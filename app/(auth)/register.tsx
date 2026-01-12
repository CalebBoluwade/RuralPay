import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../components/context/AuthProvider";
import OptimizedInput from "../../components/Input/OptimizedInput";
import PinSetupModal from "../../components/ui/PinSetupModal";
import { RegisterFormData, registerSchema } from "../../lib/validations";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [showPinModal, setShowPinModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<RegisterFormData | null>(null);
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    console.log('Registration attempt started:', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordLength: data.password?.length
    });
    
    setRegistrationData(data);
    setShowPinModal(true);
  };

  const handlePinComplete = async () => {
    if (!registrationData) return;
    
    try {
      await register(registrationData.firstName, registrationData.lastName, registrationData.email, registrationData.password);
      console.log('Registration successful, redirecting to tabs');
      setShowPinModal(false);
      router.replace("/(tabs)");
    } catch (error) {
      console.error('Registration failed:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        data: {
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          email: registrationData.email
        }
      });
      setShowPinModal(false);
      Alert.alert("Registration Failed", error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    setRegistrationData(null);
  };

  return (
    <ImageBackground
      source={{ uri: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" }}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/50">
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-1 justify-between px-6 py-8">
                {/* Header */}
                <View className="mt-16">
                  <Text className="text-4xl font-bold text-white mb-2">
                    Create Account
                  </Text>
                  <Text className="text-lg text-white/80">
                    Join us today
                  </Text>
                </View>

                {/* Form */}
                <View className="flex-1 justify-center py-8">
                  <OptimizedInput
                    control={control}
                    name="firstName"
                    label="First Name"
                    placeholder="Enter your first name"
                    error={errors.firstName}
                  />

                   <OptimizedInput
                    control={control}
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter your last name"
                    error={errors.lastName}
                  />

                  <OptimizedInput
                    control={control}
                    name="email"
                    label="Email"
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    error={errors.email}
                  />

                  <OptimizedInput
                    control={control}
                    name="phoneNumber"
                    label="Phone Number"
                    placeholder="Enter your phone number"
                    keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
                    error={errors.phoneNumber}
                  />

                  <OptimizedInput
                    control={control}
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    secureTextEntry
                    error={errors.password}
                  />

                  <OptimizedInput
                    control={control}
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    secureTextEntry
                    error={errors.confirmPassword}
                  />
                </View>

                {/* Bottom Buttons */}
                <View className="space-y-4">
                  <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                    className={`bg-emerald-700 rounded-lg py-4 ${
                      isSubmitting ? "opacity-50" : ""
                    }`}
                  >
                    <Text className="text-white text-lg font-semibold text-center">
                      {isSubmitting ? "Creating Account..." : "Create Account"}
                    </Text>
                  </TouchableOpacity>

                  <View className="flex-row justify-center items-center">
                    <Text className="text-white/80 text-base">
                      Already have an account?{" "}
                    </Text>
                    <Link href="/(auth)/login" asChild>
                      <TouchableOpacity>
                        <Text className="text-emerald-400 text-base font-semibold">
                          Sign In
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
      
      <PinSetupModal
        visible={showPinModal}
        onComplete={handlePinComplete}
        onCancel={handlePinCancel}
      />
    </ImageBackground>
  );
}