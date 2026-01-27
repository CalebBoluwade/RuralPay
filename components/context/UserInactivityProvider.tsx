import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React from "react";
import { AppState } from "react-native";
import { useAuth } from "./AuthProvider";

const LockTimeout = 5 * 1000;

export const UserInactivityProvider = ({ children }: { children: any }) => {
  const { user } = useAuth();
  const appState = React.useRef(AppState.currentState);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    
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
          if (!user || !isMounted.current) return;
          const startTimeStr = await AsyncStorage.getItem("lastActive");
          const startTime = startTimeStr ? Number.parseInt(startTimeStr) : null;
          if (startTime && Date.now() - startTime > LockTimeout) {
            setTimeout(() => {
              if (isMounted.current) {
                router.push("/(modal)/lock");
              }
            }, 0);
          }
        };
        checkInactivity();
      }

      if (nextAppState === "inactive") {
        setTimeout(() => {
          if (isMounted.current) {
            router.push("/(modal)/overlay");
          }
        }, 0);
      } else if (appState.current === "inactive" && nextAppState === "active") {
        setTimeout(() => {
          if (isMounted.current && router.canGoBack()) {
            router.back();
          }
        }, 0);
      }

      appState.current = nextAppState;
      console.log("AppState", appState.current);
    });

    return () => {
      isMounted.current = false;
      subscription.remove();
    };
  }, [user]);

  return <>{children}</>;
};
