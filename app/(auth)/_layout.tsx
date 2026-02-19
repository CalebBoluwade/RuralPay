import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" />
      <Stack.Screen name="Register" />
      <Stack.Screen
        name="ForgotPassword"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.7],
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable() ? "transparent" : "#fff",
          },
        }}
      />
    </Stack>
  );
}
