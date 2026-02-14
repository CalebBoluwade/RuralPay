import { AccessibilityInfo } from "react-native";

class AccessibilityService {
  static announceForAccessibility(message: string) {
    AccessibilityInfo.announceForAccessibility(message);
  }

  static setAccessibilityFocus(reactTag: number) {
    AccessibilityInfo.setAccessibilityFocus(reactTag);
  }

  static async isScreenReaderEnabled(): Promise<boolean> {
    return await AccessibilityInfo.isScreenReaderEnabled();
  }

  static async isReduceMotionEnabled(): Promise<boolean> {
    return await AccessibilityInfo.isReduceMotionEnabled();
  }
}

export default AccessibilityService;