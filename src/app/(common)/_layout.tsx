import { useAuth } from "@/src/components/context/AuthProvider";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function CommonScreensLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colorTheme = isDark ? "#f8fafc" : "#020617";

  const { isAuthenticated } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen
          name="transaction/[transactionId]"
          options={{
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.95],
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colorTheme,
            },
          }}
        />
      </Stack.Protected>

      <Stack.Screen
        name="feedback"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.75],
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
