import { ConfigContext, ExpoConfig } from "expo/config";
import { version } from "./package.json";

const EAS_PROJECT_ID = "e4c8aac2-05e4-4310-9ed9-a70edcdadbe6";
const PROJECT_SLUG = "nfc-card-payments";
const OWNER = "calebjnr";

// App production config
const APP_NAME = "RuralPay";
const BUNDLE_IDENTIFIER = "com.groovetech.ruralpay";
const APP_DOMAIN = "applinks:app.ruralpay.com";
const PACKAGE_NAME = "com.groovetech.ruralpay";
const ICON = "./assets/images/MS.png";
const ADAPTIVE_ICON = "./assets/images/MS.png";
const SCHEME = "ruralpay";

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV || process.env.EXPO_PUBLIC_ENVIRONMENT;

  if (!appEnv) {
    throw new Error(
      "APP_ENV or EXPO_PUBLIC_ENVIRONMENT environment variable is required",
    );
  }
  console.log("⚙️ Building app for environment:", appEnv);

  const {
    name,
    bundleIdentifier,
    icon,
    adaptiveIcon,
    packageName,
    scheme,
    googleServicesFile,
  } = getDynamicAppConfig(appEnv as "development" | "preview" | "production");

  return {
    ...config,
    name: name,
    version, // Automatically bump your project version with `npm version patch`, `npm version minor` or `npm version major`.
    slug: PROJECT_SLUG, // Must be consistent across all environments.
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    icon: icon,
    scheme: scheme,
    ios: {
      supportsTablet: true,
      bundleIdentifier: bundleIdentifier,
      appleTeamId: "",
      associatedDomains: [APP_DOMAIN],
      googleServicesFile: "./GoogleService-Info.plist",
      config: {
        googleMobileAdsAutoInit: false,
      },
      entitlements: {
        "com.apple.developer.nfc.readersession.formats": ["NDEF", "TAG"],
      },
      infoPlist: {
        UIBackgroundModes: ["fetch", "remote-notification"],
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: "This App Uses The Camera To Scan QR Codes",
        NFCReaderUsageDescription: "This App uses NFC to Read Payment Cards",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "This App Uses Device Location To Enhance Transaction Security and Aid Fraud Prevention",
        NSLocationWhenInUseUsageDescription:
          "This App Uses Device Location To Enhance Transaction Security and Aid Fraud Prevention",
        FIREBASE_ANALYTICS_COLLECTION_ENABLED: true,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: adaptiveIcon,
        backgroundColor: "#ffffff",
        backgroundImage: "./assets/images/MS.png",
        monochromeImage: "./assets/images/MS.png",
      },
      package: packageName,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: APP_DOMAIN,
              pathPrefix: "/(transaction)",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
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
      apiUrl: getApiUrl(appEnv as "development" | "preview" | "production"),
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
        "expo-router",
        {
          // asyncRoutes: true,
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/MS.png",
          color: "#ffffff",
        },
      ],
      "./plugins/withModularHeaders",
      "./plugins/withBLEPermissions",
      [
        "react-native-nfc-manager",
        { nfcReaderUsageDescription: "Allow NFC to Scan Devices." },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location.",
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true,
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/MS.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-sqlite",
        {
          enableFTS: true,
          useSQLCipher: true,
          android: {
            enableFTS: false,
            useSQLCipher: false,
          },
          ios: {
            customBuildFlags: [
              "-DSQLITE_ENABLE_DBSTAT_VTAB=1 -DSQLITE_ENABLE_SNAPSHOT=1",
            ],
          },
        },
      ],
      "expo-secure-store",
      [
        "expo-local-authentication",
        {
          faceIDPermission: "Allow $(PRODUCT_NAME) to use Face ID.",
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
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

export const getDynamicAppConfig = (
  environment: "development" | "preview" | "production",
) => {
  if (environment === "production") {
    return {
      name: APP_NAME,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      packageName: PACKAGE_NAME,
      icon: ICON,
      adaptiveIcon: ADAPTIVE_ICON,
      scheme: SCHEME,
      googleServicesFile: "./google-services.json",
    };
  }

  if (environment === "preview") {
    return {
      name: `${APP_NAME} Preview`,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      packageName: PACKAGE_NAME,
      icon: ICON,
      adaptiveIcon: ADAPTIVE_ICON,
      scheme: `${SCHEME}-prev`,
      googleServicesFile: "./google-services.json",
    };
  }

  return {
    name: `${APP_NAME} Development`,
    bundleIdentifier: `${BUNDLE_IDENTIFIER}.dev`,
    packageName: PACKAGE_NAME,
    icon: ICON,
    adaptiveIcon: ADAPTIVE_ICON,
    scheme: `${SCHEME}-dev`,
  };
};

export const getApiUrl = (
  environment: "development" | "preview" | "production",
): string => {
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!envApiUrl) {
    throw new Error(
      `EXPO_PUBLIC_API_URL environment variable is required for ${environment} environment`,
    );
  }
  return envApiUrl;
};
