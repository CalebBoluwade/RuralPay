import * as Crypto from "expo-crypto";
import forge from "node-forge";
import * as Keychain from "react-native-keychain";
import nacl from "tweetnacl";
import { axiosInstance } from "../api";

interface UserKey {
  publicKey: string;
  hash: string;
  algorithm: string;
  useEncryptedPayload: boolean;
}

function uint8ToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.byteLength;
  }
  return result;
}

class EncryptionService {
  private readonly PUBLIC_KEY_PEM_ID = "RuralPayUserKey";

  async RetrieveUserKey() {
    // Try cached key first — avoids an unauthenticated API call during login
    try {
      const cached = await this.GetUserKey();
      if (cached) return cached;
    } catch (error) {
      if (__DEV__) console.warn("Failed to retrieve cached user key:", error);
    }

    try {
      const response =
        await axiosInstance.get<APIResponse<UserKey>>("/encryption/keys");

      await Keychain.setGenericPassword(
        this.PUBLIC_KEY_PEM_ID,
        JSON.stringify(response.details),
        {
          service: this.PUBLIC_KEY_PEM_ID,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
        },
      );

      return response.details;
    } catch (error) {
      if (__DEV__) console.error("Failed to retrieve user key:", error);
      throw new Error("Could Not Retrieve Encryption Keys");
    }
  }

  async GetUserKey(): Promise<UserKey> {
    const credentials = await Keychain.getGenericPassword({
      service: this.PUBLIC_KEY_PEM_ID,
    });

    if (!credentials || credentials.username !== this.PUBLIC_KEY_PEM_ID) {
      throw new Error("User Encryption Key Not Found");
    }

    return JSON.parse(credentials.password);
  }

  /**
   * Encrypts PII using hybrid RSA + AES-GCM encryption
   * Implements a hybrid cryptosystem where:
   * - AES-256 key encrypts the actual data (using NaCl SecretBox)
   * - RSA-OAEP encrypts the AES key for secure transmission
   */
  async EncryptPII(data: string): Promise<string> {
    try {
      // 1. Obtain user's RSA public key
      const userKey = await this.ensureUserKeyAvailable();
      const { publicKey } = userKey;

      // 2. Generate symmetric encryption materials
      const aesKey = Crypto.getRandomBytes(32); // 256-bit AES key as Uint8Array
      const iv = Crypto.getRandomBytes(12); // 12-byte IV for AES-GCM

      // 4. Encrypt AES key with RSA public key (OAEP + SHA-256)
      const rsakey = forge.pki.publicKeyFromPem(publicKey);
      const encryptedAesKey = Uint8Array.from(
        forge.util.binary.raw.decode(
          rsakey.encrypt(forge.util.binary.raw.encode(aesKey), "RSA-OAEP", {
            md: forge.md.sha256.create(),
          }),
        ),
      );

      // 5. Encrypt PII data with authenticated encryption
      const encryptedData = this.encryptWithSecretBox(data, aesKey, iv);

      // 6. Package payload for backend decryption
      const payload = this.buildEncryptionPayload(
        encryptedAesKey,
        iv,
        encryptedData,
      );

      return uint8ToBase64(payload);
    } catch (error) {
      if (__DEV__) console.error("PII encryption failed:", error);
      throw new Error("Failed To Secure Sensitive Data");
    }
  }

  /**
   * Ensures user key exists, retrieving it if necessary
   */
  private async ensureUserKeyAvailable(): Promise<UserKey> {
    try {
      return await this.GetUserKey();
    } catch {
      await this.RetrieveUserKey();
      return await this.GetUserKey();
    }
  }

  /**
   * Encrypts data using NaCl SecretBox (authenticated encryption)
   * Note: SecretBox requires a 24-byte nonce; we pad the 12-byte IV with zeros
   */
  private encryptWithSecretBox(
    data: string,
    key: Uint8Array,
    iv: Uint8Array,
  ): Uint8Array {
    const dataBytes = new TextEncoder().encode(data);
    const nonce = new Uint8Array(24);
    nonce.set(iv, 0);

    return nacl.secretbox(dataBytes, nonce, key);
  }

  /**
   * Builds the binary payload format expected by the Go backend
   * Format: [2 bytes: RSA key length] + [RSA encrypted key] + [12 bytes: IV] + [ciphertext + auth tag]
   */
  private buildEncryptionPayload(
    encryptedAesKey: Uint8Array,
    iv: Uint8Array,
    encryptedData: Uint8Array,
  ): Uint8Array {
    const lengthBuffer = new Uint8Array(2);
    new DataView(lengthBuffer.buffer).setUint16(
      0,
      encryptedAesKey.byteLength,
      true,
    );

    return concatUint8Arrays([
      lengthBuffer,
      encryptedAesKey,
      iv,
      encryptedData,
    ]);
  }
}

export default new EncryptionService();
