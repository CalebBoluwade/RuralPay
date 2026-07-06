import { SessionExpiryModal } from "@/src/components/ui/Modals/SessionExpiryModal";
import { authService } from "@/src/lib/services/AuthService";
import { complianceService } from "@/src/lib/services/ComplianceService";
import QRCodeService from "@/src/lib/services/QRCodeService";
import WidgetStorageService from "@/src/lib/services/WidgetStorageService";
import { biometricService } from "@/src/lib/utils/SecureStorage";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";
import { DeviceEventEmitter } from "react-native";

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  clearFirstLogin: () => void;
  nativeAuthLogin: boolean;
  nativeAuthTransactions: boolean;
  visibleBalance: boolean;
  hasBiometricCredentials: boolean;
  hasRequiredConsents: boolean;
  consentOutdated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  biometricLogin: () => Promise<void>;
  register: (data: RegisterData) => Promise<string>;
  logout: () => Promise<void>;
  updateNativeAuthSettings: (
    login: boolean,
    transactions: boolean,
  ) => Promise<void>;
  updateVisibleBalance: (visible: boolean) => void;
  checkConsents: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthSessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nativeAuthLogin, setNativeAuthLogin] = useState(false);
  const [nativeAuthTransactions, setNativeAuthTransactions] = useState(false);
  const [visibleBalance, setVisibleBalance] = useState(true);
  const [hasBiometricCredentials, setHasBiometricCredentials] = useState(false);
  const [hasRequiredConsents, setHasRequiredConsents] = useState(false);
  const [consentOutdated, setConsentOutdated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const clearFirstLogin = () => setIsFirstLogin(false);

  const lock = () => setIsLocked(true);
  const unlock = () => setIsLocked(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const [authData, hasBiometric, hasConsents, outdated] = await Promise.all(
        [
          authService.getStoredAuthData(),
          biometricService.hasBiometricCredentials(),
          complianceService.hasRequiredConsents(),
          complianceService.isConsentOutdated(),
        ],
      );

      if (authData) {
        setUser(authData.details.user);
        setToken(authData.details.token);
        setRefreshToken(authData.details.refreshToken);
      }
      setHasBiometricCredentials(hasBiometric);
      if (hasBiometric) setNativeAuthLogin(true);
      setHasRequiredConsents(hasConsents);
      setConsentOutdated(outdated);
    } catch (error) {
      if (__DEV__) console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // JWT Expiry Watcher
  useEffect(() => {
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const expiry = decoded.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiry - currentTime;

      if (__DEV__) {
        console.log("Token expiry time:", new Date(expiry).toLocaleString());
        console.log(
          "Time until expiry:",
          Math.floor(timeUntilExpiry / 1000),
          "seconds",
        );
      }

      // If token is already expired, logout immediately
      if (timeUntilExpiry <= 0) {
        if (__DEV__) console.log("Token already expired, logging out");
        logout();
        return;
      }

      const timeout = setTimeout(
        () => {
          logout();
        },
        Math.min(timeUntilExpiry, 2147483647),
      );

      return () => clearTimeout(timeout);
    } catch (error) {
      console.error("Error decoding token:", error);
      // Optionally logout if token is invalid
      logout();
    }
  }, [token]);

  // SESSION_EXPIRED event listener — always active for the lifetime of the provider
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "SESSION_EXPIRED",
      () => {
        if (__DEV__)
          console.log("[AuthSessionProvider] Session expired event received");
        setShowSessionExpiredModal((prev) => (prev ? prev : true));
      },
    );

    return () => subscription.remove();
  }, []);

  const checkConsents = async () => {
    const hasConsents = await complianceService.hasRequiredConsents();
    setHasRequiredConsents(hasConsents);

    const outdated = await complianceService.isConsentOutdated();
    setConsentOutdated(outdated);
  };

  const login = async (identifier: string, password: string) => {
    const consents = await complianceService.hasRequiredConsents();
    if (!consents) {
      router.push("/privacy-policy");
      throw new Error(
        "Please accept the privacy policy and terms of service to continue.",
      );
    }

    const authResponse = await authService.login(identifier, password);
    setToken(authResponse.details.token);
    setRefreshToken(authResponse.details.refreshToken);
    setUser(authResponse.details.user);

    // Track login count for progressive security setup
    try {
      const countStr = await SecureStore.getItemAsync("login_count");
      const loginCount = parseInt(countStr || "0", 10);
      await SecureStore.setItemAsync("login_count", String(loginCount + 1));
    } catch (e) {
      if (__DEV__) console.warn("[AuthSession] Failed to track login count", e);
    }

    await biometricService.storeBiometricCredentials(identifier, password);
    setHasBiometricCredentials(true);
    setNativeAuthLogin(true);

    // Mark onboarding as complete after successful login
    try {
      await SecureStore.setItemAsync("onboarding_shown", "true");
    } catch (e) {
      if (__DEV__)
        console.warn("[AuthSession] Failed to mark onboarding complete", e);
    }

    // Sync role to widget shared storage
    const role = authResponse.details.user.role ?? "consumer";
    try {
      WidgetStorageService.set("user_role", role);
      if (role === "merchant") {
        const bizName = authResponse.details.user.merchant?.businessName ?? "";
        WidgetStorageService.set("merchant_name", bizName);
      }
    } catch (e) {
      if (__DEV__) console.error("[AuthSession] Failed to write user_role", e);
    }

    // Pre-fetch QR so widget has it immediately after login
    if (role === "merchant") {
      QRCodeService.GeneratePaymentQR().catch((e) => {
        if (__DEV__) console.warn("[AuthSession] Pre-fetch QR failed", e);
      });
      return router.replace("/merchant");
    } else if (role === "consumer") {
      return router.replace("/user");
    }
  };

  const biometricLogin = async () => {
    const consents = await complianceService.hasRequiredConsents();
    if (!consents) {
      router.push("/privacy-policy");
      throw new Error(
        "Please accept the privacy policy and terms of service to continue.",
      );
    }

    const credentials = await biometricService.getBiometricCredentials();
    if (!credentials) {
      throw new Error("No Biometric credentials found");
    }

    const authResponse = await authService.login(
      credentials.identifier,
      credentials.password,
    );

    // Track login count for progressive security setup
    try {
      const countStr = await SecureStore.getItemAsync("login_count");
      const loginCount = parseInt(countStr || "0", 10);
      await SecureStore.setItemAsync("login_count", String(loginCount + 1));
    } catch (e) {
      if (__DEV__) console.warn("[AuthSession] Failed to track login count", e);
    }

    setToken(authResponse.details.token);
    setRefreshToken(authResponse.details.refreshToken);
    setUser(authResponse.details.user);

    // Mark onboarding as complete after successful biometric login
    try {
      await SecureStore.setItemAsync("onboarding_shown", "true");
    } catch (e) {
      if (__DEV__)
        console.warn("[AuthSession] Failed to mark onboarding complete", e);
    }

    const role = authResponse.details.user.role ?? "consumer";
    try {
      WidgetStorageService.set("user_role", role);
      if (role === "merchant") {
        const bizName = authResponse.details.user.merchant?.businessName ?? "";
        WidgetStorageService.set("merchant_name", bizName);
      }
    } catch (e) {
      if (__DEV__)
        console.error(
          "[AuthSession] biometricLogin: Failed to write user_role",
          e,
        );
    }

    if (role === "merchant") {
      QRCodeService.GeneratePaymentQR().catch((e) => {
        if (__DEV__)
          console.warn("[AuthSession] biometricLogin: Pre-fetch QR failed", e);
      });
      return router.replace("/merchant");
    } else if (role === "consumer") {
      return router.replace("/user");
    }
  };

  const register = async (data: RegisterData) => {
    const authResponse = await authService.register(data);

    if (!authResponse?.success) {
      throw new Error("Registration failed. Please try again.");
    }

    router.replace("/auth/login");
    return authResponse.details.userId;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const handleSessionExpiry = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
      setShowSessionExpiredModal(false);
      DeviceEventEmitter.emit("RESET_SESSION_EXPIRY_FLAG");
      router.replace("/auth/login");
    } catch (error) {
      if (__DEV__) {
        console.error(
          "[AuthSessionProvider] Error during session expiry logout:",
          error,
        );
      }
      setShowSessionExpiredModal(false);
      DeviceEventEmitter.emit("RESET_SESSION_EXPIRY_FLAG");
      router.replace("/auth/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const updateNativeAuthSettings = async (
    login: boolean,
    transactions: boolean,
  ) => {
    setNativeAuthLogin(login);
    setNativeAuthTransactions(transactions);

    if (!login && hasBiometricCredentials) {
      await biometricService.clearBiometricCredentials();
      setHasBiometricCredentials(false);
    }
  };

  const updateVisibleBalance = (visible: boolean) => {
    setVisibleBalance(visible);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isFirstLogin,
        clearFirstLogin,
        nativeAuthLogin,
        nativeAuthTransactions,
        visibleBalance,
        hasBiometricCredentials,
        hasRequiredConsents,
        consentOutdated,
        login,
        biometricLogin,
        register,
        logout,
        updateNativeAuthSettings,
        updateVisibleBalance,
        checkConsents,
        token,
        refreshToken,
        isLocked,
        lock,
        unlock,
      }}
    >
      {children}

      <SessionExpiryModal
        visible={showSessionExpiredModal}
        onConfirm={handleSessionExpiry}
        isLoading={isLoggingOut}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthSessionProvider");
  }
  return context;
}
