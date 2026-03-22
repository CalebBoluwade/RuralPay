import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as Keychain from "react-native-keychain";
import ToastService from "../services/ToastService";

interface DecryptedCredentials {
  identifier: string;
  password: string;
}

// Store the Master Key for the Database
export async function SetupHardwareSecurity(merchantId: string) {
  try {
    if (!Keychain || !Keychain.setGenericPassword) {
      console.warn("Keychain not available, skipping hardware security setup");
      return;
    }

    const randomBytes = await Crypto.getRandomBytesAsync(32);
    const secretKey = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await Keychain.setGenericPassword(merchantId, secretKey, {
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.ANY,
    });
  } catch (error) {
    console.warn("Failed to setup hardware security:", error);
  }
}

export class BiometricService {
  private static readonly BIOMETRIC_LOGIN_SERVICE = "biometric_login";

  onFingerPrintPress = async (
    isBiometricSupported: boolean,
  ): Promise<boolean> => {
    try {
      console.log("Face ID button pressed");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (!isBiometricSupported) {
        ToastService.warning("Biometric not supported");
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate for transaction",
        fallbackLabel: "Use PIN",
        disableDeviceFallback: true,
      });

      console.log("Biometric result:", result);

      if (result.success) {
        ToastService.success("Biometric Authentication Successful");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        return true;
      } else {
        console.log("Biometric Authentication Failed:", result.error);

        return false;
      }
    } catch (error) {
      console.error("Biometric Authentication Error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      return false;
    }
  };

  async storeBiometricCredentials(
    identifier: string,
    password: string,
  ): Promise<void> {
    try {
      if (!Keychain || !Keychain.setGenericPassword) {
        console.warn(
          "Keychain not available, cannot store biometric credentials",
        );
        return;
      }

      const data = JSON.stringify({ identifier, password });

      await Keychain.setGenericPassword(identifier, data, {
        service: BiometricService.BIOMETRIC_LOGIN_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.ANY,
      });
    } catch (error) {
      console.warn("Failed to store biometric credentials:", error);
    }
  }

  async getBiometricCredentials(): Promise<DecryptedCredentials | null> {
    try {
      if (!Keychain || !Keychain.getGenericPassword) {
        console.warn("Keychain not available");
        return null;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to login",
        fallbackLabel: "Use passcode",
        disableDeviceFallback: false,
      });

      if (!result.success) {
        throw new Error("Biometric authentication failed");
      }

      const credentials = await Keychain.getGenericPassword({
        service: BiometricService.BIOMETRIC_LOGIN_SERVICE,
      });

      if (credentials) {
        return JSON.parse(credentials.password);
      }
    } catch (error) {
      console.error("Failed to get biometric credentials:", error);
      throw error;
    }

    return null;
  }

  async hasBiometricCredentials(): Promise<boolean> {
    try {
      if (!Keychain || !Keychain.hasGenericPassword) {
        return false;
      }

      return await Keychain.hasGenericPassword({
        service: BiometricService.BIOMETRIC_LOGIN_SERVICE,
      });
    } catch {
      return false;
    }
  }

  async clearBiometricCredentials(): Promise<void> {
    try {
      if (Keychain && Keychain.resetGenericPassword) {
        await Keychain.resetGenericPassword({
          service: BiometricService.BIOMETRIC_LOGIN_SERVICE,
        });
      }
    } catch (error) {
      console.warn("Failed to clear biometric credentials:", error);
    }
  }

  async isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }
}

export const biometricService = new BiometricService();

export class PinService {
  private static readonly PIN_KEY = "user_transaction_pin";
  private static readonly SALT = "nfc_payment_salt_2024";

  static async setPin(pin: string): Promise<boolean> {
    try {
      const hashedPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin + PinService.SALT,
      );
      await Keychain.setGenericPassword("pin", hashedPin, {
        service: PinService.PIN_KEY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.ANY,
      });
      return true;
    } catch (error) {
      ToastService.error("Failed to Set PIN");
      console.error("Error setting PIN:", error);
      return false;
    }
  }

  static async ValidatePin(pin: string): Promise<boolean> {
    try {
      if (!(await PinService.hasPin())) {
        ToastService.warning(
          "No PIN has Been Set. Please Set Up your PIN first.",
        );
        return false;
      }

      const credentials = await Keychain.getGenericPassword({
        service: PinService.PIN_KEY,
      });

      if (!credentials) {
        return false;
      }

      const inputHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin + PinService.SALT,
      );

      return inputHash === credentials.password;
    } catch (error) {
      console.error("Error validating PIN:", error);
      ToastService.error("PIN Validation Failed.");
      return false;
    }
  }

  static async hasPin(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: PinService.PIN_KEY,
      });
      return !!credentials;
    } catch {
      ToastService.error("Failed to Retrieve PIN");
      // Return false if keychain is unavailable
      return false;
    }
  }
}
