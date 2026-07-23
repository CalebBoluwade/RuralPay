import { useAuth } from "@/src/components/context/AuthSessionProvider";
import { useLanguage } from "@/src/components/context/LanguageContext";
import InfoChip from "@/src/components/ui/InfoChip";
import OptimizedInput from "@/src/components/ui/Input/OptimizedInput";
import PinSetupModal from "@/src/components/ui/Modals/PinSetupModal";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { VerificationResult } from "@/src/hooks/useLiveness";
import { RegisterFormData, registerSchema } from "@/src/lib/schema/validations";
import { authService } from "@/src/lib/services/AuthService";
import MerchantService from "@/src/lib/services/MerchantService";
import PaymentService from "@/src/lib/services/PaymentService";
import ToastService from "@/src/lib/services/ToastService";
import BanksModal from "@/src/components/ui/Modals/BanksModal";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import {
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
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
    if (step !== "phone-verify") return;
    authService
      .SendUserRegistrationOTP(
        registrationData?.phoneNumber ?? "",
        registrationData?.email ?? "",
      )
      .catch(() => {
        ToastService.error(t("auth.resendFailed"));
      });
    const timer = setTimeout(() => startCooldown(), 0);
    return () => {
      clearTimeout(timer);
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
  const [taxId, setTaxId] = useState("");
  const [merchantAccountNumber, setMerchantAccountNumber] = useState("");
  const [merchantBankCode, setMerchantBankCode] = useState("");
  const [merchantBankName, setMerchantBankName] = useState("");
  const [showBankModal, setShowBankModal] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  const [banksError, setBanksError] = useState(false);

  const fetchBanks = async () => {
    setBanksError(false);
    setBanksLoading(true);
    try {
      const result = await PaymentService.GetBanks();
      if (Array.isArray(result) && result.length > 0) setBanks(result);
      else setBanksError(true);
    } catch {
      setBanksError(true);
    } finally {
      setBanksLoading(false);
    }
  };

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
    mode: "all",
  });

  const [showLivenessGate, setShowLivenessGate] = useState(false);

  // New order: personal → phone-verify → merchant (if applicable) → liveness → pin
  const OnSubmit = async (data: RegisterFormData) => {
    setRegistrationData({
      ...data,
      isMerchant: isMerchant,
    });
    setStep("phone-verify");
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
      taxId: taxId.trim() || undefined,
      merchantBusinessAccountNumber: merchantAccountNumber.trim() || undefined,
      merchantAccountBankCode: merchantBankCode || undefined,
    }));
    setShowLivenessGate(true);
  };

  const HandlePhoneVerify = async () => {
    if (phoneOTP.length !== 6) {
      ToastService.warning(t("auth.invalidOtp"));
      return;
    }

    const OtpValidation = await authService.ValidateUserRegistrationOTP(
      phoneOTP,
      registrationData?.phoneNumber ?? "",
    );

    if (!OtpValidation.success) {
      ToastService.error(
        OtpValidation.message || t("auth.otpValidationFailed"),
      );
      return;
    }

    ToastService.success(t("auth.phoneVerifiedSuccess"));
    if (isMerchant) {
      setStep("merchant");
    } else {
      setShowLivenessGate(true);
    }
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
        const merchantResult = await MerchantService.registerMerchant({
          businessName: registrationData.businessName,
          businessAddress: registrationData.businessAddress!,
          businessType: registrationData.businessType!,
          userId: userId,
          taxId: registrationData.taxId,
          merchantBusinessAccountNumber: registrationData.merchantBusinessAccountNumber,
          merchantAccountBankCode: registrationData.merchantAccountBankCode,
        });

        if (!merchantResult.success) {
          Alert.alert(
            "Merchant Registration Failed",
            "An Error Occurred During Merchant Registration. Reach out via our Support Channels",
          );
        }
      }

      ToastService.success(
        registrationData.isMerchant
          ? t("auth.merchantRegistrationSuccess")
          : t("auth.registrationSuccess"),
      );

      setShowPinModal(false);
      router.replace("/auth/login");
    } catch {
      setShowPinModal(false);
      setStep("personal");
    }
  };

  const HandlePinCancel = () => {
    setShowPinModal(false);
    setStep("liveness");
  };

  const STEP_LABELS: Record<UserRegistrationStep, string> = {
    personal: t("auth.progressStepPersonal"),
    "phone-verify": t("auth.progressStepPhone"),
    merchant: t("auth.progressStepMerchant"),
    liveness: t("auth.progressStepLiveness"),
    pin: t("auth.progressStepPin"),
    success: t("auth.progressStepSuccess"),
  };

  const RenderProgressBar = () => {
    const Steps: UserRegistrationStep[] = isMerchant
      ? ["personal", "phone-verify", "merchant", "liveness", "pin"]
      : ["personal", "phone-verify", "liveness", "pin"];

    const CurrentIndex = Steps.indexOf(step);

    return (
      <View
        className="flex-row items-center px-4 py-3"
        style={{ width: "100%" }}
      >
        {Steps.map((s, index) => (
          <React.Fragment key={s}>
            <View className="flex-row items-center gap-1.5">
              <View
                className={`w-7 h-7 rounded-full items-center justify-center ${
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
                  className={`text-xs font-bold ${
                    index <= CurrentIndex
                      ? "text-white"
                      : isDark
                        ? "text-gray-500"
                        : "text-gray-400"
                  }`}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={{ fontSize: 11 }}
                className={`${
                  index === CurrentIndex
                    ? isDark
                      ? "text-lime-400 font-bold"
                      : "text-lime-700 font-bold"
                    : isDark
                      ? "text-gray-500"
                      : "text-gray-400"
                }`}
              >
                {STEP_LABELS[s]}
              </Text>
            </View>
            {index < Steps.length - 1 && (
              <View
                className={`flex-1 h-0.5 mx-1 ${
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
          </React.Fragment>
        ))}
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
          else if (step === "phone-verify") setStep("personal");
          else if (step === "merchant") setStep("phone-verify");
          else if (step === "liveness")
            setStep(isMerchant ? "merchant" : "phone-verify");
          else if (step === "pin") {
            setShowPinModal(false);
            setStep("liveness");
          }
        }}
      />

      {RenderProgressBar()}

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
              {/* Step context banner */}
              <View
                className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl mb-4 ${
                  isDark
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : "bg-blue-50 border border-blue-100"
                }`}
              >
                <Text style={{ fontSize: 20 }}>👤</Text>
                <Text
                  className={`flex-1 text-lg ${isDark ? "text-blue-300" : "text-blue-700"}`}
                >
                  {t("auth.stepPersonalHint")}
                </Text>
              </View>

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

              {/* BVN field + explainer */}
              <OptimizedInput
                control={control}
                name="BVN"
                label={t("auth.bvn")}
                placeholder={t("auth.bvnPlaceholder")}
                keyboardType="numeric"
                error={errors.BVN}
                labelRight={
                  <InfoChip
                    label="What is BVN?"
                    explanation={t("auth.bvnHelp")}
                  />
                }
                maxLength={11}
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

              {/* Merchant toggle — moved to bottom so it doesn't confuse regular users */}
              <Pressable
                onPress={() => setIsMerchant(!isMerchant)}
                className={`flex-row items-center p-4 rounded-2xl my-2 ${
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
                    className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {t("auth.registerAsMerchantSubtitle")}
                  </Text>
                </View>
              </Pressable>

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
              {/* Step context banner */}
              <View
                className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl mb-4 ${
                  isDark
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : "bg-blue-50 border border-blue-100"
                }`}
              >
                <Text style={{ fontSize: 20 }}>🏪</Text>
                <Text
                  className={`flex-1 text-base ${isDark ? "text-blue-300" : "text-blue-700"}`}
                >
                  {t("auth.stepMerchantHint")}
                </Text>
              </View>

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
                    className={`text-base text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
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

              {/* Tax ID, Account Number, Bank */}
              <TextInput
                className={`p-4 rounded-2xl text-base backdrop-blur-xl mb-4 ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white"
                    : "bg-white/60 border border-gray-200/50 text-gray-900"
                }`}
                placeholder="Tax ID (optional)"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={taxId}
                onChangeText={setTaxId}
              />

              <TextInput
                className={`p-4 rounded-2xl text-base backdrop-blur-xl mb-4 ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white"
                    : "bg-white/60 border border-gray-200/50 text-gray-900"
                }`}
                placeholder="Business Account Number (optional)"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={merchantAccountNumber}
                onChangeText={setMerchantAccountNumber}
                keyboardType="numeric"
                maxLength={10}
              />

              <Pressable
                onPress={() => {
                  if (banks.length === 0) fetchBanks();
                  setShowBankModal(true);
                }}
                className={`p-4 rounded-2xl flex-row justify-between items-center mb-4 ${
                  isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/60 border border-gray-200/50"
                }`}
              >
                <Text
                  className={`text-base ${
                    merchantBankName
                      ? isDark ? "text-white" : "text-gray-900"
                      : isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {merchantBankName || "Select Business Bank (optional)"}
                </Text>
                <ChevronDown size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
              </Pressable>

              <Pressable
                onPress={HandleMerchantSubmit}
                className={`py-4 rounded-2xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
              >
                <Text className="text-white text-lg font-semibold text-center">
                  {t("auth.continueToVerification")}
                </Text>
              </Pressable>

              {/* Escape hatch for users who toggled merchant by mistake */}
              <Pressable
                onPress={() => {
                  setIsMerchant(false);
                  setStep("phone-verify");
                }}
                className="py-3 items-center"
              >
                <Text
                  className={`text-base ${isDark ? "text-slate-500" : "text-slate-400"}`}
                >
                  {t("auth.notAMerchant")}
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
              {/* Step context banner */}
              <View
                className={`flex-row items-center gap-3 px-4 py-3 rounded-2xl mb-4 ${
                  isDark
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : "bg-blue-50 border border-blue-100"
                }`}
              >
                <Text style={{ fontSize: 20 }}>📱</Text>
                <Text
                  className={`flex-1 text-base ${isDark ? "text-blue-300" : "text-blue-700"}`}
                >
                  {t("auth.stepPhoneHint")}
                </Text>
              </View>

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
                    className={`text-base text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
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
                  placeholder="0  0  0  0  0  0"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  value={phoneOTP}
                  onChangeText={setPhoneOTP}
                  keyboardType="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                />

                <Pressable
                  disabled={otpCooldown > 0}
                  onPress={() => {
                    try {
                      authService.SendUserRegistrationOTP(
                        registrationData?.phoneNumber ?? "",
                        registrationData?.email ?? "",
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

      {/* Liveness pre-warning gate — shown as a modal before the camera opens */}
      <BanksModal
        banks={banks}
        visible={showBankModal}
        onClose={() => setShowBankModal(false)}
        onBankSelected={(bank) => {
          setMerchantBankCode(bank.bankCode);
          setMerchantBankName(bank.name);
          setShowBankModal(false);
        }}
        loading={banksLoading}
        fetchError={banksError}
        onRetry={fetchBanks}
      />

      {/* Liveness pre-warning gate — shown as a modal before the camera opens */}
      <Modal
        visible={showLivenessGate}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLivenessGate(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View
            className={`rounded-t-3xl p-6 gap-4 ${
              isDark ? "bg-slate-900" : "bg-white"
            }`}
          >
            <View className="items-center gap-2">
              <Text style={{ fontSize: 52 }}>🤳</Text>
              <Text
                className={`text-xl font-bold text-center ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {t("auth.livenessTitle")}
              </Text>
              <Text
                className={`text-base text-center leading-relaxed ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {t("auth.livenessWhyHint")}
              </Text>
            </View>

            {[
              { emoji: "👁️", text: t("auth.livenessStep1") },
              { emoji: "🔄", text: t("auth.livenessStep2") },
              { emoji: "✅", text: t("auth.livenessStep3") },
            ].map(({ emoji, text }) => (
              <View key={text} className="flex-row items-center gap-3">
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
                <Text
                  className={`flex-1 text-base ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {text}
                </Text>
              </View>
            ))}

            <View
              className={`flex-row items-center gap-2 px-3 py-2 rounded-xl ${
                isDark
                  ? "bg-blue-500/10 border border-blue-500/20"
                  : "bg-blue-50 border border-blue-100"
              }`}
            >
              <Text style={{ fontSize: 14 }}>🔒</Text>
              <Text
                className={`flex-1 text-base font-brand ${
                  isDark ? "text-blue-300" : "text-blue-700"
                }`}
              >
                {t("auth.livenessPrivacyNote")}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setShowLivenessGate(false);
                setStep("liveness");
              }}
              className="rounded-2xl py-4 bg-lime-400"
            >
              <Text className="text-black text-lg font-bold text-center">
                {t("auth.livenessReady")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowLivenessGate(false)}
              className="py-2 items-center"
            >
              <Text
                className={`text-base ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                {t("common.cancel")}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
