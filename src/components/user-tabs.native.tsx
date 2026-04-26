import {
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router, VectorIcon } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { QrCode, ScanLine } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function AppTabs() {
  const iconColor = { iconColor: "#65a30d", backgroundColor: "#ecfccb" };

  function QRAccessory() {
    const isDark = useColorScheme() === "dark";
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [loadingQR, setLoadingQR] = useState(false);

    return (
      <>
        <View
          className={`flex-row items-center justify-between px-4 py-2.5 border-t ${
            isDark
              ? "bg-[#1a2e05] border-[#365314]"
              : "bg-lime-50 border-lime-200"
          }`}
        >
          <View className="flex-row items-center gap-2">
            <QrCode size={18} color={isDark ? "#a3e635" : "#65a30d"} />
            <Text
              className={`text-[13px] font-semibold ${isDark ? "text-lime-400" : "text-lime-600"}`}
            >
              QR Payments
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {/* <Pressable
              onPress={handleReceive}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                isDark ? "border-lime-400" : "border-lime-600"
              }`}
            >
              {loadingQR ? (
                <ActivityIndicator size={13} color="#65a30d" />
              ) : (
                <QrCode size={13} color={isDark ? "#a3e635" : "#65a30d"} />
              )}
              <Text
                className={`text-[13px] font-semibold ${isDark ? "text-lime-400" : "text-lime-600"}`}
              >
                My QR
              </Text>
            </Pressable> */}

            <Pressable
              onPress={() => router.push("/user/qrPayments")}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime-600"
            >
              <ScanLine size={13} color="#fff" />
              <Text className="text-[13px] font-bold text-white">
                Scan & Pay
              </Text>
            </Pressable>
          </View>
        </View>

        <Modal
          visible={!!qrImage}
          transparent
          animationType="fade"
          onRequestClose={() => setQrImage(null)}
        >
          <Pressable
            className="flex-1 bg-black/60 justify-center items-center"
            onPress={() => setQrImage(null)}
          >
            <View
              className={`rounded-3xl p-7 items-center gap-4 w-[280px] ${
                isDark ? "bg-[#1a2e05]" : "bg-white"
              }`}
            >
              <Text
                className={`text-base font-bold ${isDark ? "text-lime-400" : "text-slate-900"}`}
              >
                Scan to Pay Me
              </Text>
              {qrImage && (
                <Image
                  source={{ uri: `data:image/png;base64,${qrImage}` }}
                  className="w-[200px] h-[200px]"
                  resizeMode="contain"
                />
              )}
              <Text className="text-xs text-slate-400">
                Tap anywhere to close
              </Text>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  }

  return (
    <NativeTabs
      backgroundColor={"#f7fee7"}
      iconColor={{ default: "#a3a3a3", selected: "#65a30d" }}
      tintColor={"#65a30d"}
      indicatorColor={"#fff"}
      rippleColor={"#ecfccb"}
    >
      <NativeTabs.BottomAccessory>
        <QRAccessory />
      </NativeTabs.BottomAccessory>

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

      <NativeTabs.Trigger name="bank-transfers">
        <NativeTabs.Trigger.Label hidden>Payments</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={FontAwesome} name="send" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="qrPayments" role="more">
        <NativeTabs.Trigger.Label hidden>Payments</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={FontAwesome} name="qrcode" />}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cards" hidden={true}>
        <NativeTabs.Trigger.Label hidden>Payments</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={FontAwesome} name="qrcode" />}
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

      <NativeTabs.Trigger name="search" hidden={true} role="search">
        <NativeTabs.Trigger.Label hidden>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          selectedColor={iconColor.iconColor}
          src={<VectorIcon family={FontAwesome5} name="user-circle" />}
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
