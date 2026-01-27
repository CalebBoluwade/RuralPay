import { ToastService } from "@/hooks/use-toast";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LocalAuthentication from "expo-local-authentication";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OptimizedInput from "../../components/Input/OptimizedInput";
import { useAuth } from "../../components/context/AuthProvider";
import { useLanguage } from "../../components/context/LanguageContext";
import { languageNames } from "../../i18n";
import { biometricService } from "../../lib/SecureStorage";
import { LoginFormData, loginSchema } from "../../lib/validations";

export default function LoginScreen() {
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
      phoneNumber: "",
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
      await login(data.phoneNumber, data.password);
      router.replace("/(tabs)");
    } catch (error) {
      ToastService.error(
        error instanceof Error ? error.message : "An error occurred",
      );
    }
  };

  const onFingerPrintPress = async () => {
    try {
      if (!isBiometricSupported) {
        Alert.alert(
          "Error",
          "Biometric authentication is not available on this device",
        );
        return;
      }

      if (!hasBiometricCredentials) {
        Alert.alert(
          "Error",
          "No saved credentials found. Please log in with Phone number and password first.",
        );
        return;
      }

      await biometricLogin();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Authentication Failed",
        error instanceof Error
          ? error.message
          : "Unable to Authenticate with Biometrics",
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
            <View className="flex-1 px-6 py-8">
              {/* Language Button */}
              <View className="absolute top-4 right-6 z-10">
                <TouchableOpacity
                  onPress={() => setShowLanguageModal(true)}
                  className="w-12 h-12 rounded-full items-center justify-center bg-white/20 backdrop-blur border border-white/30"
                >
                  <Text className="text-2xl">
                    {languageNames[language].flag}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Header */}
              <View className="mt-12 mb-12">
                <Text className="text-5xl font-bold text-white mb-3">
                  {t("auth.welcomeBack")}
                </Text>
              </View>

              {/* Form Card */}
              <View className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8 mb-8">
                <Text className="text-2xl font-bold text-white mb-8 text-center">
                  {t("auth.login")}
                </Text>

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

                <TouchableOpacity className="self-end mb-8">
                  <Text className="text-white/90 text-base font-medium">
                    {t("auth.forgotPassword")}
                  </Text>
                </TouchableOpacity>

                {/* Login Buttons */}
                <View className="space-y-4 flex-row justify-center gap-3">
                  <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className={`w-64 bg-indigo-700 rounded-2xl py-4 shadow-lg ${
                      isSubmitting ? "opacity-50" : ""
                    }`}
                  >
                    <Text className="text-white text-lg font-bold text-center">
                      {isSubmitting ? "Signing In..." : t("auth.login")}
                    </Text>
                  </TouchableOpacity>

                  {
                    // isBiometricSupported &&
                    hasBiometricCredentials && nativeAuthLogin && (
                      <TouchableOpacity
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
                        {/* <Text className="text-white text-lg font-semibold ml-3">
                          Use{" "}
                          {biometricType === "facial"
                            ? "Face ID"
                            : biometricType === "fingerprint"
                              ? "Fingerprint"
                              : "Biometric"}
                        </Text> */}
                      </TouchableOpacity>
                    )
                  }
                </View>
              </View>

              {/* Sign Up Link */}
              <View className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <View className="flex-row justify-center items-center">
                  <Text className="text-white/80 text-lg">
                    {t("auth.dontHaveAccount")}{" "}
                  </Text>
                  <Link href="/(auth)/register" asChild>
                    <TouchableOpacity>
                      <Text className="text-blue-300 text-lg font-bold">
                        {t("auth.signUp")}
                      </Text>
                    </TouchableOpacity>
                  </Link>
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
                  <Ionicons name="language" size={32} color="#a78bfa" />
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
