import CBNLogo from "@/assets/images/CBN.svg";
import CreditCard from "@/assets/images/CreditCard.svg";
import { useAuth } from "@/src/components/context/AuthSessionProvider";
import { useLanguage } from "@/src/components/context/LanguageContext";
import OptimizedInput from "@/src/components/ui/Input/OptimizedInput";
import Loading from "@/src/components/ui/Modals/Loading";
import SelectLanguageModal from "@/src/components/ui/Modals/SelectLanguageModal";
import { LoginFormData, loginSchema } from "@/src/lib/schema/validations";
import ToastService from "@/src/lib/services/ToastService";
import { biometricService } from "@/src/lib/utils/SecureStorage";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LocalAuthentication from "expo-local-authentication";
import { Link, router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  CheckSquare,
  Fingerprint,
  ScanFace,
  ScanLine,
  Square,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen({
  appVersion = "1.0.0",
}: Readonly<{ appVersion?: string }>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width } = useWindowDimensions();

  const {
    login,
    biometricLogin,
    hasBiometricCredentials,
    hasRequiredConsents,
    isLoading,
  } = useAuth();
  const { t } = useLanguage();
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricType, setBiometricType] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasRequiredConsents) {
      router.push("/privacy-policy");
    }
  }, [isLoading, hasRequiredConsents]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  useEffect(() => {
    (async () => {
      const compatible = await biometricService.isBiometricAvailable();
      setIsBiometricSupported(compatible);

      if (compatible) {
        const types =
          await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
          )
        ) {
          setBiometricType("facial");
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricType("fingerprint");
        } else {
          setBiometricType("biometric");
        }
      }

      const savedIdentifier = await SecureStore.getItemAsync(
        "remembered_identifier",
      );
      if (savedIdentifier) {
        setValue("identifier", savedIdentifier);
        setRememberMe(true);
      }
    })();
  }, []);

  const onSubmit = async (data: LoginFormData) => {
    try {
      if (rememberMe) {
        await SecureStore.setItemAsync(
          "remembered_identifier",
          data.identifier,
        );
      } else {
        await SecureStore.deleteItemAsync("remembered_identifier");
      }
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
        ToastService.error("No Saved Credentials Found. Log in First.");
        return;
      }

      await biometricLogin();
    } catch (error) {
      ToastService.error(
        error instanceof Error
          ? error.message
          : "Unable to Authenticate With Biometrics",
      );
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <Loading
        loading={isSubmitting}
        isInitialLoad={isLoading}
        accentColor={isDark ? "#a3e635" : "#65a30d"}
        isDark={isDark}
        screenName="Login"
      />

      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-between px-6 pt-2 pb-1">
            {/* Header with Language Selector */}
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"} mb-1`}
                >
                  {t("auth.welcomeBack")}
                </Text>
                <Text
                  className={`text-3xl font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {t("auth.login")}
                </Text>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => router.push("/quick-links")}
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isDark
                      ? "bg-white/10 border border-white/20"
                      : "bg-black/20 border border-gray-200/50"
                  } backdrop-blur`}
                >
                  <Text className="text-xl">✨</Text>
                </Pressable>

                <SelectLanguageModal />
              </View>
            </View>

            <View className="items-center">
              <CreditCard width={width - 48} height={(width - 48) * 0.8} />
            </View>

            {/* Login Form */}
            <View>
              <OptimizedInput
                control={control}
                name="identifier"
                label="Phone / Email / Username"
                placeholder="Enter Phone, Email, or Username"
                keyboardType="default"
                autoCapitalize="none"
                error={errors.identifier}
                labelRight={
                  isBiometricSupported &&
                  (hasBiometricCredentials || rememberMe) ? (
                    <Pressable onPress={onFingerPrintPress}>
                      {biometricType === "facial" ? (
                        <ScanFace
                          size={24}
                          color={isDark ? "#a3e635" : "#65a30d"}
                        />
                      ) : biometricType === "fingerprint" ? (
                        <Fingerprint
                          size={24}
                          color={isDark ? "#a3e635" : "#65a30d"}
                        />
                      ) : (
                        <ScanLine
                          size={24}
                          color={isDark ? "#a3e635" : "#65a30d"}
                        />
                      )}
                    </Pressable>
                  ) : undefined
                }
              />
            </View>

            <OptimizedInput
              control={control}
              name="password"
              label={t("auth.password")}
              placeholder="Enter your Password"
              secureTextEntry
              showPasswordToggle
              error={errors.password}
            />

            <View className="flex-row justify-between items-center mb-2">
              <Pressable
                onPress={() => setRememberMe((v) => !v)}
                className="flex-row items-center gap-2"
              >
                {rememberMe ? (
                  <CheckSquare
                    size={18}
                    color={isDark ? "#a3e635" : "#65a30d"}
                  />
                ) : (
                  <Square size={18} color={isDark ? "#64748b" : "#94a3b8"} />
                )}
                <Text
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Remember me
                </Text>
              </Pressable>

              <Pressable onPress={() => router.push("/forgot-password")}>
                <Text className="text-lime-500 text-sm font-semibold">
                  {t("auth.forgotPassword")}
                </Text>
              </Pressable>
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className={`bg-lime-400 rounded-2xl py-4 shadow-lg mb-2 ${
                isSubmitting ? "opacity-50" : ""
              }`}
            >
              <Text className="text-black text-lg font-bold text-center">
                {isSubmitting ? "Signing In..." : t("auth.login")}
              </Text>
            </Pressable>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center mt-2">
              <Text
                className={`text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {t("auth.dontHaveAccount")}{" "}
              </Text>
              <Link href="/auth/register" asChild>
                <Pressable>
                  <Text className="text-lime-500 text-base font-bold">
                    {t("auth.signUp")}
                  </Text>
                </Pressable>
              </Link>
            </View>

            {/* Feedback Link */}
            <View className="flex-row justify-center items-center my-4">
              <Text
                className={`text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Got a minute?{" "}
              </Text>
              <Pressable onPress={() => router.push("/(common)/feedback")}>
                <Text className="text-lime-500 text-base font-bold">
                  Share Your Feedback
                </Text>
              </Pressable>
            </View>

            <View className="flex-row justify-center items-center gap-3">
              <Text
                className={`text-center text-lg font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}
              >
                v{appVersion}
              </Text>

              <View className="flex-row justify-center items-center gap-2">
                <CBNLogo width={32} height={32} />

                <View className="flex-row">
                  <Text
                    className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    Licensed By The{" "}
                  </Text>
                  <Text
                    className={`text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}
                  >
                    CBN
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
