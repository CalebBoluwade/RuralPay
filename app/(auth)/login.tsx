import { MaterialCommunityIcons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LocalAuthentication from "expo-local-authentication";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OptimizedInput from "../../components/Input/OptimizedInput";
import { useAuth } from "../../components/context/AuthProvider";
import { biometricService } from "../../components/lib/SecureStorage";
import { LoginFormData, loginSchema } from "../../lib/validations";

export default function LoginScreen() {
  const { login, biometricLogin, nativeAuthLogin, hasBiometricCredentials } = useAuth();
  const [isBiometricSupported, setIsBiometricSupported] =
    useState<boolean>(false);
  const [biometricType, setBiometricType] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
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
            LocalAuthentication.AuthenticationType.FINGERPRINT
          )
        ) {
          setBiometricType("fingerprint");
        } else if (
          biometricTypes.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
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
      await login(data.email, data.password);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Login Failed",
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  };

  const onFingerPrintPress = async () => {
    try {
      if (!isBiometricSupported) {
        Alert.alert(
          "Error",
          "Biometric authentication is not available on this device"
        );
        return;
      }

      if (!hasBiometricCredentials) {
        Alert.alert(
          "Error",
          "No saved credentials found. Please log in with email and password first."
        );
        return;
      }

      await biometricLogin();
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert(
        "Authentication Failed",
        error instanceof Error ? error.message : "Unable to authenticate with biometrics"
      );
    }
  };

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
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
              {/* Header */}
              <View className="mt-12 mb-12">
                <Text className="text-5xl font-bold text-white mb-3">
                  Welcome Back
                </Text>
                <Text className="text-xl text-white/80">
                  Sign in to your account
                </Text>
              </View>

              {/* Form Card */}
              <View className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-8 mb-8">
                <Text className="text-2xl font-bold text-white mb-8 text-center">
                  Sign In
                </Text>

                <OptimizedInput
                  control={control}
                  name="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  error={errors.email}
                />

                <OptimizedInput
                  control={control}
                  name="password"
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  error={errors.password}
                />

                <TouchableOpacity className="self-end mb-8">
                  <Text className="text-white/90 text-base font-medium">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                {/* Login Buttons */}
                <View className="space-y-4">
                  <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className={`bg-indigo-700 rounded-2xl py-4 shadow-lg ${
                      isSubmitting ? "opacity-50" : ""
                    }`}
                  >
                    <Text className="text-white text-lg font-bold text-center">
                      {isSubmitting ? "Signing In..." : "Sign In"}
                    </Text>
                  </TouchableOpacity>

                  {isBiometricSupported && nativeAuthLogin && hasBiometricCredentials && (
                    <View className="flex-row items-center my-6">
                      <View className="flex-1 h-px bg-white/30" />
                      <Text className="text-white/70 mx-4 font-medium">or</Text>
                      <View className="flex-1 h-px bg-white/30" />
                    </View>
                  )}

                  {isBiometricSupported && nativeAuthLogin && hasBiometricCredentials && (
                    <TouchableOpacity
                      onPress={onFingerPrintPress}
                      className="bg-white/20 backdrop-blur border border-white/30 rounded-2xl py-4 flex-row items-center justify-center shadow-lg"
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
                      <Text className="text-white text-lg font-semibold ml-3">
                        Use {biometricType === "facial" ? "Face ID" : biometricType === "fingerprint" ? "Fingerprint" : "Biometric"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Sign Up Link */}
              <View className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <View className="flex-row justify-center items-center">
                  <Text className="text-white/80 text-lg">
                    Don&apos;t have an account?{" "}
                  </Text>
                  <Link href="/(auth)/register" asChild>
                    <TouchableOpacity>
                      <Text className="text-blue-300 text-lg font-bold">
                        Sign Up
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
