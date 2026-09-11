import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import LandingPage from "./pages/LandingPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import HomePage from "./pages/HomePage";
import CameraPage from "./pages/CameraPage";
import LiveWall from "./pages/LiveWall";
import QRPage from "./pages/QRPage";
import OnboardPage from "./pages/OnboardPage";
import GuestSplashPage from "./pages/GuestSplashPage";
import GuestCameraPage from "./pages/GuestCameraPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Couple admin — Supabase-auth gated */}
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/onboard" element={<OnboardPage />} />
        <Route path="/camera" element={<RequireAuth><CameraPage /></RequireAuth>} />
        <Route path="/qr" element={<RequireAuth><QRPage /></RequireAuth>} />
        <Route path="/home" element={<HomePage />} />

        {/* Guest — private per-wedding link, no auth, config fetched from Supabase */}
        <Route path="/w/:slug" element={<GuestSplashPage />} />
        <Route path="/w/:slug/camera" element={<GuestCameraPage />} />
        <Route path="/w/:slug/live" element={<LiveWall />} />
        <Route path="/w/:slug/qr" element={<QRPage />} />
        <Route path="/w/:slug/*" element={<Navigate to="camera" replace />} />
        <Route path="/live" element={<LiveWall />} />
      </Routes>
    </ErrorBoundary>
  );
}
