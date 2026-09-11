import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { loadWeddingForOwner } from "../utils/weddingStore";

export interface WeddingOwner {
  email: string;
  slug: string;
  weddingId: string;
}

interface AuthState {
  user: WeddingOwner | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, slug: string, weddingId: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  hasWedding: boolean;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  }
  return supabase;
}

function ownerFromSessionUser(u: { id: string; email?: string; user_metadata?: Record<string, string> }, slug: string, weddingId: string): WeddingOwner {
  const meta = u.user_metadata as Record<string, string> | undefined;
  return {
    email: u.email || meta?.email || "",
    slug,
    weddingId: weddingId || meta?.weddingId || u.id,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WeddingOwner | null>(null);
  const [hasWedding, setHasWedding] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load the owner's wedding (config + slug) directly from Supabase
  const loadOwnerWedding = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    const wedding = await loadWeddingForOwner(authUser.id);
    if (wedding) {
      const next = ownerFromSessionUser(authUser, wedding.slug, wedding.weddingId);
      setUser(next);
      setHasWedding(true);
      return next;
    }
    // account exists but wedding not published yet (mid-onboarding) — use metadata slug
    const meta = authUser.user_metadata as Record<string, string> | undefined;
    const next = ownerFromSessionUser(authUser, meta?.slug || "", "");
    setUser(next);
    setHasWedding(false);
    return next;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoaded(true);
      return;
    }
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const sUser = data.session?.user;
      if (sUser && !cancelled) {
        await loadOwnerWedding(sUser as unknown as { id: string; email?: string; user_metadata?: Record<string, string> });
      }
      if (!cancelled) setIsLoaded(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "SIGNED_IN" && session?.user) {
        void loadOwnerWedding(session.user as unknown as { id: string; email?: string; user_metadata?: Record<string, string> });
      } else if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setHasWedding(false);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadOwnerWedding]);

  const login = useCallback(async (email: string, password: string) => {
    const sb = requireSupabase();
    const { error, data } = await sb.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Login failed");
    await loadOwnerWedding(data.user as unknown as { id: string; email?: string; user_metadata?: Record<string, string> });
  }, [loadOwnerWedding]);

  const loginWithGoogle = useCallback(async () => {
    const sb = requireSupabase();
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const register = useCallback(async (email: string, password: string, slug: string, weddingId: string) => {
    const sb = requireSupabase();

    // Slug uniqueness is enforced by DB unique constraint; surface a friendly error first
    const { data: existing } = await sb.from("weddings").select("slug").eq("slug", slug.toLowerCase()).maybeSingle();
    if (existing) throw new Error("That wedding link is already taken. Try another slug.");

    const { data, error } = await sb.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: { data: { slug: slug.toLowerCase(), weddingId } },
    });
    if (error) throw new Error(error.message);

    // Publish the wedding row owned by this user (upsert overwrites any anon row with the same slug)
    const { error: upErr } = await sb
      .from("weddings")
      .upsert(
        {
          slug: slug.toLowerCase(),
          wedding_id: weddingId,
          owner_id: data.user?.id ?? null,
          couple_names: "Newlyweds",
          config: { slug: slug.toLowerCase(), weddingId, coupleNames: "Newlyweds" },
          published: true,
        },
        { onConflict: "slug" },
      );
    if (upErr) throw new Error(`Could not claim /w/${slug}: ${upErr.message}`);

    if (data.user) {
      await loadOwnerWedding(data.user as unknown as { id: string; email?: string; user_metadata?: Record<string, string> });
    }
  }, [loadOwnerWedding]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const sb = requireSupabase();
    const { error } = await sb.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const sb = requireSupabase();
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(() => {
    if (isSupabaseConfigured && supabase) void supabase.auth.signOut();
    setUser(null);
    setHasWedding(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, register, sendPasswordReset, updatePassword, isAuthenticated: !!user, hasWedding, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
