import { useEffect, useState } from "react";
import LoginScreen from "../components/screens/auth/Login";
import OnboardingCarousel from "../components/screens/common/Carousel";

export default function Index() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // AsyncStorage.getItem("onboarding_done").then((val) =>
    setShowOnboarding(true);
    // );
  }, []);

  const handleFinish = async () => {
    // await AsyncStorage.setItem("onboarding_done", "true");
    setShowOnboarding(false);
  };

  return showOnboarding ? (
    <OnboardingCarousel onFinish={handleFinish} />
  ) : (
    <LoginScreen />
  );
}
