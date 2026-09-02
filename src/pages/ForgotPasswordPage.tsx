import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Footer from "../components/Footer";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <div className="flex items-center px-4 py-3 bg-navy text-cream">
        <Link to="/login" className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to login">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-center font-display text-sm font-medium">Forgot Password</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-parchment p-6 shadow-lg shadow-navy/5">
          {!sent ? (
            <>
              <h2 className="font-display text-xl text-navy mb-1">Reset your password</h2>
              <p className="font-body text-xs text-floral-slate mb-6">
                Enter your couple email — we’ll send a reset link that opens <span className="font-mono text-navy">/reset-password</span>.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-body text-xs font-medium text-navy mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                    autoComplete="email"
                  />
                </div>
                {error && <p className="font-body text-xs text-mauve bg-mauve/10 border border-mauve/20 rounded-xl px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : <Mail className="w-4 h-4" />}
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
              <p className="font-body text-[11px] text-parchment text-center mt-4">
                Didn’t get it? Check spam, or try “Continue with Google” if that’s how you signed up.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-floral-slate/10 border border-floral-slate/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-floral-slate" />
              </div>
              <h2 className="font-display text-lg text-navy mb-1">Check your email</h2>
              <p className="font-body text-xs text-floral-slate">
                If an account exists for <span className="font-mono text-navy">{email}</span>, you’ll get a link to reset your password. It expires in 1 hour.
              </p>
              <Link to="/login" className="inline-flex mt-6 px-6 py-3 rounded-xl bg-navy text-cream font-body text-sm font-semibold">Back to login</Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
