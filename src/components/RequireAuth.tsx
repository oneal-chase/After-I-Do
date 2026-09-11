import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Auth gate. No localStorage anywhere — session lives in Supabase Auth,
// and "has a wedding" is a Supabase query, not a local flag.
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasWedding, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-cream">
        <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Authenticated but hasn't finished creating a wedding → onboarding
  if (!hasWedding && location.pathname !== "/onboard") {
    return <Navigate to="/onboard" replace />;
  }

  return <>{children}</>;
}
