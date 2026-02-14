import { useAuth } from "@/components/context/AuthProvider";
import { useLanguage } from "@/components/context/LanguageContext";
import OptimizedInput from "@/components/ui/Input/OptimizedInput";
import SelectLanguageModal from "@/components/ui/Modals/SelectLanguageModal";
import { languageNames } from "@/i18n";
import { LoginFormData, loginSchema } from "@/lib/schema/validations";
import ToastService from "@/lib/services/ToastService";
import { biometricService } from "@/lib/utils/SecureStorage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LocalAuthentication from "expo-local-authentication";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { login, biometricLogin, nativeAuthLogin, hasBiometricCredentials } =
    useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [isBiometricSupported, setIsBiometricSupported] =
    useState<boolean>(false);
  const [biometricType, setBiometricType] = useState("");
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Check if device supports biometric authentication
  useEffect(() => {
    (async () => {
      const compatible = await biometricService.isBiometricAvailable();
      setIsBiometricSupported(compatible);

      if (compatible) {
        const biometricTypes =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        // Check if device supports fingerprint or facial recognition
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
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.identifier, data.password);
    } catch (error) {
      ToastService.error(
        error instanceof Error ? error.message : "An error occurred",
      );
    }
  };

  const onFingerPrintPress = async () => {
    try {
      if (!isBiometricSupported) {
        ToastService.error(
          "Biometric Authentication is not available on this device",
        );
        return;
      }

      if (!hasBiometricCredentials) {
        ToastService.error("No Saved Credentials Found. Please log in first.");
        return;
      }

      await biometricLogin();
    } catch (error) {
      ToastService.error(
        error instanceof Error
          ? error.message
          : "Unable to authenticate with biometrics",
      );
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
            <View className="flex-1 px-6 py-5">
              {/* Header */}
              <View className="flex-row items-center my-6">
                <Text className="text-3xl font-bold text-white">
                  {t("auth.welcomeBack")}
                </Text>

                {/* Language Button */}
                <SelectLanguageModal />
              </View>

              {/* Form Card */}
              <View className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-6 mb-4">
                <Text className="text-2xl font-bold text-white mb-6 text-center">
                  {t("auth.login")}
                </Text>

                <OptimizedInput
                  control={control}
                  name="identifier"
                  label="Phone / Email / Username"
                  placeholder="Enter Phone, Email, or Username"
                  keyboardType="default"
                  autoCapitalize="none"
                  error={errors.identifier}
                />

                <OptimizedInput
                  control={control}
                  name="password"
                  label={t("auth.password")}
                  placeholder="Enter your Password"
                  secureTextEntry
                  showPasswordToggle
                  error={errors.password}
                />

                <Link href="/(auth)/ForgotPassword" asChild>
                  <Pressable className="self-end mb-8">
                    <Text className="text-white/90 text-base font-medium">
                      {t("auth.forgotPassword")}
                    </Text>
                  </Pressable>
                </Link>

                {/* Login Buttons */}
                <View className="space-y-4 flex-row justify-center gap-3">
                  <Pressable
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className={`w-64 bg-indigo-700 rounded-2xl py-4 shadow-lg ${
                      isSubmitting ? "opacity-50" : ""
                    }`}
                  >
                    <Text className="text-white text-lg font-bold text-center">
                      {isSubmitting ? "Signing In..." : t("auth.login")}
                    </Text>
                  </Pressable>

                  {isBiometricSupported &&
                    hasBiometricCredentials &&
                    nativeAuthLogin && (
                      <Pressable
                        onPress={onFingerPrintPress}
                        className="w-16 bg-white/20 backdrop-blur border border-white/30 rounded-2xl px-2 py-4 flex-row items-center justify-center shadow-lg"
                      >
                        <MaterialCommunityIcons
                          name={
                            biometricType === "facial"
                              ? "face-recognition"
                              : biometricType === "fingerprint"
                                ? "fingerprint"
                                : "passport-biometric"
                          }
                          size={24}
                          color="white"
                        />
                      </Pressable>
                    )}
                </View>
              </View>

              {/* Sign Up Link */}
              <View className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 mb-4">
                <View className="flex-row justify-center items-center">
                  <Text className="text-white/80 text-lg">
                    {t("auth.dontHaveAccount")}{" "}
                  </Text>
                  <Link href="/(auth)/Register" asChild>
                    <TouchableOpacity>
                      <Text className="text-blue-300 text-lg font-bold">
                        {t("auth.signUp")}
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>

              {/* Quick Links */}
              <View className="mb-8">
                <Text
                  className={`text-xl font-bold mb-3 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {t("home.quickLinks")}
                </Text>
                <View className="flex-row justify-between gap-2 mb-6">
                  <Pressable
                    className={`flex-1 py-3 rounded-2xl items-center backdrop-blur-xl ${
                      isDark
                        ? "bg-white/10 border border-white/20"
                        : "bg-gray-50 border border-gray-200 shadow-sm"
                    }`}
                    onPress={() =>
                      router.push("/(transaction)/VoiceTransactionBanking")
                    }
                    style={{
                      shadowColor: isDark ? "#fff" : "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                    }}
                  >
                    <Ionicons
                      name="mic-outline"
                      size={32}
                      color={isDark ? "#84cc16" : "#65a30d"}
                    />
                    <Text
                      className={`text-sm mt-3 font-semibold text-center ${
                        isDark ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {t("payments.voice")}
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 py-3 rounded-2xl items-center backdrop-blur-xl ${
                      isDark
                        ? "bg-white/10 border border-white/20"
                        : "bg-gray-50 border border-gray-200 shadow-sm"
                    }`}
                    onPress={() => router.push("/(transaction)/USSDPay")}
                    style={{
                      shadowColor: isDark ? "#fff" : "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                    }}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={32}
                      color={isDark ? "#fb923c" : "#ea580c"}
                    />
                    <Text
                      className={`text-sm mt-3 font-semibold text-center ${
                        isDark ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      {t("payments.ussd")}
                    </Text>
                  </Pressable>
                  <Pressable
                    className={`flex-1 py-3 rounded-2xl items-center backdrop-blur-xl ${
                      isDark
                        ? "bg-white/10 border border-white/20"
                        : "bg-gray-50 border border-gray-200 shadow-sm"
                    }`}
                    onPress={() => {}}
                    style={{
                      shadowColor: isDark ? "#fff" : "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                    }}
                  >
                    <Ionicons
                      name="wallet-outline"
                      size={32}
                      color={isDark ? "#34d399" : "#059669"}
                    />
                    <Text
                      className={`text-sm mt-3 font-semibold text-center ${
                        isDark ? "text-gray-200" : "text-gray-700"
                      }`}
                    >
                      Quick Pay
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Language Selection Modal */}
        <Modal
          visible={showLanguageModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View className="flex-1 justify-end bg-black/80">
            <View className="rounded-t-3xl p-6 bg-[#1a1a2e] border-t border-white/20">
              <View className="items-center mb-6">
                <View className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-lime-500/20">
                  <Ionicons
                    name="language"
                    size={32}
                    color={isDark ? "#ffffff" : "#7c3aed"}
                  />
                </View>
                <Text className="text-xl font-bold text-white">
                  Select Language
                </Text>
              </View>

              {Object.entries(languageNames).map(([key, { label, flag }]) => (
                <TouchableOpacity
                  key={key}
                  onPress={async () => {
                    await setLanguage(key as any);
                    setShowLanguageModal(false);
                  }}
                  className={`p-4 rounded-2xl mb-3 backdrop-blur-xl ${
                    language === key
                      ? "bg-lime-600 border-2 border-lime-400"
                      : "bg-white/10 border border-white/20"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Text className="text-2xl mr-3">{flag}</Text>
                      <Text
                        className={`text-lg font-semibold ${
                          language === key ? "text-white" : "text-white"
                        }`}
                      >
                        {label}
                      </Text>
                    </View>
                    {language === key && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="white"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                className="py-4 rounded-2xl mt-2 bg-white/10 border border-white/20"
              >
                <Text className="text-center font-bold text-white">
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}
