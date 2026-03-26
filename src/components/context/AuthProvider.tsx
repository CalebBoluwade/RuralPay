import { authService } from "@/src/lib/services/AuthService";
import { complianceService } from "@/src/lib/services/ComplianceService";
import { biometricService } from "@/src/lib/utils/SecureStorage";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
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

export function AuthProvider({
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
  const [isLocked, setIsLocked] = useState(false);

  const lock = () => setIsLocked(true);
  const unlock = () => setIsLocked(false);

  //   const timerRef = useRef<NodeJS.Timeout>();
  // const interactionListenerRef = useRef<any>();
  // const appStateRef = useRef<AppStateStatus>(appState);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const authData = await authService.getStoredAuthData();
      if (authData) {
        setUser(authData.details.user);
      }

      const hasBiometric = await biometricService.hasBiometricCredentials();
      setHasBiometricCredentials(hasBiometric);
      if (hasBiometric) setNativeAuthLogin(true);

      const hasConsents = await complianceService.hasRequiredConsents();
      setHasRequiredConsents(hasConsents);

      const outdated = await complianceService.isConsentOutdated();
      setConsentOutdated(outdated);
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // JWT Expiry Watcher
  useEffect(() => {
    if (!token) return;

    const decoded: any = jwtDecode(token);
    const expiry = decoded.exp * 1000;

    console.log("Az Expired: " + expiry, expiry - Date.now());

    const timeout = setTimeout(() => {
      logout();
    }, expiry - Date.now());

    return () => clearTimeout(timeout);
  }, [token]);

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
    setUser(authResponse.details.user);

    await biometricService.storeBiometricCredentials(identifier, password);
    setHasBiometricCredentials(true);
    setNativeAuthLogin(true);

    if (authResponse.details.user.role === "merchant") {
      return router.push("/merchant");
    } else if (authResponse.details.user.role === "consumer") {
      return router.push("/user");
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

    setToken(authResponse.details.token);
    setUser(authResponse.details.user);

    if (authResponse.details.user.role === "merchant") {
      return router.push("/merchant");
    } else if (authResponse.details.user.role === "consumer") {
      return router.push("/user");
    }
  };

  const register = async (data: RegisterData) => {
    const authResponse = await authService.register(data);

    // if (authResponse.user.role === "merchant") {
    //   await complianceService.createMerchantConsents(authResponse.user.id);
    // } else if (authResponse.user.role === "consumer") {
    //   await complianceService.createConsumerConsents(authResponse.user.id);
    // }

    if (!authResponse?.success) {
      throw new Error("Registration failed. Please try again.");
    }

    router.push("/auth/login");
    return authResponse.details.userId;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);

    router.replace("/auth/login");
  };

  const updateNativeAuthSettings = async (
    login: boolean,
    transactions: boolean,
  ) => {
    setNativeAuthLogin(login);
    setNativeAuthTransactions(transactions);

    // Clear biometric credentials if biometric login is disabled
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
        isLocked,
        lock,
        unlock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
