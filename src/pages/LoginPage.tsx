import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import Footer from "../components/Footer";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError((e as Error).message);
      setGoogleLoading(false);
    }
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

          {isSupabaseConfigured ? (
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-parchment text-navy font-body text-sm font-semibold hover:bg-cream/50 transition-colors disabled:opacity-50"
            >
              {googleLoading ? <span className="w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" /> : <span className="w-4 h-4 rounded-full bg-white border border-parchment flex items-center justify-center text-[10px]">G</span>}
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>
          ) : null}

          <div className="flex items-center gap-3 my-2">
            <div className="h-px flex-1 bg-parchment" />
            <span className="font-body text-[11px] text-parchment">or use wedding password</span>
            <div className="h-px flex-1 bg-parchment" />
          </div>

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
              {loading ? "Checking…" : "Log in with password"}
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
          <p className="font-body text-xs font-medium text-navy">How this connects to Drive</p>
          <p className="font-body text-[11px] text-floral-slate mt-1">
            The same Google project powers both: <span className="font-mono">VITE_GOOGLE_CLIENT_ID</span> is used for <span className="text-navy">Continue with Google</span> (Supabase Auth) and for the Dashboard’s <span className="text-navy">Connect Drive</span> (GIS <span className="font-mono">drive.file</span>). Enable Drive API once and both work.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
