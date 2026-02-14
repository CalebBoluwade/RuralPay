import OptimizedInput from "@/components/ui/Input/OptimizedInput";
import ToastService from "@/lib/services/ToastService";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useLanguage } from "../../components/context/LanguageContext";

const forgotPasswordSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
});

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

type Step = "phone" | "otp" | "reset";

export default function ForgotPasswordScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const {
    control: phoneControl,
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors, isSubmitting: isPhoneSubmitting },
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

  const onPhoneSubmit = async (data: ForgotPasswordData) => {
    try {
      setPhoneNumber(data.phoneNumber);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      ToastService.success("Verification code sent to your phone");
      setStep("otp");
    } catch (error) {
      ToastService.error("Failed to send verification code");
    }
  };

  const onOtpSubmit = async () => {
    if (otp.length !== 6) {
      ToastService.warning("Please enter the 6-digit code");
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      ToastService.success("Code verified successfully");
      setStep("reset");
    } catch (error) {
      ToastService.error("Invalid verification code");
    }
  };

  const onResetSubmit = async (data: ResetPasswordData) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      ToastService.success("Password reset successfully");
      router.replace("/(auth)/Login");
    } catch {
      ToastService.error("Failed to Reset Password");
    }
  };

  const resendCode = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      ToastService.success("New verification code sent");
    } catch {
      ToastService.error("Failed to resend code");
    }
  };

  return (
    <ImageBackground
      source={{
        uri: "https://images.pexels.com/photos/35255685/pexels-photo-35255685.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      }}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/40">
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="flex-1 px-6 py-8">
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => {
                  if (step === "phone") router.back();
                  else if (step === "otp") setStep("phone");
                  else if (step === "reset") setStep("otp");
                }}
                className="w-12 h-12 rounded-full items-center justify-center bg-white/20 backdrop-blur border border-white/30 mb-8"
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>

              {/* Header */}
              <View className="mb-12">
                <Text className="text-4xl font-bold text-white mb-3">
                  {step === "phone" && "Forgot Password?"}
                  {step === "otp" && "Enter Code"}
                  {step === "reset" && "Reset Password"}
                </Text>
                <Text className="text-white/80 text-lg">
                  {step === "phone" &&
                    "Enter your phone number to receive a verification code"}
                  {step === "otp" &&
                    "Enter the 6-digit code sent to your phone"}
                  {step === "reset" && "Create a new password for your account"}
                </Text>
              </View>

              {/* Form Card */}
              <View className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8 mb-8">
                {/* Phone Number Step */}
                {step === "phone" && (
                  <>
                    <OptimizedInput
                      control={phoneControl}
                      name="phoneNumber"
                      label="Phone Number"
                      placeholder="Enter your phone number"
                      keyboardType="phone-pad"
                      error={phoneErrors.phoneNumber}
                    />

                    <TouchableOpacity
                      onPress={handlePhoneSubmit(onPhoneSubmit)}
                      disabled={isPhoneSubmitting}
                      className={`bg-indigo-700 rounded-2xl py-4 shadow-lg ${
                        isPhoneSubmitting ? "opacity-50" : ""
                      }`}
                    >
                      <Text className="text-white text-lg font-bold text-center">
                        {isPhoneSubmitting ? "Sending..." : "Send Code"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* OTP Step */}
                {step === "otp" && (
                  <>
                    <View className="mb-6">
                      <Text className="text-xl font-semibold mb-2 text-white">
                        Verification Code
                      </Text>
                      <TextInput
                        className="h-20 rounded-2xl p-3 text-2xl text-center backdrop-blur-xl bg-white/10 border border-white/20 text-white tracking-widest"
                        placeholder="0 0 0 0 0 0"
                        placeholderTextColor="#9CA3AF"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>

                    <TouchableOpacity
                      onPress={onOtpSubmit}
                      className="bg-indigo-700 rounded-2xl py-4 shadow-lg mb-4"
                    >
                      <Text className="text-white text-lg font-bold text-center">
                        Verify Code
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={resendCode}>
                      <Text className="text-white/90 text-center font-medium">
                        Didn&apos;t receive code? Resend
                      </Text>
                    </TouchableOpacity>
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

                    <TouchableOpacity
                      onPress={handleResetSubmit(onResetSubmit)}
                      disabled={isResetSubmitting}
                      className={`bg-indigo-700 rounded-2xl py-4 shadow-lg ${
                        isResetSubmitting ? "opacity-50" : ""
                      }`}
                    >
                      <Text className="text-white text-lg font-bold text-center">
                        {isResetSubmitting ? "Resetting..." : "Reset Password"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Back to Login Link */}
              <View className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <View className="flex-row justify-center items-center">
                  <Text className="text-white/80 text-lg">
                    Remember your password?{" "}
                  </Text>
                  <Link href="/(auth)/Login" asChild>
                    <TouchableOpacity>
                      <Text className="text-blue-300 text-lg font-bold">
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}
