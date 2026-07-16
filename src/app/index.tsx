import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { version } from "../../package.json";
import LoginScreen from "../components/screens/auth/Login";
import OnboardingCarousel from "../components/screens/common/Carousel";
import SmartOnboarding from "../components/screens/common/SmartOnboarding";

export default function Index() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingType, setOnboardingType] = useState<
    "smart" | "carousel" | "login"
  >("smart");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize onboarding state from SecureStore
  useEffect(() => {
    (async () => {
      try {
        const onboardingShown =
          await SecureStore.getItemAsync("onboarding_shown");

        if (onboardingShown === "true") {
          // User has completed onboarding, go to login
          setShowOnboarding(false);
          setOnboardingType("login");
        } else {
          // Show smart onboarding for first-time users
          setShowOnboarding(true);
          setOnboardingType("smart");
        }
      } catch (error) {
        console.error(
          "Error reading onboarding state from SecureStore:",
          error,
        );
        setOnboardingType("smart");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleSmartOnboardingFinish = useCallback(
    async (userType: "consumer" | "merchant", primaryGoal: string) => {
      try {
        // Show carousel for additional app features explanation
        setOnboardingType("carousel");
      } catch (error) {
        if (__DEV__) console.error("Error in smart onboarding finish:", error);
        setOnboardingType("carousel");
      }
    },
    [],
  );

  const handleCarouselFinish = useCallback(async () => {
    try {
      await SecureStore.setItemAsync("onboarding_shown", "true");
      setShowOnboarding(false);
      setOnboardingType("login");
    } catch (error) {
      if (__DEV__)
        console.error("Error saving onboarding state to SecureStore:", error);
      setShowOnboarding(false);
      setOnboardingType("login");
    }
  }, []);

  if (isLoading) {
    return null;
  }

  // Show smart onboarding (role + goal selection)
  if (onboardingType === "smart") {
    return (
      <SmartOnboarding
        onFinish={handleSmartOnboardingFinish}
        appVersion={version}
      />
    );
  }

  // Show carousel (feature overview)
  if (onboardingType === "carousel") {
    return (
      <OnboardingCarousel
        onFinish={handleCarouselFinish}
        appVersion={version}
      />
    );
  }

  // Show login screen
  return (
    <LoginScreen appVersion={version} environment={process.env.NODE_ENV} />
  );
}
