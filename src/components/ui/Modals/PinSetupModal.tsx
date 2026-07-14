import { PinService } from "@/src/lib/utils/SecureStorage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface PinSetupModalProps {
  visible: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

const PinSetupModal: React.FC<PinSetupModalProps> = ({
  visible,
  onComplete,
  onCancel,
}) => {
  const [code, setCode] = useState<number[]>([]);
  const [confirmCode, setConfirmCode] = useState<number[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const codeLength = new Array(6).fill(0);

  const offset = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const OFFSET = 20;
  const TIME = 80;

  const resetModal = () => {
    setCode([]);
    setConfirmCode([]);
    setIsConfirming(false);
  };

  const onNumberPress = (num: number) => {
    const currentCode = isConfirming ? confirmCode : code;
    if (currentCode.length < 6) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isConfirming) {
        setConfirmCode((prev) => [...prev, num]);
      } else {
        setCode((prev) => [...prev, num]);
      }
    }
  };

  const onBackspacePress = () => {
    const currentCode = isConfirming ? confirmCode : code;
    if (currentCode.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isConfirming) {
      setConfirmCode((prev) => prev.slice(0, -1));
    } else {
      setCode((prev) => prev.slice(0, -1));
    }
  };

  const RenderButton = (num: number) => (
    <Pressable
      key={num}
      onPress={() => onNumberPress(num)}
      className="w-[72px] h-[72px] justify-center items-center bg-white border-2 border-gray-200 rounded-full active:bg-gray-50"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text className="text-gray-900 text-3xl font-light">{num}</Text>
    </Pressable>
  );

  useEffect(() => {
    if (!isConfirming && code.length === 6) {
      setIsConfirming(true);
    } else if (isConfirming && confirmCode.length === 6) {
      if (code.join("") === confirmCode.join("")) {
        const savePin = async () => {
          const success = await PinService.setPIN(code.join(""));
          if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            resetModal();
            onComplete();
          } else {
            Alert.alert("Error", "Failed to save PIN. Please try again.");
            resetModal();
          }
        };
        savePin();
      } else {
        offset.value = withSequence(
          withTiming(-OFFSET, { duration: TIME / 2 }),
          withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
          withTiming(0, { duration: TIME / 2 }),
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "PINs don't match. Please try again.");
        resetModal();
      }
    }
  }, [code, confirmCode, isConfirming, onComplete]);

  const currentCode = isConfirming ? confirmCode : code;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-gradient-to-b from-lime-50 to-white">
        <View className="px-6 pt-12 pb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {isConfirming ? "Confirm Your PIN" : "Set Up Your PIN"}
              </Text>
              <Text className="text-base text-gray-500 mt-1">
                {isConfirming
                  ? "Enter Your PIN Again To Confirm"
                  : "Enter a 6-digit PIN To Secure Your Account"}
              </Text>
            </View>
            <Pressable
              onPress={onCancel}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        <View className="flex-1 justify-between pb-12">
          <Animated.View
            style={style}
            className="flex-row justify-center mt-12"
          >
            {codeLength.map((_, index) => (
              <View
                key={index + 1}
                className={`w-4 h-4 mx-3 rounded-full ${
                  currentCode[index] ? "bg-lime-600" : "bg-gray-300"
                }`}
              />
            ))}
          </Animated.View>

          <View className="items-center px-8">
            <View className="gap-4">
              <View className="flex-row justify-center gap-6">
                {[1, 2, 3].map((num) => RenderButton(num))}
              </View>
              <View className="flex-row justify-center gap-6">
                {[4, 5, 6].map((num) => RenderButton(num))}
              </View>
              <View className="flex-row justify-center gap-6">
                {[7, 8, 9].map((num) => RenderButton(num))}
              </View>
              <View className="flex-row justify-center gap-6 items-center">
                <View className="w-[72px] h-[72px]" />
                <Pressable
                  onPress={() => onNumberPress(0)}
                  className="w-[72px] h-[72px] justify-center items-center bg-white border-2 border-gray-200 rounded-full active:bg-gray-50"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <Text className="text-gray-900 text-3xl font-light">0</Text>
                </Pressable>
                <Pressable
                  onPress={onBackspacePress}
                  className="w-[72px] h-[72px] justify-center items-center"
                  disabled={currentCode.length === 0}
                >
                  <Ionicons
                    name="backspace-outline"
                    size={28}
                    color={currentCode.length > 0 ? "#4F46E5" : "#D1D5DB"}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PinSetupModal;
