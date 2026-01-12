import { PinService, biometricService } from "@/components/lib/SecureStorage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "../../context/AuthProvider";

interface TransactionPinProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TransactionPin: React.FC<TransactionPinProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { nativeAuthTransactions } = useAuth();
  const [code, setCode] = React.useState<number[]>([]);
  const [isBiometricSupported, setIsBiometricSupported] =
    React.useState<boolean>(false);
  const [biometricType, setBiometricType] = React.useState("");
  const codeLength = new Array(6).fill(0);

  // Check if device supports biometric authentication
  useEffect(() => {
    (async () => {
      const compatible = await biometricService.isBiometricAvailable();
      setIsBiometricSupported(compatible);

      if (compatible) {
        const biometricTypes =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (
          biometricTypes.includes(
            LocalAuthentication.AuthenticationType.FINGERPRINT
          )
        ) {
          setBiometricType("fingerprint");
        } else if (
          biometricTypes.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          setBiometricType("facial");
        } else {
          setBiometricType("biometric");
        }
      }
    })();
  }, []);

  const offset = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const OFFSET = 20;
  const TIME = 80;

  const onFingerPrintPress = async () => {
    try {
      console.log("Face ID button pressed");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (!isBiometricSupported) {
        console.log("Biometric not supported");
        return;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate for transaction",
        fallbackLabel: "Use PIN",
        disableDeviceFallback: true,
      });

      console.log("Biometric result:", result);

      if (result.success) {
        console.log("Biometric authentication successful");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess?.();
      } else {
        console.log("Biometric authentication failed:", result.error);
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const OnNumberPressDown = (num: number) => {
    if (code.length < 6) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCode((prev) => [...prev, num]);
    }
  };

  const RenderButton = (num: number) => (
    <TouchableOpacity
      key={num}
      onPress={() => OnNumberPressDown(num)}
      className="w-20 h-20 justify-center items-center bg-green-700/25 backdrop-blur shadow-lg rounded-full"
    >
      <Text className="text-white text-2xl font-light">{num}</Text>
    </TouchableOpacity>
  );

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
          console.log("PIN is correct");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCode([]);
          onSuccess?.();
        } else {
          console.log("PIN is incorrect");

          offset.value = withSequence(
            withTiming(-OFFSET, { duration: TIME / 2 }),
            withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
            withTiming(0, { duration: TIME / 2 })
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setCode([]);
        }
      };

      validatePin();
    }
  }, [code, onSuccess]);

  return (
    <View>
      <Animated.View style={style} className="flex-row justify-center mb-12">
        {codeLength.map((_, index) => (
          <View
            key={index + 1}
            className={`w-4 h-4 border-2 border-emerald-700 mx-2 justify-center items-center rounded-lg ${
              code[index] ? "bg-emerald-700" : "bg-transparent"
            }`}
          >
            <Text className="text-2xl text-white">
              {code.length > index ? "•" : ""}
            </Text>
          </View>
        ))}
      </Animated.View>

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
          {isBiometricSupported && nativeAuthTransactions ? (
            <TouchableOpacity
              className="w-20 h-20 justify-center items-center"
              onPress={onFingerPrintPress}
            >
              <MaterialCommunityIcons
                name={
                  biometricType === "facial"
                    ? "face-recognition"
                    : biometricType === "fingerprint"
                    ? "fingerprint"
                    : "passport-biometric"
                }
                size={32}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          ) : (
            <View className="w-20 h-20" />
          )}

          <TouchableOpacity
            onPress={() => OnNumberPressDown(0)}
            className="w-20 h-20 justify-center items-center bg-white/10 rounded-full"
          >
            <Text className="text-white text-2xl font-light">0</Text>
          </TouchableOpacity>

          <View className="w-20 h-20 justify-center items-center">
            {code.length > 0 ? (
              <TouchableOpacity onPress={() => onBackspacePress()}>
                <Ionicons name="backspace" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            ) : onCancel ? (
              <TouchableOpacity onPress={onCancel}>
                <Ionicons name="close" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

export default TransactionPin;
