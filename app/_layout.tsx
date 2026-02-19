import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import "../global.css";

import { AuthProvider } from "@/components/context/AuthProvider";
import { LanguageProvider } from "@/components/context/LanguageContext";
import { ToastProvider } from "@/components/context/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";

export default function RootLayout() {
  const router = useRouter();

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

  return (
    <ErrorBoundary>
      {/* <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}> */}
      <LanguageProvider>
        <AuthProvider>
          {/* <UserInactivityProvider> */}
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(user)" options={{ headerShown: false }} />
              <Stack.Screen
                name="(merchant)"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(common)" options={{ headerShown: false }} />
              <Stack.Screen name="(modal)" options={{ headerShown: false }} />
            </Stack>
            {/* <ComplianceGuard /> */}
          </ToastProvider>
          {/* </UserInactivityProvider> */}
        </AuthProvider>
      </LanguageProvider>
      {/* </ThemeProvider> */}
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}
