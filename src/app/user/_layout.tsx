import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Badge,
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import React from "react";

export default function TabLayout() {
  const icon = { iconColor: "#65a30d", backgroundColor: "#ecfccb" };

  return (
    <NativeTabs
      backgroundColor={"#f7fee7"}
      iconColor={{ default: "#a3a3a3", selected: "#65a30d" }}
      tintColor={"#65a30d"}
      indicatorColor={"#fff"}
      rippleColor={"#ecfccb"}
    >
      <NativeTabs.Trigger name="index" options={icon}>
        <Label hidden>Home</Label>
        <Icon
          src={<VectorIcon family={MaterialCommunityIcons} name="home" />}
        />
        <Badge>3</Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Tracker" options={icon}>
        <Label hidden>Tracker</Label>
        <Icon src={<VectorIcon family={Feather} name="pie-chart" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="BankTransfers" options={icon}>
        <Label hidden>Payments</Label>
        <Icon src={<VectorIcon family={Ionicons} name="cash-outline" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ValueAddedServices" options={icon}>
        <Label hidden>Services</Label>
        <Icon src={<VectorIcon family={Ionicons} name="cog-outline" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Profile" options={icon}>
        <Label hidden>Profile</Label>
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
