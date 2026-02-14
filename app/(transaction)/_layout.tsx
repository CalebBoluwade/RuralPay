import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransactionHistory" options={{ title: "History" }} />
      <Stack.Screen name="USSDPay" options={{ headerShown: false }} />
      <Stack.Screen name="MerchantServices" options={{ headerShown: false }} />

      <Stack.Screen
        name="BankTransfers"
        options={{
          presentation: Platform.OS === "ios" ? "modal" : "card",
          headerShown: false,
          headerTransparent: Platform.OS === "ios",
        }}
      />

      <Stack.Screen
        name="QRScan"
        options={{
          title: "",
          headerShown: false,
          headerTransparent: Platform.OS === "ios",
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5, 1],
          sheetInitialDetentIndex: 0,
        }}
      />

      <Stack.Screen
        name="QRPayments"
        options={{
          presentation: Platform.OS === "ios" ? "modal" : "card",
          headerShown: false,
          headerTransparent: Platform.OS === "ios",
        }}
      />

      <Stack.Screen
        name="NFCPayments"
        options={{
          presentation: Platform.OS === "ios" ? "modal" : "card",
          headerShown: false,
          headerTransparent: Platform.OS === "ios",
        }}
      />

      <Stack.Screen
        name="[txId]"
        options={{
          presentation: Platform.OS === "ios" ? "modal" : "card",
          headerShown: false,
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5, 1],
          sheetInitialDetentIndex: 0,
          headerTransparent: Platform.OS === "ios",
        }}
      />

      <Stack.Screen
        name="[ussdCode]"
        options={{
          presentation: Platform.OS === "ios" ? "modal" : "card",
          headerShown: false,
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5, 1],
          sheetInitialDetentIndex: 0,
          headerTransparent: Platform.OS === "ios",
        }}
      />

      <Stack.Screen
        name="ProvisionCard"
        options={{
          title: "",
          presentation: "formSheet",
          headerShown: true,
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.5, 1],
          sheetInitialDetentIndex: 0,
          headerTransparent: Platform.OS === "ios",
        }}
      />
    </Stack>
  );
}
