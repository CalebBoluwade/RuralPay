import { useAuth } from "@/src/components/context/AuthSessionProvider";
import ToastService from "@/src/lib/services/ToastService";
import { PinService } from "@/src/lib/utils/SecureStorage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, Text, View, useColorScheme } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const Lock = () => {
  const { user } = useAuth();
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
        const isValid = await PinService.ValidatePin(code.join(""));

        if (isValid) {
          ToastService.info("PIN is Correct");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCode([]);

          try {
            if (router.canGoBack()) {
              router.back();
            }
          } catch (e) {
            if (__DEV__) console.log("Navigation error:", e);
          }
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
      className={`flex-1 ${isDark ? "bg-gradient-to-b from-[#0a0a0f] to-[#1a1a2e]" : "bg-gradient-to-b from-white to-gray-50"}`}
    >
      <View className="flex-1 px-6 justify-between py-12">
        <Animated.View
          entering={FadeIn.duration(600)}
          className="items-center mt-8"
        >
          <View
            className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${
              isDark
                ? "bg-gradient-to-br from-lime-500/20 to-emerald-500/20"
                : "bg-gradient-to-br from-lime-100 to-emerald-100"
            }`}
          >
            <Ionicons
              name="lock-closed"
              size={36}
              color={isDark ? "#84cc16" : "#65a30d"}
            />
          </View>
          <Text
            className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Welcome Back
          </Text>
          <Text
            className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {user?.firstName}
          </Text>
        </Animated.View>

        <View className="items-center">
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <Text
              className={`text-sm mb-6 ${isDark ? "text-gray-500" : "text-gray-500"}`}
            >
              Enter your PIN
            </Text>
            <Animated.View
              style={style}
              className="flex-row justify-center mb-12"
            >
              {codeLength.map((_, index) => (
                <View
                  key={index + 1}
                  className={`w-14 h-14 mx-2 justify-center items-center rounded-2xl ${
                    code[index]
                      ? isDark
                        ? "bg-lime-500 shadow-lg shadow-lime-500/50"
                        : "bg-lime-600 shadow-lg shadow-lime-600/30"
                      : isDark
                        ? "bg-white/5 border-2 border-white/10"
                        : "bg-gray-100 border-2 border-gray-200"
                  }`}
                >
                  {code[index] && (
                    <View className="w-3 h-3 rounded-full bg-white" />
                  )}
                </View>
              ))}
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            className="w-full max-w-sm"
          >
            <View className="gap-4 p-4">
              {[
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
              ].map((row, rowIndex) => (
                <View key={rowIndex + 1} className="flex-row justify-between">
                  {row.map((num) => (
                    <Pressable
                      key={num}
                      onPress={() => OnNumberPressDown(num)}
                      className={`w-[30%] aspect-square justify-center items-center rounded-3xl ${
                        isDark
                          ? "bg-white/10 active:bg-white/20"
                          : "bg-white active:bg-gray-50 shadow-sm"
                      }`}
                    >
                      <Text
                        className={`text-3xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {num}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}

              <View className="flex-row justify-between items-center">
                <Pressable
                  className="w-[30%] aspect-square justify-center items-center"
                  onPress={onFingerPrintPress}
                >
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center ${
                      isDark ? "bg-lime-500/20" : "bg-lime-100"
                    }`}
                  >
                    <Ionicons
                      name="finger-print"
                      size={32}
                      color={isDark ? "#a78bfa" : "#7c3aed"}
                    />
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => OnNumberPressDown(0)}
                  className={`w-[30%] aspect-square justify-center items-center rounded-3xl ${
                    isDark
                      ? "bg-white/10 active:bg-white/20"
                      : "bg-white active:bg-gray-50 shadow-sm"
                  }`}
                >
                  <Text
                    className={`text-3xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    0
                  </Text>
                </Pressable>

                <Pressable
                  className="w-[30%] aspect-square justify-center items-center"
                  onPress={onBackspacePress}
                  disabled={code.length === 0}
                >
                  {code.length > 0 && (
                    <View
                      className={`w-16 h-16 rounded-full items-center justify-center ${
                        isDark ? "bg-red-500/20" : "bg-red-100"
                      }`}
                    >
                      <Ionicons
                        name="backspace-outline"
                        size={28}
                        color={isDark ? "#f87171" : "#dc2626"}
                      />
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>

        <View className="h-8" />
      </View>
    </SafeAreaView>
  );
};

export default Lock;
