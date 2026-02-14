import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import "../global.css";

import { AuthProvider } from "@/components/context/AuthProvider";
import { LanguageProvider } from "@/components/context/LanguageContext";
import { ToastProvider } from "@/components/context/ToastProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // Initialize analytics
    // Analytics.initialize();
  }, []);

  return (
    <ErrorBoundary>
      {/* <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}> */}
      <StatusBar style="auto" />
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            {/* <UserInactivityProvider> */}
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
            {/* </UserInactivityProvider> */}
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
      {/* </ThemeProvider> */}
    </ErrorBoundary>
  );
}
