import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { Platform, useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? "#84cc16" : "#65a30d",
        tabBarInactiveTintColor: isDark ? "#6b7280" : "#9ca3af",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: isDark ? "#0a0a0f" : "#ffffff",
          borderTopWidth: 1,
          borderTopColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          height: Platform.OS === "ios" ? 88 : 70,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
          paddingTop: Platform.OS === "ios" ? 8 : 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: Platform.OS === "android" ? 2 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTransparent: Platform.OS === "ios",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              size={focused ? 26 : 24}
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, focused }) => (
            <Octicons size={focused ? 26 : 24} name={"stack"} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              size={focused ? 26 : 24}
              name={focused ? "cash" : "cash-multiple"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              size={focused ? 26 : 24}
              name={focused ? "account" : "account-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
