import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React from "react";
import { AppState } from "react-native";
import { useAuth } from "./AuthProvider";

const LockTimeout = 5 * 1000;

export const UserInactivityProvider = ({ children }: { children: any }) => {
  const { user } = useAuth();
  const appState = React.useRef(AppState.currentState);

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      console.log("appState", appState.current, nextAppState);

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground!");
        // Handle app coming to foreground
      }

      const recordStartTime = async () => {
        await AsyncStorage.setItem("lastActive", Date.now().toString());
      };

      if (nextAppState === "background") {
        recordStartTime();
      } else if (
        nextAppState === "active" &&
        appState.current === "background"
      ) {
        const checkInactivity = async () => {
          if (!user) return; // Only check inactivity if user is authenticated
          const startTimeStr = await AsyncStorage.getItem("lastActive");
          const startTime = startTimeStr ? Number.parseInt(startTimeStr) : null;
          if (startTime && Date.now() - startTime > LockTimeout) {
            router.push("/(modal)/lock"); // Navigate to lock screen if inactive
          }
        };
        checkInactivity();
      }

      if (nextAppState === "inactive") {
        router.push("/(modal)/overlay"); // Navigate to overlay screen on inactive
      } else {
        router.canGoBack() && router.back();
      }

      appState.current = nextAppState;
      console.log("AppState", appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return <>{children}</>;
};
