import { Link, useNavigate } from "react-router-dom";
import { LogOut, QrCode, Radio, Settings, ExternalLink, Copy, Check, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDesignSystem } from "../context/DesignSystemContext";
import { getWeddingUrl } from "../config/designTokens";
import GoogleDriveConnect from "../components/GoogleDriveConnect";
import Footer from "../components/Footer";
import { deleteWedding } from "../utils/weddingStore";
import { useState } from "react";

export default function DashboardPage() {
  const { user, logout, isLoaded } = useAuth();
  const { config } = useDesignSystem();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-cream px-6 text-center">
        <p className="font-body text-sm text-floral-slate mb-4">You’re not logged in as a couple.</p>
        <Link to="/login" className="px-6 py-3 rounded-xl bg-navy text-cream font-body text-sm font-semibold">Go to login</Link>
      </div>
    );
  }

  const slug = user.slug || config.slug;
  const weddingUrl = getWeddingUrl(slug, "/camera");
  const liveUrl = getWeddingUrl(slug, "/live");

  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500); } catch { /* ignore */ }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <header className="flex items-center justify-between px-6 py-4 border-b border-parchment bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="After I Do" className="w-8 h-8" />
          <div>
            <p className="font-display text-sm font-semibold text-navy">{config.coupleNames}</p>
            <p className="font-body text-xs text-floral-slate">/w/{slug} · {user.email}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate("/"); }} className="flex items-center gap-2 px-3 py-2 rounded-full border border-parchment text-navy font-body text-xs hover:bg-parchment/20 transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Log out
        </button>
      </header>

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full space-y-6">
        <GoogleDriveConnect />

        <div className="p-6 rounded-2xl border border-parchment bg-white shadow-sm">
          <h1 className="font-display text-xl text-navy mb-1">Your wedding dashboard</h1>
          <p className="font-body text-xs text-floral-slate">Only you can do these — guests at <span className="font-mono text-navy">/w/{slug}</span> never see them.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
            <Link to="/onboard" className="flex items-center gap-3 p-4 rounded-xl border border-parchment bg-cream/30 hover:border-gold/30 transition-colors">
              <Settings className="w-5 h-5 text-gold" />
              <div className="text-left">
                <p className="font-body text-sm font-semibold text-navy">Edit wedding</p>
                <p className="font-body text-xs text-floral-slate">Colors, fonts, timeline, slug</p>
              </div>
            </Link>
            <Link to="/qr" className="flex items-center gap-3 p-4 rounded-xl border border-parchment bg-cream/30 hover:border-gold/30 transition-colors">
              <QrCode className="w-5 h-5 text-gold" />
              <div className="text-left">
                <p className="font-body text-sm font-semibold text-navy">QR &amp; table cards</p>
                <p className="font-body text-xs text-floral-slate">Private, isolated per couple</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl border-2 border-navy bg-navy text-cream">
          <h2 className="font-body text-sm font-semibold flex items-center gap-2">
            <Radio className="w-4 h-4 text-gold" />
            Live wall — for the reception projector
          </h2>
          <p className="font-body text-xs text-cream/70 mt-1">Open this on the projector. Guests’ photos + notes appear live.</p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <a href={liveUrl} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cream text-navy font-body text-sm font-semibold hover:bg-cream/90 transition-colors">
              <ExternalLink className="w-4 h-4" />
              Start live wall
            </a>
            <button onClick={() => copy(liveUrl, "live")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-cream/20 text-cream font-body text-sm hover:bg-white/10 transition-colors">
              {copied === "live" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === "live" ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="font-mono text-[11px] text-cream/50 mt-3 truncate">{liveUrl}</p>
        </div>

        <div className="p-6 rounded-2xl border border-parchment bg-white">
          <h3 className="font-body text-sm font-semibold text-navy">Guest link — put this on tables</h3>
          <p className="font-mono text-xs text-floral-slate mt-1 truncate">{weddingUrl}</p>
          <div className="flex gap-2 mt-3">
            <button onClick={() => copy(weddingUrl, "guest")} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors">
              {copied === "guest" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === "guest" ? "Copied" : "Copy guest link"}
            </button>
            <a href={weddingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-3 rounded-xl border border-parchment text-navy font-body text-sm hover:bg-parchment/20 transition-colors">
              <ExternalLink className="w-4 h-4" />
              Test
            </a>
          </div>
          <p className="font-body text-[11px] text-parchment mt-2">Guest scan → branded splash → camera. No login, no setup. Theme comes from your wedding.</p>
        </div>

        <div className="p-4 rounded-xl border border-gold/20 bg-gold/5">
          <p className="font-body text-xs font-medium text-navy">How Drive works</p>
          <p className="font-body text-[11px] text-floral-slate mt-1">
            Tap “Connect Google Drive” once — we create <span className="font-mono">Wedding Capture / your-slug</span> automatically. Guests never touch this. If you skip, photos still appear on the live wall via secure storage (you can connect later — we’ll still save to Drive going forward). Service-account setup is no longer needed.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-mauve/20 bg-mauve/5">
          <p className="font-body text-xs font-medium text-navy">Danger zone</p>
          <p className="font-body text-[11px] text-floral-slate mt-1">
            Delete <span className="font-mono text-navy">/w/{slug}</span> and all its photos. This removes the wedding from Supabase + this browser. Guests with the old link will see “Wedding not found.” For demo data like <span className="font-mono">kendra-diego</span>, you can delete it here, or run in Supabase SQL Editor: <span className="font-mono">delete from public.weddings where slug='kendra-diego';</span>
          </p>
          <button
            onClick={async () => {
              if (!confirm(`Delete /w/${slug} and all photos? This cannot be undone.`)) return;
              await deleteWedding(slug);
              logout();
              navigate("/");
            }}
            className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-mauve text-white font-body text-xs font-medium hover:bg-mauve/90 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete this wedding
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
