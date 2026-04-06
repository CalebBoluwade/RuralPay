import { useAuth } from "@/src/components/context/AuthSessionProvider";
import {
  FontAwesome,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

export default function MerchantLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user, isAuthenticated } = useAuth();

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
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                size={focused ? 28 : 26}
                name={focused ? "list" : "list-outline"}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="services"
          options={{
            title: "Services",
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome6
                size={focused ? 28 : 26}
                name={focused ? "plug-circle-bolt" : "plug-circle"}
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
    </Tabs>
  );
}
