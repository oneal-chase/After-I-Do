import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CameraPage from "./CameraPage";
import { loadWedding } from "../utils/weddingStore";
import { getDefaultConfig, type WeddingConfig } from "../config/designTokens";

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) { setReady(true); return; }
      const loaded = await loadWedding(slug);
      const cfg = loaded || getDefaultConfig();
      if (!cancelled) {
        injectGuestTheme(cfg);
        // persist guest wedding so syncEngine uses correct slug/endpoint
        try { localStorage.setItem("wedding-config", JSON.stringify(cfg)); } catch { /* ignore */ }
        setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return <CameraPage />;
}
