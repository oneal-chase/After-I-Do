import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export interface WeddingOwner {
  email: string;
  slug: string;
  weddingId: string;
}

interface AuthState {
  user: WeddingOwner | null;
  login: (slug: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, slug: string, weddingId: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoaded: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

const OWNERS_KEY = "wedding-owners";
const SESSION_KEY = "wedding-session";

type OwnerRecord = WeddingOwner & { passwordHash: string };

function loadOwners(): Record<string, OwnerRecord> {
  try {
    const raw = localStorage.getItem(OWNERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveOwners(map: Record<string, OwnerRecord>) {
  localStorage.setItem(OWNERS_KEY, JSON.stringify(map));
}

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WeddingOwner | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Prefer Supabase session if configured (FOSS, self-hostable)
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        const sUser = data.session?.user;
        if (sUser && !cancelled) {
          // try to recover slug/weddingId from weddings table or session metadata
          const meta = sUser.user_metadata as Record<string, string> | undefined;
          const fallback = (() => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } })() as WeddingOwner | null;
          const next: WeddingOwner = {
            email: sUser.email || meta?.email || fallback?.email || "",
            slug: meta?.slug || fallback?.slug || "",
            weddingId: meta?.weddingId || fallback?.weddingId || sUser.id,
          };
          if (next.slug) {
            setUser(next);
            localStorage.setItem(SESSION_KEY, JSON.stringify(next));
          }
        } else if (!cancelled) {
          try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (raw) setUser(JSON.parse(raw));
          } catch { /* ignore */ }
        }
        if (!cancelled) setIsLoaded(true);
        // keep in sync with future auth changes
        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
          if (cancelled) return;
          if (session?.user) {
            const u = session.user;
            const m = u.user_metadata as Record<string, string> | undefined;
            const fb2 = (() => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } })() as WeddingOwner | null;
            const n: WeddingOwner = { email: u.email || m?.email || fb2?.email || "", slug: m?.slug || fb2?.slug || "", weddingId: m?.weddingId || fb2?.weddingId || u.id };
            if (n.slug) { setUser(n); localStorage.setItem(SESSION_KEY, JSON.stringify(n)); }
          } else {
            setUser(null);
            localStorage.removeItem(SESSION_KEY);
          }
        });
        return () => sub.subscription.unsubscribe();
      }
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch { /* ignore */ }
      if (!cancelled) setIsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (slug: string, password: string) => {
    // Supabase path (preferred, FOSS)
    if (isSupabaseConfigured && supabase) {
      const owners = loadOwners();
      const rec = owners[slug.toLowerCase()];
      const email = rec?.email;
      if (!email) return false;
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return false;
      const u = data.user;
      if (!u) return false;
      const next: WeddingOwner = { email: email.toLowerCase(), slug: slug.toLowerCase(), weddingId: rec.weddingId };
      setUser(next);
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return true;
    }
    const owners = loadOwners();
    const rec = owners[slug.toLowerCase()];
    if (!rec) return false;
    const hash = await sha256(password);
    const ok = rec.passwordHash === hash || rec.passwordHash === password;
    if (!ok) return false;
    try {
      const weddingRaw = localStorage.getItem(`wedding:${slug.toLowerCase()}`);
      if (weddingRaw) {
        const cfg = JSON.parse(weddingRaw) as { gasEndpoint?: string; gasToken?: string };
        if (cfg.gasEndpoint) {
          fetch(cfg.gasEndpoint, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "verifyOwner", slug, email: rec.email, token: rec.passwordHash }),
          }).catch(() => {});
        }
      }
    } catch { /* ignore */ }

    const next: WeddingOwner = { email: rec.email, slug: rec.slug, weddingId: rec.weddingId };
    setUser(next);
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return true;
  }, []);

  const register = useCallback(async (email: string, password: string, slug: string, weddingId: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: { data: { slug: slug.toLowerCase(), weddingId } },
      });
      if (error) throw new Error(error.message);
      // Supabase may require email confirmation; still create local mapping for immediate login
      const owners = loadOwners();
      const key = slug.toLowerCase();
      if (owners[key]) throw new Error("That wedding link is already taken. Try another slug.");
      const passwordHash = await sha256(password);
      owners[key] = { email: email.toLowerCase(), slug: key, weddingId, passwordHash };
      saveOwners(owners);
      const u = data.user;
      const next: WeddingOwner = { email: email.toLowerCase(), slug: key, weddingId: u?.id || weddingId };
      setUser(next);
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return;
    }
    const owners = loadOwners();
    const key = slug.toLowerCase();
    if (owners[key]) throw new Error("That wedding link is already taken. Try another slug.");
    const passwordHash = await sha256(password);
    owners[key] = { email: email.toLowerCase(), slug: key, weddingId, passwordHash };
    saveOwners(owners);
    const next: WeddingOwner = { email: email.toLowerCase(), slug: key, weddingId };
    setUser(next);
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }, []);

  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) throw new Error("Google sign-in needs Supabase — set VITE_SUPABASE_URL / ANON_KEY");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { access_type: "offline", prompt: "consent" },
        // Note: drive.file is granted separately via GIS “Connect Drive” button so auth stays simple.
        // To request it here too, add scopes: "https://www.googleapis.com/auth/drive.file"
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const logout = useCallback(() => {
    if (isSupabaseConfigured && supabase) void supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, register, isAuthenticated: !!user, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
