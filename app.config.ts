import { ConfigContext, ExpoConfig } from "expo/config";
import { version } from "./package.json";

const EAS_PROJECT_ID = "e4c8aac2-05e4-4310-9ed9-a70edcdadbe6";
const PROJECT_SLUG = "nfc-card-payments";
const OWNER = "calebjnr";

// App production config
const APP_NAME = "RuralPay";
const BUNDLE_IDENTIFIER = "com.groovetech.nfccardpayments";
const PACKAGE_NAME = "com.groovetech.nfccardpayments";
const ICON = "./assets/images/icon.png";
const ADAPTIVE_ICON = "./assets/images/android-icon-foreground.png";
const SCHEME = "nfccardpayments";

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV || process.env.EXPO_PUBLIC_ENVIRONMENT || "development";
  console.log("⚙️ Building app for environment:", appEnv);

  const { name, bundleIdentifier, icon, adaptiveIcon, packageName, scheme, googleServicesFile } =
    getDynamicAppConfig(
      appEnv as "development" | "preview" | "production"
    );

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
      googleServicesFile: "./GoogleService-Info.plist",
      config: {
        googleMobileAdsAutoInit: false,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NFCReaderUsageDescription:
          "This app uses NFC to read payment cards for secure transactions.",
        NSLocationWhenInUseUsageDescription:
          "This app uses location to enhance transaction security and fraud prevention.",
        FIREBASE_ANALYTICS_COLLECTION_ENABLED: true,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: adaptiveIcon,
        backgroundColor: "#ffffff",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      package: packageName,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      ...(googleServicesFile && { googleServicesFile }),
      permissions: [
        "android.permission.NFC",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
      ],
      config: {
        googleMobileAdsAutoInit: false,
      },
    },
    updates: {
      url: `https://u.expo.dev/${EAS_PROJECT_ID}`,
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
      "expo-router",
      "./plugins/withModularHeaders",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location.",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
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
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    owner: OWNER,
  };
};

export const getDynamicAppConfig = (
  environment: "development" | "preview" | "production"
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
      bundleIdentifier: `${BUNDLE_IDENTIFIER}.preview`,
      packageName: `${PACKAGE_NAME}.preview`,
      icon: "./assets/images/icon.png",
      adaptiveIcon: "./assets/images/android-icon-foreground.png",
      scheme: `${SCHEME}-prev`,
      googleServicesFile: "./google-services.json",
    };
  }

  return {
    name: `${APP_NAME} Development`,
    bundleIdentifier: `${BUNDLE_IDENTIFIER}.dev`,
    packageName: `${PACKAGE_NAME}.dev`,
    icon: "./assets/images/icon.png",
    adaptiveIcon: "./assets/images/android-icon-foreground.png",
    scheme: `${SCHEME}-dev`,
  };
};

export const getApiUrl = (
  environment: "development" | "preview" | "production"
): string => {
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!envApiUrl) {
    throw new Error(`EXPO_PUBLIC_API_URL environment variable is required for ${environment} environment`);
  }
  return envApiUrl;
};
