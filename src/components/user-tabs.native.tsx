import {
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { VectorIcon } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { useColorScheme } from "react-native";

export default function AppTabs() {
  const scheme = useColorScheme();
  // const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const iconColor = { iconColor: "#65a30d", backgroundColor: "#ecfccb" };

  return (
    <NativeTabs
      backgroundColor={"#f7fee7"}
      iconColor={{ default: "#a3a3a3", selected: "#65a30d" }}
      tintColor={"#65a30d"}
      indicatorColor={"#fff"}
      rippleColor={"#ecfccb"}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label hidden>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={MaterialCommunityIcons} name="home" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tracker">
        <NativeTabs.Trigger.Label hidden>Tracker</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={FontAwesome} name="pie-chart" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bankTransfers">
        <NativeTabs.Trigger.Label hidden>Payments</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={FontAwesome} name="send" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="services">
        <NativeTabs.Trigger.Label hidden>VAS</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={FontAwesome6} name="plug-circle-bolt" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label hidden>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={FontAwesome5} name="user-circle" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
