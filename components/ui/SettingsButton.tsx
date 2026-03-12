import * as IntentLauncher from "expo-intent-launcher";
import * as Linking from "expo-linking";
import React from "react";
import {
    Alert,
    Platform,
    Pressable,
    Text
} from "react-native";

const SettingsButton = ({ type }: { type: "bluetooth" | "nfc" }) => {
  const handlePress = async () => {
    if (Platform.OS === "android") {
      try {
        const action =
          type === "bluetooth"
            ? IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS
            : IntentLauncher.ActivityAction.NFC_SETTINGS;

        await IntentLauncher.startActivityAsync(action);
      } catch {
        IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.SETTINGS,
        );
      }
    } else {
      Alert.alert(
        "Enable " + type,
        `Please enable ${type} in your system settings.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ],
      );
    }
  };

  return (
    <Pressable
      className={`p-4 rounded-lg my-2.5 items-center ${type === "nfc" ? "bg-[#34C759]" : "bg-[#007AFF]"}`}
      onPress={handlePress}
    >
      <Text className="text-white font-bold">
        Open {type.toUpperCase()} Settings
      </Text>
    </Pressable>
  );
};

export default SettingsButton;
