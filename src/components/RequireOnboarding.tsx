import { Navigate, useLocation } from "react-router-dom";
import { STORAGE_KEY } from "../config/designTokens";

function isOnboardingDone(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    return parsed.onboardingComplete === true;
  } catch {
    return false;
  }
}

export default function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (
    location.pathname === "/" ||
    location.pathname === "/how-it-works" ||
    location.pathname === "/login" ||
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/privacy" ||
    location.pathname === "/terms" ||
    location.pathname === "/dashboard" ||
    location.pathname === "/onboard" ||
    location.pathname === "/live" ||
    location.pathname.startsWith("/w/")
  ) {
    return <>{children}</>;
  }

  if (!isOnboardingDone()) {
    return <Navigate to="/onboard" replace />;
  }

  return <>{children}</>;
}
