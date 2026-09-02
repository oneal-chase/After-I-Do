import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDesignSystem } from "../../context/DesignSystemContext";

export default function AccountStep({ onValue }: { onValue: (v: { email: string; password: string } | null) => void }) {
  const { config } = useDesignSystem();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consent, setConsent] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const pwValid = password.length >= 8;
  const match = password === confirm && pwValid;
  const canProceed = emailValid && match && consent;

  useEffect(() => {
    onValue(canProceed ? { email: email.toLowerCase().trim(), password } : null);
  }, [email, password, canProceed, onValue]);

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div className="text-center">
        <h3 className="font-display text-lg text-navy mb-1">Create couple login</h3>
        <p className="font-body text-xs text-floral-slate">
          For <span className="text-navy font-medium">{config.coupleNames || "your wedding"}</span> · <span className="font-mono text-navy">/w/{config.slug}</span>
        </p>
        <p className="font-body text-[11px] text-parchment mt-1">Only you can edit, view QR, and start the live wall. Guests never log in.</p>
      </div>

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
        {email && !emailValid && <p className="font-body text-xs text-mauve mt-1">Enter a valid email.</p>}
      </div>

      <div>
        <label className="block font-body text-xs font-medium text-navy mb-1.5">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
          autoComplete="new-password"
        />
        {password && !pwValid && <p className="font-body text-xs text-mauve mt-1">Use 8+ characters.</p>}
      </div>

      <div>
        <label className="block font-body text-xs font-medium text-navy mb-1.5">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          className="w-full px-4 py-3 rounded-xl border border-parchment bg-cream/50 font-body text-sm text-navy focus:outline-none focus:border-gold transition-colors"
          autoComplete="new-password"
        />
        {confirm && password !== confirm && <p className="font-body text-xs text-mauve mt-1">Passwords don’t match.</p>}
      </div>

      <label className="flex gap-3 items-start p-3 rounded-xl border border-parchment bg-white">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-parchment text-navy accent-navy focus:ring-gold"
        />
        <span className="font-body text-xs text-floral-slate leading-relaxed">
          I agree to After I Do’s{" "}
          <Link to="/privacy" target="_blank" className="underline decoration-parchment underline-offset-4 text-navy hover:text-floral-slate">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/terms" target="_blank" className="underline decoration-parchment underline-offset-4 text-navy hover:text-floral-slate">
            Terms of Service
          </Link>
          .
        </span>
      </label>

      <div className="p-3 rounded-xl border border-gold/20 bg-gold/5">
        <p className="font-body text-xs font-medium text-navy">What this unlocks (only for you):</p>
        <ul className="font-body text-[11px] text-floral-slate list-disc ml-4 mt-1 space-y-0.5">
          <li>Edit colors, fonts, timeline</li>
          <li>Private QR at <span className="font-mono text-navy">/w/{config.slug}</span></li>
          <li>Start live wall for the projector</li>
        </ul>
      </div>

      <p className="font-body text-[10px] text-parchment text-center">
        Pluggable: this per-wedding password can be swapped for Supabase/Clerk magic link later (same login shape).
      </p>
    </div>
  );
}
