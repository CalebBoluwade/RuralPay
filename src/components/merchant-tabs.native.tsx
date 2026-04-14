import {
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { VectorIcon } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";

export default function MerchantTabs() {
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
        <NativeTabs.Trigger.Label hidden>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={Ionicons} name="home" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="sales-analytics">
        <NativeTabs.Trigger.Label hidden>Analytics</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={Ionicons} name="bar-chart" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Label hidden>Transactions</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={Ionicons} name="list" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="services">
        <NativeTabs.Trigger.Label hidden>Services</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={Ionicons} name="grid" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bank-uptime">
        <NativeTabs.Trigger.Label hidden>Bank Uptime</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={MaterialCommunityIcons} name="heart-pulse" />}
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
