import { useNavigate } from "react-router-dom";
import { useDesignSystem } from "../context/DesignSystemContext";
import { useAuth } from "../context/AuthContext";
import OnboardingWizard from "../onboard/OnboardingWizard";
import { saveWedding } from "../utils/weddingStore";

export default function OnboardPage() {
  const navigate = useNavigate();
  const { config, updateConfig } = useDesignSystem();
  const { register } = useAuth();

  const handleComplete = async (account: { email: string; password: string } | null) => {
    const finalSlug = config.slug;
    // create owner account for this wedding (pluggable auth)
    if (account) {
      try {
        await register(account.email, account.password, finalSlug, config.weddingId);
      } catch (e) {
        alert((e as Error).message);
        return;
      }
    }
    const consentAt = new Date().toISOString();
    updateConfig({ onboardingComplete: true, consentAt, privacyVersion: "2025-12-11" });
    try { await saveWedding({ ...config, onboardingComplete: true, consentAt, privacyVersion: "2025-12-11" }); } catch { /* ignore */ }
    navigate("/dashboard");
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}
