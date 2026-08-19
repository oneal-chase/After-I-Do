import { Link } from "react-router-dom";
import { Camera, Radio, QrCode } from "lucide-react";
import { WEDDING_CONFIG, getCurrentPhase } from "../config/wedding.config";
import SyncHUD from "../components/SyncHUD";

export default function HomePage() {
  const phase = getCurrentPhase();
  const displayName = WEDDING_CONFIG.timeline.find((t) => t.folderName === phase)?.name ?? "General";

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-cream">
      <SyncHUD />

      {/* Decorative top line */}
      <div className="w-16 h-px bg-gold/50 mb-6" />

      {/* Monogram */}
      <div className="font-display text-5xl text-gold tracking-widest mb-2">K & D</div>

      {/* Names */}
      <h1 className="font-script text-4xl text-navy mb-1">Kendra & Diego</h1>

      {/* Date */}
      <p className="font-body text-sm text-floral-slate tracking-widest uppercase mb-1">
        September 11, 2026
      </p>
      <p className="font-body text-xs text-parchment mb-10">
        {WEDDING_CONFIG.venue}
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

      {/* Footer */}
      <p className="mt-12 font-body text-[10px] text-parchment/60 text-center">
        No app download required — photos sync live to the couple's private album
      </p>
    </div>
  );
}
