import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireOnboarding from "./components/RequireOnboarding";
import RequireAuth from "./components/RequireAuth";
import LandingPage from "./pages/LandingPage";
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
import HowItWorksPage from "./pages/HowItWorksPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  return (
    <ErrorBoundary>
      <RequireOnboarding>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Couple admin — auth-gated, can start live wall */}
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/onboard" element={<OnboardPage />} />
          {/* Owner preview routes (also auth-gated via RequireAuth if you prefer) */}
          <Route path="/camera" element={<RequireAuth><CameraPage /></RequireAuth>} />
          <Route path="/live" element={<LiveWall />} />
          <Route path="/qr" element={<RequireAuth><QRPage /></RequireAuth>} />
          <Route path="/home" element={<HomePage />} />

          {/* Guest — visually unchanged, private per-wedding link, no auth */}
          <Route path="/w/:slug" element={<GuestSplashPage />} />
          <Route path="/w/:slug/camera" element={<GuestCameraPage />} />
          <Route path="/w/:slug/live" element={<LiveWall />} />
          <Route path="/w/:slug/qr" element={<QRPage />} />
          <Route path="/w/:slug/*" element={<Navigate to="camera" replace />} />
        </Routes>
      </RequireOnboarding>
    </ErrorBoundary>
  );
}
