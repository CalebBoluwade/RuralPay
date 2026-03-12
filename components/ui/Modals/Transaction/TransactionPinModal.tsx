import AccountService from "@/lib/services/AccountService";
import { ReceiptService } from "@/lib/services/ReceiptService";
import ToastService from "@/lib/services/ToastService";
import { maskEmail, maskPhone } from "@/lib/utils";
import { formatAmount } from "@/lib/utils/formatAmount";
import { PinService, biometricService } from "@/lib/utils/SecureStorage";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import {
  CheckCircle2,
  ChevronRight,
  Delete,
  Fingerprint,
  Grid2x2,
  Lock,
  Mail,
  MessageSquare,
  ScanFace,
  ScanLine,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react-native";
import React, { useEffect } from "react";
import {
  Modal,
  Pressable,
  Share,
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
import { useAuth } from "../../../context/AuthProvider";
import OTPInput from "../../Input/OTPInput";
import PinSetupModal from "../PinSetupModal";

interface TransactionPinProps {
  paymentMessage: string;
  showPinModal: boolean;
  // onSuccess?: () => void;
  error: string;
  initiateTransaction: (TwoFA_VerificationCode: string) => Promise<boolean>;
  onCancel?: () => void;
  amount: string;
  recipient: string;
  transactionResult?: ReceiptData; // TransactionData
}

type AuthStep = "PIN" | "Select-2FA" | "Verify-2FA" | "Success" | "Failure";

const TransactionPin: React.FC<TransactionPinProps> = ({
  paymentMessage,
  showPinModal,
  initiateTransaction,
  onCancel,
  amount,
  recipient,
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
  const [hasPin, setHasPin] = React.useState<boolean>(true);
  const [showPinSetup, setShowPinSetup] = React.useState<boolean>(false);
  const [currentStep, setCurrentStep] = React.useState<AuthStep>("PIN");
  const [selected2FA, setSelected2FA] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const codeLength = new Array(6).fill(0);

  const handleDownloadReceipt = async () => {
    if (transactionResult) {
      await ReceiptService.downloadReceipt(transactionResult);
    }
  };

  const handleShare = async () => {
    if (!transactionResult) return;

    try {
      await Share.share({
        message: `Transaction Successful!\nAmount: ₦${transactionResult.amount}\nRecipient: ${transactionResult.recipient}\nReference: ${transactionResult.reference}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const TFAOptions: {
    id: string;
    title: string;
    sub: string;
    icon: React.FC<{ size: number; color: string }>;
  }[] = [
    {
      id: "sms",
      title: "SMS Verification",
      sub: `Code will be sent to ${maskPhone(user?.phoneNumber)}`,
      icon: MessageSquare,
    },
    {
      id: "email",
      title: "Email Verification",
      sub: `Code will be sent to ${maskEmail(user?.email)}`,
      icon: Mail,
    },
  ];

  const send2FACode = async (method: string) => {
    setIsLoading(true);
    try {
      const response = await AccountService.SendUserOTP(
        "2FA-CODE",
        method === "sms" ? "SMS" : "Email",
      );

      if (response.success) {
        ToastService.success(
          `Verification Code Sent via ${selected2FA === "sms" ? "SMS" : "Email"}`,
        );
        setCurrentStep("Verify-2FA");
      } else {
        ToastService.error("Failed to Send verification code");
      }
    } catch {
      ToastService.error("Failed to Send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const Validate2FACode = async (TwoFA_VerificationCode: string) => {
    console.log(TwoFA_VerificationCode);

    setIsLoading(true);
    try {
      // "2FA-CODE"
      const transactionResult = await initiateTransaction(
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
      // Reset state when modal closes, but not on terminal steps
      setCurrentStep((prev) => {
        if (prev === "Success" || prev === "Failure") return prev;
        return "PIN";
      });
      setCode([]);
      setSelected2FA("");
      return;
    }

    (async () => {
      const pinExists = await PinService.hasPin();
      setHasPin(pinExists);

      if (!pinExists) {
        setShowPinSetup(true);
        return;
      }

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

  const OnNumberPressDown = (num: number) => {
    if (code.length < 6) {
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

  const renderPinView = () => (
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
          {paymentMessage}
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
              <Pressable onPress={onCancel}>
                <X size={28} color={isDark ? "#9ca3af" : "#6b7280"} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </>
  );

  const render2FASelect = () => (
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
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelected2FA(option.id);
              send2FACode(option.id);
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
                  className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
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

  const render2FAVerify = () => (
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
          We&apos;ve sent a 8-digit code to your{" "}
          {selected2FA === "sms" ? "phone" : "email"}
        </Text>
      </View>

      <View className="items-center mb-10">
        <OTPInput
          length={8}
          onComplete={(verificationCode) => Validate2FACode(verificationCode)}
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
          send2FACode(selected2FA === "sms" ? "SMS" : "Email");
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

  const renderSuccess = () => (
    <View className="flex-1 w-full justify-center px-6">
      <View className="items-center mb-12">
        <View
          className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${isDark ? "bg-lime-500/20" : "bg-lime-100"}`}
        >
          <CheckCircle2 size={56} color={isDark ? "#84cc16" : "#65a30d"} />
        </View>
        <Text
          className={`text-3xl font-brand font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Payment Successful!
        </Text>
        <Text
          className={`text-base text-center px-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          Your transaction of{" "}
          {formatAmount(Number.parseFloat(amount), "NGN", true, false)} was
          completed successfully.
        </Text>
      </View>

      <View
        className={`p-6 rounded-2xl mb-8 border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}
      >
        <View className="flex-row justify-between items-center mb-4">
          <Text
            className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Reference
          </Text>
          <Text
            className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {transactionResult?.reference}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-4">
          <Text
            className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Narration
          </Text>
          <Text
            className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {transactionResult?.narration}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text
            className={`text-base font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Date
          </Text>
          <Text
            className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {new Date().toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View className="flex-row space-x-2 gap-2 mb-4">
        <Pressable
          className={`flex-1 rounded-2xl py-5 px-1 items-center ${isDark ? "bg-lime-600" : "bg-lime-500"}`}
          onPress={handleDownloadReceipt}
        >
          <Text className="text-white text-base font-semibold break-words text-wrap">
            Download Receipt
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 rounded-2xl py-5 px-1 items-center backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-gray-200 border border-gray-300"
          }`}
          onPress={handleShare}
        >
          <Text
            className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
          >
            Share
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => {
          onCancel?.();
          setCurrentStep("PIN");
        }}
        className={`p-5 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-500"}`}
      >
        <Text className="text-white text-center text-xl font-bold">Close</Text>
      </Pressable>
    </View>
  );

  const renderFailure = () => (
    <View className="flex-1 w-full justify-center px-6">
      <View className="items-center mb-12">
        <View
          className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${isDark ? "bg-red-500/20" : "bg-red-100"}`}
        >
          <XCircle size={56} color={isDark ? "#ef4444" : "#dc2626"} />
        </View>
        <Text
          className={`text-center text-2xl font-brand font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Transaction Failed. We Couldn&apos;t Complete Your Transaction
        </Text>
        <Text
          className={`text-lg text-center px-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {error}
        </Text>
      </View>

      <Pressable
        onPress={() => {
          onCancel?.();
          setCurrentStep("PIN");
        }}
        className={`p-5 rounded-2xl ${isDark ? "bg-red-600" : "bg-red-500"}`}
      >
        <Text className="text-white text-center text-xl font-bold">Close</Text>
      </Pressable>
    </View>
  );

  useEffect(() => {
    if (code.length === 6) {
      const validatePin = async () => {
        try {
          const isValid = await PinService.ValidatePin(code.join(""));
          console.log(isValid);

          if (isValid) {
            ToastService.success("PIN Is Correct");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCode([]);
            setCurrentStep("Select-2FA");
          } else {
            ToastService.error("Incorrect PIN");

            offset.value = withSequence(
              withTiming(-OFFSET, { duration: TIME / 2 }),
              withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
              withTiming(0, { duration: TIME / 2 }),
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setCode([]);
          }
        } catch (error) {
          console.error("PIN validation error:", error);
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
        return renderPinView();
      case "Select-2FA":
        return render2FASelect();
      case "Verify-2FA":
        return render2FAVerify();
      case "Success":
        return renderSuccess();
      case "Failure":
        return renderFailure();
      default:
        return renderPinView();
    }
  };
  return (
    <>
      <Modal
        visible={
          (showPinModal ||
            currentStep === "Success" ||
            currentStep === "Failure") &&
          hasPin &&
          !showPinSetup
        }
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onCancel}
      >
        <SafeAreaView
          className={`flex-1 justify-center items-center ${isDark ? "bg-[#0a0a0f]" : "bg-[#e7efe7]"}`}
        >
          {getCurrentStepContent()}
        </SafeAreaView>
      </Modal>

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
    </>
  );
};

export default TransactionPin;
