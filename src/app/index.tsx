import { useCallback, useState } from "react";
import LoginScreen from "../components/screens/auth/Login";
import OnboardingCarousel from "../components/screens/common/Carousel";

export default function Index() {
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleFinish = useCallback(() => setShowOnboarding(false), []);

  return showOnboarding ? (
    <OnboardingCarousel onFinish={handleFinish} />
  ) : (
    <LoginScreen />
  );
}
