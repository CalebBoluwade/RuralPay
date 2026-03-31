import Constants from "expo-constants";
import { Platform } from "react-native";

export interface AppConfig {
  apiUrl: string;
  environment: "development" | "preview" | "production";
}

const getConfig = (): AppConfig => {
  // Try to get apiUrl from environment variable first, then fallback to expo config
  let apiUrl = process.env.EXPO_PUBLIC_API_URL;

  // If not found in env vars, try expo config extra (works better on Android)
  if (!apiUrl) {
    apiUrl = Constants.expoConfig?.extra?.apiUrl;
  }

  const environment =
    process.env.EXPO_PUBLIC_ENVIRONMENT ||
    Constants.expoConfig?.extra?.environment ||
    "development";

  if (!apiUrl) {
    if (__DEV__) console.error("Platform:", Platform.OS);
    if (__DEV__) console.error("Environment variables:", process.env);
    if (__DEV__)
      console.error("Expo config extra:", Constants.expoConfig?.extra);
    throw new Error(
      "API URL is not configured. Please set EXPO_PUBLIC_API_URL environment variable or configure it in app.json extra field.",
    );
  }

  return {
    apiUrl,
    environment: environment as AppConfig["environment"],
  };
};

export const config = getConfig();
