import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, QrCode, MonitorPlay } from "lucide-react";
import Footer from "../components/Footer";

export default function HowItWorksPage() {
  useEffect(() => {
    document.title = "How It Works | Frictionless Guest Photo Uploads | After I Do";
    const desc = "Discover how After I Do makes guest photo collection seamless from ceremony to late-night dance floor in three simple steps.";
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
        <Link to="/onboard" className="px-5 py-2.5 rounded-full bg-navy text-cream font-body text-sm font-medium hover:bg-navy/90 transition-colors">
          Start Your Gallery
        </Link>
      </header>

      <main className="flex-1">
        <section className="px-6 py-12 md:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="font-body text-xs font-medium tracking-widest uppercase text-navy">How It Works</span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-semibold text-navy leading-tight">
            From ceremony to<br />
            <span className="font-script font-normal text-gold">late-night dance floor</span> in three steps.
          </h1>
          <p className="font-body text-sm md:text-base text-floral-slate max-w-2xl mx-auto mt-4 leading-relaxed">
            Frictionless for guests, beautiful for you. No app, no learning curve — just scan and share.
          </p>
        </section>

        <section className="px-6 pb-12 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 md:p-8 rounded-2xl bg-white border border-parchment shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-navy text-cream flex items-center justify-center font-display text-sm font-semibold mb-4">01</div>
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold text-navy">Generate</h3>
              <p className="font-body text-sm text-floral-slate mt-2 leading-relaxed">
                Create your private event link, customize your live gallery, and set download permissions in under two minutes.
              </p>
              <div className="mt-4 h-px bg-gold/20" />
              <p className="font-body text-xs text-parchment mt-3">Your colors, fonts, and monogram — editorial polish, instantly.</p>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-white border border-parchment shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-navy text-cream flex items-center justify-center font-display text-sm font-semibold mb-4">02</div>
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <QrCode className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold text-navy">Place</h3>
              <p className="font-body text-sm text-floral-slate mt-2 leading-relaxed">
                Print matching, design-forward QR codes directly onto reception table tents, bar signage, and seating charts.
              </p>
              <div className="mt-4 h-px bg-gold/20" />
              <p className="font-body text-xs text-parchment mt-3">5×7 table cards with Champagne Gold borders — ready to print.</p>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-white border border-parchment shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-navy text-cream flex items-center justify-center font-display text-sm font-semibold mb-4">03</div>
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                <MonitorPlay className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display text-lg font-semibold text-navy">Relive</h3>
              <p className="font-body text-sm text-floral-slate mt-2 leading-relaxed">
                Guests scan and upload instantly using native mobile browsers, preserving every unposed snapshot and 2:00 AM video in full resolution.
              </p>
              <div className="mt-4 h-px bg-gold/20" />
              <p className="font-body text-xs text-parchment mt-3">Live wall auto-plays — project it by the dance floor.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-10">
            <Link to="/onboard" className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors shadow-lg shadow-navy/15">
              Start Your Gallery — Free Preview
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 border-navy/15 text-navy font-body text-sm font-semibold hover:bg-navy/5 transition-colors">
              Couple login
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
