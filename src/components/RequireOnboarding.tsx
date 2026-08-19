import { Navigate, useLocation } from "react-router-dom";
import { STORAGE_KEY } from "../config/designTokens";

function hasSavedConfig(): boolean {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    return !!parsed.coupleNames && parsed.coupleNames !== "";
  } catch {
    return false;
  }
}

export default function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (location.pathname === "/onboard" || location.pathname === "/live") {
    return <>{children}</>;
  }

  if (!hasSavedConfig()) {
    return <Navigate to="/onboard" replace />;
  }

  return <>{children}</>;
}
