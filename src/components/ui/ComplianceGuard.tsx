import { useDeviceIntegrity } from "@/src/hooks/useDeviceIntegrity";
import { ComplianceService } from "@/src/lib/services/ComplianceService";
import { router } from "expo-router";
import { ShieldAlert } from "lucide-react-native";
import React from "react";
import { Platform, Pressable, Text, View, useColorScheme } from "react-native";
import { useAuth } from "../context/AuthSessionProvider";

interface ComplianceGuardProps {
  children?: React.ReactNode;
}

export default function ComplianceGuard({
  children,
}: Readonly<ComplianceGuardProps>) {
  const { isLoading, consentOutdated } = useAuth();
  const { isCompromised, isChecking } = useDeviceIntegrity();
  const isDark = useColorScheme() === "dark";

  // Don't block render — show children while checks run, gate only on results
  if (isCompromised) {
    return (
      <View
        className={`flex-1 justify-center items-center px-8 ${
          isDark ? "bg-[#0a0a0f]" : "bg-gray-50"
        }`}
      >
        <View
          className={`w-36 h-36 rounded-full items-center justify-center mb-6 ${
            isDark ? "bg-lime-500/20" : "bg-lime-100"
          }`}
        >
          <Text className="text-6xl">🔒</Text>
        </View>
        <Text
          className={`text-2xl font-bold mb-4 text-center ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Device Not Supported
        </Text>
        <Text
          className={`text-lg text-center leading-6 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          RuralPay cannot run on a{" "}
          {Platform.OS === "ios" ? "jailbroken" : "rooted"} device.{"\n\n"}
          For your security, payment features are disabled on compromised
          devices.
        </Text>
      </View>
    );
  }

  if (consentOutdated) {
    return (
      <View
        className={`flex-1 justify-center items-center px-8 ${
          isDark ? "bg-[#0a0a0f]" : "bg-gray-50"
        }`}
      >
        <View
          className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
            isDark ? "bg-lime-500/20" : "bg-lime-100"
          }`}
        >
          <ShieldAlert size={44} color={isDark ? "#a3e635" : "#65a30d"} />
        </View>

        <Text
          className={`text-2xl font-bold mb-3 text-center ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Our Policies Have Been Updated
        </Text>

        <Text
          className={`text-base text-center leading-6 mb-2 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          We’ve updated our Privacy Policy and Terms of Service to version{" "}
          <Text className={`font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
            {ComplianceService.CURRENT_VERSION}
          </Text>
          .
        </Text>

        <Text
          className={`text-base text-center leading-6 mb-10 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Please review and accept the updated policies to continue using
          RuralPay.
        </Text>

        <Pressable
          onPress={() => router.push("/(common)/privacy-policy")}
          className="w-full bg-lime-400 rounded-2xl py-4 items-center"
        >
          <Text className="text-white text-lg font-bold">
            Review Updated Policies
          </Text>
        </Pressable>
      </View>
    );
  }

  return children ? <>{children}</> : null;
}
