import ScreenHeader from "@/components/ui/ScreenHeader";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { z } from "zod";
import OptimizedInput from "../../components/Input/OptimizedInput";

const customerSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  cardType: z.enum(["debit", "credit"]),
});

type CustomerData = z.infer<typeof customerSchema>;

const ProvisionCard = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState(1);
  const [nfcWriting, setNfcWriting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      cardType: "debit",
    },
  });

  const watchedValues = watch();

  const handleNext = handleSubmit(() => {
    setStep(2);
  });

  const handleNfcWrite = async () => {
    setNfcWriting(true);
    // Simulate NFC write
    setTimeout(() => {
      setNfcWriting(false);
      Alert.alert("Success", "Card provisioned successfully");
      setStep(1);
      reset();
    }, 3000);
  };

  if (step === 2) {
    return (
      <View className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}>
        <View className="px-6 pt-12 pb-6">
          <Text
            className={`text-3xl font-bold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            NFC Card Writing
          </Text>
          <Text
            className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Position your card near the device
          </Text>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <View
            className={`w-56 h-56 rounded-full justify-center items-center mb-8 ${
              nfcWriting
                ? "bg-green-500"
                : isDark
                  ? "bg-lime-600"
                  : "bg-lime-500"
            }`}
          >
            <View
              className={`w-40 h-40 rounded-full justify-center items-center backdrop-blur-xl ${
                isDark ? "bg-white/10" : "bg-white/20"
              }`}
            >
              <Text className="text-6xl">{nfcWriting ? "⚡" : "💳"}</Text>
            </View>
          </View>

          <Text
            className={`text-2xl font-bold mb-3 text-center ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {nfcWriting ? "Writing Data..." : "Ready to Write"}
          </Text>
          <Text
            className={`text-lg text-center mb-10 px-4 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {nfcWriting
              ? "Keep the card steady and close to your device"
              : "Hold the NFC card against the back of your device"}
          </Text>

          <View
            className={`p-6 rounded-2xl mb-10 w-full backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50 shadow-sm"
            }`}
          >
            <Text
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              Card Details
            </Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
                  Customer
                </Text>
                <Text
                  className={`font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {watchedValues.customerName}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
                  Email
                </Text>
                <Text
                  className={`font-medium ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {watchedValues.email}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
                  Phone
                </Text>
                <Text
                  className={`font-medium ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {watchedValues.phone}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className={isDark ? "text-gray-400" : "text-gray-600"}>
                  Type
                </Text>
                <Text
                  className={`font-semibold capitalize ${
                    isDark ? "text-lime-400" : "text-lime-600"
                  }`}
                >
                  {watchedValues.cardType}
                </Text>
              </View>
            </View>
          </View>

          <View className="w-full space-y-4">
            <TouchableOpacity
              className={`py-4 rounded-2xl ${
                nfcWriting
                  ? "bg-gray-500"
                  : isDark
                    ? "bg-lime-600"
                    : "bg-lime-700"
              }`}
              onPress={handleNfcWrite}
              disabled={nfcWriting}
            >
              <Text className="text-white text-lg font-bold text-center">
                {nfcWriting ? "Writing to Card..." : "Start NFC Write"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`py-3 rounded-2xl backdrop-blur-xl ${
                isDark
                  ? "bg-white/5 border border-white/10"
                  : "bg-white/40 border-2 border-gray-300"
              }`}
              onPress={() => setStep(1)}
              disabled={nfcWriting}
            >
              <Text
                className={`text-lg font-semibold text-center ${
                  isDark ? "text-white" : "text-gray-700"
                }`}
              >
                ← Back to Form
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="New Card Setup"
        subtitle="Enter customer details to provision a new NFC card"
        onBack={() => router.back()}
      />

      <View className="px-6 pb-8">
        <View
          className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <Text
            className={`text-xl font-bold mb-6 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Customer Information
          </Text>

          <OptimizedInput
            control={control}
            name="customerName"
            label="Full Name *"
            placeholder="Enter customer's full name"
            error={errors.customerName}
          />

          <OptimizedInput
            control={control}
            name="email"
            label="Email Address *"
            placeholder="customer@example.com"
            keyboardType="email-address"
            error={errors.email}
          />

          <OptimizedInput
            control={control}
            name="phone"
            label="Phone Number *"
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
            error={errors.phone}
          />
        </View>

        <View
          className={`rounded-2xl p-6 mb-8 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <Text
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-800"
            }`}
          >
            Card Type
          </Text>
          <View className="flex-row gap-4">
            {(["debit", "credit"] as const).map((type) => (
              <TouchableOpacity
                key={type}
                className={`flex-1 p-4 rounded-2xl items-center backdrop-blur-xl ${
                  watchedValues.cardType === type
                    ? isDark
                      ? "border-2 border-lime-500 bg-lime-500/20"
                      : "border-2 border-lime-500 bg-lime-50"
                    : isDark
                      ? "border border-white/20 bg-white/5"
                      : "border border-gray-200 bg-white/50"
                }`}
                onPress={() => setValue("cardType", type)}
              >
                <Text className="text-2xl mb-2">
                  {type === "debit" ? "💳" : "💎"}
                </Text>
                <Text
                  className={`text-lg font-semibold capitalize ${
                    watchedValues.cardType === type
                      ? isDark
                        ? "text-lime-400"
                        : "text-lime-600"
                      : isDark
                        ? "text-gray-400"
                        : "text-gray-700"
                  }`}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          className={`py-4 rounded-2xl ${
            isDark ? "bg-lime-600" : "bg-lime-700"
          }`}
          onPress={handleNext}
        >
          <Text className="text-white text-lg font-bold text-center">
            Continue to NFC Writing →
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProvisionCard;
