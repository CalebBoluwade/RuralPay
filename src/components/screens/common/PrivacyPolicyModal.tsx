import { useAuth } from "@/src/components/context/AuthSessionProvider";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import {
    complianceService,
    ComplianceService,
} from "@/src/lib/services/ComplianceService";
import { router } from "expo-router";
import {
    Check,
    CircleUser,
    CreditCard,
    Eye,
    FileText,
    Handshake,
    Headset,
    Shield,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyModal() {
  const { checkConsents, consentOutdated } = useAuth();
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
      {/* Header */}
      <ScreenHeader
        title="Privacy & Terms"
        subtitle="Review Our Policies"
        goBack={false}
      />

      <View className="flex-1 px-6 py-5">
        {/* Re-consent update banner */}
        {consentOutdated && (
          <View
            className={`mx-6 mb-4 px-4 py-3 rounded-2xl flex-row items-start gap-3 ${
              isDark
                ? "bg-amber-500/15 border border-amber-500/30"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            <Text className="text-lg">📋</Text>
            <View className="flex-1">
              <Text
                className={`text-base font-bold mb-0.5 ${
                  isDark ? "text-amber-300" : "text-amber-800"
                }`}
              >
                Policies Updated — v{ComplianceService.CURRENT_VERSION}
              </Text>
              <Text
                className={`text-xs leading-4 ${
                  isDark ? "text-amber-400/80" : "text-amber-700"
                }`}
              >
                We’ve made changes since you last agreed. Please review and
                re-accept to continue.
              </Text>
            </View>
          </View>
        )}

        {/* Tab Selector */}
        <View
          className={`flex-row rounded-2xl p-2 mb-6 ${isDark ? "bg-white/10" : "bg-gray-100"}`}
        >
          <Pressable
            className={`flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2 ${
              currentTab === "privacy" ? "bg-lime-400" : ""
            }`}
            onPress={() => setCurrentTab("privacy")}
          >
            <Shield
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
            <FileText
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
              className={`font-bold text-lg ${
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
                icon="Eye"
                title="What We Collect"
                items={[
                  "🔐 Payment Card Data (encrypted & secure)",
                  "📊 Transaction history for your records",
                  "📱 Device info for fraud prevention",
                  "📍 Location data for security verification",
                  "👆 Biometric data (stored locally only)",
                ]}
              />
              <PolicySection
                isDark={isDark}
                icon="Shield"
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
                icon="CircleUser"
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
                icon="Handshake"
                title="Service Agreement"
                items={[
                  "🇳🇬 Compliant with Nigerian financial laws",
                  "✅ Use services responsibly & legally",
                  "🤝 Mutual respect & fair usage",
                  "📋 Regular terms updates (we'll notify you)",
                ]}
              />
              <PolicySection
                isDark={isDark}
                icon="CreditCard"
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
                icon="Headset"
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
              {acceptedPrivacy && <Check size={14} color="white" />}
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
              {acceptedTerms && <Check size={14} color="white" />}
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
  isDark,
}: {
  icon: string;
  title: string;
  items: string[];
  isDark: boolean;
}) {
  const iconColor = isDark ? "rgba(255,255,255,0.8)" : "#374151";
  const Icon = {
    Shield,
    FileText,
    Check,
    CreditCard,
    Headset,
    Eye,
    CircleUser,
    Handshake,
  }[icon];
  return (
    <View
      className={`rounded-2xl p-5 ${isDark ? "bg-white/10" : "bg-gray-100"}`}
    >
      <View className="flex-row items-center mb-3">
        {Icon && <Icon size={18} color={iconColor} />}
        <Text
          className={`font-bold font-brand text-xl ml-2 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {title}
        </Text>
      </View>
      {items.map((item, i) => (
        <Text
          key={i + 1}
          className={`text-lg leading-8 ${isDark ? "text-white/70" : "text-gray-600"}`}
        >
          {item}
        </Text>
      ))}
    </View>
  );
}
