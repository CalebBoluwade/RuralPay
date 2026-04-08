import "@/global.css";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as Notifications from "expo-notifications";
import { router, SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import "react-native-reanimated";
import { AuthSessionProvider } from "../components/context/AuthSessionProvider";
import { LanguageProvider } from "../components/context/LanguageContext";
import { NotificationProvider } from "../components/context/NotificationContext";
import { ToastProvider } from "../components/context/ToastProvider";
import ComplianceGuard from "../components/ui/ComplianceGuard";
import EncryptionService from "../lib/services/EncryptionService";
import { pinningService } from "../lib/services/PinningService";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    AutourOne: require("@/assets/fonts/AutourOne.ttf"),
  });

  const colorScheme = useColorScheme();

  useEffect(() => {
    const initializeStartupServices = async () => {
      try {
        await Promise.all([
          EncryptionService.RetrieveUserKey(),
          pinningService.initialize(),
        ]);
      } catch (error) {
        console.error("Failed To Initialize Startup Services:", error);
      }
    };

    initializeStartupServices();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url;
        if (url) router.push(url as any);
      },
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ErrorBoundary>
      <NotificationProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <ToastProvider>
            <AuthSessionProvider>
              <LanguageProvider>
                <ComplianceGuard>
                  {/* <Slot /> */}
                  <RootNavigator />

                  <StatusBar style="auto" />
                </ComplianceGuard>
              </LanguageProvider>
            </AuthSessionProvider>
          </ToastProvider>
        </ThemeProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colorTheme = isDark ? "#020617" : "#f8fafc";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="screen-menu"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.56],
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable()
              ? "transparent"
              : colorTheme,
          },
        }}
      />

      <Stack.Screen
        name="forgot-password"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.45],
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable()
              ? "transparent"
              : colorTheme,
          },
        }}
      />

      <Stack.Screen
        name="select-language"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.65, 0.8],
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable()
              ? "transparent"
              : colorTheme,
          },
        }}
      />

      <Stack.Screen
        name="quick-links"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5],
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable()
              ? "transparent"
              : colorTheme,
          },
        }}
      />
    </Stack>
  );
}
