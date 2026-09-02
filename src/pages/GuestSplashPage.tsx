import { Link, useParams, useNavigate } from "react-router-dom";
import { Camera, Radio } from "lucide-react";
import { useEffect, useState } from "react";
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

export default function GuestSplashPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<WeddingConfig | null>(null);

  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!slug) return;
      const loaded = await loadWedding(slug);
      if (!cancelled && loaded) {
        setConfig(loaded);
        injectGuestTheme(loaded);
      } else if (!cancelled) {
        setNotFound(true);
        setConfig(getDefaultConfig());
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

  if (notFound) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-cream text-center">
        <div className="font-display text-5xl text-parchment mb-4">—</div>
        <h1 className="font-display text-2xl text-navy mb-2">Wedding not found</h1>
        <p className="font-body text-sm text-floral-slate max-w-xs mb-6">
          The link <span className="font-mono text-navy">/w/{slug}</span> doesn’t exist or was deleted.
        </p>
        <Link to="/" className="px-6 py-3 rounded-xl bg-navy text-cream font-body text-sm font-semibold">Go to After I Do</Link>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to="/privacy" className="font-body text-[11px] text-parchment hover:text-floral-slate transition-colors underline decoration-parchment/0 hover:decoration-parchment underline-offset-4">Privacy</Link>
          <span className="w-1 h-1 rounded-full bg-parchment" />
          <Link to="/terms" className="font-body text-[11px] text-parchment hover:text-floral-slate transition-colors underline decoration-parchment/0 hover:decoration-parchment underline-offset-4">Terms</Link>
        </div>
      </div>
    );
  }

  const dateStr = new Date(config.weddingDate + "T12:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hasMonogram = !!config.images.monogram;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-cream">
      <div className="w-16 h-px bg-gold/50 mb-6" />

      {hasMonogram ? (
        <img src={config.images.monogram} alt="Monogram" className="h-16 w-16 object-contain mb-2" />
      ) : (
        <div className="font-display text-5xl text-gold tracking-widest mb-2">{config.monogram}</div>
      )}

      <h1 className="font-script text-4xl text-navy mb-1 text-center">{config.coupleNames}</h1>
      <p className="font-body text-sm text-floral-slate tracking-widest uppercase mb-1">{dateStr}</p>
      <p className="font-body text-xs text-parchment mb-8 text-center">{config.venue}</p>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-px bg-parchment" />
        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
        <div className="w-12 h-px bg-parchment" />
      </div>

      <p className="font-body text-sm text-floral-slate text-center max-w-xs mb-8">
        You’re invited to capture photos for <span className="text-navy font-medium">{config.coupleNames}</span>.
        <br />
        <span className="text-xs text-parchment">Your photos stay private to this wedding.</span>
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate(`/w/${slug}/camera`)}
          className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors shadow-lg shadow-navy/15"
        >
          <Camera className="w-5 h-5" />
          Open Camera
        </button>
        <Link
          to={`/w/${slug}/live`}
          className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl border-2 border-navy/15 text-navy font-body text-sm font-semibold hover:bg-navy/5 transition-colors"
        >
          <Radio className="w-5 h-5" />
          Live Wall
        </Link>
      </div>

      <p className="font-body text-[10px] text-parchment text-center mt-6">
        No app needed — works on any phone.
      </p>
      <div className="flex items-center justify-center gap-3 mt-8">
        <Link to="/privacy" className="font-body text-[11px] text-parchment hover:text-floral-slate transition-colors underline decoration-parchment/0 hover:decoration-parchment underline-offset-4">Privacy</Link>
        <span className="w-1 h-1 rounded-full bg-parchment" />
        <Link to="/terms" className="font-body text-[11px] text-parchment hover:text-floral-slate transition-colors underline decoration-parchment/0 hover:decoration-parchment underline-offset-4">Terms</Link>
      </div>
      <p className="font-body text-[10px] text-parchment mt-2">© {new Date().getFullYear()} After I Do</p>
    </div>
  );
}
