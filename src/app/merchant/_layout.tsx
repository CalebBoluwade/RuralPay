import { useAuth } from "@/src/components/context/AuthSessionProvider";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
      <Tabs.Protected guard={isAuthenticated && user?.role === "merchant"}>
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
          name="sales-analytics"
          options={{
            title: "Sales Navigator",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="storefront" size={size} color={color} />
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
          name="bank-uptime"
          options={{
            title: "Bank Uptime",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                size={focused ? 28 : 26}
                name={focused ? "pulse" : "heart-pulse"}
                color={color}
              />
            ),
          }}
        />
      </Tabs.Protected>

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
    </Tabs>
  );
}
