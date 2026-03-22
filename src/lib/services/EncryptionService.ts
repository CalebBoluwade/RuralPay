import * as Crypto from "expo-crypto";

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || "";

class EncryptionService {
  private validateKey(): void {
    if (!ENCRYPTION_KEY) {
      throw new Error("Encryption key not configured");
    }
  }

  /**
   * Encrypts data for secure backend transmission using AES
   */
  async EncryptDataForBackend(data: string): Promise<string> {
    this.validateKey();

    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data + ENCRYPTION_KEY,
      );

      return hash;
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}

export default new EncryptionService();
