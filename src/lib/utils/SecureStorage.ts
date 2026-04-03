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
      if (__DEV__)
        console.warn(
          "Keychain not available, skipping hardware security setup",
        );
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
    if (__DEV__) console.warn("Failed to setup hardware security:", error);
  }
}

export class BiometricService {
  private static readonly BIOMETRIC_LOGIN_SERVICE = "biometric_login";

  onFingerPrintPress = async (
    isBiometricSupported: boolean,
  ): Promise<boolean> => {
    try {
      if (__DEV__) console.log("Face ID button pressed");
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

      if (__DEV__) console.log("Biometric result:", result);

      if (result.success) {
        ToastService.success("Biometric Authentication Successful");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        return true;
      } else {
        if (__DEV__)
          console.log("Biometric Authentication Failed:", result.error);

        return false;
      }
    } catch (error) {
      if (__DEV__) console.error("Biometric Authentication Error:", error);
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
        if (__DEV__)
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
      if (__DEV__)
        console.warn("Failed to store biometric credentials:", error);
    }
  }

  async getBiometricCredentials(): Promise<DecryptedCredentials | null> {
    try {
      if (!Keychain || !Keychain.getGenericPassword) {
        if (__DEV__) console.warn("Keychain not available");
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
      if (__DEV__) console.error("Failed to get biometric credentials:", error);
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
      if (__DEV__)
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

interface PinAttemptState {
  count: number;
  lockedUntil: number | null;
}

export class PinService {
  private static readonly PIN_KEY = "user_transaction_pin";
  private static readonly SALT_KEY = "user_transaction_pin_salt";
  private static readonly ATTEMPTS_KEY = "pin_attempt_state";
  private static readonly MAX_ATTEMPTS = 5;

  private static async generateSalt(): Promise<string> {
    const bytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  private static async getSalt(): Promise<string | null> {
    const result = await Keychain.getGenericPassword({
      service: PinService.SALT_KEY,
    });
    return result ? result.password : null;
  }

  private static async getAttemptState(): Promise<PinAttemptState> {
    try {
      const raw = await Keychain.getGenericPassword({
        service: PinService.ATTEMPTS_KEY,
      });
      if (raw) return JSON.parse(raw.password);
    } catch {}
    return { count: 0, lockedUntil: null };
  }

  private static async saveAttemptState(state: PinAttemptState): Promise<void> {
    await Keychain.setGenericPassword("attempts", JSON.stringify(state), {
      service: PinService.ATTEMPTS_KEY,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.ANY,
    });
  }

  /** Returns seconds remaining if locked, 0 if not locked. */
  static async getLockSecondsRemaining(): Promise<number> {
    const state = await PinService.getAttemptState();
    if (state.lockedUntil && Date.now() < state.lockedUntil) {
      return Math.ceil((state.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  }

  static async setPIN(pin: string): Promise<boolean> {
    try {
      const salt = await PinService.generateSalt();
      const hashedPin = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin + salt,
      );
      await Keychain.setGenericPassword("salt", salt, {
        service: PinService.SALT_KEY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.ANY,
      });
      await Keychain.setGenericPassword("pin", hashedPin, {
        service: PinService.PIN_KEY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.ANY,
      });
      await PinService.saveAttemptState({ count: 0, lockedUntil: null });
      return true;
    } catch (error) {
      ToastService.error("Failed to Set PIN");
      if (__DEV__) console.error("Error setting PIN:", error);
      return false;
    }
  }

  static async ValidatePin(pin: string): Promise<boolean> {
    try {
      const lockSeconds = await PinService.getLockSecondsRemaining();
      if (lockSeconds > 0) {
        ToastService.error(`Too many attempts. Try again in ${lockSeconds}s`);
        return false;
      }

      if (!(await PinService.hasPin())) {
        ToastService.warning(
          "No PIN has Been Set. Please Set Up your PIN first.",
        );
        return false;
      }

      const [credentials, salt] = await Promise.all([
        Keychain.getGenericPassword({ service: PinService.PIN_KEY }),
        PinService.getSalt(),
      ]);

      if (!credentials || !salt) return false;

      const inputHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pin + salt,
      );

      if (inputHash === credentials.password) {
        await PinService.saveAttemptState({ count: 0, lockedUntil: null });
        return true;
      }

      // Failed attempt — apply rate limiting
      const state = await PinService.getAttemptState();
      const newCount = state.count + 1;
      if (newCount >= PinService.MAX_ATTEMPTS) {
        // Exponential backoff: 30s * 2^(excess failures), capped at 1 hour
        const excess = newCount - PinService.MAX_ATTEMPTS;
        const backoffMs = Math.min(30_000 * Math.pow(2, excess), 3_600_000);
        await PinService.saveAttemptState({
          count: newCount,
          lockedUntil: Date.now() + backoffMs,
        });
        ToastService.error(
          `Too many attempts. Locked for ${Math.ceil(backoffMs / 1000)}s`,
        );
      } else {
        await PinService.saveAttemptState({
          count: newCount,
          lockedUntil: null,
        });
        ToastService.warning(
          `Incorrect PIN. ${PinService.MAX_ATTEMPTS - newCount} attempt(s) remaining`,
        );
      }
      return false;
    } catch (error) {
      if (__DEV__) console.error("Error validating PIN:", error);
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
      return false;
    }
  }
}
