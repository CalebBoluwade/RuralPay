/**
 * Asset Loader Module
 * Provides a centralized way to load asset files so they're properly resolved by Metro bundler.
 * This ensures assets are correctly included in the APK bundle.
 */

// Fonts
export const FONTS = {
  AutourOne: require("../../assets/fonts/AutourOne-Regular.ttf"),
} as const;

// SVG Images
export const SVG_IMAGES = {
  CreditCard: require("../../assets/images/CreditCard.svg"),
  CBN: require("../../assets/images/CBN.svg"),
  ScanToPay: require("../../assets/images/ScanToPay.svg"),
  Visa: require("../../assets/images/visa.svg"),
  Mastercard: require("../../assets/images/mastercard.svg"),
  MTN: require("../../assets/images/mtn-seeklogo.svg"),
} as const;

// PNG/JPG Images
export const IMAGES = {
  RuralPayLogo: require("../../assets/images/RuralPayLogo.png"),
  RuralPaySplash: require("../../assets/images/RuralPaySplash.png"),
  RuralPaySplashJPG: require("../../assets/images/RuralPaySplash.jpg"),
  AndroidIconForeground: require("../../assets/images/android-icon-foreground.png"),
  AndroidIconBackground: require("../../assets/images/android-icon-background.png"),
  AndroidIconMonochrome: require("../../assets/images/android-icon-monochrome.png"),
  Icon: require("../../assets/images/icon.png"),
  Favicon: require("../../assets/images/favicon.png"),
  MS: require("../../assets/images/MS.png"),
} as const;

// GIF Images
export const GIFS = {
  TapToPay: require("../../assets/gifs/taptopay.gif"),
} as const;

export default {
  FONTS,
  SVG_IMAGES,
  IMAGES,
  GIFS,
};
