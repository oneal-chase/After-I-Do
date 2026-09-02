import { Link } from "react-router-dom";
import { Camera, Sparkles, QrCode, LogIn, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
            <Camera className="w-4 h-4 text-cream" />
          </div>
          <span className="font-display text-sm font-semibold text-navy tracking-wide">Wedding Capture</span>
        </div>
        {isAuthenticated ? (
          <Link to="/dashboard" className="font-body text-sm text-navy hover:text-floral-slate transition-colors">
            {user?.slug} · Dashboard →
          </Link>
        ) : (
          <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-full border border-parchment text-navy font-body text-sm hover:bg-parchment/20 transition-colors">
            <LogIn className="w-4 h-4" />
            Couple login
          </Link>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span className="font-body text-xs font-medium text-navy">Private link per wedding · no app needed</span>
        </div>

        <h1 className="font-display text-4xl md:text-5xl text-navy leading-tight mb-3">
          Your wedding, <span className="font-script text-gold font-normal">beautifully</span> captured
        </h1>
        <p className="font-body text-sm md:text-base text-floral-slate max-w-xl mb-8">
          Guests scan a private QR and share photos + notes that match your invitation suite. You get a live wall for the reception — isolated per couple.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          {isAuthenticated ? (
            <Link to="/dashboard" className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors shadow-lg shadow-navy/10">
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link to="/onboard" className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors shadow-lg shadow-navy/10">
              Create your wedding
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link to="/login" className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-navy/15 text-navy font-body text-sm font-semibold hover:bg-navy/5 transition-colors">
            <LogIn className="w-4 h-4" />
            Couple login
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mt-12 text-left">
          <div className="p-5 rounded-2xl border border-parchment bg-white/50">
            <Camera className="w-5 h-5 text-gold mb-3" />
            <h3 className="font-body text-sm font-semibold text-navy">Themed camera</h3>
            <p className="font-body text-xs text-floral-slate mt-1">Polaroid frames with your colors, fonts, and monogram. No download.</p>
          </div>
          <div className="p-5 rounded-2xl border border-parchment bg-white/50">
            <QrCode className="w-5 h-5 text-gold mb-3" />
            <h3 className="font-body text-sm font-semibold text-navy">Private QR</h3>
            <p className="font-body text-xs text-floral-slate mt-1">Each couple gets <span className="font-mono text-navy">/w/your-slug</span> — fully isolated.</p>
          </div>
          <div className="p-5 rounded-2xl border border-parchment bg-white/50">
            <Sparkles className="w-5 h-5 text-gold mb-3" />
            <h3 className="font-body text-sm font-semibold text-navy">Live wall</h3>
            <p className="font-body text-xs text-floral-slate mt-1">Project guest photos + notes live. Start it from your dashboard.</p>
          </div>
        </div>

        <p className="font-body text-[11px] text-parchment mt-8 max-w-md">
          Guests: scan the QR on your table — you’ll see a branded splash, then camera. No account, no setup.
        </p>
      </main>

      <Footer />
    </div>
  );
}
