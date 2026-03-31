/**
 * SessionProvider
 * Monitors session/JWT expiry and displays modal before logout
 * Prevents abrupt redirects and improves user experience during token expiry
 */

import { SessionExpiryModal } from "@/src/components/ui/Modals/SessionExpiryModal";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { useAuth } from "./AuthProvider";

interface SessionContextType {
  showSessionExpiredModal: boolean;
  handleSessionExpiry: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Function to reset the API session expiry flag (called when user logs in)
export function resetSessionExpiredFlag() {
  // This needs to be accessible from the API module
  // We'll communicate this via DeviceEventEmitter
  DeviceEventEmitter.emit("RESET_SESSION_EXPIRY_FLAG");
}

export function SessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout, isAuthenticated } = useAuth();

  /**
   * Handle session expiry
   * Show modal, then log out and redirect
   */
  const handleSessionExpiry = async () => {
    if (isLoggingOut) {
      // Prevent duplicate handling if already logging out
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
      setShowSessionExpiredModal(false);
      // Reset the session expiry flag for next login
      DeviceEventEmitter.emit("RESET_SESSION_EXPIRY_FLAG");
      router.replace("/auth/login");
    } catch (error) {
      if (__DEV__) {
        console.error(
          "[SessionProvider] Error during session expiry logout:",
          error,
        );
      }
      // Force redirect even if logout fails
      setShowSessionExpiredModal(false);
      DeviceEventEmitter.emit("RESET_SESSION_EXPIRY_FLAG");
      router.replace("/auth/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  /**
   * Listen for SESSION_EXPIRED event from API interceptor
   * Show modal instead of immediate redirect
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = DeviceEventEmitter.addListener(
      "SESSION_EXPIRED",
      () => {
        if (__DEV__) {
          console.log("[SessionProvider] Session expired event received");
        }
        // Only show modal if not already showing it or logging out
        if (!showSessionExpiredModal && !isLoggingOut) {
          setShowSessionExpiredModal(true);
        }
      },
    );

    return () => subscription.remove();
  }, [isAuthenticated, showSessionExpiredModal, isLoggingOut]);

  return (
    <SessionContext.Provider
      value={{ showSessionExpiredModal, handleSessionExpiry }}
    >
      {children}

      {/* Session Expiry Modal - displayed on top of entire app */}
      <SessionExpiryModal
        visible={showSessionExpiredModal}
        onConfirm={handleSessionExpiry}
        isLoading={isLoggingOut}
      />
    </SessionContext.Provider>
  );
}

/**
 * Hook to access session context
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}
