// import "dotenv/config";
import { ConfigContext, ExpoConfig } from "expo/config";
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
const APP_DOMAIN = `applinks:${TENANT_DOMAIN}`;
const ANDROID_HOST = TENANT_DOMAIN;

// Asset paths — CI unzips to ./assets/{tenantSlug}/, local dev falls back to default
const ASSET_BASE = `./assets/${TENANT_SLUG}`;
const ICON = `${ASSET_BASE}/app_icon.png`;
const ADAPTIVE_ICON = `${ASSET_BASE}/app_icon.png`;
const SPLASH = `${ASSET_BASE}/splash_screen.png`;

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
    assetBundlePatterns: ["assets/**/*"],
    icon: ICON,
    scheme: SCHEME,
    ios: {
      supportsTablet: true,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      appleTeamId: "G3YNG3LDQ3",
      associatedDomains: [APP_DOMAIN],
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST ?? "./GoogleService-Info.plist",
      config: {
        googleMobileAdsAutoInit: false,
      },
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
        NSCameraUsageDescription:
          "RuralPay Uses The Camera To Scan QR Codes And Verify User Identity",
        NFCReaderUsageDescription: "RuralPay Uses NFC to Read Payment Cards",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "RuralPay Uses Device Location To Enhance Transaction Security and Aid Fraud Prevention",
        NSLocationWhenInUseUsageDescription:
          "RuralPay Uses Device Location To Enhance Transaction Security and Aid Fraud Prevention",
        FIREBASE_ANALYTICS_COLLECTION_ENABLED: true,
        CFBundleAllowMixedLocalizations: true,
        CFBundleLocalizations: ["fr"],
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
      config: {
        googleMobileAdsAutoInit: false,
      },
    },
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
      enabled: true,
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
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
      "./plugins/withMainApplicationFix",
      "expo-audio",
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
      "./plugins/withModularHeaders",
      "./plugins/withMavenCentral",
      "./plugins/withBLEPermissions",
      "./plugins/withAndroidWidget",
      "./plugins/withIOSWidget",
      // ...(appEnv === "production" ? ["./plugins/withScreenSecurity"] : []),
      [
        "react-native-nfc-manager",
        { nfcReaderUsageDescription: "Allow NFC to Scan Cards For Payment" },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: `Allow ${APP_NAME} To Use Your Location For Transaction Security`,
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: `Allow ${APP_NAME} To Access Your Camera`,
          microphonePermission: `Allow ${APP_NAME} To Access Your Microphone`,
          recordAudioAndroid: true,
        },
      ],
      [
        "react-native-vision-camera",
        {
          cameraPermissionText: `Allow ${APP_NAME} to access your camera for identity verification`,
          enableFrameProcessors: true,
        },
      ],
      // ["@stripe/stripe-react-native", {}],
      // [
      //   "expo-sqlite",
      //   {
      //     enableFTS: true,
      //     useSQLCipher: true,
      //     android: {
      //       enableFTS: false,
      //       useSQLCipher: false,
      //     },
      //     ios: {
      //       customBuildFlags: [
      //         "-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1",
      //       ],
      //     },
      //   },
      // ],
      "expo-secure-store",
      [
        "expo-local-authentication",
        {
          faceIDPermission: `Allow ${APP_NAME} to Use FACE ID.`,
          fingerprintPermission: `Allow ${APP_NAME} to Use FINGERPRINT`,
          touchIDPermission: `Allow ${APP_NAME} to Use TOUCH ID`,
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
            deploymentTarget: "15.5",
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

// export const getApiUrl = (
//   environment: "development" | "preview" | "production",
// ): string => {
//   const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
//   if (!envApiUrl) {
//     throw new Error(
//       `EXPO_PUBLIC_API_URL Environment Variable Required for ${environment} Environment`,
//     );
//   }
//   return envApiUrl;
// };
