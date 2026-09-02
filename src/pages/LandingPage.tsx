import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Camera, ArrowRight, Eye, QrCode, Sparkles, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    document.title = "After I Do | Private Wedding Photo Sharing & Guest Albums";
    const desc = "Collect every unfiltered moment your hired photographer missed. Instant, app-free wedding photo sharing via custom QR codes. Full-resolution, private, and effortless.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <Link to="/" className="flex items-center gap-2">
          <img src="/after-i-do-logo.svg" alt="After I Do" className="h-8 w-auto" />
          <span className="hidden sm:inline font-display text-sm font-semibold text-navy tracking-wide">After I Do</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/how-it-works" className="font-body text-sm text-floral-slate hover:text-navy transition-colors">
            How It Works
          </Link>
          <Link to="/privacy" className="font-body text-sm text-floral-slate hover:text-navy transition-colors">
            Privacy
          </Link>
        </nav>
        {isAuthenticated ? (
          <Link to="/dashboard" className="font-body text-sm font-medium text-navy hover:text-floral-slate transition-colors">
            {user?.slug} · Dashboard →
          </Link>
        ) : (
          <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-full border border-parchment text-navy font-body text-sm hover:bg-parchment/20 transition-colors">
            <LogIn className="w-4 h-4" />
            Couple login
          </Link>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero — Conversion Engine */}
        <section className="px-6 py-16 md:py-24 text-center bg-cream">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <img src="/after-i-do-logo.svg" alt="After I Do — interlocking rings heart aperture" className="w-[280px] md:w-[360px] h-auto mb-6" />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span className="font-body text-xs font-medium text-navy tracking-widest uppercase">Private · App-Free · Full-Resolution</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-semibold text-navy leading-[1.05] tracking-tight">
              The Wedding Memories
              <br />
              <span className="font-script font-normal text-gold">Your Photographer Couldn&apos;t</span>
              <br />
              Be There to Catch.
            </h1>

            <p className="font-body text-base md:text-lg text-floral-slate leading-relaxed max-w-2xl mt-6">
              A private, browser-based photo roll crowdsourced directly from your guests. No app store downloads, no account setup — just one simple scan from their seats.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-10">
              <Link
                to="/onboard"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors shadow-lg shadow-navy/15"
              >
                Start Your Gallery — Free Preview
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-navy/15 text-navy font-body text-sm font-semibold hover:bg-navy/5 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Live Guest Demo
              </Link>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <div className="w-12 h-px bg-gold/30" />
              <span className="font-body text-[11px] tracking-[0.2em] uppercase text-parchment">Soft Cream · Midnight Ink · Champagne Gold</span>
              <div className="w-12 h-px bg-gold/30" />
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="px-6 py-12 bg-white/40 border-y border-parchment">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl border border-parchment bg-white">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <Camera className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display text-base font-semibold text-navy">Full-resolution, unfiltered</h3>
              <p className="font-body text-sm text-floral-slate mt-2 leading-relaxed">Every 2:00 AM dance-floor video and unposed table snapshot — straight from your guests’ cameras, no compression.</p>
            </div>
            <div className="p-6 rounded-2xl border border-parchment bg-white">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display text-base font-semibold text-navy">One scan, no app</h3>
              <p className="font-body text-sm text-floral-slate mt-2 leading-relaxed">Custom QR on table tents, bar signs, and seating charts. Native browser upload — guests are sharing in under 5 seconds.</p>
            </div>
            <div className="p-6 rounded-2xl border border-parchment bg-white">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display text-base font-semibold text-navy">Private by design</h3>
              <p className="font-body text-sm text-floral-slate mt-2 leading-relaxed">Each wedding lives at <span className="font-mono text-navy">/w/your-slug</span> — isolated, shareable only with your QR, and deletable anytime.</p>
            </div>
          </div>
        </section>

        {/* Subtle CTA strip */}
        <section className="px-6 py-10 text-center">
          <p className="font-body text-sm text-floral-slate max-w-xl mx-auto">
            Already have a wedding? <Link to="/login" className="text-navy underline decoration-gold underline-offset-4 hover:text-gold">Log in to your dashboard</Link> or <Link to="/how-it-works" className="text-navy underline decoration-gold underline-offset-4 hover:text-gold">see how it works</Link>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
