/**
 * Asset Loader Module
 * Provides a centralized way to load asset files so they're properly resolved by Metro bundler.
 * This ensures assets are correctly included in the APK bundle.
 */
import MasterCard from "@/assets/images/mastercard.svg";
import VisaCard from "@/assets/images/visa.svg";
import { SvgProps } from "react-native-svg";

export const SCHEME_ASSETS: Partial<Record<CardScheme, React.FC<SvgProps>>> = {
  VISA: VisaCard,
  MASTERCARD: MasterCard,
};

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
  RuralPayLogo: require("../../assets/images/RuralPay.png"),
} as const;

// GIF Images
export const GIFS = {
  TapToPay: require("../../assets/gifs/taptopay.gif"),
} as const;

export default {
  SVG_IMAGES,
  IMAGES,
  GIFS,
};
