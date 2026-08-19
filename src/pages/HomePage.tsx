import { Link } from "react-router-dom";
import { Camera, Radio, QrCode, Settings } from "lucide-react";
import { useDesignSystem } from "../context/DesignSystemContext";
import { getCurrentPhase, getPhaseDisplayName } from "../config/wedding.config";
import SyncHUD from "../components/SyncHUD";

export default function HomePage() {
  const { config } = useDesignSystem();
  const phase = getCurrentPhase();
  const displayName = getPhaseDisplayName(phase);

  const hasCustomMonogram = !!config.images.monogram;

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-cream">
      <SyncHUD />

      {/* Decorative top line */}
      <div className="w-16 h-px bg-gold/50 mb-6" />

      {/* Monogram */}
      {hasCustomMonogram ? (
        <img
          src={config.images.monogram}
          alt="Monogram"
          className="h-16 w-16 object-contain mb-2"
        />
      ) : (
        <div className="font-display text-5xl text-gold tracking-widest mb-2">{config.monogram}</div>
      )}

      {/* Names */}
      <h1 className="font-script text-4xl text-navy mb-1">{config.coupleNames}</h1>

      {/* Date */}
      <p className="font-body text-sm text-floral-slate tracking-widest uppercase mb-1">
        {new Date(config.weddingDate + "T12:00:00").toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <p className="font-body text-xs text-parchment mb-10">
        {config.venue}
      </p>

      {/* Decorative divider */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-px bg-parchment" />
        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
        <div className="w-12 h-px bg-parchment" />
      </div>

      {/* Current phase badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-mauve/10 border border-mauve/20 mb-10">
        <span className="w-2 h-2 rounded-full bg-mauve animate-pulse" />
        <span className="font-body text-xs font-medium text-mauve">Currently: {displayName}</span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          to="/camera"
          className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors shadow-lg shadow-navy/15"
        >
          <Camera className="w-5 h-5" />
          Open Camera
        </Link>

        <Link
          to="/live"
          className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl border-2 border-navy/15 text-navy font-body text-sm font-semibold hover:bg-navy/5 transition-colors"
        >
          <Radio className="w-5 h-5" />
          Reception Live Wall
        </Link>

        <Link
          to="/qr"
          className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-2xl border border-parchment text-floral-slate font-body text-sm font-medium hover:bg-parchment/30 transition-colors"
        >
          <QrCode className="w-5 h-5" />
          Table QR Cards
        </Link>
      </div>

      {/* Customize link */}
      <Link
        to="/onboard"
        className="mt-8 flex items-center gap-1.5 font-body text-[11px] text-parchment/50 hover:text-parchment transition-colors"
      >
        <Settings className="w-3 h-3" />
        Customize this wedding
      </Link>
    </div>
  );
}
