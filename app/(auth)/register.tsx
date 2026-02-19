import { useAuth } from "@/components/context/AuthProvider";
import { useLanguage } from "@/components/context/LanguageContext";
import OptimizedInput from "@/components/ui/Input/OptimizedInput";
import PinSetupModal from "@/components/ui/Modals/PinSetupModal";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { RegisterFormData, registerSchema } from "@/lib/schema/validations";
import AccountService from "@/lib/services/AccountService";
import { DeviceService } from "@/lib/services/Device";
import MerchantService from "@/lib/services/MerchantService";
import ToastService from "@/lib/services/ToastService";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type RegistrationStep =
  | "personal"
  | "merchant"
  | "bvn"
  | "phone-verify"
  | "pin";

type Language = "english" | "yoruba" | "igbo" | "hausa";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState<RegistrationStep>("personal");
  const [showPinModal, setShowPinModal] = useState(false);
  const [registrationData, setRegistrationData] =
    useState<RegisterFormData | null>(null);

  const [BVN, setBVN] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english");

  // Merchant
  const [isMerchant, setIsMerchant] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] = useState(false);

  const businessTypes = [
    "Restaurant",
    "Retail",
    "E-commerce",
    "Services",
    "Healthcare",
    "Education",
    "Entertainment",
    "Transportation",
    "Real Estate",
    "Other",
  ];

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    reValidateMode: "onChange",
  });

  const OnSubmit = async (data: RegisterFormData) => {
    setRegistrationData({
      ...data,
      isMerchant: isMerchant,
    });

    if (isMerchant) {
      setStep("merchant");
    } else {
      setStep("bvn");
    }
  };

  const HandleMerchantSubmit = () => {
    if (!businessName.trim()) {
      ToastService.warning("Business Name is required");
      return;
    }
    if (!businessAddress.trim()) {
      ToastService.warning("Business Address is required");
      return;
    }
    if (!businessType.trim()) {
      ToastService.warning("Business Type is required");
      return;
    }

    setRegistrationData((prev) => ({
      ...prev!,
      businessName: businessName,
      businessAddress: businessAddress,
      businessType: businessType,
    }));
    setStep("bvn");
  };

  const HandleBvnSubmit = async () => {
    if (BVN.length !== 11) {
      ToastService.warning("BVN Must Be 11 Digits");
      return;
    }

    const BvnValidation = await AccountService.ValidateBVN({
      bvn: BVN,
      phoneNumber: registrationData?.phoneNumber || "",
      email: registrationData?.email || "",
    });

    if (!BvnValidation.valid) {
      ToastService.error(BvnValidation.message || "Failed to Validate BVN");
      return;
    }

    ToastService.info("Verification Code Sent to your Registered Phone");
    setStep("phone-verify");
  };

  const HandlePhoneVerify = async () => {
    if (phoneOTP.length !== 8) {
      ToastService.warning("Please Enter the 8-digit Code");
      return;
    }

    const OtpValidation = await AccountService.ValidateOTP(BVN, phoneOTP);

    if (!OtpValidation.valid) {
      ToastService.error(OtpValidation.message || "Failed to Validate OTP");
      return;
    }

    ToastService.success("Phone Number Verified Successfully");
    setStep("pin");
    setShowPinModal(true);
  };

  const HandlePinComplete = async () => {
    if (!registrationData) return;

    try {
      const pushToken = await DeviceService.registerForPushNotificationsAsync();
      // Register user first
      const UserResult = await register({
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        email: registrationData.email.toLowerCase(),
        password: registrationData.password,
        phoneNumber: registrationData.phoneNumber,
        bvn: BVN,
        pushToken: pushToken ?? "",
      });

      // If merchant registration, register merchant profile
      if (registrationData.isMerchant && registrationData.businessName) {
        await MerchantService.registerMerchant({
          businessName: registrationData.businessName,
          businessAddress: registrationData.businessAddress!,
          businessType: registrationData.businessType!,
          userId: UserResult.id,
        });
      }

      ToastService.success(
        registrationData.isMerchant
          ? "Merchant Registration Successful"
          : "Registration Successful",
      );

      setShowPinModal(false);
      router.replace("/(auth)/Login");
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

  const HandlePinCancel = () => {
    setShowPinModal(false);
    setStep("phone-verify");
  };

  const RenderProgressBar = () => {
    const Steps: RegistrationStep[] = isMerchant
      ? ["personal", "merchant", "bvn", "phone-verify"]
      : ["personal", "bvn", "phone-verify"];

    const CurrentIndex = Steps.indexOf(step);

    return (
      <View className="w-full justify-center items-center mb-8">
        <View className="flex-row items-center px-2" style={{ width: "80%" }}>
          {Steps.map((s, index) => (
            <View key={s} className="flex-1 flex-row items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  index <= CurrentIndex
                    ? isDark
                      ? "bg-lime-600"
                      : "bg-lime-700"
                    : isDark
                      ? "bg-white/10"
                      : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-sm font-bold ${index <= CurrentIndex ? "text-white" : isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  {index + 1}
                </Text>
              </View>
              {index < Steps.length - 1 && (
                <View
                  className={`flex-1 h-1 mx-2 ${
                    index < CurrentIndex
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
      </View>
    );
  };

  const RenderSubtitle = (): string => {
    if (step === "personal") return "Enter your personal details";
    if (step === "merchant") return "Enter your business information";
    if (step === "bvn") return "Verify your identity";
    if (step === "phone-verify") return "Enter Phone Verification code";
    return "";
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      {/* Header */}
      <ScreenHeader
        title={t("auth.register")}
        subtitle={RenderSubtitle()}
        onBack={() => {
          if (step === "personal") router.back();
          else if (step === "merchant") setStep("personal");
          else if (step === "bvn")
            setStep(isMerchant ? "merchant" : "personal");
          else if (step === "phone-verify") setStep("bvn");
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 pt-8"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-2 pb-8 w-full">
            {RenderProgressBar()}

            {/* Personal Info Step */}
            {step === "personal" && (
              <View className="flex-1">
                {/* Merchant Registration Toggle */}
                <Pressable
                  onPress={() => setIsMerchant(!isMerchant)}
                  className={`flex-row items-center p-4 rounded-2xl mb-4 backdrop-blur-xl ${
                    isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-white/60 border border-gray-200/50"
                  }`}
                >
                  <View
                    className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                      isMerchant
                        ? isDark
                          ? "bg-lime-600 border-lime-600"
                          : "bg-lime-700 border-lime-700"
                        : isDark
                          ? "border-white/40"
                          : "border-gray-400"
                    }`}
                  >
                    {isMerchant && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Register as Merchant
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Accept payments for your business
                    </Text>
                  </View>
                </Pressable>

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
                  name="username"
                  label="Username"
                  placeholder="Choose a unique username"
                  autoCapitalize="none"
                  error={errors.username}
                />

                <OptimizedInput
                  control={control}
                  name="email"
                  label={t("auth.email")}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  showPasswordToggle
                  error={errors.password}
                />

                <OptimizedInput
                  control={control}
                  name="confirmPassword"
                  label={t("auth.confirmPassword")}
                  placeholder="Confirm your password"
                  secureTextEntry
                  showPasswordToggle
                  error={errors.confirmPassword}
                />

                <Pressable
                  onPress={handleSubmit(OnSubmit)}
                  disabled={isSubmitting}
                  className={`py-4 rounded-2xl mt-4 ${isDark ? "bg-lime-600" : "bg-lime-700"} ${
                    isSubmitting ? "opacity-50" : ""
                  }`}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    {isSubmitting ? "Processing..." : t("common.continue")}
                  </Text>
                </Pressable>

                <View className="flex-row justify-center items-center mt-6">
                  <Text
                    className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {t("auth.alreadyHaveAccount")}{" "}
                  </Text>
                  <Link href="/(auth)/Login" asChild>
                    <Pressable>
                      <Text
                        className={`text-base font-semibold ${isDark ? "text-lime-400" : "text-lime-600"}`}
                      >
                        {t("auth.login")}
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            )}

            {/* Merchant Info Step */}
            {step === "merchant" && (
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
                        name="business"
                        size={32}
                        color={isDark ? "#ffffff" : "#000000"}
                      />
                    </View>
                    <Text
                      className={`text-xl font-bold text-center ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Business Information
                    </Text>
                    <Text
                      className={`text-sm text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Tell us about your business to start accepting payments
                    </Text>
                  </View>

                  <TextInput
                    className={`p-4 rounded-2xl text-base backdrop-blur-xl mb-4 ${
                      isDark
                        ? "bg-white/10 border border-white/20 text-white"
                        : "bg-white/60 border border-gray-200/50 text-gray-900"
                    }`}
                    placeholder="Business Name"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    value={businessName}
                    onChangeText={setBusinessName}
                  />

                  <TextInput
                    className={`p-4 rounded-2xl text-base backdrop-blur-xl mb-4 ${
                      isDark
                        ? "bg-white/10 border border-white/20 text-white"
                        : "bg-white/60 border border-gray-200/50 text-gray-900"
                    }`}
                    placeholder="Business Address"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    value={businessAddress}
                    onChangeText={setBusinessAddress}
                    multiline
                  />

                  <View className="mb-4">
                    <Pressable
                      onPress={() => setShowBusinessTypeDropdown(!showBusinessTypeDropdown)}
                      className={`p-4 rounded-2xl backdrop-blur-xl flex-row justify-between items-center ${
                        isDark
                          ? "bg-white/10 border border-white/20"
                          : "bg-white/60 border border-gray-200/50"
                      }`}
                    >
                      <Text
                        className={`text-base ${
                          businessType
                            ? isDark
                              ? "text-white"
                              : "text-gray-900"
                            : isDark
                              ? "text-gray-400"
                              : "text-gray-500"
                        }`}
                      >
                        {businessType || "Select Business Type"}
                      </Text>
                      <Ionicons
                        name={showBusinessTypeDropdown ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                    </Pressable>

                    {showBusinessTypeDropdown && (
                      <View
                        className={`mt-2 rounded-2xl backdrop-blur-xl overflow-hidden ${
                          isDark
                            ? "bg-white/10 border border-white/20"
                            : "bg-white/60 border border-gray-200/50"
                        }`}
                      >
                        {businessTypes.map((type, index) => (
                          <Pressable
                            key={type}
                            onPress={() => {
                              setBusinessType(type);
                              setShowBusinessTypeDropdown(false);
                            }}
                            className={`p-4 flex-row justify-between items-center ${
                              index !== businessTypes.length - 1
                                ? isDark
                                  ? "border-b border-white/10"
                                  : "border-b border-gray-200"
                                : ""
                            }`}
                          >
                            <Text
                              className={`text-base ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {type}
                            </Text>
                            {businessType === type && (
                              <Ionicons
                                name="checkmark"
                                size={20}
                                color={isDark ? "#84cc16" : "#65a30d"}
                              />
                            )}
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={HandleMerchantSubmit}
                  className={`py-4 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    Continue to Verification
                  </Text>
                </Pressable>
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
                        color={isDark ? "#ffffff" : "#000000"}
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
                    value={BVN}
                    onChangeText={setBVN}
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

                <Pressable
                  onPress={HandleBvnSubmit}
                  className={`py-4 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    Verify BVN
                  </Text>
                </Pressable>
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
                    value={phoneOTP}
                    onChangeText={setPhoneOTP}
                    keyboardType="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                  />

                  <Pressable onPress={HandleBvnSubmit}>
                    <Text
                      className={`text-center ${isDark ? "text-lime-400" : "text-lime-600"}`}
                    >
                      Resend Code
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={HandlePhoneVerify}
                  className={`py-4 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                >
                  <Text className="text-white text-lg font-semibold text-center">
                    Complete Registration
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PinSetupModal
        visible={showPinModal}
        onComplete={HandlePinComplete}
        onCancel={HandlePinCancel}
      />
    </SafeAreaView>
  );
}
