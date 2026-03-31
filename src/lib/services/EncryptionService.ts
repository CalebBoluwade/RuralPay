import * as Crypto from "expo-crypto";
import * as Keychain from "react-native-keychain";
import { RSA } from "react-native-rsa-native";
import nacl from "tweetnacl";
import { axiosInstance } from "../api";

interface UserKey {
  publicKey: string;
  hash: string;
  algorithm: string;
}

class EncryptionService {
  private readonly PUBLIC_KEY_PEM_ID = "RuralPayUserKey";

  async RetrieveUserKey() {
    try {
      const response =
        await axiosInstance.get<
          APIResponse<{ publicKey: string; hash: string; algorithm: string }>
        >("/encryption/keys");

      await Keychain.setGenericPassword(
        this.PUBLIC_KEY_PEM_ID,
        JSON.stringify(response.details),
        {
          service: this.PUBLIC_KEY_PEM_ID,
          accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
        },
      );

      return response.details.publicKey;
    } catch (error) {
      if (__DEV__) console.error("Failed to retrieve user key:", error);
      throw new Error("Could Not Retrieve Encryption Key");
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

      // 3. Convert AES key to Base64 string for RSA encryption
      const aesKeyBase64 = Buffer.from(aesKey).toString("base64");

      // 4. Encrypt AES key with RSA public key
      const encryptedAesKeyBase64 = await RSA.encrypt(aesKeyBase64, publicKey);
      const encryptedAesKey = Buffer.from(encryptedAesKeyBase64, "base64");

      // 5. Encrypt PII data with authenticated encryption
      const encryptedData = this.encryptWithSecretBox(data, aesKey, iv);

      // 6. Package payload for backend decryption
      const payload = this.buildEncryptionPayload(
        encryptedAesKey,
        iv,
        encryptedData,
      );

      return payload.toString("base64");
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
    encryptedAesKey: Buffer,
    iv: Uint8Array,
    encryptedData: Uint8Array,
  ): Buffer {
    const rsaKeyLength = encryptedAesKey.byteLength;
    const lengthBuffer = Buffer.allocUnsafe(2);
    lengthBuffer.writeUInt16LE(rsaKeyLength, 0);

    return Buffer.concat([
      lengthBuffer,
      encryptedAesKey,
      Buffer.from(iv),
      Buffer.from(encryptedData),
    ]);
  }
}

export default new EncryptionService();
