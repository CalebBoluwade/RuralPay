import { useAuth } from "@/src/components/context/AuthSessionProvider";
import Unauthenticated from "@/src/components/screens/auth/Unauthenticated";
import {
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { HandCoins, LucideLightbulb } from "lucide-react-native";
import { useColorScheme } from "react-native";

export default function MerchantLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== "consumer") {
    return <Unauthenticated />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#a78bfa" : "#7c3aed",
        tabBarInactiveTintColor: isDark ? "#6b7280" : "#9ca3af",
        tabBarStyle: {
          backgroundColor: isDark ? "#0a0a0f" : "#ffffff",
          borderTopColor: isDark ? "#1f2937" : "#e5e7eb",
        },
      }}
    >
      <Tabs.Protected guard={isAuthenticated && user?.role === "consumer"}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="storefront" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="tracker"
          options={{
            title: "Funds Tracker",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome name="pie-chart" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="bank-transfers"
          options={{
            title: "Bank Transfers",
            tabBarIcon: ({ color, focused }) => (
              <HandCoins size={focused ? 28 : 26} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="services"
          options={{
            title: "Services",
            tabBarIcon: ({ color, focused }) => (
              <LucideLightbulb
                size={focused ? 28 : 26}
                // name={focused ? "plug-circle-bolt" : "plug-circle-minus"}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                size={focused ? 28 : 26}
                name={focused ? "account" : "account-outline"}
                color={color}
              />
            ),
          }}
        />
      </Tabs.Protected>

      {/* Hide non-tab screens from tab bar */}
      {/* <Tabs.Screen name="bank-transfers" options={{ href: null }} /> */}
      <Tabs.Screen name="cards" options={{ href: null }} />
      <Tabs.Screen name="manageLinkedAccounts" options={{ href: null }} />
      <Tabs.Screen name="qrPayments" options={{ href: null }} />
      <Tabs.Screen name="tapPayments" options={{ href: null }} />
    </Tabs>
  );
}
