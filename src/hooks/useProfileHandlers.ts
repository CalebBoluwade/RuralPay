import ToastService from "@/src/lib/services/ToastService";
import { biometricService, PinService } from "@/src/lib/utils/SecureStorage";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { authService } from "../lib/services/AuthService";

interface UseProfileHandlersProps {
  logout: () => Promise<void>;
  updateNativeAuthSettings: (
    login: boolean,
    transactions: boolean,
  ) => Promise<void>;
  nativeAuthLogin: boolean;
  nativeAuthTransactions: boolean;
  user: any;
}

export const useProfileHandlers = ({
  logout,
  updateNativeAuthSettings,
  nativeAuthLogin,
  nativeAuthTransactions,
  user,
}: UseProfileHandlersProps) => {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStep, setPinStep] = useState<"old" | "new">("old");
  const [editedFirstName, setEditedFirstName] = useState(user?.firstName || "");
  const [editedLastName, setEditedLastName] = useState(user?.lastName || "");

  const resetPinState = useCallback(() => {
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    setPinStep("old");
  }, []);

  const handlePinChange = useCallback(async () => {
    if (pinStep === "old") {
      if (oldPin.length !== 6) {
        Alert.alert("Error", "PIN must be 6 digits");
        return;
      }
      const isValid = await PinService.ValidatePin(oldPin);
      if (!isValid) {
        ToastService.error("Current PIN is Incorrect");
        setOldPin("");
        return;
      }
      setPinStep("new");
    } else {
      if (newPin.length !== 6) {
        Alert.alert("Error", "New PIN must be 6 digits");
        return;
      }
      if (newPin !== confirmPin) {
        Alert.alert("Error", "PINs do not match");
        setConfirmPin("");
        return;
      }
      await PinService.setPIN(newPin);
      ToastService.success("PIN Updated Successfully");
      resetPinState();
    }
  }, [pinStep, oldPin, newPin, confirmPin, resetPinState]);

  const handleBiometricLoginToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        const isAvailable = await biometricService.isBiometricAvailable();
        if (!isAvailable) {
          ToastService.error("Biometric Authentication Is Not Available");
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Enable Biometric Login",
          fallbackLabel: "Use passcode",
        });

        if (!result.success) {
          ToastService.error("Authentication failed");
          return;
        }
      }
      await updateNativeAuthSettings(value, nativeAuthTransactions);
    },
    [nativeAuthTransactions, updateNativeAuthSettings],
  );

  const handleTransactionSecurityToggle = useCallback(
    async (value: boolean) => {
      if (value) {
        const isAvailable = await biometricService.isBiometricAvailable();
        if (!isAvailable) {
          ToastService.error("Biometric Authentication Is Not Available");
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Enable Transaction Security",
          fallbackLabel: "Use passcode",
        });

        if (!result.success) {
          ToastService.error("Authentication failed");
          return;
        }
      }
      await updateNativeAuthSettings(nativeAuthLogin, value);
    },
    [nativeAuthLogin, updateNativeAuthSettings],
  );

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are You Sure You Want to Logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  }, [logout]);

  const handleDeleteAccount = useCallback(async () => {
    const response = await authService.DeleteAccount();

    if (!response.success) {
      ToastService.error(response.message || "Failed to delete account");
      return;
    }

    Alert.alert(
      "Account Deleted",
      "Your Account has been successfully deleted",
      [
        {
          text: "OK",
          onPress: async () => {
            ToastService.success("Account Deleted Successfully");
            await logout();
            router.replace("/auth/login");
          },
        },
      ],
    );
  }, [logout]);

  const handleEdit = useCallback(() => {
    setEditedFirstName(user?.firstName || "");
    setEditedLastName(user?.lastName || "");
  }, [user]);

  const handleSaveDetails = useCallback(() => {
    if (user) {
      user.firstName = editedFirstName;
      user.lastName = editedLastName;
    }
    ToastService.success("Profile Updated Successfully!");
  }, [user, editedFirstName, editedLastName]);

  return {
    pinState: {
      oldPin,
      newPin,
      confirmPin,
      pinStep,
      setOldPin,
      setNewPin,
      setConfirmPin,
      setPinStep,
    },
    handlePinChange,
    handleBiometricLoginToggle,
    handleTransactionSecurityToggle,
    handleLogout,
    handleDeleteAccount,
    handleEdit,
    handleSaveDetails,
    editedFirstName,
    setEditedFirstName,
    editedLastName,
    setEditedLastName,
    resetPinState,
  };
};
