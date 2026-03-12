import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";

export default function CommonScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Transaction/[transactionId]"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.95],
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable() ? "transparent" : "#fff",
          },
        }}
      />
    </Stack>
  );
}
