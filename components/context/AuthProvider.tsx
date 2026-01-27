import React, { createContext, useContext, useEffect, useState } from "react";
import { biometricService } from "../../lib/SecureStorage";
import { authService } from "../../lib/auth";

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  bvn: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  nativeAuthLogin: boolean;
  nativeAuthTransactions: boolean;
  visibleBalance: boolean;
  hasBiometricCredentials: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  biometricLogin: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateNativeAuthSettings: (
    login: boolean,
    transactions: boolean,
  ) => Promise<void>;
  updateVisibleBalance: (visible: boolean) => void;
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
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phoneNumber: string, password: string) => {
    const authResponse = await authService.login(phoneNumber, password);
    setUser(authResponse.user);

    // Store credentials for biometric login if enabled
    if (nativeAuthLogin) {
      await biometricService.storeBiometricCredentials(phoneNumber, password);
      setHasBiometricCredentials(true);
    }
  };

  const biometricLogin = async () => {
    const credentials = await biometricService.getBiometricCredentials();
    if (!credentials) {
      throw new Error("No biometric credentials found");
    }

    const authResponse = await authService.login(
      credentials.phoneNumber,
      credentials.password,
    );
    setUser(authResponse.user);
  };

  const register = async (data: RegisterData) => {
    const authResponse = await authService.register(data);
    setUser(authResponse.user);
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
        login,
        biometricLogin,
        register,
        logout,
        updateNativeAuthSettings,
        updateVisibleBalance,
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
