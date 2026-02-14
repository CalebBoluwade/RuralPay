import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "./AuthProvider";

const LOCK_TIMEOUT_KEY = "lockTimeout";
const DEFAULT_LOCK_TIMEOUT = 60 * 1000; // 1 Minute

export const UserInactivityProvider = ({ children }: { children: any }) => {
  const { user } = useAuth();
  const router = useRouter();
  const appState = React.useRef(AppState.currentState);
  const inactivityTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const backgroundTime = React.useRef<number | null>(null);

  const getLockTimeout = async () => {
    const timeout = await AsyncStorage.getItem(LOCK_TIMEOUT_KEY);
    return timeout ? parseInt(timeout) : DEFAULT_LOCK_TIMEOUT;
  };

  const navigateToLock = () => {
    console.log("FSZ");
    try {
      router.push("/(modal)/welcome-banner");
    } catch (e) {
      console.log("Navigation not ready:", e);
    }
  };

  const resetInactivityTimer = React.useCallback(async () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    if (!user) return;

    const timeout = await getLockTimeout();
    inactivityTimer.current = setTimeout(() => {
      if (user) {
        navigateToLock();
      }
    }, timeout);
  }, [user, navigateToLock]);

  React.useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "background") {
        backgroundTime.current = Date.now();
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
        }
      } else if (
        nextAppState === "active" &&
        appState.current === "background"
      ) {
        if (user && backgroundTime.current) {
          const timeout = await getLockTimeout();
          const elapsed = Date.now() - backgroundTime.current;
          if (elapsed > timeout) {
            navigateToLock();
          } else {
            resetInactivityTimer();
          }
        }
        backgroundTime.current = null;
      } else if (nextAppState === "inactive") {
        try {
          router.push("/(modal)/overlay");
        } catch (e) {
          console.log("Navigation not ready:", e);
        }
      } else if (appState.current === "inactive" && nextAppState === "active") {
        if (router.canGoBack()) {
          try {
            router.back();
          } catch (e) {
            console.log("Navigation not ready:", e);
          }
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    if (user) {
      resetInactivityTimer();
    }

    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      subscription.remove();
    };
  }, [user, resetInactivityTimer, navigateToLock]);

  return <>{children}</>;
};

export const setLockTimeout = async (milliseconds: number) => {
  await AsyncStorage.setItem(LOCK_TIMEOUT_KEY, milliseconds.toString());
};
