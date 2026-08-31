import { Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireOnboarding from "./components/RequireOnboarding";
import HomePage from "./pages/HomePage";
import CameraPage from "./pages/CameraPage";
import LiveWall from "./pages/LiveWall";
import QRPage from "./pages/QRPage";
import OnboardPage from "./pages/OnboardPage";
import GuestSplashPage from "./pages/GuestSplashPage";
import GuestCameraPage from "./pages/GuestCameraPage";

export default function App() {
  return (
    <ErrorBoundary>
      <RequireOnboarding>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/camera" element={<CameraPage />} />
          <Route path="/live" element={<LiveWall />} />
          <Route path="/qr" element={<QRPage />} />
          <Route path="/onboard" element={<OnboardPage />} />
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
