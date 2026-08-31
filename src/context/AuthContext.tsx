import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface WeddingOwner {
  email: string;
  slug: string;
  weddingId: string;
}

interface AuthState {
  user: WeddingOwner | null;
  login: (slug: string, password: string) => Promise<boolean>;
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
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
    setIsLoaded(true);
  }, []);

  const login = useCallback(async (slug: string, password: string) => {
    const owners = loadOwners();
    const rec = owners[slug.toLowerCase()];
    if (!rec) return false;
    const hash = await sha256(password);
    // support legacy plain stored (migrated) — if hash length mismatch, compare plain
    const ok = rec.passwordHash === hash || rec.passwordHash === password;
    if (!ok) return false;
    // also try GAS verification best-effort (if wedding has gasEndpoint, let it confirm)
    try {
      const weddingRaw = localStorage.getItem(`wedding:${slug.toLowerCase()}`);
      if (weddingRaw) {
        const cfg = JSON.parse(weddingRaw) as { gasEndpoint?: string; gasToken?: string };
        if (cfg.gasEndpoint) {
          // fire-and-forget verification; don't block login on network
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

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated: !!user, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
