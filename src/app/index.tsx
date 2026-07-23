import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { version } from "../../package.json";
import { useAuth } from "../components/context/AuthSessionProvider";
import LoginScreen from "../components/screens/auth/Login";
import OnboardingCarousel from "../components/screens/common/Carousel";
import SmartOnboarding from "../components/screens/common/SmartOnboarding";

export default function Index() {
  const { isLoading, onboardingShown } = useAuth();
  const [onboardingType, setOnboardingType] = useState<"smart" | "carousel" | "login">("smart");

  useEffect(() => {
    if (!isLoading) {
      setOnboardingType(onboardingShown ? "login" : "smart");
    }
  }, [isLoading, onboardingShown]);

  const handleSmartOnboardingFinish = useCallback(
    async (_userType: "consumer" | "merchant", _primaryGoal: string) => {
      setOnboardingType("carousel");
    },
    [],
  );

  const handleCarouselFinish = useCallback(async () => {
    try {
      await SecureStore.setItemAsync("onboarding_shown", "true");
    } catch {}
    setOnboardingType("login");
  }, []);

  if (isLoading) return null;

  if (onboardingType === "smart") {
    return <SmartOnboarding onFinish={handleSmartOnboardingFinish} appVersion={version} />;
  }

  if (onboardingType === "carousel") {
    return <OnboardingCarousel onFinish={handleCarouselFinish} appVersion={version} />;
  }

  return <LoginScreen appVersion={version} environment={process.env.NODE_ENV} />;
}
