import { Tabs } from "expo-router";
import React from "react";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform, useColorScheme } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      // screenOptions={{
      //   tabBarActiveTintColor: isDark ? "#84cc16" : "#65a30d",
      //   tabBarInactiveTintColor: isDark ? "#6b7280" : "#9ca3af",
      //   headerShown: false,

      //   tabBarStyle: {
      //     backgroundColor: "transparent",
      //     position: "absolute",
      //     borderTopWidth: 0,
      //     elevation: 0,

      //     shadowOpacity: 0, // iOS shadow
      //   },

      //   tabBarBackground: () => null, // 🔑 THIS is critical
      // }}
      // tabBar={(props) => <CustomTabBar {...props} />}
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
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTransparent: Platform.OS === "ios",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              size={focused ? 28 : 26}
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
        }}
      />

      {/* <Tabs.Screen
        name="Services"
        options={{
          title: "Services",
          tabBarIcon: ({ color, focused }) => (
            <Octicons size={focused ? 28 : 26} name={"stack"} color={color} />
          ),
        }}
      /> */}

      <Tabs.Screen
        name="Payments"
        options={{
          title: "Payments",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 28 : 26}
              name={focused ? "cash" : "cash-outline"}
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
