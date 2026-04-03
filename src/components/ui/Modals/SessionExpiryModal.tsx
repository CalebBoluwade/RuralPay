import { Timer } from "lucide-react-native";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface SessionExpiryModalProps {
  visible: boolean;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function SessionExpiryModal({
  visible,
  onConfirm,
  isLoading = false,
}: Readonly<SessionExpiryModalProps>) {
  const isDark = useColorScheme() === "dark";

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {}}

      //       transparent
      // animationType="fade"
      // hardwareAccelerated
      // onRequestClose={() => {
      //   // Prevent dismissal on Android back button
      //   // Modal can only be dismissed via onConfirm button
      // }}
    >
      <SafeAreaView
        className={`flex-1 justify-center items-center px-6 ${
          isDark ? "bg-[#0a0a0f]" : "bg-[#e7efe7]"
        }`}
      >
        <View className="items-center mb-12">
          <View
            className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${
              isDark ? "bg-red-500/20" : "bg-red-100"
            }`}
          >
            <Timer size={40} color={isDark ? "#ef4444" : "#dc2626"} />
          </View>
          <Text
            className={`text-3xl font-brand font-bold mb-3 text-center ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Session Expired
          </Text>
          <Text
            className={`text-base text-center px-4 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Your Session has expired. Please log in again to continue.
          </Text>
        </View>

        <Pressable
          onPress={onConfirm}
          disabled={isLoading}
          className={`w-full p-5 rounded-2xl items-center ${
            isDark ? "bg-red-600" : "bg-red-500"
          } ${isLoading ? "opacity-50" : ""}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white text-center text-xl font-bold">
              Log In Again
            </Text>
          )}
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}
