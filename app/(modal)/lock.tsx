import { useAuth } from "@/components/context/AuthProvider";
import { ToastService } from "@/hooks/use-toast";
import { PinService } from "@/lib/SecureStorage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const Lock = () => {
  const { nativeAuthLogin, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [code, setCode] = React.useState<number[]>([]);
  const codeLength = new Array(6).fill(0);

  const offset = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const OFFSET = 20;
  const TIME = 80;

  const onFingerPrintPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const OnNumberPressDown = (num: number) => {
    if (code.length < 6) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCode((prev) => [...prev, num]);
    }
  };

  const onBackspacePress = () => {
    if (code.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (code.length === 6) {
      const validatePin = async () => {
        const isValid = await PinService.validatePin(code.join(""));

        if (isValid) {
          ToastService.info("PIN is Correct");
          router.replace("/");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCode([]);
        } else {
          ToastService.error("PIN is incorrect");

          offset.value = withSequence(
            withTiming(-OFFSET, { duration: TIME / 2 }),
            withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
            withTiming(0, { duration: TIME / 2 }),
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setCode([]);
        }
      };

      validatePin();
    }
  }, [code]);

  return (
    <SafeAreaView
      className={`flex-1 px-12 py-8 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <Text
        className={`text-2xl font-semibold text-center mb-12 mt-16 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        Welcome Back, {user?.FirstName}
      </Text>

      <Animated.View style={style} className="flex-row justify-center mb-16">
        {codeLength.map((_, index) => (
          <View
            key={index + 1}
            className={`w-4 h-4 mx-2 justify-center items-center rounded-lg backdrop-blur-xl ${
              code[index]
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
      </Animated.View>

      <View className="flex-1 justify-center">
        <View className="flex-row justify-between mb-6">
          {[1, 2, 3].map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => OnNumberPressDown(num)}
              className={`w-20 h-20 justify-center items-center rounded-full backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50"
              }`}
            >
              <Text
                className={`text-2xl font-medium ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row justify-between mb-6">
          {[4, 5, 6].map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => OnNumberPressDown(num)}
              className={`w-20 h-20 justify-center items-center rounded-full backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50"
              }`}
            >
              <Text
                className={`text-2xl font-medium ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row justify-between mb-6">
          {[7, 8, 9].map((num) => (
            <TouchableOpacity
              key={num}
              onPress={() => OnNumberPressDown(num)}
              className={`w-20 h-20 justify-center items-center rounded-full backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-white/60 border border-gray-200/50"
              }`}
            >
              <Text
                className={`text-2xl font-medium ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            className="w-20 h-20 justify-center items-center"
            onPress={() => onFingerPrintPress()}
          >
            <Ionicons
              name="finger-print"
              size={32}
              color={isDark ? "#a78bfa" : "#7c3aed"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => OnNumberPressDown(0)}
            className={`w-20 h-20 justify-center items-center rounded-full backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
          >
            <Text
              className={`text-2xl font-medium ${isDark ? "text-white" : "text-gray-900"}`}
            >
              0
            </Text>
          </TouchableOpacity>

          <View className="w-20 h-20 justify-center items-center">
            {code.length > 0 && (
              <TouchableOpacity onPress={() => onBackspacePress()}>
                <Ionicons
                  name="backspace"
                  size={28}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Lock;
