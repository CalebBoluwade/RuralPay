import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Badge,
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import React from "react";

export default function TabLayout() {
  const icon = { iconColor: "#84cc16", backgroundColor: "#9ca3af" };

  return (
    <NativeTabs
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
    // screenOptions={{
    //   headerShown: false,
    //   tabBarActiveTintColor: isDark ? "#a78bfa" : "#7c3aed",
    //   tabBarInactiveTintColor: isDark ? "#6b7280" : "#9ca3af",
    //   tabBarStyle: {
    //     backgroundColor: isDark ? "#0a0a0f" : "#ffffff",
    //     borderTopColor: isDark ? "#1f2937" : "#e5e7eb",
    //   },
    // }}
    >
      <NativeTabs.Trigger name="index" options={icon}>
        <Label>Home</Label>
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="home" />}
        />
        <Badge>3</Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Tracker" options={icon}>
        <Label>Tracker</Label>
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="chart-bar" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Payments" options={icon}>
        <Label>Payments</Label>
        <Icon src={<VectorIcon family={Ionicons} name="cash-outline" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Services" options={icon}>
        <Label>Services</Label>
        <Icon src={<VectorIcon family={Ionicons} name="cog-outline" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Profile" options={icon}>
        <Label>Profile</Label>
        <Icon
          src={
            <VectorIcon
              family={MaterialCommunityIcons}
              name="account-outline"
            />
          }
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

{
  /* <Tabs.Screen
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
      /> */
}

{
  /* <Tabs.Screen
        name="Tracker"
        options={{
          title: "Tracker",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 28 : 26}
              name={focused ? "analytics" : "analytics-outline"}
              color={color}
            />
          ),
        }}
      /> */
}

{
  /* <Tabs.Screen
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
      /> */
}

{
  /* <Tabs.Screen
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
      /> */
}
