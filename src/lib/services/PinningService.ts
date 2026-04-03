import {
  addSslPinningErrorListener,
  initializeSslPinning,
  isSslPinningAvailable,
} from "react-native-ssl-public-key-pinning";
import { integrityService } from "./IntegrityService";

class PinningService {
  private _initialized = false;

  async initialize(): Promise<void> {
    if (this._initialized) return;

    // No point enforcing pinning on a device that already owns the trust store
    const compromised = await integrityService.isDeviceCompromised();
    if (compromised) return;

    if (!isSslPinningAvailable()) {
      if (__DEV__)
        console.warn(
          "[PinningService] SSL pinning module not available (Expo Go?)",
        );
      return;
    }

    const domain = process.env.EXPO_PUBLIC_API_DOMAIN;
    const hashesRaw = process.env.EXPO_PUBLIC_SSL_PIN_HASHES;

    if (!domain || !hashesRaw) {
      if (__DEV__)
        console.warn(
          "[PinningService] SSL pin env vars not set — pinning skipped",
        );
      return;
    }

    const publicKeyHashes = hashesRaw.split(",").map((h) => h.trim());

    await initializeSslPinning({
      [domain]: {
        includeSubdomains: true,
        publicKeyHashes,
        // Rotate before this date — forces an app update with new pins
        expirationDate: process.env.EXPO_PUBLIC_SSL_PIN_EXPIRY ?? "2026-01-01",
      },
    });

    addSslPinningErrorListener((error) => {
      if (__DEV__)
        console.error(
          `[PinningService] Pin validation failed for ${error.serverHostname}: ${error.message}`,
        );
    });

    this._initialized = true;
    if (__DEV__)
      console.info(`[PinningService] SSL pinning active for ${domain}`);
  }
}

export const pinningService = new PinningService();
