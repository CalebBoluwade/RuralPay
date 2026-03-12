import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../components/context/AuthProvider";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { complianceService } from "../../lib/services/ComplianceService";

export default function PrivacyPolicyModal() {
  const { checkConsents } = useAuth();
  const isDark = useColorScheme() === "dark";
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [currentTab, setCurrentTab] = useState<"privacy" | "terms">("privacy");

  const handleAccept = async () => {
    if (!acceptedPrivacy || !acceptedTerms) return;
    await complianceService.setComplianceConsent({
      privacyPolicy: true,
      termsOfService: true,
    });
    await complianceService.setPrivacyConsent({
      dataCollection: true,
      analytics: true,
      marketing: false,
    });
    await checkConsents();
    router.back();
  };

  const canAccept = acceptedPrivacy && acceptedTerms;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-950" : "bg-white"}`}>
      <View className="flex-1 px-6 py-8">
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          className={`w-12 h-12 rounded-full items-center justify-center border mb-8 ${isDark ? "bg-white/20 border-white/30" : "bg-gray-100 border-gray-200"}`}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "white" : "#1f2937"}
          />
        </Pressable>

        {/* Header */}
        <View className="mb-8">
          <Text
            className={`text-4xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Privacy & Terms
          </Text>
          <Text
            className={`text-lg ${isDark ? "text-white/80" : "text-gray-500"}`}
          >
            Review our policies before getting started
          </Text>
        </View>

        {/* Tab Selector */}
        <View
          className={`flex-row rounded-2xl p-1 mb-6 ${isDark ? "bg-white/10" : "bg-gray-100"}`}
        >
          <Pressable
            className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2 ${
              currentTab === "privacy" ? "bg-lime-400" : ""
            }`}
            onPress={() => setCurrentTab("privacy")}
          >
            <Ionicons
              name="shield"
              size={18}
              color={
                currentTab === "privacy"
                  ? "white"
                  : isDark
                    ? "rgba(255,255,255,0.6)"
                    : "#6b7280"
              }
            />
            <Text
              className={`font-bold ${
                currentTab === "privacy"
                  ? "text-white"
                  : isDark
                    ? "text-white/60"
                    : "text-gray-500"
              }`}
            >
              Privacy Policy
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2 ${
              currentTab === "terms" ? "bg-lime-400" : ""
            }`}
            onPress={() => setCurrentTab("terms")}
          >
            <Ionicons
              name="document-text"
              size={18}
              color={
                currentTab === "terms"
                  ? "white"
                  : isDark
                    ? "rgba(255,255,255,0.6)"
                    : "#6b7280"
              }
            />
            <Text
              className={`font-bold ${
                currentTab === "terms"
                  ? "text-white"
                  : isDark
                    ? "text-white/60"
                    : "text-gray-500"
              }`}
            >
              Terms of Service
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {currentTab === "privacy" ? (
            <View className="gap-4 pb-6">
              <PolicySection
                isDark={isDark}
                icon="eye"
                title="What We Collect"
                items={[
                  "🔐 Payment card data (encrypted & secure)",
                  "📊 Transaction history for your records",
                  "📱 Device info for fraud prevention",
                  "📍 Location data for security verification",
                  "👆 Biometric data (stored locally only)",
                ]}
              />
              <PolicySection
                isDark={isDark}
                icon="shield-checkmark"
                title="How We Protect You"
                items={[
                  "🔒 Bank-grade encryption for all data",
                  "🏦 Secure device keychain storage",
                  "🚫 Never shared with third parties",
                  "🛡️ Regular security audits & updates",
                  "⚡ Real-time fraud monitoring",
                ]}
              />
              <PolicySection
                isDark={isDark}
                icon="person-circle"
                title="Your Rights"
                items={[
                  "👀 View all your data anytime",
                  "✏️ Request corrections or updates",
                  "🗑️ Delete your account & data",
                  "📧 Contact: privacy@ruralpay.com",
                  "📞 24/7 support available",
                ]}
              />
            </View>
          ) : (
            <View className="gap-4 pb-6">
              <PolicySection
                isDark={isDark}
                icon="handshake"
                title="Service Agreement"
                isFontAwesome
                items={[
                  "🇳🇬 Compliant with Nigerian financial laws",
                  "✅ Use services responsibly & legally",
                  "🤝 Mutual respect & fair usage",
                  "📋 Regular terms updates (we'll notify you)",
                ]}
              />
              <PolicySection
                isDark={isDark}
                icon="card"
                title="Payment Terms"
                items={[
                  "💳 Transaction limits based on account type",
                  "💰 Transparent fee structure",
                  "🔐 You're responsible for account security",
                  "🚨 Report suspicious activity immediately",
                  "⚡ Instant transaction processing",
                ]}
              />
              <PolicySection
                isDark={isDark}
                icon="headset"
                title="Support & Liability"
                items={[
                  "🛠️ Services provided with reasonable care",
                  "📞 24/7 customer support team",
                  "⚖️ Nigerian law governs disputes",
                  "📧 support@ruralpay.com",
                  "🤝 Fair resolution process",
                ]}
              />
            </View>
          )}
        </ScrollView>

        {/* Consent + CTA */}
        <View
          className={`pt-4 border-t ${isDark ? "border-white/20" : "border-gray-200"}`}
        >
          <Pressable
            className="flex-row items-center mb-3"
            onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
          >
            <View
              className={`w-6 h-6 rounded-lg border-2 mr-3 items-center justify-center ${
                acceptedPrivacy
                  ? "bg-lime-400 border-lime-400"
                  : isDark
                    ? "border-white/40"
                    : "border-gray-300"
              }`}
            >
              {acceptedPrivacy && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
            <Text
              className={`flex-1 ${isDark ? "text-white/90" : "text-gray-700"}`}
            >
              I accept the Privacy Policy
            </Text>
          </Pressable>

          <Pressable
            className="flex-row items-center mb-6"
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View
              className={`w-6 h-6 rounded-lg border-2 mr-3 items-center justify-center ${
                acceptedTerms
                  ? "bg-lime-400 border-lime-400"
                  : isDark
                    ? "border-white/40"
                    : "border-gray-300"
              }`}
            >
              {acceptedTerms && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
            <Text
              className={`flex-1 ${isDark ? "text-white/90" : "text-gray-700"}`}
            >
              I accept the Terms of Service
            </Text>
          </Pressable>

          <Pressable
            onPress={handleAccept}
            disabled={!canAccept}
            className={`rounded-2xl py-4 items-center ${
              canAccept ? "bg-lime-400" : isDark ? "bg-white/20" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-lg font-bold ${
                canAccept
                  ? "text-white"
                  : isDark
                    ? "text-white/40"
                    : "text-gray-400"
              }`}
            >
              Start Using RuralPay
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

function PolicySection({
  icon,
  title,
  items,
  isFontAwesome,
  isDark,
}: {
  icon: string;
  title: string;
  items: string[];
  isFontAwesome?: boolean;
  isDark: boolean;
}) {
  const iconColor = isDark ? "rgba(255,255,255,0.8)" : "#374151";
  return (
    <View
      className={`rounded-2xl p-5 ${isDark ? "bg-white/10" : "bg-gray-100"}`}
    >
      <View className="flex-row items-center mb-3">
        {isFontAwesome ? (
          <FontAwesome6 name={icon as any} size={18} color={iconColor} />
        ) : (
          <Ionicons name={icon as any} size={18} color={iconColor} />
        )}
        <Text
          className={`font-bold text-base ml-2 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {title}
        </Text>
      </View>
      {items.map((item, i) => (
        <Text
          key={i}
          className={`text-sm leading-7 ${isDark ? "text-white/70" : "text-gray-600"}`}
        >
          {item}
        </Text>
      ))}
    </View>
  );
}
