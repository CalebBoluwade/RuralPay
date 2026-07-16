import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

const LOGIN_COUNT_KEY = "login_count";
const SECURITY_SETUP_DELAYED = "security_setup_delayed";
const SECURITY_SETUP_SHOWN_COUNT = "security_setup_shown_count";

interface SecuritySetupState {
  shouldPromptSetup: boolean;
  setupStep: "none" | "pin" | "biometric" | "both";
  dismissCount: number;
}

/**
 * Progressive security setup hook
 * Prompts for security setup after N logins instead of blocking on first login
 * Shows banners instead of modal dialogs for less friction
 */
export const useSecuritySetupPrompt = (): SecuritySetupState => {
  const [state, setState] = useState<SecuritySetupState>({
    shouldPromptSetup: false,
    setupStep: "none",
    dismissCount: 0,
  });

  useEffect(() => {
    checkSecuritySetupNeed();
  }, []);

  const checkSecuritySetupNeed = useCallback(async () => {
    try {
      // Don't prompt if user has already set up security
      const setupComplete = await SecureStore.getItemAsync(
        "security_setup_complete",
      );
      if (setupComplete === "true") {
        setState({
          shouldPromptSetup: false,
          setupStep: "none",
          dismissCount: 0,
        });
        return;
      }

      // Get current login count
      const countStr = await SecureStore.getItemAsync(LOGIN_COUNT_KEY);
      const loginCount = parseInt(countStr || "0", 10);

      // Get how many times user has dismissed the prompt
      const dismissStr = await SecureStore.getItemAsync(
        SECURITY_SETUP_SHOWN_COUNT,
      );
      const dismissCount = parseInt(dismissStr || "0", 10);

      // Check if security setup was explicitly delayed
      const delayed = await SecureStore.getItemAsync(SECURITY_SETUP_DELAYED);

      // Prompt after 3 logins, then again every 5 logins after that
      const shouldPrompt =
        loginCount >= 3 &&
        (!delayed || loginCount >= parseInt(delayed, 10) + 5);

      if (shouldPrompt) {
        setState({
          shouldPromptSetup: true,
          setupStep: "both", // Suggest both PIN and biometric
          dismissCount,
        });
      }
    } catch (error) {
      if (__DEV__) console.error("[useSecuritySetupPrompt] Error:", error);
    }
  }, []);

  const incrementLoginCount = useCallback(async () => {
    try {
      const countStr = await SecureStore.getItemAsync(LOGIN_COUNT_KEY);
      const loginCount = parseInt(countStr || "0", 10);
      await SecureStore.setItemAsync(LOGIN_COUNT_KEY, String(loginCount + 1));
      await checkSecuritySetupNeed();
    } catch (error) {
      if (__DEV__)
        console.error("[useSecuritySetupPrompt] Error incrementing:", error);
    }
  }, [checkSecuritySetupNeed]);

  const dismissPrompt = useCallback(async () => {
    try {
      const dismissStr = await SecureStore.getItemAsync(
        SECURITY_SETUP_SHOWN_COUNT,
      );
      const dismissCount = parseInt(dismissStr || "0", 10);
      await SecureStore.setItemAsync(
        SECURITY_SETUP_SHOWN_COUNT,
        String(dismissCount + 1),
      );

      const countStr = await SecureStore.getItemAsync(LOGIN_COUNT_KEY);
      const loginCount = parseInt(countStr || "0", 10);
      await SecureStore.setItemAsync(
        SECURITY_SETUP_DELAYED,
        String(loginCount),
      );

      setState({
        shouldPromptSetup: false,
        setupStep: "none",
        dismissCount: dismissCount + 1,
      });
    } catch (error) {
      if (__DEV__)
        console.error("[useSecuritySetupPrompt] Error dismissing:", error);
    }
  }, []);

  const markSecuritySetupComplete = useCallback(async () => {
    try {
      await SecureStore.setItemAsync("security_setup_complete", "true");
      setState({
        shouldPromptSetup: false,
        setupStep: "none",
        dismissCount: 0,
      });
    } catch (error) {
      if (__DEV__)
        console.error(
          "[useSecuritySetupPrompt] Error marking complete:",
          error,
        );
    }
  }, []);

  return {
    ...state,
    // Expose methods as part of state for hook consumers
  } as any;
};

/**
 * Hook wrapper with methods for managing security setup
 */
export const useSecuritySetupManager = () => {
  const [state, setState] = useState<SecuritySetupState>({
    shouldPromptSetup: false,
    setupStep: "none",
    dismissCount: 0,
  });

  const incrementLoginCount = useCallback(async () => {
    try {
      const countStr = await SecureStore.getItemAsync(LOGIN_COUNT_KEY);
      const loginCount = parseInt(countStr || "0", 10);
      await SecureStore.setItemAsync(LOGIN_COUNT_KEY, String(loginCount + 1));

      // Recheck after increment
      await checkSecuritySetupNeed();
    } catch (error) {
      if (__DEV__) console.error("[useSecuritySetupManager] Error:", error);
    }
  }, []);

  const checkSecuritySetupNeed = useCallback(async () => {
    try {
      const setupComplete = await SecureStore.getItemAsync(
        "security_setup_complete",
      );
      if (setupComplete === "true") {
        setState({
          shouldPromptSetup: false,
          setupStep: "none",
          dismissCount: 0,
        });
        return;
      }

      const countStr = await SecureStore.getItemAsync(LOGIN_COUNT_KEY);
      const loginCount = parseInt(countStr || "0", 10);
      const dismissStr = await SecureStore.getItemAsync(
        SECURITY_SETUP_SHOWN_COUNT,
      );
      const dismissCount = parseInt(dismissStr || "0", 10);
      const delayed = await SecureStore.getItemAsync(SECURITY_SETUP_DELAYED);

      const shouldPrompt =
        loginCount >= 3 &&
        (!delayed || loginCount >= parseInt(delayed, 10) + 5);

      setState({
        shouldPromptSetup: shouldPrompt,
        setupStep: shouldPrompt ? "both" : "none",
        dismissCount,
      });
    } catch (error) {
      if (__DEV__)
        console.error("[useSecuritySetupManager] Check error:", error);
    }
  }, []);

  const dismissPrompt = useCallback(async () => {
    try {
      const dismissStr = await SecureStore.getItemAsync(
        SECURITY_SETUP_SHOWN_COUNT,
      );
      const dismissCount = parseInt(dismissStr || "0", 10);
      await SecureStore.setItemAsync(
        SECURITY_SETUP_SHOWN_COUNT,
        String(dismissCount + 1),
      );

      const countStr = await SecureStore.getItemAsync(LOGIN_COUNT_KEY);
      const loginCount = parseInt(countStr || "0", 10);
      await SecureStore.setItemAsync(
        SECURITY_SETUP_DELAYED,
        String(loginCount),
      );

      setState({
        shouldPromptSetup: false,
        setupStep: "none",
        dismissCount: dismissCount + 1,
      });
    } catch (error) {
      if (__DEV__)
        console.error("[useSecuritySetupManager] Dismiss error:", error);
    }
  }, []);

  const markSecuritySetupComplete = useCallback(async () => {
    try {
      await SecureStore.setItemAsync("security_setup_complete", "true");
      setState({
        shouldPromptSetup: false,
        setupStep: "none",
        dismissCount: 0,
      });
    } catch (error) {
      if (__DEV__)
        console.error("[useSecuritySetupManager] Complete error:", error);
    }
  }, []);

  useEffect(() => {
    checkSecuritySetupNeed();
  }, [checkSecuritySetupNeed]);

  return {
    ...state,
    incrementLoginCount,
    dismissPrompt,
    markSecuritySetupComplete,
    checkSecuritySetupNeed,
  };
};
