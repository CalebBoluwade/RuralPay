import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { SplashScreen, Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import "../global.css";

import { AuthProvider } from "@/components/context/AuthProvider";
import { LanguageProvider } from "@/components/context/LanguageContext";
import { ToastProvider } from "@/components/context/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ComplianceGuard from "@/components/ui/ComplianceGuard";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

// Prevent splash from hiding before fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded, error] = useFonts({
    // Key = the name you'll reference everywhere
    "AutourOne-Regular": require("../assets/fonts/AutourOne-Regular.ttf"),
  });

  useEffect(() => {
    // Initialize analytics
    // Analytics.initialize();

    // 1. Listen for notification interaction
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data.url;
        if (url) {
          // Use Expo Router to navigate
          router.push(url as any);
        }
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <ComplianceGuard>
          <ErrorBoundary>
            <ToastProvider>
              <LanguageProvider>
                {/* <UserInactivityProvider> */}
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(user)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(merchant)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(common)"
                    options={{ headerShown: false }}
                  />
                  {/* <Stack.Screen name="(modal)" options={{ headerShown: false }} /> */}
                </Stack>
                {/* </UserInactivityProvider> */}
              </LanguageProvider>
            </ToastProvider>
          </ErrorBoundary>

          <StatusBar style="auto" />
        </ComplianceGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
