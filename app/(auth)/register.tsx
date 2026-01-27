import AccountService from "@/components/services/AccountService";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { ToastService } from "@/hooks/use-toast";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../components/context/AuthProvider";
import { useLanguage } from "../../components/context/LanguageContext";
import OptimizedInput from "../../components/Input/OptimizedInput";
import PinSetupModal from "../../components/ui/PinSetupModal";
import { RegisterFormData, registerSchema } from "../../lib/validations";

type RegistrationStep =
  | "language"
  | "personal"
  | "bvn"
  | "phone-verify"
  | "pin";

type Language = "english" | "yoruba" | "igbo" | "hausa";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState<RegistrationStep>("language");
  const [showPinModal, setShowPinModal] = useState(false);
  const [registrationData, setRegistrationData] =
    useState<RegisterFormData | null>(null);
  const [bvn, setBvn] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: RegisterFormData) => {
    setRegistrationData(data);
    setStep("bvn");
  };

  const handleBvnSubmit = async () => {
    if (bvn.length !== 11) {
      ToastService.warning("BVN Must Be 11 Digits");
      return;
    }

    const bvnValidation = await AccountService.ValidateBVN({
      bvn: bvn,
      phoneNumber: registrationData?.phoneNumber || "",
      email: registrationData?.email || "",
    });

    if (!bvnValidation.valid) {
      ToastService.error(bvnValidation.message || "Failed to Validate BVN");
      return;
    }

    ToastService.info("Verification Code Sent to your Registered Phone");
    setStep("phone-verify");
  };

  const handlePhoneVerify = async () => {
    if (phoneOtp.length !== 8) {
      ToastService.warning("Please Enter the 8-digit Code");
      return;
    }

    const OtpValidation = await AccountService.ValidateOTP(bvn, phoneOtp);

    if (!OtpValidation.valid) {
      ToastService.error(OtpValidation.message || "Failed to Validate OTP");
      return;
    }

    ToastService.success("Phone Number Verified Successfully");
    setStep("pin");
    setShowPinModal(true);
  };

  const handlePinComplete = async () => {
    if (!registrationData) return;

    try {
      await register({
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: registrationData.email.toLowerCase(),
        password: registrationData.password,
        phoneNumber: registrationData.phoneNumber,
        bvn,
      });

      ToastService.success("Registration Successful");
      setShowPinModal(false);
      router.replace("/(tabs)");
    } catch (error) {
      setShowPinModal(false);
      setStep("personal");
      ToastService.error(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again",
      );
    }
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    setStep("phone-verify");
  };

  const renderProgressBar = () => {
    const steps: RegistrationStep[] = [
      "language",
      "personal",
      "bvn",
      "phone-verify",
    ];
    const currentIndex = steps.indexOf(step);

    return (
      <View className="flex-row justify-center place-items-center mb-8 px-2">
        {steps.map((s, index) => (
          <View key={s} className="flex-1 flex-row items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                index <= currentIndex
                  ? isDark
                    ? "bg-lime-600"
                    : "bg-lime-700"
                  : isDark
                    ? "bg-white/10"
                    : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-sm font-bold ${index <= currentIndex ? "text-white" : isDark ? "text-gray-500" : "text-gray-400"}`}
              >
                {index + 1}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                className={`flex-1 h-1 mx-2 ${
                  index < currentIndex
                    ? isDark
                      ? "bg-lime-600"
                      : "bg-lime-700"
                    : isDark
                      ? "bg-white/10"
                      : "bg-gray-200"
                }`}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const RenderSubtitle = (): string => {
    if (step === "language") return "Choose your preferred language";
    if (step === "personal") return "Enter your personal details";
    if (step === "bvn") return "Verify your identity";
    if (step === "phone-verify") return "Enter Phone Verification code";
    return "";
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <ScreenHeader
            title={t("auth.register")}
            subtitle={RenderSubtitle()}
            onBack={() => {
              if (step === "language") router.back();
              else if (step === "personal") setStep("language");
              else if (step === "bvn") setStep("personal");
              else if (step === "phone-verify") setStep("bvn");
            }}
          />
          <View className="flex-1 px-6 pt-2 pb-8">
            {renderProgressBar()}

            {/* Personal Info Step */}
            {step === "personal" && (
              <View className="flex-1">
                <OptimizedInput
                  control={control}
                  name="firstName"
                  label={t("auth.firstName")}
                  placeholder="Enter your first name"
                  error={errors.firstName}
                />

                <OptimizedInput
                  control={control}
                  name="lastName"
                  label={t("auth.lastName")}
                  placeholder="Enter your last name"
                  error={errors.lastName}
                />

                <OptimizedInput
                  control={control}
                  name="email"
                  label={t("auth.email")}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  error={errors.email}
                />

                <OptimizedInput
                  control={control}
                  name="phoneNumber"
                  label={t("auth.phoneNumber")}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                  error={errors.phoneNumber}
                />

                <OptimizedInput
                  control={control}
                  name="password"
                  label={t("auth.password")}
                  placeholder="Enter your password"
                  secureTextEntry
                  error={errors.password}
                />

                <OptimizedInput
                  control={control}
                  name="confirmPassword"
                  label={t("auth.confirmPassword")}
                  placeholder="Confirm your password"
                  secureTextEntry
                  error={errors.confirmPassword}
                />

                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className={`py-4 rounded-2xl mt-4 ${isDark ? "bg-lime-600" : "bg-lime-700"} ${
                    isSubmitting ? "opacity-50" : ""
                  }`}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    {isSubmitting ? "Processing..." : t("common.continue")}
                  </Text>
                </TouchableOpacity>

                <View className="flex-row justify-center items-center mt-6">
                  <Text
                    className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {t("auth.alreadyHaveAccount")}{" "}
                  </Text>
                  <Link href="/(auth)/login" asChild>
                    <TouchableOpacity>
                      <Text
                        className={`text-base font-semibold ${isDark ? "text-lime-400" : "text-lime-600"}`}
                      >
                        {t("auth.login")}
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            )}

            {/* Language Selection Step */}
            {step === "language" && (
              <View className="flex-1">
                <View
                  className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
                    isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-white/60 border border-gray-200/50"
                  }`}
                >
                  <View className="items-center mb-6">
                    <View
                      className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                        isDark ? "bg-lime-500/20" : "bg-lime-100"
                      }`}
                    >
                      <Ionicons
                        name="language"
                        size={32}
                        color={isDark ? "#a78bfa" : "#7c3aed"}
                      />
                    </View>
                    <Text
                      className={`text-xl font-bold text-center ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Select Language
                    </Text>
                    <Text
                      className={`text-sm text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Choose your preferred language for the app
                    </Text>
                  </View>

                  {[
                    { value: "english", label: "English", flag: "🇬🇧" },
                    { value: "yoruba", label: "Yoruba", flag: "🇳🇬" },
                    { value: "igbo", label: "Igbo", flag: "🇳🇬" },
                    { value: "hausa", label: "Hausa", flag: "🇳🇬" },
                  ].map((lang) => (
                    <TouchableOpacity
                      key={lang.value}
                      onPress={() =>
                        setSelectedLanguage(lang.value as Language)
                      }
                      className={`p-4 rounded-2xl mb-3 backdrop-blur-xl ${
                        selectedLanguage === lang.value
                          ? isDark
                            ? "bg-lime-600 border-2 border-lime-400"
                            : "bg-lime-700 border-2 border-lime-500"
                          : isDark
                            ? "bg-white/10 border border-white/20"
                            : "bg-white/60 border border-gray-200/50"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Text className="text-2xl mr-3">{lang.flag}</Text>
                          <Text
                            className={`text-lg font-semibold ${
                              selectedLanguage === lang.value
                                ? "text-white"
                                : isDark
                                  ? "text-white"
                                  : "text-gray-900"
                            }`}
                          >
                            {lang.label}
                          </Text>
                        </View>
                        {selectedLanguage === lang.value && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="white"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => setStep("personal")}
                  className={`py-4 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    {t("common.continue")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* BVN Entry Step */}
            {step === "bvn" && (
              <View className="flex-1">
                <View
                  className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
                    isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-white/60 border border-gray-200/50"
                  }`}
                >
                  <View className="items-center mb-4">
                    <View
                      className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                        isDark ? "bg-lime-500/20" : "bg-lime-100"
                      }`}
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={32}
                        color={isDark ? "#a78bfa" : "#7c3aed"}
                      />
                    </View>
                    <Text
                      className={`text-xl font-bold text-center ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Bank Verification Number
                    </Text>
                    <Text
                      className={`text-sm text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Enter your 11-digit BVN to verify your identity
                    </Text>
                  </View>

                  <TextInput
                    className={`p-4 rounded-2xl text-lg text-center backdrop-blur-xl mb-4 ${
                      isDark
                        ? "bg-white/10 border border-white/20 text-white"
                        : "bg-white/60 border border-gray-200/50 text-gray-900"
                    }`}
                    placeholder="Enter 11-digit BVN"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    value={bvn}
                    onChangeText={setBvn}
                    keyboardType="numeric"
                    maxLength={11}
                  />

                  <View
                    className={`p-3 rounded-xl ${isDark ? "bg-blue-500/10" : "bg-blue-50"}`}
                  >
                    <Text
                      className={`text-xs ${isDark ? "text-blue-300" : "text-blue-700"}`}
                    >
                      ℹ️ Your BVN is safe and will only be used for verification
                      purposes
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleBvnSubmit}
                  className={`py-4 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    Verify BVN
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Phone Verification Step */}
            {step === "phone-verify" && (
              <View className="flex-1">
                <View
                  className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
                    isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-white/60 border border-gray-200/50"
                  }`}
                >
                  <View className="items-center mb-4">
                    <View
                      className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                        isDark ? "bg-green-500/20" : "bg-green-100"
                      }`}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={32}
                        color={isDark ? "#34d399" : "#059669"}
                      />
                    </View>
                    <Text
                      className={`text-xl font-bold text-center ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Verify Phone Number
                    </Text>
                    <Text
                      className={`text-sm text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Enter the 6-digit Code sent via SMS, WhatsApp, and Email
                    </Text>
                  </View>

                  <TextInput
                    className={`p-4 rounded-2xl text-2xl text-center backdrop-blur-xl mb-4 tracking-widest ${
                      isDark
                        ? "bg-white/10 border border-white/20 text-white"
                        : "bg-white/60 border border-gray-200/50 text-gray-900"
                    }`}
                    placeholder="0 0 0 0 0 0 0 0"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    value={phoneOtp}
                    onChangeText={setPhoneOtp}
                    keyboardType="numeric"
                    maxLength={8}
                  />

                  <TouchableOpacity onPress={handleBvnSubmit}>
                    <Text
                      className={`text-center ${isDark ? "text-lime-400" : "text-lime-600"}`}
                    >
                      Resend Code
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handlePhoneVerify}
                  className={`py-4 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    Complete Registration
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PinSetupModal
        visible={showPinModal}
        onComplete={handlePinComplete}
        onCancel={handlePinCancel}
      />
    </SafeAreaView>
  );
}
