import { Link } from "react-router-dom";

export default function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`px-6 py-6 text-center ${className}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <img src="/favicon.svg" alt="" aria-hidden className="w-6 h-6" />
        <span className="font-display text-xs font-semibold text-navy tracking-wide">After I Do</span>
      </div>
      <p className="font-body text-[11px] text-parchment">© {new Date().getFullYear()} After I Do · Candid Moments. Shared.</p>
      <div className="flex items-center justify-center gap-3 mt-2">
        <Link to="/privacy" className="font-body text-[11px] text-parchment hover:text-floral-slate transition-colors underline decoration-parchment/0 hover:decoration-parchment underline-offset-4">
          Privacy
        </Link>
        <span className="w-1 h-1 rounded-full bg-parchment" />
        <Link to="/terms" className="font-body text-[11px] text-parchment hover:text-floral-slate transition-colors underline decoration-parchment/0 hover:decoration-parchment underline-offset-4">
          Terms
        </Link>
      </div>
    </footer>
  );
}
