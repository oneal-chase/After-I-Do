import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CameraPage from "./CameraPage";
import { loadWedding } from "../utils/weddingStore";
import { setActiveConfig, getDefaultConfig, type WeddingConfig } from "../config/designTokens";

function injectGuestTheme(c: WeddingConfig) {
  const r = document.documentElement.style;
  r.setProperty("--color-cream", c.colors.cream);
  r.setProperty("--color-navy", c.colors.navy);
  r.setProperty("--color-floral-slate", c.colors.floralSlate);
  r.setProperty("--color-mauve", c.colors.mauve);
  r.setProperty("--color-gold", c.colors.gold);
  r.setProperty("--color-parchment", c.colors.parchment);
}

export default function GuestCameraPage() {
  const { slug } = useParams<{ slug: string }>();
  const [config, setConfig] = useState<WeddingConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = slug ? await loadWedding(slug) : null;
      const cfg = loaded || getDefaultConfig();
      if (!cancelled) {
        setActiveConfig(cfg);
        injectGuestTheme(cfg);
        setConfig(cfg);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (!config) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return <CameraPage guestSlug={slug} />;
}
