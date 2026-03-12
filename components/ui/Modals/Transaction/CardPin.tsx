import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Modal, Pressable, Text, View, useColorScheme } from "react-native";

interface CardPinProps {
  paymentMessage: string;
  showPinModal: boolean;
  onPinEntered: (pin: string) => void;
  onCancel?: () => void;
}

const CardPIN: React.FC<CardPinProps> = ({
  paymentMessage,
  showPinModal,
  onPinEntered,
  onCancel,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [code, setCode] = React.useState<number[]>([]);

  const codeLength = new Array(4).fill(0);

  const OnNumberPressDown = (num: number) => {
    if (code.length < 4) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCode((prev) => [...prev, num]);
    }
  };

  const RenderButton = (num: number) => (
    <Pressable
      key={num}
      onPress={() => OnNumberPressDown(num)}
      className={`w-20 h-20 justify-center items-center rounded-full backdrop-blur-xl ${
        isDark
          ? "bg-white/10 border border-white/20"
          : "bg-white/30 border border-gray-200/50"
      }`}
    >
      <Text
        className={`text-2xl font-light ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {num}
      </Text>
    </Pressable>
  );

  const onBackspacePress = () => {
    if (code.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (code.length === 4) {
      const pin = code.join("");
      setCode([]);
      onPinEntered(pin);
    }
  }, [code, onPinEntered]);

  return (
    <Modal
      visible={showPinModal}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <View
        className={`flex-1 justify-center ${
          isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"
        }`}
      >
        <View className="px-5 items-center">
          <Text
            className={`text-2xl font-bold mb-4 text-center ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Enter PIN
          </Text>
          <Text
            className={`text-base font-semibold text-center mb-12 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {paymentMessage}
          </Text>
        </View>

        <View className="flex-row justify-center mb-12">
          {codeLength.map((_, index) => (
            <View
              key={index + 1}
              className={`w-4 h-4 mx-2 justify-center items-center rounded-lg backdrop-blur-xl ${
                code.length > index
                  ? isDark
                    ? "bg-lime-500 border-2 border-lime-400"
                    : "bg-lime-600 border-2 border-lime-500"
                  : isDark
                    ? "border-2 border-white/30 bg-transparent"
                    : "border-2 border-gray-400 bg-transparent"
              }`}
            >
              <Text
                className={`text-2xl ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {code.length > index ? "•" : ""}
              </Text>
            </View>
          ))}
        </View>

        <View className="items-center">
          <View className="flex-row justify-between w-80 mb-6">
            {[1, 2, 3].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between w-80 mb-6">
            {[4, 5, 6].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between w-80 mb-6">
            {[7, 8, 9].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between w-64 mb-4">
            <View className="w-20 h-20" />

            <Pressable
              onPress={() => OnNumberPressDown(0)}
              className={`w-20 h-20 justify-center items-center rounded-full backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/30 border border-gray-200/50"
              }`}
            >
              <Text
                className={`text-2xl font-light ${isDark ? "text-white" : "text-gray-900"}`}
              >
                0
              </Text>
            </Pressable>

            <View className="w-20 h-20 justify-center items-center">
              {code.length > 0 ? (
                <Pressable onPress={() => onBackspacePress()}>
                  <Ionicons
                    name="arrow-back-outline"
                    size={28}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </Pressable>
              ) : onCancel ? (
                <Pressable onPress={onCancel}>
                  <Ionicons
                    name="close"
                    size={28}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CardPIN;
