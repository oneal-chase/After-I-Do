import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CameraPage from "./pages/CameraPage";
import LiveWall from "./pages/LiveWall";
import QRPage from "./pages/QRPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/camera" element={<CameraPage />} />
      <Route path="/live" element={<LiveWall />} />
      <Route path="/qr" element={<QRPage />} />
    </Routes>
  );
}
