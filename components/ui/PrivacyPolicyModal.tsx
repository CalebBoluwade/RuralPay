import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, Animated, Dimensions } from "react-native";
import { complianceService } from "../../lib/services/ComplianceService";
import { useColorScheme } from "../../hooks/use-color-scheme";

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const { height } = Dimensions.get('window');

export default function PrivacyPolicyModal({ visible, onClose, onAccept }: PrivacyPolicyModalProps) {
  const isDark = useColorScheme() === "dark";
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [currentTab, setCurrentTab] = useState<'privacy' | 'terms'>('privacy');

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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-white"}`}>
        {/* Header */}
        <View className={`px-6 pt-16 pb-6 ${isDark ? "bg-[#1a1a2e]" : "bg-blue-50"}`}>
          <View className="items-center mb-4">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
              isDark ? "bg-blue-500/20" : "bg-blue-100"
            }`}>
              <Ionicons name="shield-checkmark" size={32} color={isDark ? "#60a5fa" : "#2563eb"} />
            </View>
            <Text className={`text-2xl font-bold text-center ${
              isDark ? "text-white" : "text-gray-900"
            }`}>
              Privacy & Terms
            </Text>
            <Text className={`text-sm text-center mt-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}>
              Please review and accept our policies to continue
            </Text>
          </View>

          {/* Tab Selector */}
          <View className={`flex-row rounded-xl p-1 ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}>
            <Pressable
              className={`flex-1 py-3 rounded-lg items-center ${
                currentTab === 'privacy'
                  ? isDark ? "bg-blue-600" : "bg-blue-500"
                  : "bg-transparent"
              }`}
              onPress={() => setCurrentTab('privacy')}
            >
              <Text className={`font-semibold ${
                currentTab === 'privacy'
                  ? "text-white"
                  : isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Privacy Policy
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 py-3 rounded-lg items-center ${
                currentTab === 'terms'
                  ? isDark ? "bg-blue-600" : "bg-blue-500"
                  : "bg-transparent"
              }`}
              onPress={() => setCurrentTab('terms')}
            >
              <Text className={`font-semibold ${
                currentTab === 'terms'
                  ? "text-white"
                  : isDark ? "text-gray-400" : "text-gray-600"
              }`}>
                Terms of Service
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {currentTab === 'privacy' ? (
            <View className="py-6">
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="eye" size={20} color={isDark ? "#60a5fa" : "#2563eb"} />
                  <Text className={`text-lg font-semibold ml-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    Data We Collect
                  </Text>
                </View>
                <Text className={`text-sm leading-6 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  • Payment card information for secure transactions{"\n"}
                  • Transaction history and payment data{"\n"}
                  • Device information for security purposes{"\n"}
                  • Location data for fraud prevention{"\n"}
                  • Biometric data for authentication (stored locally)
                </Text>
              </View>

              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="shield" size={20} color={isDark ? "#10b981" : "#059669"} />
                  <Text className={`text-lg font-semibold ml-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    How We Protect Your Data
                  </Text>
                </View>
                <Text className={`text-sm leading-6 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  • End-to-end encryption for all transactions{"\n"}
                  • Secure storage using device keychain{"\n"}
                  • No sharing with third parties{"\n"}
                  • Regular security audits and updates
                </Text>
              </View>

              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="person" size={20} color={isDark ? "#f59e0b" : "#d97706"} />
                  <Text className={`text-lg font-semibold ml-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    Your Rights
                  </Text>
                </View>
                <Text className={`text-sm leading-6 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  • Access your personal data anytime{"\n"}
                  • Request data correction or deletion{"\n"}
                  • Opt-out of marketing communications{"\n"}
                  • Contact us at privacy@ruralpay.com
                </Text>
              </View>
            </View>
          ) : (
            <View className="py-6">
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="document-text" size={20} color={isDark ? "#60a5fa" : "#2563eb"} />
                  <Text className={`text-lg font-semibold ml-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    Service Agreement
                  </Text>
                </View>
                <Text className={`text-sm leading-6 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  By using RuralPay, you agree to use our services responsibly and in accordance with Nigerian financial regulations.
                </Text>
              </View>

              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="card" size={20} color={isDark ? "#10b981" : "#059669"} />
                  <Text className={`text-lg font-semibold ml-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    Payment Terms
                  </Text>
                </View>
                <Text className={`text-sm leading-6 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  • Transaction limits apply as per your account type{"\n"}
                  • Fees may apply for certain services{"\n"}
                  • You're responsible for account security{"\n"}
                  • Report suspicious activity immediately
                </Text>
              </View>

              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="warning" size={20} color={isDark ? "#f59e0b" : "#d97706"} />
                  <Text className={`text-lg font-semibold ml-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}>
                    Liability & Support
                  </Text>
                </View>
                <Text className={`text-sm leading-6 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}>
                  • Services provided "as is" with reasonable care{"\n"}
                  • 24/7 customer support available{"\n"}
                  • Disputes resolved through Nigerian arbitration{"\n"}
                  • Contact support@ruralpay.com for assistance
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Consent Checkboxes */}
        <View className={`px-6 py-4 border-t ${
          isDark ? "border-gray-700 bg-[#1a1a2e]" : "border-gray-200 bg-gray-50"
        }`}>
          <View className="space-y-4">
            <Pressable
              className="flex-row items-center"
              onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
            >
              <View className={`w-6 h-6 border-2 rounded-md mr-3 items-center justify-center ${
                acceptedPrivacy 
                  ? "bg-blue-500 border-blue-500" 
                  : isDark ? "border-gray-500" : "border-gray-400"
              }`}>
                {acceptedPrivacy && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text className={`flex-1 text-sm font-medium ${
                isDark ? "text-gray-200" : "text-gray-800"
              }`}>
                I have read and accept the Privacy Policy
              </Text>
            </Pressable>

            <Pressable
              className="flex-row items-center"
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View className={`w-6 h-6 border-2 rounded-md mr-3 items-center justify-center ${
                acceptedTerms 
                  ? "bg-blue-500 border-blue-500" 
                  : isDark ? "border-gray-500" : "border-gray-400"
              }`}>
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
              <Text className={`flex-1 text-sm font-medium ${
                isDark ? "text-gray-200" : "text-gray-800"
              }`}>
                I have read and accept the Terms of Service
              </Text>
            </Pressable>
          </View>

          <Pressable
            className={`mt-6 py-4 rounded-xl items-center ${
              canAccept 
                ? "bg-blue-500 shadow-lg" 
                : isDark ? "bg-gray-700" : "bg-gray-300"
            }`}
            onPress={handleAccept}
            disabled={!canAccept}
            style={{
              shadowColor: canAccept ? "#3b82f6" : "transparent",
              shadowOpacity: 0.3,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <View className="flex-row items-center">
              <Ionicons 
                name="shield-checkmark" 
                size={20} 
                color={canAccept ? "white" : isDark ? "#6b7280" : "#9ca3af"} 
              />
              <Text className={`font-semibold ml-2 ${
                canAccept ? "text-white" : isDark ? "text-gray-400" : "text-gray-500"
              }`}>
                Accept and Continue to RuralPay
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}