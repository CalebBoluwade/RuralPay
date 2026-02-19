import { authService } from "@/lib/auth";
import { complianceService } from "@/lib/services/ComplianceService";
import { biometricService } from "@/lib/utils/SecureStorage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  nativeAuthLogin: boolean;
  nativeAuthTransactions: boolean;
  visibleBalance: boolean;
  hasBiometricCredentials: boolean;
  hasRequiredConsents: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  biometricLogin: () => Promise<void>;
  register: (data: RegisterData) => Promise<User>;
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

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const authData = await authService.getStoredAuthData();
      if (authData) {
        setUser(authData.user);
      }

      const hasBiometric = await biometricService.hasBiometricCredentials();
      setHasBiometricCredentials(hasBiometric);

      const hasConsents = await complianceService.hasRequiredConsents();
      setHasRequiredConsents(hasConsents);
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConsents = async () => {
    const hasConsents = await complianceService.hasRequiredConsents();
    setHasRequiredConsents(hasConsents);
  };

  const login = async (identifier: string, password: string) => {
    const authResponse = await authService.login(identifier, password);
    setUser(authResponse.user);

    if (authResponse.user.role === "merchant") {
      return router.push("/(merchant)");
    } else if (authResponse.user.role === "consumer") {
      return router.push("/(user)");
    }

    // Store credentials for biometric login if enabled
    if (nativeAuthLogin) {
      await biometricService.storeBiometricCredentials(identifier, password);
      setHasBiometricCredentials(true);
    }
  };

  const biometricLogin = async () => {
    const credentials = await biometricService.getBiometricCredentials();
    if (!credentials) {
      throw new Error("No biometric credentials found");
    }

    const authResponse = await authService.login(
      credentials.identifier,
      credentials.password,
    );
    setUser(authResponse.user);

    if (authResponse.user.role === "merchant") {
      return router.push("/(merchant)");
    } else if (authResponse.user.role === "consumer") {
      return router.push("/(user)");
    }
  };

  const register = async (data: RegisterData) => {
    const authResponse = await authService.register(data);

    // if (authResponse.user.role === "merchant") {
    //   await complianceService.createMerchantConsents(authResponse.user.id);
    // } else if (authResponse.user.role === "consumer") {
    //   await complianceService.createConsumerConsents(authResponse.user.id);
    // }

    router.push("/(auth)/Login");

    if (!authResponse) {
      throw new Error("Registration failed. Please try again.");
    }

    return authResponse.user;
  };

  const logout = async () => {
    await authService.logout();
    await biometricService.clearBiometricCredentials();
    setUser(null);
    setHasBiometricCredentials(false);
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
        login,
        biometricLogin,
        register,
        logout,
        updateNativeAuthSettings,
        updateVisibleBalance,
        checkConsents,
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
