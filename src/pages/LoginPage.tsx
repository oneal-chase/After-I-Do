import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!slug.trim() || !password) {
      setError("Enter your wedding link and password.");
      return;
    }
    setLoading(true);
    const ok = await login(slug.trim().toLowerCase(), password);
    setLoading(false);
    if (ok) navigate("/dashboard");
    else setError("That link or password didn’t match. Check your QR setup or try again.");
  };

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <div className="flex items-center px-4 py-3 bg-navy text-cream">
        <Link to="/" className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to home">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-center font-display text-sm font-medium">Couple Login</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-parchment p-6 shadow-lg shadow-navy/5">
          <h2 className="font-display text-xl text-navy mb-1">Welcome back</h2>
          <p className="font-body text-xs text-floral-slate mb-6">Log in to manage your wedding, QR, and live wall.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-body text-xs font-medium text-navy mb-1.5">Wedding link (slug)</label>
              <div className="flex items-center gap-2">
                <span className="font-body text-xs text-parchment">/w/</span>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="kendra-diego"
                  className="flex-1 px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>
            </div>
            <div>
              <label className="block font-body text-xs font-medium text-navy mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
              />
            </div>

            {error && <p className="font-body text-xs text-mauve bg-mauve/10 border border-mauve/20 rounded-xl px-3 py-2">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-50"
            >
              {loading ? <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? "Checking…" : "Log in"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-parchment flex flex-col gap-2 text-center">
            <p className="font-body text-xs text-floral-slate">
              New couple? <Link to="/onboard" className="text-navy underline decoration-parchment underline-offset-4">Create your wedding</Link>
            </p>
            <p className="font-body text-[11px] text-parchment">
              Guests don’t log in — they just scan the QR at <span className="font-mono text-floral-slate">/w/your-slug/camera</span>.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl border border-gold/20 bg-gold/5 max-w-sm">
          <p className="font-body text-xs font-medium text-navy">Auth options (for you as owner):</p>
          <ul className="font-body text-[11px] text-floral-slate list-disc ml-4 mt-1 space-y-1">
            <li><span className="text-navy font-medium">Now (MVP):</span> Per-wedding password (local + best-effort GAS verify). No vendor, instant.</li>
            <li><span className="text-navy font-medium">Next:</span> Email magic link or Supabase/Clerk — swap one file <span className="font-mono">AuthContext.tsx</span> (interface stays <span className="font-mono">login(slug,pw)</span>).</li>
            <li><span className="text-navy font-medium">Scale:</span> Stripe + KV/D1 + JWT replaces local map, guest URLs unchanged.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
