import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { version } from "../../package.json";
import LoginScreen from "../components/screens/auth/Login";
import OnboardingCarousel from "../components/screens/common/Carousel";

export default function Index() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize onboarding state from SecureStore
  useEffect(() => {
    (async () => {
      try {
        const onboardingShown = await SecureStore.getItemAsync("onboarding_shown");
        setShowOnboarding(onboardingShown !== "true");
      } catch (error) {
        console.error("Error reading onboarding state from SecureStore:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleFinish = useCallback(async () => {
    try {
      await SecureStore.setItemAsync("onboarding_shown", "true");
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error saving onboarding state to SecureStore:", error);
      setShowOnboarding(false);
    }
  }, []);

  if (isLoading) {
    return null; // or a loading screen
  }

  return showOnboarding ? (
    <OnboardingCarousel onFinish={handleFinish} appVersion={version} />
  ) : (
    <LoginScreen appVersion={version} />
  );
}
