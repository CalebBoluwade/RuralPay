import { PinService } from "@/components/lib/SecureStorage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import ScreenHeader from "./ui/ScreenHeader";

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
    <TouchableOpacity
      key={num}
      onPress={() => onNumberPress(num)}
      className="w-16 h-16 justify-center items-center bg-emerald-50 rounded-full"
    >
      <Text className="text-emerald-600 text-xl font-medium">{num}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (!isConfirming && code.length === 6) {
      setIsConfirming(true);
    } else if (isConfirming && confirmCode.length === 6) {
      if (code.join("") === confirmCode.join("")) {
        const savePin = async () => {
          const success = await PinService.setPin(code.join(""));
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
          withTiming(0, { duration: TIME / 2 })
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
      <View className="flex-1 bg-white --px-6 py-8">
        <ScreenHeader
          title={isConfirming ? "Confirm PIN" : "Create PIN"}
          subtitle={
            isConfirming
              ? "Please re-enter your PIN to confirm"
              : "Create a 6-digit PIN for secure transactions"
          }
          goBack={false}
        />

        {/* <View className="flex-row items-center justify-between mb-8">
          <Text className="text-2xl font-bold text-gray-900"></Text>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View> */}

        <Animated.View style={style} className="flex-row justify-center my-16">
          {codeLength.map((_, index) => (
            <View
              key={index + 1}
              className={`w-4 h-4 border-2 border-gray-400 mx-2 justify-center items-center rounded-lg ${
                currentCode[index] ? "bg-blue-600" : "bg-transparent"
              }`}
            >
              <Text className="text-2xl text-white">
                {currentCode.length > index ? "•" : ""}
              </Text>
            </View>
          ))}
        </Animated.View>

        <View className="items-center space-y-8">
          <View className="flex-row justify-between w-80 mb-16">
            {[1, 2, 3].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between w-80 mb-16">
            {[4, 5, 6].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between w-80 mb-16">
            {[7, 8, 9].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between w-80 mb-16">
            <View className="w-16 h-16" />

            <TouchableOpacity
              onPress={() => onNumberPress(0)}
              className="w-20 h-20 justify-center items-center bg-white/10 rounded-full"
            >
              <Text className="text-white text-2xl font-light">0</Text>
            </TouchableOpacity>

            <View className="w-16 h-16 justify-center items-center">
              {currentCode.length > 0 && (
                <TouchableOpacity onPress={onBackspacePress}>
                  <Ionicons name="backspace" size={24} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>

            {/* <View className="w-20 h-20 justify-center items-center">
            {code.length > 0 ? (
              <TouchableOpacity onPress={() => onBackspacePress()}>
                <Ionicons name="backspace" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            ) : onCancel ? (
              <TouchableOpacity onPress={onCancel}>
                <Ionicons name="close" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View> */}
          </View>
        </View>

        {/* <Animated.View style={style} className="flex-row justify-center mb-12">
          {codeLength.map((_, index) => (
            <View
              key={index + 1}
              className={`w-4 h-4 border-2 border-gray-300 mx-2 rounded-lg ${
                currentCode[index] ? "bg-blue-600 border-blue-600" : "bg-transparent"
              }`}
            >
              <Text className="text-center text-white text-xs">
                {currentCode.length > index ? "•" : ""}
              </Text>
            </View>
          ))}
        </Animated.View>

        <View className="flex-1 justify-center">
          <View className="flex-row justify-between mb-4">
            {[1, 2, 3].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between mb-4">
            {[4, 5, 6].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between mb-4">
            {[7, 8, 9].map((num) => RenderButton(num))}
          </View>
          <View className="flex-row justify-between items-center">
            <View className="w-16 h-16" />
            <TouchableOpacity
              onPress={() => onNumberPress(0)}
              className="w-16 h-16 justify-center items-center bg-blue-50 rounded-full"
            >
              <Text className="text-blue-600 text-xl font-medium">0</Text>
            </TouchableOpacity>
            <View className="w-16 h-16 justify-center items-center">
              {currentCode.length > 0 && (
                <TouchableOpacity onPress={onBackspacePress}>
                  <Ionicons name="backspace" size={24} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View> */}
      </View>
    </Modal>
  );
};

export default PinSetupModal;
