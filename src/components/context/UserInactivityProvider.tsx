import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { AppState, AppStateStatus } from "react-native";
import { useAuth } from "./AuthProvider";

const LOCK_TIMEOUT_KEY = "lockTimeout";
const DEFAULT_LOCK_TIMEOUT = 60 * 5 * 1000; // 1 Minute

export const UserInactivityProvider = ({ children }: { children: any }) => {
  const { user } = useAuth();
  const appState = React.useRef(AppState.currentState);
  const inactivityTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const backgroundTime = React.useRef<number | null>(null);

  const getLockTimeout = async () => {
    const timeout = await SecureStore.getItemAsync(LOCK_TIMEOUT_KEY);
    return timeout ? Number.parseInt(timeout) : DEFAULT_LOCK_TIMEOUT;
  };

  const navigateToLock = React.useCallback(() => {
    console.log("FSZ");
    try {
      router.replace("/auth/LockScreen");
    } catch (e) {
      console.log("Navigation not ready:", e);
    }
  }, []);

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

  const handleBackground = React.useCallback(() => {
    backgroundTime.current = Date.now();
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  const handleActive = React.useCallback(async () => {
    if (user && backgroundTime.current) {
      const timeout = await getLockTimeout();
      const elapsed = Date.now() - backgroundTime.current;
      elapsed > timeout ? navigateToLock() : resetInactivityTimer();
    }
    backgroundTime.current = null;
  }, [user, navigateToLock, resetInactivityTimer]);

  const handleInactive = React.useCallback(() => {
    try {
      router.push("/(modal)/overlay");
    } catch (e) {
      console.log("Navigation not ready:", e);
    }
  }, []);

  const handleInactiveToActive = React.useCallback(() => {
    if (router.canGoBack()) {
      try {
        router.back();
      } catch (e) {
        console.log("Navigation not ready:", e);
      }
    }
  }, []);

  React.useEffect(
    () => {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === "background") {
          handleBackground();
        } else if (
          nextAppState === "active" &&
          appState.current === "background"
        ) {
          handleActive();
        } else if (nextAppState === "inactive") {
          handleInactive();
        } else if (
          appState.current === "inactive" &&
          nextAppState === "active"
        ) {
          handleInactiveToActive();
        }
        appState.current = nextAppState;
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
    },
    [
      // user,
      // resetInactivityTimer,
      // navigateToLock,
      // handleBackground,
      // handleActive,
      // handleInactive,
      // handleInactiveToActive,
    ],
  );

  return <>{children}</>;
};

export const setLockTimeout = async (milliseconds: number) => {
  await SecureStore.setItemAsync(LOCK_TIMEOUT_KEY, milliseconds.toString());
};
