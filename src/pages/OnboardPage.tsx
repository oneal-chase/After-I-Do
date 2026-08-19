import { useNavigate } from "react-router-dom";
import { useDesignSystem } from "../context/DesignSystemContext";
import OnboardingWizard from "../onboard/OnboardingWizard";

export default function OnboardPage() {
  const navigate = useNavigate();
  const { updateConfig } = useDesignSystem();

  const handleComplete = () => {
    updateConfig({ onboardingComplete: true });
    navigate("/");
  };

  return <OnboardingWizard onComplete={handleComplete} />;
}
