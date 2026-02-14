import { Stack } from "expo-router";

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="lock"
        options={{
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="overlay"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="welcome-banner"
        options={{
          presentation: "transparentModal",
        }}
      />
    </Stack>
  );
}
