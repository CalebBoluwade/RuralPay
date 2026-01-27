import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import "../global.css";

import { AuthProvider } from "@/components/context/AuthProvider";
import { LanguageProvider } from "@/components/context/LanguageContext";
import { ToastProvider } from "@/components/context/ToastProvider";
import { UserInactivityProvider } from "@/components/context/UserInactivityProvider";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize analytics
    // Analytics.initialize();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <UserInactivityProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(transaction)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="(modal)/lock"
                  options={{
                    headerShown: false,
                    animation: "fade",
                  }}
                />
                <Stack.Screen
                  name="(modal)/overlay"
                  options={{
                    headerShown: false,
                  }}
                />
              </Stack>
            </UserInactivityProvider>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
