import { useLanguage } from "@/src/components/context/LanguageContext";
import OptimizedInput from "@/src/components/ui/Input/OptimizedInput";
import OTPInput from "@/src/components/ui/Input/OTPInput";
import {
  ForgotPasswordData,
  forgotPasswordSchema,
  ResetPasswordData,
  resetPasswordSchema,
} from "@/src/lib/schema/validations";
import { authService } from "@/src/lib/services/AuthService";
import ToastService from "@/src/lib/services/ToastService";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = "identifier" | "otp" | "reset";

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("identifier");
  const [otp, setOtp] = useState("");

  const {
    control: identifierControl,
    getValues: identifierValues,
    handleSubmit: handleIdentifierSubmit,
    formState: {
      errors: identifierErrors,
      isSubmitting: isIdentifierSubmitting,
    },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetSubmitting },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onIdentifierSubmit = async (data: ForgotPasswordData) => {
    const ok = await authService.forgotPassword(data.identifier);
    if (ok) {
      ToastService.success("Verification Code Sent");
      setStep("otp");
    } else {
      ToastService.error("Failed to Send verification Code");
    }
  };

  const onOtpSubmit = async () => {
    if (otp.length !== 8) {
      ToastService.warning("Please Enter the 8-Digit Code");
      return;
    }
    ToastService.success("Code Verified Successfully");
    setStep("reset");
  };

  const onResetSubmit = async (data: ResetPasswordData) => {
    const ok = await authService.resetPassword({
      token: otp,
      password: data.newPassword,
    });
    if (ok) {
      // router.replace("/auth/Login"); d
      ToastService.success("Password Reset Successfully");
      router.back();

      setTimeout(
        () => ToastService.success("Password reset successfully"),
        3000,
      );
    } else {
      ToastService.error("Failed to Reset Password");
    }
  };

  const resendCode = async () => {
    const ok = await authService.forgotPassword(identifierValues("identifier"));
    if (ok) {
      ToastService.success("Verification code sent");
      setStep("otp");
    } else {
      ToastService.error("Failed to send verification code");
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-6 py-8">
          {/* Back Button */}
          <Pressable
            onPress={() => {
              if (step === "identifier") router.back();
              else if (step === "otp") setStep("identifier");
              else if (step === "reset") setStep("otp");
            }}
            className="w-12 h-12 rounded-full items-center justify-center bg-white/20 backdrop-blur border border-white/30 mb-8"
          >
            <ArrowLeft size={24} color="white" />
          </Pressable>

          {/* Header */}
          <View className="mb-12">
            <Text
              className={`text-4xl font-brand font-bold ${isDark ? "text-white" : "text-gray-900"} mb-3`}
            >
              {step === "identifier" && "Forgot Password?"}
              {step === "otp" && "Enter Verification Code"}
              {step === "reset" && "Reset Password"}
            </Text>
            <Text
              className={`${isDark ? "text-white/80" : "text-gray-900"} text-lg`}
            >
              {step === "identifier" &&
                "Enter your phone number, email or username"}
              {step === "otp" && "Enter the 8-digit code sent to you"}
              {step === "reset" && "Create a new password for your account"}
            </Text>
          </View>

          {/* Form Card */}
          {/* <View className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-4 mb-8"> */}
          {/* Identifier Step */}
          {step === "identifier" && (
            <>
              <OptimizedInput
                control={identifierControl}
                name="identifier"
                label="Phone, Email or Username"
                placeholder="Enter phone number, email or username"
                autoCapitalize="none"
                error={identifierErrors.identifier}
              />

              <Pressable
                onPress={handleIdentifierSubmit(onIdentifierSubmit)}
                disabled={isIdentifierSubmitting}
                className={`bg-lime-400 rounded-2xl py-4 shadow-lg ${
                  isIdentifierSubmitting ? "opacity-50" : ""
                }`}
              >
                <Text className="text-white text-lg font-bold text-center">
                  {isIdentifierSubmitting ? "Sending..." : "Send Code"}
                </Text>
              </Pressable>
            </>
          )}

          {/* OTP Step */}
          {step === "otp" && (
            <>
              <OTPInput onComplete={(eightDigits) => setOtp(eightDigits)} />
              {/* <TextInput
                    className="h-20 rounded-2xl p-3 text-2xl text-center backdrop-blur-xl bg-white/10 border border-white/20 text-white tracking-widest"
                    placeholder="0 0 0 0 0 0"
                    placeholderTextColor="#9CA3AF"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={6}
                  /> */}

              <Pressable
                onPress={onOtpSubmit}
                className="bg-lime-700 rounded-2xl py-4 shadow-lg mb-6"
              >
                <Text className="text-white text-lg font-bold text-center">
                  Verify Code
                </Text>
              </Pressable>

              <Pressable onPress={resendCode}>
                <Text
                  className={`mb-3 ${isDark ? "text-white" : "text-gray-900"} text-center font-medium`}
                >
                  Didn&apos;t receive code? Resend
                </Text>
              </Pressable>
            </>
          )}

          {/* Reset Password Step */}
          {step === "reset" && (
            <>
              <OptimizedInput
                control={resetControl}
                name="newPassword"
                label="New Password"
                placeholder="Enter new password"
                secureTextEntry
                showPasswordToggle
                error={resetErrors.newPassword}
              />

              <OptimizedInput
                control={resetControl}
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm new password"
                secureTextEntry
                showPasswordToggle
                error={resetErrors.confirmPassword}
              />

              <Pressable
                onPress={handleResetSubmit(onResetSubmit)}
                disabled={isResetSubmitting}
                className={`bg-lime-700 rounded-2xl py-4 shadow-lg ${
                  isResetSubmitting ? "opacity-50" : ""
                }`}
              >
                <Text className="text-white text-lg font-bold text-center">
                  {isResetSubmitting ? "Resetting..." : "Reset Password"}
                </Text>
              </Pressable>
            </>
          )}
          {/* </View> */}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
