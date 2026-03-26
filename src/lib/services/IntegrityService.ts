import { Directory, File } from "expo-file-system";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Paths that only exist on jailbroken iOS devices
const IOS_JAILBREAK_PATHS = [
  "/Applications/Cydia.app",
  "/Library/MobileSubstrate/MobileSubstrate.dylib",
  "/bin/bash",
  "/usr/sbin/sshd",
  "/etc/apt",
  "/private/var/lib/apt",
  "/usr/bin/ssh",
  "/private/var/stash",
];

// Paths that only exist on rooted Android devices
const ANDROID_ROOT_PATHS = [
  "/system/app/Superuser.apk",
  "/system/xbin/su",
  "/system/bin/su",
  "/sbin/su",
  "/data/local/su",
  "/data/local/bin/su",
  "/data/local/xbin/su",
  "/system/sd/xbin/su",
  "/system/bin/failsafe/su",
  "/data/local/tmp/su",
  "/system/app/SuperSU.apk",
  "/system/app/Kinguser.apk",
];

class IntegrityService {
  private _cachedResult: boolean | null = null;

  async isDeviceCompromised(): Promise<boolean> {
    if (this._cachedResult !== null) return this._cachedResult;

    // Simulators/emulators are not real devices — skip checks entirely
    if (!Device.isDevice) {
      this._cachedResult = false;
      return false;
    }

    const compromised =
      Platform.OS === "ios"
        ? await this._checkIOS()
        : await this._checkAndroid();

    this._cachedResult = compromised;
    return compromised;
  }

  private async _checkIOS(): Promise<boolean> {
    for (const path of IOS_JAILBREAK_PATHS) {
      try {
        const isDir = path.endsWith(".app") || !path.includes(".");
        const exists = isDir
          ? new Directory(path).exists
          : new File(path).exists;
        if (exists) return true;
      } catch {
        // Access denied to path — itself a jailbreak signal on sensitive paths
        if (path === "/bin/bash" || path === "/usr/sbin/sshd") return true;
      }
    }
    return false;
  }

  private async _checkAndroid(): Promise<boolean> {
    for (const path of ANDROID_ROOT_PATHS) {
      try {
        if (new File(path).exists) return true;
      } catch {
        // Continue checking
      }
    }
    return false;
  }

  /** Call this to invalidate the cache (e.g. on app foreground) */
  resetCache() {
    this._cachedResult = null;
  }
}

export const integrityService = new IntegrityService();
