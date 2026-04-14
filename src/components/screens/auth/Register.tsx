import { useAuth } from "@/src/components/context/AuthSessionProvider";
import { useLanguage } from "@/src/components/context/LanguageContext";
import OptimizedInput from "@/src/components/ui/Input/OptimizedInput";
import PinSetupModal from "@/src/components/ui/Modals/PinSetupModal";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { VerificationResult } from "@/src/hooks/useLiveness";
import { RegisterFormData, registerSchema } from "@/src/lib/schema/validations";
import AccountService from "@/src/lib/services/AccountService";
import MerchantService from "@/src/lib/services/MerchantService";
import ToastService from "@/src/lib/services/ToastService";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import {
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Pressable, Text, TextInput, View, useColorScheme } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import LivenessVerificationScreen from "./LivenessVerificationScreen";

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState<UserRegistrationStep>("personal");
  const [showPinModal, setShowPinModal] = useState(false);
  const [registrationData, setRegistrationData] =
    useState<RegisterFormData | null>(null);
  const [livenessResult, setLivenessResult] =
    useState<VerificationResult | null>(null);

  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(60);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setOtpCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (step === "phone-verify") startCooldown();
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [step]);

  // Merchant
  const [isMerchant, setIsMerchant] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [showBusinessTypeDropdown, setShowBusinessTypeDropdown] =
    useState(false);

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
      setStep("liveness");
    }
  };

  const HandleMerchantSubmit = () => {
    if (!businessName.trim()) {
      ToastService.warning(t("auth.businessNameRequired"));
      return;
    }
    if (!businessAddress.trim()) {
      ToastService.warning(t("auth.businessAddressRequired"));
      return;
    }
    if (!businessType.trim()) {
      ToastService.warning(t("auth.businessTypeRequired"));
      return;
    }

    setRegistrationData((prev) => ({
      ...prev!,
      businessName: businessName,
      businessAddress: businessAddress,
      businessType: businessType,
    }));
    setStep("liveness");
  };

  const HandlePhoneVerify = async () => {
    if (phoneOTP.length !== 8) {
      ToastService.warning(t("auth.invalidOtp"));
      return;
    }

    const OtpValidation = await AccountService.ValidateUserPhoneNumberOTP(
      "Registration",
      phoneOTP,
    );

    if (!OtpValidation.success) {
      ToastService.error(
        OtpValidation.message || t("auth.otpValidationFailed"),
      );
      return;
    }

    ToastService.success(t("auth.phoneVerifiedSuccess"));
    setStep("liveness");
  };

  const HandleLivenessSuccess = (result: VerificationResult) => {
    if (__DEV__) console.log(result);
    setLivenessResult(result);
    setStep("pin");
    setShowPinModal(true);
  };

  const HandleLivenessFailure = (error: string) => {
    ToastService.error(error || "Liveness check failed. Please try again.");
  };

  const HandlePinComplete = async () => {
    if (!registrationData) return;

    try {
      // Register user first
      const userId = await register({
        firstName: registrationData.firstName,
        lastName: registrationData.lastName,
        userName: registrationData.username,
        email: registrationData.email.toLowerCase(),
        password: registrationData.password,
        phoneNumber: registrationData.phoneNumber,
        bvn: registrationData.BVN,
        identityToken: livenessResult?.identityToken ?? "",
      });

      // If merchant registration, register merchant profile
      if (registrationData.isMerchant && registrationData.businessName) {
        await MerchantService.registerMerchant({
          businessName: registrationData.businessName,
          businessAddress: registrationData.businessAddress!,
          businessType: registrationData.businessType!,
          userId: userId,
        });
      }

      ToastService.success(
        registrationData.isMerchant
          ? t("auth.merchantRegistrationSuccess")
          : t("auth.registrationSuccess"),
      );

      setShowPinModal(false);
      router.replace("/auth/login");
    } catch (error) {
      setShowPinModal(false);
      setStep("personal");
      ToastService.error(
        error instanceof Error ? error.message : t("auth.registrationFailed"),
      );
    }
  };

  const HandlePinCancel = () => {
    setShowPinModal(false);
    setStep("phone-verify");
  };

  const RenderProgressBar = () => {
    const Steps: UserRegistrationStep[] = isMerchant
      ? ["personal", "merchant", "phone-verify", "liveness", "pin"]
      : ["personal", "phone-verify", "liveness", "pin"];

    const CurrentIndex = Steps.indexOf(step);

    return (
      <View className="justify-center items-center my-3">
        <View
          className="flex-row items-center justify-center"
          style={{ width: "100%" }}
        >
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
    if (step === "personal") return t("auth.enterPersonalDetails");
    if (step === "merchant") return t("auth.enterBusinessInfo");
    if (step === "phone-verify") return t("auth.enterPhoneCode");
    if (step === "liveness") return t("auth.followPrompts");
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
          else if (step === "phone-verify")
            setStep(isMerchant ? "merchant" : "personal");
          else if (step === "liveness") setStep("phone-verify");
        }}
      />

      <View className="w-full flex-row items-center justify-center">
        {RenderProgressBar()}
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        className="flex-1"
      >
        <View className="flex-1 px-6 pb-8 w-full">
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
                  {isMerchant && <Check size={16} color="white" />}
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {t("auth.registerAsMerchant")}
                  </Text>
                  <Text
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {t("auth.registerAsMerchantSubtitle")}
                  </Text>
                </View>
              </Pressable>

              <OptimizedInput
                control={control}
                name="firstName"
                label={t("auth.firstName")}
                placeholder={t("auth.firstName")}
                error={errors.firstName}
              />

              <OptimizedInput
                control={control}
                name="lastName"
                label={t("auth.lastName")}
                placeholder={t("auth.lastName")}
                error={errors.lastName}
              />

              <OptimizedInput
                control={control}
                name="username"
                label={t("auth.username")}
                placeholder={t("auth.username")}
                autoCapitalize="none"
                error={errors.username}
              />

              <OptimizedInput
                control={control}
                name="email"
                label={t("auth.email")}
                placeholder={t("auth.email")}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <OptimizedInput
                control={control}
                name="phoneNumber"
                label={t("auth.phoneNumber")}
                placeholder={t("auth.phoneNumber")}
                keyboardType="phone-pad"
                error={errors.phoneNumber}
              />

              <OptimizedInput
                control={control}
                name="BVN"
                label={t("auth.bvn")}
                placeholder={t("auth.bvnPlaceholder")}
                keyboardType="numeric"
                error={errors.BVN}
                labelRight={
                  <ShieldCheck
                    size={21}
                    color={isDark ? "#ffffff" : "#000000"}
                  />
                }
                maxLength={11}
                // editable={isSubmitting}
              />

              <OptimizedInput
                control={control}
                name="password"
                label={t("auth.password")}
                placeholder={t("auth.password")}
                secureTextEntry
                showPasswordToggle
                error={errors.password}
              />

              <OptimizedInput
                control={control}
                name="confirmPassword"
                label={t("auth.confirmPassword")}
                placeholder={t("auth.confirmPassword")}
                secureTextEntry
                showPasswordToggle
                error={errors.confirmPassword}
              />

              <Pressable
                onPress={handleSubmit(OnSubmit)}
                disabled={isSubmitting}
                className={`bg-lime-400 rounded-2xl py-4 shadow-lg my-2 ${
                  isSubmitting ? "opacity-50" : ""
                }`}
              >
                <Text className="text-black text-lg font-bold text-center">
                  {isSubmitting ? t("common.processing") : t("common.continue")}
                </Text>
              </Pressable>

              <View className="flex-row justify-center items-center mt-6">
                <Text
                  className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {t("auth.alreadyHaveAccount")}{" "}
                </Text>
                <Link href="/auth/login" asChild>
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
                    <Building2
                      size={32}
                      color={isDark ? "#ffffff" : "#000000"}
                    />
                  </View>
                  <Text
                    className={`text-xl font-brand text-center ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {t("auth.businessInformation")}
                  </Text>
                  <Text
                    className={`text-sm text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {t("auth.businessInformationSubtitle")}
                  </Text>
                </View>

                <TextInput
                  className={`p-4 rounded-2xl text-base backdrop-blur-xl mb-4 ${
                    isDark
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-white/60 border border-gray-200/50 text-gray-900"
                  }`}
                  placeholder={t("auth.businessName")}
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
                  placeholder={t("auth.businessAddress")}
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  value={businessAddress}
                  onChangeText={setBusinessAddress}
                  multiline
                />

                <View className="mb-4">
                  <Pressable
                    onPress={() =>
                      setShowBusinessTypeDropdown(!showBusinessTypeDropdown)
                    }
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
                      {businessType || t("auth.selectBusinessType")}
                    </Text>
                    {showBusinessTypeDropdown ? (
                      <ChevronUp
                        size={20}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                    ) : (
                      <ChevronDown
                        size={20}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                    )}
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
                            index === businessTypes.length - 1
                              ? ""
                              : isDark
                                ? "border-b border-white/10"
                                : "border-b border-gray-200"
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
                            <Check
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
                  {t("auth.continueToVerification")}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Liveness Step */}
          {step === "liveness" && (
            <LivenessVerificationScreen
              userId={registrationData?.email ?? ""}
              bvn={registrationData?.BVN ?? ""}
              onSuccess={HandleLivenessSuccess}
              onFailure={HandleLivenessFailure}
            />
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
                    <CheckCircle
                      size={32}
                      color={isDark ? "#34d399" : "#059669"}
                    />
                  </View>
                  <Text
                    className={`text-xl font-brand text-center ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {t("auth.verifyPhoneNumber")}
                  </Text>
                  <Text
                    className={`text-sm text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {t("auth.verifyPhoneSubtitle")}
                  </Text>
                </View>

                {/* <OTPInput
                  length={6}
                  onComplete={(verificationCode) =>
                    setPhoneOTP(verificationCode)
                  }
                /> */}

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

                <Pressable
                  disabled={otpCooldown > 0}
                  onPress={() => {
                    try {
                      AccountService.SendUserOTP(
                        "Registration",
                        registrationData?.phoneNumber ?? "",
                      );
                      ToastService.info(t("auth.otpResent"));
                      startCooldown();
                    } catch (error) {
                      ToastService.error(
                        error instanceof Error
                          ? error.message
                          : t("auth.resendFailed"),
                      );
                    }
                  }}
                >
                  <Text
                    className={`text-center ${
                      otpCooldown > 0
                        ? isDark
                          ? "text-slate-500"
                          : "text-slate-400"
                        : isDark
                          ? "text-lime-400"
                          : "text-lime-600"
                    }`}
                  >
                    {otpCooldown > 0
                      ? `Resend Code in ${otpCooldown}s`
                      : t("auth.resendCode")}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={HandlePhoneVerify}
                className={`py-4 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
              >
                <Text className="text-white text-lg font-semibold text-center">
                  {t("auth.completeRegistration")}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      <PinSetupModal
        visible={showPinModal}
        onComplete={HandlePinComplete}
        onCancel={HandlePinCancel}
      />
    </SafeAreaView>
  );
}
