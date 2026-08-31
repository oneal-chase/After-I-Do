import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { loadWedding } from "../utils/weddingStore";
import { type WeddingConfig } from "../config/designTokens";

export function useGuestWedding(): WeddingConfig | null {
  const { slug } = useParams<{ slug: string }>();
  const [cfg, setCfg] = useState<WeddingConfig | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    loadWedding(slug).then((c) => {
      if (!cancelled && c) {
        const r = document.documentElement.style;
        r.setProperty("--color-cream", c.colors.cream);
        r.setProperty("--color-navy", c.colors.navy);
        r.setProperty("--color-floral-slate", c.colors.floralSlate);
        r.setProperty("--color-mauve", c.colors.mauve);
        r.setProperty("--color-gold", c.colors.gold);
        r.setProperty("--color-parchment", c.colors.parchment);
        setCfg(c);
      }
    });
    return () => { cancelled = true; };
  }, [slug]);

  return cfg;
}

export default function GuestLayout({ children }: { children: ReactNode }) {
  const cfg = useGuestWedding();
  if (!cfg) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }
  // also sync to localStorage for syncEngine per-wedding slug
  try {
    const cur = localStorage.getItem("wedding-config");
    const parsed = cur ? JSON.parse(cur) : null;
    if (!parsed || parsed.slug !== cfg.slug) {
      localStorage.setItem("wedding-config", JSON.stringify(cfg));
    }
  } catch { /* ignore */ }
  return <>{children}</>;
}
