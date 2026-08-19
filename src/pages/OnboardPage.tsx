import { useNavigate } from "react-router-dom";
import OnboardingWizard from "../onboard/OnboardingWizard";

export default function OnboardPage() {
  const navigate = useNavigate();

  return <OnboardingWizard onComplete={() => navigate("/")} />;
}
