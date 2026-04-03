import { authService } from "@/src/lib/services/AuthService";
import ToastService from "@/src/lib/services/ToastService";
import { biometricService, PinService } from "@/src/lib/utils/SecureStorage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { Fingerprint, ScanFace, ScanLine } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  DeviceEventEmitter,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
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

const LockScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [code, setCode] = React.useState<number[]>([]);
  const [isBiometricSupported, setIsBiometricSupported] =
    React.useState<boolean>(false);
  const [biometricType, setBiometricType] = React.useState("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [lockSeconds, setLockSeconds] = React.useState<number>(0);
  const isLocked = lockSeconds > 0;
  const codeLength = new Array(6).fill(0);

  const offset = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  // Refs to track mounted state and intervals - FIXED: Added initial values
  const isMounted = useRef<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const validationInProgress = useRef<boolean>(false);

  const OFFSET = 20;
  const TIME = 80;

  const OnNumberPressDown = (num: number) => {
    if (isLocked || code.length >= 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode((prev) => [...prev, num]);
  };

  // Check biometric support and initial lock state
  useEffect(() => {
    let isActive = true;

    (async () => {
      try {
        const [compatible, remaining] = await Promise.all([
          biometricService.isBiometricAvailable(),
          PinService.getLockSecondsRemaining(),
        ]);

        if (isActive) {
          setIsBiometricSupported(compatible);
          setLockSeconds(remaining);
        }

        if (compatible && isActive) {
          const biometricTypes =
            await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (
            biometricTypes.includes(
              LocalAuthentication.AuthenticationType.FINGERPRINT,
            )
          ) {
            setBiometricType("fingerprint");
          } else if (
            biometricTypes.includes(
              LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
            )
          ) {
            setBiometricType("facial");
          } else {
            setBiometricType("biometric");
          }
        }
      } catch (error) {
        if (__DEV__) console.error("Biometric check error:", error);
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  // Countdown timer when locked
  useEffect(() => {
    if (lockSeconds <= 0) {
      // Clear timer if lockSeconds becomes 0
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      return;
    }

    // Clear existing timer before creating a new one
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setLockSeconds((s) => {
        if (s <= 1) {
          // Clear timer when reaching 0
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = undefined;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
    };
  }, [lockSeconds]);

  useEffect(() => {
    // Prevent multiple validations from running simultaneously
    if (code.length === 6 && !validationInProgress.current) {
      validationInProgress.current = true;

      const validatePin = async () => {
        try {
          const isValid = await PinService.ValidatePin(code.join(""));

          if (!isMounted.current) return;

          if (isValid) {
            ToastService.success("PIN Is Correct");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCode([]);
            await GetUserRefreshToken();
          } else {
            const remaining = await PinService.getLockSecondsRemaining();
            if (remaining > 0 && isMounted.current) setLockSeconds(remaining);

            offset.value = withSequence(
              withTiming(-OFFSET, { duration: TIME / 2 }),
              withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
              withTiming(0, { duration: TIME / 2 }),
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            if (isMounted.current) setCode([]);
          }
        } catch (error) {
          if (!isMounted.current) return;

          if (__DEV__) console.error("PIN validation error:", error);
          ToastService.error("PIN validation failed");

          offset.value = withSequence(
            withTiming(-OFFSET, { duration: TIME / 2 }),
            withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
            withTiming(0, { duration: TIME / 2 }),
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setCode([]);
        } finally {
          validationInProgress.current = false;
        }
      };

      validatePin();
    }
  }, [code]);

  const onBackspacePress = () => {
    if (code.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode((prev) => prev.slice(0, -1));
  };

  const GetUserRefreshToken = async () => {
    // Prevent multiple simultaneous refresh token calls
    if (isLoading) return;

    try {
      setIsLoading(true);

      const user = await authService.refreshToken();

      if (!isMounted.current) return;

      if (user) {
        router.canGoBack() ? router.back() : null;
        DeviceEventEmitter.emit("PIN_SUCCESS");
      } else {
        router.replace("/auth/login");
      }
    } catch (error) {
      if (!isMounted.current) return;
      if (__DEV__) console.error("Refresh token error:", error);
      router.replace("/auth/login");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      // Clear any pending timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      // Reset validation flag
      validationInProgress.current = false;
    };
  }, []);

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-gray-50"}`}
    >
      <View className="flex-1 px-6 justify-between py-12">
        <Animated.View
          entering={FadeIn.duration(600)}
          className="items-center mt-8"
        >
          <View
            className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${
              isDark
                ? "bg-lime-500/20 to-emerald-500/20"
                : "bg-lime-100 to-emerald-100"
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
            Secured. Encrypted
          </Text>
        </Animated.View>

        <View className="items-center">
          <Animated.View
          // entering={FadeInDown.delay(200).duration(600)}
          >
            <Text
              className={`text-sm mb-6 ${isDark ? "text-gray-200" : "text-gray-500"}`}
            >
              {isLocked
                ? `Too Many Attempts. Try Again In ${lockSeconds}s`
                : "Enter your PIN"}
            </Text>
            <Animated.View
              style={style}
              className="flex-row justify-center mb-12"
            >
              {codeLength.map((_, index) => (
                <View
                  key={index + 1}
                  className={`w-12 h-12 mx-2 justify-center items-center rounded-2xl ${
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
            <View className="gap-4 p-6">
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
                        className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
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
                  onPress={async () => {
                    const result =
                      await biometricService.onFingerPrintPress(
                        isBiometricSupported,
                      );

                    if (result) {
                      await GetUserRefreshToken();
                    }
                  }}
                >
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center ${
                      isDark ? "bg-lime-500/20" : "bg-lime-100"
                    }`}
                  >
                    {isBiometricSupported &&
                      (biometricType === "facial" ? (
                        <ScanFace
                          size={24}
                          color={isDark ? "#a3e635" : "#65a30d"}
                        />
                      ) : biometricType === "fingerprint" ? (
                        <Fingerprint
                          size={24}
                          color={isDark ? "#a3e635" : "#65a30d"}
                        />
                      ) : (
                        <ScanLine
                          size={24}
                          color={isDark ? "#a3e635" : "#65a30d"}
                        />
                      ))}
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

export default LockScreen;
