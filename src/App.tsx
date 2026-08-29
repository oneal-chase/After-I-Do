import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireOnboarding from "./components/RequireOnboarding";
import HomePage from "./pages/HomePage";
import CameraPage from "./pages/CameraPage";
import LiveWall from "./pages/LiveWall";
import QRPage from "./pages/QRPage";
import OnboardPage from "./pages/OnboardPage";

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
        </Routes>
      </RequireOnboarding>
    </ErrorBoundary>
  );
}
