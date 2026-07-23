// import "dotenv/config";
import { ConfigContext, ExpoConfig } from "expo/config";
import { existsSync } from "fs";
import { version } from "./package.json";

const EAS_PROJECT_ID = "e4c8aac2-05e4-4310-9ed9-a70edcdadbe6";
const PROJECT_SLUG = "nfc-card-payments";
const OWNER = "calebjnr";

// Whitelabel overrides (injected by CI via env vars, fallback to RuralPay defaults)
const TENANT_SLUG = process.env.TENANT_SLUG ?? PROJECT_SLUG;
const APP_NAME = process.env.TENANT_APP_NAME ?? "RuralPay";
const BUNDLE_IDENTIFIER =
  process.env.TENANT_BUNDLE_ID ?? "com.zegiftedtechnologies.ruralpay";
const PACKAGE_NAME =
  process.env.TENANT_PACKAGE_NAME ?? "com.zegiftedtechnologies.ruralpay";
const SCHEME = process.env.TENANT_SCHEME ?? "ruralpay";
const TENANT_DOMAIN =
  process.env.TENANT_DOMAIN ?? "ruralpay.zegiftedtechnologies.com";
const ANDROID_HOST = TENANT_DOMAIN;

// Asset paths — CI unzips to ./assets/{tenantSlug}/, local dev falls back to default
const ASSET_BASE = `./assets/${TENANT_SLUG}`;
const ICON = existsSync(`${ASSET_BASE}/app_icon.png`)
  ? `${ASSET_BASE}/app_icon.png`
  : "./assets/images/RuralPay.png";
const ADAPTIVE_ICON = ICON;
const SPLASH = existsSync(`${ASSET_BASE}/splash_screen.png`)
  ? `${ASSET_BASE}/splash_screen.png`
  : "./assets/images/splash-icon.png";

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv =
    process.env.APP_ENV || process.env.EXPO_PUBLIC_ENVIRONMENT || "development";

  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";

  return {
    ...config,
    name: APP_NAME,
    version,
    slug: PROJECT_SLUG,
    orientation: "default",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["assets/fonts/*", "assets/images/*", "assets/gifs/*"],
    icon: ICON,
    scheme: SCHEME,
    ios: {
      supportsTablet: true,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      appleTeamId: "G3YNG3LDQ3",
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
      entitlements: {
        "com.apple.security.application-groups": [
          "group.com.zegiftedtechnologies.ruralpay",
        ],
        "com.apple.developer.nfc.readersession.formats": ["NDEF", "TAG"],
        "aps-environment":
          appEnv === "production" ? "production" : "development",
      },
      infoPlist: {
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationLandscapeLeft",
          "UIInterfaceOrientationLandscapeRight",
        ],
        "UISupportedInterfaceOrientations~ipad": [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationPortraitUpsideDown",
          "UIInterfaceOrientationLandscapeLeft",
          "UIInterfaceOrientationLandscapeRight",
        ],
        UIBackgroundModes: ["fetch", "remote-notification"],
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: `${APP_NAME} uses your camera to scan QR codes for payments and to verify your identity during registration`,
        NFCReaderUsageDescription: `${APP_NAME} uses NFC to read your payment card details for contactless transactions`,
        NSLocationAlwaysAndWhenInUseUsageDescription: undefined,
        NSLocationWhenInUseUsageDescription: `${APP_NAME} uses your location to verify transaction origin and detect fraudulent activity on your account`,
        // Suppress stale Expo Dev Launcher injections — this app does not use
        // CoreMotion hardware or local network discovery in production
        NSMotionUsageDescription: undefined,
        NSLocalNetworkUsageDescription: undefined,
        // NSLocationAlwaysUsageDescription is a legacy key superseded by
        // NSLocationAlwaysAndWhenInUseUsageDescription — suppress the stale default
        NSLocationAlwaysUsageDescription: undefined,
        // Microphone — set here to ensure it overrides any stale prebuild value
        NSMicrophoneUsageDescription: `${APP_NAME} uses your microphone for voice-activated banking and transaction commands`,
        // Contacts — used in airtime and data purchase to pick a recipient from contacts
        NSContactsUsageDescription: `${APP_NAME} uses your contacts so you can quickly select a recipient's phone number when purchasing airtime or data`,
        FIREBASE_ANALYTICS_COLLECTION_ENABLED: true,
        CFBundleAllowMixedLocalizations: true,
        // Actual supported locales — en + Nigerian languages. No French in the codebase.
        CFBundleLocalizations: ["en", "yo", "ig", "ha"],
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [SCHEME],
          },
        ],
        LSApplicationCategoryType: "public.app-category.finance",
        NSSupportsLiveActivities: true,
        NSSupportsLiveActivitiesFrequentUpdates: true,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: ADAPTIVE_ICON,
        monochromeImage: "./assets/images/RuralPay-Monochrome.png",
        backgroundColor: "#ffffff",
      },
      predictiveBackGestureEnabled: false,
      package: PACKAGE_NAME,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: ANDROID_HOST,
              pathPrefix: "/qrpay",
            },
            {
              scheme: "https",
              host: ANDROID_HOST,
              pathPrefix: "/checkout",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
        {
          action: "VIEW",
          data: [
            {
              scheme: SCHEME,
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      ...(googleServicesFile && { googleServicesFile }),
      permissions: [
        "android.permission.NFC",
        "android.permission.CAMERA",
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
      ],
    },
    // updates: {
    //   url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
    //   checkAutomatically: "ON_ERROR_RECOVERY",
    //   fallbackToCacheTimeout: 0,
    // },
    // runtimeVersion: {
    //   policy: "appVersion",
    // },
    extra: {
      eas: {
        projectId: EAS_PROJECT_ID,
      },
      // apiUrl: getApiUrl(appEnv as "development" | "preview" | "production"),
      environment: appEnv,
      router: {},
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-audio",
        {
          microphonePermission: `Allow ${APP_NAME} to access your microphone for voice-activated banking and transaction commands`,
        },
      ],
      [
        "expo-font",
        {
          fonts: ["./assets/fonts/AutourOne.ttf"],
        },
      ],
      "@bacons/apple-targets",
      "expo-image",
      "expo-sharing",
      "expo-web-browser",
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#e6ede7",
          android: {
            image: SPLASH,
            imageWidth: 250,
            imageHeight: 250,
          },
        },
      ],
      //      [
      //   "expo-splash-screen",
      //   {
      //     image: "./assets/images/RuralPaySplash.png",
      //     imageWidth: 300,
      //     resizeMode: "cover",
      //     backgroundColor: "#ffffff",
      //     dark: {
      //       backgroundColor: "#000000",
      //     },
      //   },
      // ],
      [
        "expo-notifications",
        {
          icon: ICON,
          color: "#ffffff",
          mode: appEnv === "production" ? "production" : "development",
        },
      ],
      // "./plugins/withMainApplicationFix",
      "./plugins/withModularHeaders",
      "./plugins/withMavenCentral",
      "./plugins/withBLEPermissions",
      "./plugins/withAndroidWidget",
      "./plugins/withIOSWidget",
      "./plugins/withScreenSecurity",
      [
        "react-native-nfc-manager",
        {
          nfcReaderUsageDescription: `${APP_NAME} uses NFC to read your payment card details for contactless transactions`,
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission: `${APP_NAME} uses your location to verify transaction origin and detect fraudulent activity on your account`,
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: `${APP_NAME} uses your camera to scan QR codes for payments and to verify your identity during registration`,
        },
      ],
      [
        "react-native-vision-camera",
        {
          cameraPermissionText: `${APP_NAME} uses your camera to verify your identity during registration`,
          enableFrameProcessors: true,
        },
      ],
      // ["@stripe/stripe-react-native", {}],
      "expo-secure-store",
      [
        "expo-contacts",
        {
          contactsPermission: `${APP_NAME} uses your contacts so you can quickly select a recipient's phone number when purchasing airtime or data`,
        },
      ],
      [
        "expo-local-authentication",
        {
          faceIDPermission: `${APP_NAME} uses Face ID to authenticate your identity for secure login and transaction approval`,
          fingerprintPermission: `${APP_NAME} uses your fingerprint to authenticate your identity for secure login and transaction approval`,
          touchIDPermission: `${APP_NAME} uses Touch ID to authenticate your identity for secure login and transaction approval`,
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 35,
            buildToolsVersion: "36.0.0",
            minSdkVersion: 26,
          },
          ios: {
            deploymentTarget: "16.4",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    owner: OWNER,
  };
};
