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
  STORAGE_KEY,
  getDefaultConfig,
  getFontStack,
} from "../config/designTokens";

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

export function DesignSystemProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<WeddingConfig>(getDefaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WeddingConfig;
        const merged = { ...getDefaultConfig(), ...parsed };
        // Seed GAS endpoint from env if not set in config
        if (!merged.gasEndpoint && import.meta.env.VITE_GAS_WEBHOOK_URL) {
          merged.gasEndpoint = import.meta.env.VITE_GAS_WEBHOOK_URL;
        }
        setConfig(merged);
        injectCSSVariables(merged);
      } else {
        injectCSSVariables(getDefaultConfig());
      }
    } catch {
      injectCSSVariables(getDefaultConfig());
    }
    setIsLoaded(true);
  }, []);

  const updateConfig = useCallback(
    (partial: Partial<WeddingConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...partial };
        injectCSSVariables(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const updateColors = useCallback(
    (colors: Partial<ColorTokens>) => {
      setConfig((prev) => {
        const next = { ...prev, colors: { ...prev.colors, ...colors } };
        injectCSSVariables(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const updateFonts = useCallback(
    (fonts: Partial<FontTokens>) => {
      setConfig((prev) => {
        const next = { ...prev, fonts: { ...prev.fonts, ...fonts } };
        injectCSSVariables(next);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const resetConfig = useCallback(() => {
    const fresh = getDefaultConfig();
    setConfig(fresh);
    injectCSSVariables(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

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
