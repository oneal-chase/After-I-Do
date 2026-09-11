import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type WeddingConfig,
  type ColorTokens,
  type FontTokens,
  getDefaultConfig,
  getFontStack,
  setActiveConfig,
} from "../config/designTokens";
import { loadWedding, loadWeddingForOwner, saveWedding } from "../utils/weddingStore";
import { useAuth } from "./AuthContext";

interface DesignSystemContextValue {
  config: WeddingConfig;
  updateConfig: (partial: Partial<WeddingConfig>) => void;
  updateColors: (colors: Partial<ColorTokens>) => void;
  updateFonts: (fonts: Partial<FontTokens>) => void;
  resetConfig: () => void;
  isLoaded: boolean;
}

const DesignSystemContext = createContext<DesignSystemContextValue | null>(null);

function injectCSSVariables(config: WeddingConfig) {
  const root = document.documentElement;
  root.style.setProperty("--color-cream", config.colors.cream);
  root.style.setProperty("--color-navy", config.colors.navy);
  root.style.setProperty("--color-floral-slate", config.colors.floralSlate);
  root.style.setProperty("--color-mauve", config.colors.mauve);
  root.style.setProperty("--color-gold", config.colors.gold);
  root.style.setProperty("--color-parchment", config.colors.parchment);

  const scriptFont = getFontStack(config.fonts.script);
  const displayFont = getFontStack(config.fonts.display);
  const bodyFont = getFontStack(config.fonts.body);

  root.style.setProperty("--font-script", scriptFont);
  root.style.setProperty("--font-display", displayFont);
  root.style.setProperty("--font-body", bodyFont);
}

function adoptConfig(config: WeddingConfig): WeddingConfig {
  const merged = { ...getDefaultConfig(), ...config };
  injectCSSVariables(merged);
  setActiveConfig(merged);
  return merged;
}

export function DesignSystemProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WeddingConfig>(getDefaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isAuthenticated, isLoaded: authLoaded } = useAuth();
  const isGuestPath = typeof window !== "undefined" && window.location.pathname.startsWith("/w/");

  // Guest pages: load the wedding theme for the slug in the URL (in-memory only).
  // Owner pages: load the wedding for the authenticated user from Supabase.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isGuestPath) {
        const slug = window.location.pathname.match(/^\/w\/([^/]+)/)?.[1];
        if (slug) {
          const wedding = await loadWedding(slug);
          if (wedding && !cancelled) setConfig(adoptConfig(wedding));
        }
        if (!cancelled) setIsLoaded(true);
        return;
      }
      if (!authLoaded) return;
      if (isAuthenticated && user?.email) {
        const { getSupabaseClient } = await import("../lib/supabase");
        const sb = getSupabaseClient();
        if (sb) {
          const { data } = await sb.auth.getUser();
          const authUser = data.user;
          if (authUser && !cancelled) {
            const wedding = await loadWeddingForOwner(authUser.id);
            if (wedding && !cancelled) {
              setConfig(adoptConfig(wedding));
            }
          }
        }
      }
      if (!cancelled) setIsLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [authLoaded, isAuthenticated, user?.email, isGuestPath]);

  // Persist straight to Supabase — the only store. Fire-and-forget with console surface.
  const persist = useCallback((next: WeddingConfig) => {
    saveWedding(next).catch((e) => console.error("Wedding save failed:", e));
  }, []);

  const updateConfig = useCallback(
    (partial: Partial<WeddingConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        injectCSSVariables(next);
        setActiveConfig(next);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateColors = useCallback(
    (colors: Partial<ColorTokens>) => {
      setConfig((prev) => {
        const next = { ...prev, colors: { ...prev.colors, ...colors } };
        injectCSSVariables(next);
        setActiveConfig(next);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const updateFonts = useCallback(
    (fonts: Partial<FontTokens>) => {
      setConfig((prev) => {
        const next = { ...prev, fonts: { ...prev.fonts, ...fonts } };
        injectCSSVariables(next);
        setActiveConfig(next);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const resetConfig = useCallback(() => {
    const fresh = getDefaultConfig();
    setConfig(adoptConfig(fresh));
    persist(fresh);
  }, [persist]);

  return (
    <DesignSystemContext.Provider
      value={{ config, updateConfig, updateColors, updateFonts, resetConfig, isLoaded }}
    >
      {children}
    </DesignSystemContext.Provider>
  );
}

export function useDesignSystem(): DesignSystemContextValue {
  const ctx = useContext(DesignSystemContext);
  if (!ctx) throw new Error("useDesignSystem must be used within DesignSystemProvider");
  return ctx;
}

export function useCanvasColors(): ColorTokens {
  const { config } = useDesignSystem();
  return config.colors;
}

export function useCanvasFonts(): Record<string, string> {
  const { config } = useDesignSystem();
  return {
    script: getFontStack(config.fonts.script),
    display: getFontStack(config.fonts.display),
    body: getFontStack(config.fonts.body),
  };
}

export { getFontStack };
