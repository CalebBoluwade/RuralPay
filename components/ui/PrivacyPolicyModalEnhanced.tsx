import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { complianceService } from "../../lib/services/ComplianceService";

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const { height, width } = Dimensions.get("window");

export default function PrivacyPolicyModal({
  visible,
  onClose,
  onAccept,
}: PrivacyPolicyModalProps) {
  const isDark = useColorScheme() === "dark";
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [currentTab, setCurrentTab] = useState<"privacy" | "terms">("privacy");
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [visible]);

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

    onAccept();
  };

  const canAccept = acceptedPrivacy && acceptedTerms;

  return (
    <Modal visible={visible} animationType="none" transparent>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View className="flex-1">
        {/* Backdrop */}
        <Animated.View
          className={`absolute inset-0 ${isDark ? "bg-black/80" : "bg-black/50"}`}
          style={{ opacity: fadeAnim }}
        />

        {/* Modal Content */}
        <Animated.View
          className="flex-1 justify-end"
          style={{
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height, 0],
                }),
              },
              { scale: scaleAnim },
            ],
          }}
        >
          <View
            className={`rounded-t-3xl overflow-hidden ${
              isDark ? "bg-[#0a0a0f]" : "bg-white"
            }`}
            style={{ maxHeight: height * 0.95 }}
          >
            {/* Drag Handle */}
            <View className="items-center py-3">
              <View
                className={`w-12 h-1 rounded-full ${
                  isDark ? "bg-gray-600" : "bg-gray-300"
                }`}
              />
            </View>

            {/* Header */}
            <View
              className={`px-6 pb-6 ${isDark ? "bg-gradient-to-b from-lime-900/20 to-transparent" : "bg-gradient-to-b from-lime-50 to-transparent"}`}
            >
              <View className="items-center mb-6">
                <Animated.View
                  className={`w-20 h-20 rounded-2xl items-center justify-center mb-4 ${
                    isDark ? "bg-lime-500/20" : "bg-lime-100"
                  }`}
                  style={{
                    transform: [{ scale: scaleAnim }],
                  }}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={40}
                    color={isDark ? "#84cc16" : "#65a30d"}
                  />
                </Animated.View>
                <Text
                  className={`text-3xl font-bold text-center mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Welcome to RuralPay
                </Text>
                <Text
                  className={`text-base text-center leading-6 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Your privacy and security are our top priority.{"\n"}
                  Please review our policies to get started.
                </Text>
              </View>

              {/* Enhanced Tab Selector */}
              <View
                className={`flex-row rounded-2xl p-1.5 ${
                  isDark ? "bg-gray-800/80" : "bg-white shadow-sm"
                }`}
              >
                <Pressable
                  className={`flex-1 py-4 rounded-xl items-center ${
                    currentTab === "privacy"
                      ? "bg-lime-500 shadow-lg"
                      : "bg-transparent"
                  }`}
                  onPress={() => setCurrentTab("privacy")}
                  style={{
                    shadowColor:
                      currentTab === "privacy" ? "#84cc16" : "transparent",
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                >
                  <Ionicons
                    name="shield"
                    size={20}
                    color={
                      currentTab === "privacy"
                        ? "white"
                        : isDark
                          ? "#84cc16"
                          : "#65a30d"
                    }
                  />
                  <Text
                    className={`font-bold mt-1 ${
                      currentTab === "privacy"
                        ? "text-white"
                        : isDark
                          ? "text-lime-400"
                          : "text-lime-600"
                    }`}
                  >
                    Privacy Policy
                  </Text>
                </Pressable>
                <Pressable
                  className={`flex-1 py-4 rounded-xl items-center ${
                    currentTab === "terms"
                      ? "bg-lime-500 shadow-lg"
                      : "bg-transparent"
                  }`}
                  onPress={() => setCurrentTab("terms")}
                  style={{
                    shadowColor:
                      currentTab === "terms" ? "#84cc16" : "transparent",
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                >
                  <Ionicons
                    name="document-text"
                    size={20}
                    color={
                      currentTab === "terms"
                        ? "white"
                        : isDark
                          ? "#84cc16"
                          : "#65a30d"
                    }
                  />
                  <Text
                    className={`font-bold mt-1 ${
                      currentTab === "terms"
                        ? "text-white"
                        : isDark
                          ? "text-lime-400"
                          : "text-lime-600"
                    }`}
                  >
                    Terms of Service
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              className="flex-1 px-6"
              showsVerticalScrollIndicator={false}
            >
              {currentTab === "privacy" ? (
                <View className="pb-6">
                  <View
                    className={`p-6 rounded-2xl mb-6 ${
                      isDark ? "bg-gray-800/50" : "bg-lime-50"
                    }`}
                  >
                    <View className="flex-row items-center mb-4">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                          isDark ? "bg-lime-500/20" : "bg-lime-200"
                        }`}
                      >
                        <Ionicons
                          name="eye"
                          size={20}
                          color={isDark ? "#84cc16" : "#65a30d"}
                        />
                      </View>
                      <Text
                        className={`text-xl font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        What We Collect
                      </Text>
                    </View>
                    <Text
                      className={`text-sm leading-7 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      🔐 Payment card data (encrypted & secure){"\n"}
                      📊 Transaction history for your records{"\n"}
                      📱 Device info for fraud prevention{"\n"}
                      📍 Location data for security verification{"\n"}
                      👆 Biometric data (stored locally only)
                    </Text>
                  </View>

                  <View
                    className={`p-6 rounded-2xl mb-6 ${
                      isDark ? "bg-gray-800/50" : "bg-emerald-50"
                    }`}
                  >
                    <View className="flex-row items-center mb-4">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                          isDark ? "bg-emerald-500/20" : "bg-emerald-200"
                        }`}
                      >
                        <Ionicons
                          name="shield-checkmark"
                          size={20}
                          color={isDark ? "#10b981" : "#059669"}
                        />
                      </View>
                      <Text
                        className={`text-xl font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        How We Protect You
                      </Text>
                    </View>
                    <Text
                      className={`text-sm leading-7 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      🔒 Bank-grade encryption for all data{"\n"}
                      🏦 Secure device keychain storage{"\n"}
                      🚫 Never shared with third parties{"\n"}
                      🛡️ Regular security audits & updates{"\n"}⚡ Real-time
                      fraud monitoring
                    </Text>
                  </View>

                  <View
                    className={`p-6 rounded-2xl mb-6 ${
                      isDark ? "bg-gray-800/50" : "bg-amber-50"
                    }`}
                  >
                    <View className="flex-row items-center mb-4">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                          isDark ? "bg-amber-500/20" : "bg-amber-200"
                        }`}
                      >
                        <Ionicons
                          name="person-circle"
                          size={20}
                          color={isDark ? "#f59e0b" : "#d97706"}
                        />
                      </View>
                      <Text
                        className={`text-xl font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Your Rights
                      </Text>
                    </View>
                    <Text
                      className={`text-sm leading-7 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      👀 View all your data anytime{"\n"}
                      ✏️ Request corrections or updates{"\n"}
                      🗑️ Delete your account & data{"\n"}
                      📧 Contact: privacy@ruralpay.com{"\n"}
                      📞 24/7 support available
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="pb-6">
                  <View
                    className={`p-6 rounded-2xl mb-6 ${
                      isDark ? "bg-gray-800/50" : "bg-blue-50"
                    }`}
                  >
                    <View className="flex-row items-center mb-4">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                          isDark ? "bg-blue-500/20" : "bg-blue-200"
                        }`}
                      >
                        <FontAwesome6
                          name="handshake"
                          size={20}
                          color={isDark ? "#60a5fa" : "#2563eb"}
                        />
                      </View>
                      <Text
                        className={`text-xl font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Service Agreement
                      </Text>
                    </View>
                    <Text
                      className={`text-sm leading-7 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      🇳🇬 Compliant with Nigerian financial laws{"\n"}✅ Use
                      services responsibly & legally{"\n"}
                      🤝 Mutual respect & fair usage{"\n"}
                      📋 Regular terms updates (we&apos;ll notify you)
                    </Text>
                  </View>

                  <View
                    className={`p-6 rounded-2xl mb-6 ${
                      isDark ? "bg-gray-800/50" : "bg-green-50"
                    }`}
                  >
                    <View className="flex-row items-center mb-4">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                          isDark ? "bg-green-500/20" : "bg-green-200"
                        }`}
                      >
                        <Ionicons
                          name="card"
                          size={20}
                          color={isDark ? "#22c55e" : "#16a34a"}
                        />
                      </View>
                      <Text
                        className={`text-xl font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Payment Terms
                      </Text>
                    </View>
                    <Text
                      className={`text-sm leading-7 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      💳 Transaction limits based on account type{"\n"}
                      💰 Transparent fee structure{"\n"}
                      🔐 You&apos;re responsible for account security{"\n"}
                      🚨 Report suspicious activity immediately{"\n"}⚡ Instant
                      transaction processing
                    </Text>
                  </View>

                  <View
                    className={`p-6 rounded-2xl mb-6 ${
                      isDark ? "bg-gray-800/50" : "bg-purple-50"
                    }`}
                  >
                    <View className="flex-row items-center mb-4">
                      <View
                        className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                          isDark ? "bg-purple-500/20" : "bg-purple-200"
                        }`}
                      >
                        <Ionicons
                          name="headset"
                          size={20}
                          color={isDark ? "#a855f7" : "#9333ea"}
                        />
                      </View>
                      <Text
                        className={`text-xl font-bold ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Support & Liability
                      </Text>
                    </View>
                    <Text
                      className={`text-sm leading-7 ${
                        isDark ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      🛠️ Services provided with reasonable care{"\n"}
                      📞 24/7 customer support team{"\n"}
                      ⚖️ Nigerian law governs disputes{"\n"}
                      📧 support@ruralpay.com{"\n"}
                      🤝 Fair resolution process
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Enhanced Consent Section */}
            <View
              className={`px-6 py-6 border-t ${
                isDark
                  ? "border-gray-700 bg-gradient-to-t from-gray-900/50 to-transparent"
                  : "border-gray-200 bg-gradient-to-t from-gray-50 to-transparent"
              }`}
            >
              <View className="space-y-5">
                <Pressable
                  className={`flex-row items-center p-4 rounded-2xl ${
                    acceptedPrivacy
                      ? isDark
                        ? "bg-lime-500/20"
                        : "bg-lime-50"
                      : isDark
                        ? "bg-gray-800/50"
                        : "bg-gray-50"
                  }`}
                  onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
                >
                  <View
                    className={`w-7 h-7 border-2 rounded-xl mr-4 items-center justify-center ${
                      acceptedPrivacy
                        ? "bg-lime-500 border-lime-500"
                        : isDark
                          ? "border-gray-500"
                          : "border-gray-400"
                    }`}
                  >
                    {acceptedPrivacy && (
                      <Ionicons name="checkmark" size={18} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      I accept the Privacy Policy
                    </Text>
                    <Text
                      className={`text-sm mt-1 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Your data is safe and secure with us
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  className={`flex-row items-center p-4 rounded-2xl ${
                    acceptedTerms
                      ? isDark
                        ? "bg-lime-500/20"
                        : "bg-lime-50"
                      : isDark
                        ? "bg-gray-800/50"
                        : "bg-gray-50"
                  }`}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                >
                  <View
                    className={`w-7 h-7 border-2 rounded-xl mr-4 items-center justify-center ${
                      acceptedTerms
                        ? "bg-lime-500 border-lime-500"
                        : isDark
                          ? "border-gray-500"
                          : "border-gray-400"
                    }`}
                  >
                    {acceptedTerms && (
                      <Ionicons name="checkmark" size={18} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      I accept the Terms of Service
                    </Text>
                    <Text
                      className={`text-sm mt-1 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Fair terms for secure payments
                    </Text>
                  </View>
                </Pressable>
              </View>

              <Pressable
                className={`mt-6 py-5 rounded-2xl items-center ${
                  canAccept
                    ? "bg-lime-500 shadow-xl"
                    : isDark
                      ? "bg-gray-700"
                      : "bg-gray-300"
                }`}
                onPress={handleAccept}
                disabled={!canAccept}
                style={{
                  shadowColor: canAccept ? "#84cc16" : "transparent",
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name="rocket"
                    size={24}
                    color={canAccept ? "white" : isDark ? "#6b7280" : "#9ca3af"}
                  />
                  <Text
                    className={`font-bold text-lg ml-3 ${
                      canAccept
                        ? "text-white"
                        : isDark
                          ? "text-gray-400"
                          : "text-gray-500"
                    }`}
                  >
                    Start Using RuralPay
                  </Text>
                </View>
                {canAccept && (
                  <Text className="text-white/80 text-sm mt-1">
                    Welcome to secure payments!
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
