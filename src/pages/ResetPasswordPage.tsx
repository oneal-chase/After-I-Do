import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import Footer from "../components/Footer";

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the hash: #access_token=...
    // supabase-js with detectSessionInUrl:true will auto-parse it; we just wait a tick
    if (!isSupabaseConfigured || !supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      // if session exists after hash parse, we’re in recovery mode
      setReady(true);
      if (!data.session) {
        // no session yet — user may have landed without token (e.g. direct nav)
        // let them still try; Supabase will error on updateUser if no session
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don’t match.");
      return;
    }
    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-cream">
      <div className="flex items-center px-4 py-3 bg-navy text-cream">
        <Link to="/login" className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Back to login">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-center font-display text-sm font-medium">Set New Password</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-parchment p-6 shadow-lg shadow-navy/5">
          {!done ? (
            <>
              <h2 className="font-display text-xl text-navy mb-1">Choose a new password</h2>
              <p className="font-body text-xs text-floral-slate mb-6">For your After I Do couple account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-body text-xs font-medium text-navy mb-1.5">New password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block font-body text-xs font-medium text-navy mb-1.5">Confirm</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
                    autoComplete="new-password"
                  />
                </div>
                {error && <p className="font-body text-xs text-mauve bg-mauve/10 border border-mauve/20 rounded-xl px-3 py-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-navy text-cream font-body text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                  {loading ? "Saving…" : "Save new password"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-floral-slate/10 border border-floral-slate/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-floral-slate" />
              </div>
              <h2 className="font-display text-lg text-navy mb-1">Password updated</h2>
              <p className="font-body text-xs text-floral-slate">You’ll be redirected to login…</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
