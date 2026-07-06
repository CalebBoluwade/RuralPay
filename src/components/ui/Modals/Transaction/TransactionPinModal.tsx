import { useIdentityGate } from "@/src/hooks/useIdentityGate";
import AccountService from "@/src/lib/services/AccountService";
import { ReceiptService } from "@/src/lib/services/ReceiptService";
import ToastService from "@/src/lib/services/ToastService";
import { maskEmail, maskPhone } from "@/src/lib/utils";
import { PinService, biometricService } from "@/src/lib/utils/SecureStorage";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import {
  ChevronRight,
  Delete,
  Fingerprint,
  Grid2x2,
  Lock,
  MessageSquare,
  ScanEye,
  ScanFace,
  ScanLine,
  ShieldCheck,
  X,
} from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthSessionProvider";
import OTPInput from "../../Input/OTPInput";
import PinSetupModal from "../PinSetupModal";
import TransactionFailure from "./TransactionFailure";
import TransactionSuccess from "./TransactionSuccess";

interface TransactionPINProps {
  paymentMessage: string;
  showPinModal: boolean;
  // onSuccess?: () => void;
  error: string;
  initiateTransaction: (
    TwoFAType: TwoFAType,
    TwoFA_VerificationCode: string,
  ) => Promise<boolean>;
  onCancel?: () => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  transactionResult?: TransactionHistoryItem; // TransactionData
}

const TransactionPin: React.FC<TransactionPINProps> = ({
  paymentMessage,
  showPinModal,
  initiateTransaction,
  onCancel,
  isLoading,
  setIsLoading,
  error,
  transactionResult,
}) => {
  const { nativeAuthTransactions, user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [code, setCode] = React.useState<number[]>([]);
  const [isBiometricSupported, setIsBiometricSupported] =
    React.useState<boolean>(false);
  const [biometricType, setBiometricType] = React.useState("");
  const [hasPin, setHasPin] = React.useState<boolean>(false);
  const [showPinSetup, setShowPinSetup] = React.useState<boolean>(false);
  const [currentStep, setCurrentStep] = React.useState<AuthStep>("PIN");
  const [selected2FA, setSelected2FA] = React.useState<TwoFAType>();
  const [lockSeconds, setLockSeconds] = React.useState<number>(0);
  const [isVerifyingLiveness, setIsVerifyingLiveness] = React.useState(false);
  const isLocked = lockSeconds > 0;
  const codeLength = new Array(6).fill(0);
  const { requireVerification } = useIdentityGate();

  const handleDownloadReceipt = async () => {
    if (transactionResult) {
      await ReceiptService.DownloadTransactionReceipt({
        ...transactionResult,
        amount: (transactionResult.amount ?? 0).toString(),
      });
    }
  };

  const TFAOptions: {
    id: TwoFAType;
    title: string;
    sub: string;
    icon: React.FC<{ size: number; color: string }>;
  }[] = [
    {
      id: "OTP",
      title: "OTP Verification",
      sub: `Code will be sent to ${maskPhone(user?.phoneNumber)} and ${maskEmail(user?.email)} and will expire in 10 Mins`,
      icon: MessageSquare,
    },
    {
      id: "BYPASS",
      title: "Biometric Verification",
      sub: "Use your fingerprint or face to verify",
      icon:
        biometricType === "facial"
          ? ScanFace
          : biometricType === "fingerprint"
            ? Fingerprint
            : ScanLine,
    },
    {
      id: "FACIAL_RECOGNITION",
      title: "Facial Recognition",
      sub: "Use Liveness Checks to Verify",
      icon: ScanEye,
    },
  ];

  const send2FACode = async () => {
    setIsLoading(true);
    try {
      const response = await AccountService.SendUserOTP("2FA-CODE");

      if (response.success) {
        ToastService.success(`Verification Code Sent`);
        setCurrentStep("Verify-2FA");
      } else {
        Alert.alert("Error", "Failed to Send verification code");
      }
    } catch {
      Alert.alert("Error", "Failed to Send verification code");
    } finally {
      setIsLoading(false);
      setIsVerifyingLiveness(false);
      setIsLoading(false);
    }
  };

  const Validate2FACode = async (TwoFA_VerificationCode: string) => {
    setIsLoading(true);
    try {
      // "2FA-CODE"
      const transactionResult = await initiateTransaction(
        selected2FA!,
        TwoFA_VerificationCode,
      );
      if (transactionResult) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentStep("Success");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setCurrentStep("Failure");
      }
    } catch {
      setCurrentStep("Failure");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if device supports biometric authentication and if PIN exists
  useEffect(() => {
    if (!showPinModal) {
      setCode([]);
      return;
    }

    (async () => {
      const pinExists = await PinService.hasPin();
      setHasPin(pinExists);

      if (!pinExists) {
        setShowPinSetup(true);
        return;
      }

      const remaining = await PinService.getLockSecondsRemaining();
      setLockSeconds(remaining);

      const compatible = await biometricService.isBiometricAvailable();
      setIsBiometricSupported(compatible);

      if (compatible) {
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
    })();
  }, [showPinModal]);

  const offset = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const OFFSET = 20;
  const TIME = 80;

  // Countdown timer when locked
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockSeconds > 0]);

  const OnNumberPressDown = (num: number) => {
    if (isLocked || code.length >= 6) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode((prev) => [...prev, num]);
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

  const RenderPinView = () => (
    <>
      <View className="items-center px-6 mb-12">
        <View
          className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? "bg-lime-500/20" : "bg-lime-100"}`}
        >
          <Lock size={40} color={isDark ? "#84cc16" : "#65a30d"} />
        </View>
        <Text
          className={`text-3xl font-brand font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Enter PIN
        </Text>
        <Text
          className={`text-base font-semibold text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {isLocked
            ? `Too many attempts. Try again in ${lockSeconds}s`
            : paymentMessage}
        </Text>
      </View>

      <Animated.View style={style} className="flex-row justify-center mb-12">
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
            <Pressable
              className="w-20 h-20 justify-center items-center"
              onPress={async () => {
                const result =
                  await biometricService.onFingerPrintPress(
                    isBiometricSupported,
                  );

                if (result) {
                  setCurrentStep("Select-2FA");
                }
              }}
            >
              {biometricType === "facial" ? (
                <ScanFace size={32} color={isDark ? "#a78bfa" : "#7c3aed"} />
              ) : biometricType === "fingerprint" ? (
                <Fingerprint size={32} color={isDark ? "#a78bfa" : "#7c3aed"} />
              ) : (
                <ScanLine size={32} color={isDark ? "#a78bfa" : "#7c3aed"} />
              )}
            </Pressable>
          ) : (
            <View className="w-20 h-20" />
          )}

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
                <Delete size={28} color={isDark ? "#9ca3af" : "#6b7280"} />
              </Pressable>
            ) : onCancel ? (
              <Pressable onPress={handleClose}>
                <X size={28} color={isDark ? "#9ca3af" : "#6b7280"} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </>
  );

  const Render2FASelect = () => (
    <View className="flex-1 justify-center w-full max-w-md">
      <View className="items-center px-6 mb-8">
        <View
          className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? "bg-lime-500/20" : "bg-lime-100"}`}
        >
          <ShieldCheck size={40} color={isDark ? "#84cc16" : "#65a30d"} />
        </View>
        <Text
          className={`text-3xl font-brand font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Verify It&apos;s You
        </Text>
        <Text
          className={`text-base text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          Choose your verification method
        </Text>
      </View>

      <View className="px-6 w-full">
        {TFAOptions.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => {
              setSelected2FA(option.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (option.id === "FACIAL_RECOGNITION") {
                setIsVerifyingLiveness(true);
                requireVerification(
                  (result) => {
                    setIsVerifyingLiveness(false);
                    Validate2FACode(result?.identityToken ?? "");
                  },
                  () => {
                    setIsVerifyingLiveness(false);
                    ToastService.error("Facial verification failed");
                  },
                );
              } else if (option.id === "BYPASS") {
                biometricService
                  .onFingerPrintPress(isBiometricSupported)
                  .then((result) => {
                    if (result) {
                      Validate2FACode("BIOMETRIC-VERIFIED");
                    } else {
                      ToastService.error("Biometric verification failed");
                    }
                  });
              } else if (option.id === "OTP") {
                send2FACode();
              } else {
                Alert.alert("Error", "Unsupported 2FA method selected");
              }
            }}
            disabled={isLoading}
            className={`p-4 mb-4 rounded-2xl border-2 ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}
          >
            <View className="flex-row items-center">
              <View
                className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isDark ? "bg-lime-500/20" : "bg-lime-100"}`}
              >
                <option.icon size={24} color={isDark ? "#84cc16" : "#65a30d"} />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-base font-brand font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {option.title}
                </Text>
                <Text
                  className={`text-base mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {option.sub}
                </Text>
              </View>
              <ChevronRight size={20} color={isDark ? "#84cc16" : "#65a30d"} />
            </View>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => setCurrentStep("PIN")}
        className="mt-4 p-4 items-center"
      >
        <Text
          className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          ← Back to PIN
        </Text>
      </Pressable>
    </View>
  );

  const Render2FAVerify = () => (
    <View className="flex-1 px-6 justify-center">
      <View className="items-center mb-12">
        <View
          className={`w-20 h-20 rounded-full items-center justify-center mb-6 ${isDark ? "bg-lime-500/20" : "bg-lime-100"}`}
        >
          <Grid2x2 size={40} color={isDark ? "#84cc16" : "#65a30d"} />
        </View>
        <Text
          className={`text-3xl font-brand font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Enter Code
        </Text>
        <Text
          className={`text-base text-center px-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          We&apos;ve Sent a 8-digit Code To Your Device
        </Text>
      </View>

      <View className="items-center mb-10">
        <OTPInput
          length={8}
          onComplete={(verificationCode) => {
            Keyboard.dismiss();
            Validate2FACode(verificationCode);
          }}
        />
        {/* <TextInput
          value={verificationCode}
          onChangeText={(text) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setVerificationCode(text);
          }}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
          className={`text-3xl font-mono tracking-widest text-center p-6 rounded-2xl border-2 w-64 ${isDark ? "bg-white/5 border-white/20 text-white" : "bg-white border-gray-300 text-gray-900"}`}
          placeholder="000000"
          placeholderTextColor={isDark ? "#4b5563" : "#9ca3af"}
        /> */}
      </View>

      {/* <Pressable
        onPress={() => verify2FACode}
        disabled={isLoading}
        className={`p-5 rounded-2xl mb-4 ${isDark ? "bg-lime-600" : "bg-lime-500"} ${isLoading ? "opacity-50" : ""}`}
      >
        <Text className="text-white text-center text-xl font-bold">
          {isLoading ? "⏳ Processing..." : "✓ Confirm & Pay"}
        </Text>
      </Pressable> */}

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          send2FACode();
        }}
        disabled={isLoading}
        className="items-center mb-4"
      >
        <Text
          className={`text-base font-semibold ${isDark ? "text-lime-400" : "text-lime-600"}`}
        >
          Resend Code
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setCurrentStep("Select-2FA")}
        className="items-center"
      >
        <Text
          className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          ← Change Method
        </Text>
      </Pressable>
    </View>
  );

  const handleClose = () => {
    Keyboard.dismiss();
    setCurrentStep("PIN");
    onCancel?.();
  };

  const RenderSuccess = () => (
    <TransactionSuccess
      transactionResult={transactionResult!}
      handleDownloadReceipt={handleDownloadReceipt}
      onClose={handleClose}
    />
  );

  const RenderFailure = () => (
    <TransactionFailure error={error} onClose={handleClose} />
  );

  useEffect(() => {
    if (code.length === 6) {
      const validatePin = async () => {
        try {
          const isValid = await PinService.ValidatePin(code.join(""));

          if (isValid) {
            ToastService.success("PIN Is Correct");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCode([]);
            setCurrentStep("Select-2FA");
          } else {
            const remaining = await PinService.getLockSecondsRemaining();
            if (remaining > 0) setLockSeconds(remaining);

            offset.value = withSequence(
              withTiming(-OFFSET, { duration: TIME / 2 }),
              withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
              withTiming(0, { duration: TIME / 2 }),
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setCode([]);
          }
        } catch (error) {
          if (__DEV__) console.error("PIN Validation Error:", error);
          ToastService.error("PIN validation failed");

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

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case "PIN":
        return RenderPinView();
      case "Select-2FA":
        return Render2FASelect();
      case "Verify-2FA":
        return Render2FAVerify();
      case "Success":
        return RenderSuccess();
      case "Failure":
        return RenderFailure();
      default:
        return RenderPinView();
    }
  };

  return (
    <>
      <PinSetupModal
        visible={showPinSetup}
        onComplete={() => {
          setShowPinSetup(false);
          setHasPin(true);
        }}
        onCancel={() => {
          setShowPinSetup(false);
          onCancel?.();
        }}
      />

      <Modal
        visible={
          !showPinSetup &&
          hasPin &&
          (showPinModal ||
            currentStep === "Success" ||
            currentStep === "Failure") &&
          !isVerifyingLiveness
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <SafeAreaView
          className={`flex-1 justify-center items-center ${isDark ? "bg-[#0a0a0f]" : "bg-[#e7efe7]"}`}
        >
          {getCurrentStepContent()}
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default TransactionPin;
