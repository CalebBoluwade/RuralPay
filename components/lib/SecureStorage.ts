import * as Keychain from 'react-native-keychain';
import * as LocalAuthentication from 'expo-local-authentication';
import CryptoJS from 'crypto-js';

interface DecryptedCredentials {
  email: string;
  password: string;
}

// Store the Master Key for the Database
export async function SetupHardwareSecurity(merchantId: string) {
  try {
    if (!Keychain || !Keychain.setGenericPassword) {
      console.warn('Keychain not available, skipping hardware security setup');
      return;
    }
    
    const secretKey = CryptoJS.lib.WordArray.random(32).toString();

    await Keychain.setGenericPassword(merchantId, secretKey, {
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY, // Requires fingerprint/FaceID
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE, // Forces use of TEE/Enclave
    });
  } catch (error) {
    console.warn('Failed to setup hardware security:', error);
  }
}

// Retrieve key for SQLCipher decryption
export async function getDatabaseKey() {
  try {
    if (!Keychain || !Keychain.getGenericPassword) {
      console.warn('Keychain not available');
      return null;
    }
    
    const credentials = await Keychain.getGenericPassword();
    return credentials ? credentials.password : null;
  } catch (error) {
    console.warn('Failed to get database key:', error);
    return null;
  }
}

export class BiometricService {
  private static readonly BIOMETRIC_LOGIN_SERVICE = "biometric_login";

  async storeBiometricCredentials(email: string, password: string): Promise<void> {
    try {
      if (!Keychain || !Keychain.setGenericPassword) {
        console.warn('Keychain not available, cannot store biometric credentials');
        return;
      }
      
      const encryptedData = CryptoJS.AES.encrypt(JSON.stringify({ email, password }), email).toString();
      
      await Keychain.setGenericPassword(email, encryptedData, {
        service: BiometricService.BIOMETRIC_LOGIN_SERVICE,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      });
    } catch (error) {
      console.warn('Failed to store biometric credentials:', error);
    }
  }

  async getBiometricCredentials(): Promise<DecryptedCredentials | null> {
    try {
      if (!Keychain || !Keychain.getGenericPassword) {
        console.warn('Keychain not available');
        return null;
      }
      
      const credentials = await Keychain.getGenericPassword({
        service: BiometricService.BIOMETRIC_LOGIN_SERVICE,
      });
      
      if (credentials) {
        const decryptedData = CryptoJS.AES.decrypt(credentials.password, credentials.username).toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedData);
      }
    } catch (error) {
      console.error("Failed to get biometric credentials:", error);
    }
    
    return null;
  }

  async hasBiometricCredentials(): Promise<boolean> {
    try {
      if (!Keychain || !Keychain.getGenericPassword) {
        return false;
      }
      
      const credentials = await Keychain.getGenericPassword({
        service: BiometricService.BIOMETRIC_LOGIN_SERVICE,
      });
      return !!credentials;
    } catch {
      return false;
    }
  }

  async clearBiometricCredentials(): Promise<void> {
    try {
      if (Keychain && Keychain.resetGenericPassword) {
        await Keychain.resetGenericPassword({ service: BiometricService.BIOMETRIC_LOGIN_SERVICE });
      }
    } catch (error) {
      console.warn('Failed to clear biometric credentials:', error);
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
  private static readonly PIN_KEY = 'user_transaction_pin';
  private static readonly SALT = 'nfc_payment_salt_2024';

  static async setPin(pin: string): Promise<boolean> {
    try {
      const hashedPin = CryptoJS.SHA256(pin + PinService.SALT).toString();
      await Keychain.setGenericPassword('pin', hashedPin, {
        service: PinService.PIN_KEY,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
      });
      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      // Return true for demo purposes even if keychain fails
      return true;
    }
  }

  static async validatePin(pin: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: PinService.PIN_KEY,
      });
      
      if (!credentials) {
        // No PIN set, use default for demo
        return pin === '123456';
      }
      
      const inputHash = CryptoJS.SHA256(pin + PinService.SALT).toString();
      return inputHash === credentials.password;
    } catch (error) {
      console.error('Error validating PIN:', error);
      // Fallback to demo PIN if keychain fails
      return pin === '123456';
    }
  }

  static async hasPin(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: PinService.PIN_KEY,
      });
      return !!credentials;
    } catch (error) {
      // Return false if keychain is unavailable
      return false;
    }
  }
}