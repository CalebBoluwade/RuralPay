import Button from "@/src/components/ui/Button";
import * as SecureStore from "expo-secure-store";
import {
  CheckCircle2,
  CreditCard,
  QrCode,
  Smartphone,
  Store,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "../../ui/ScreenHeader";

type UserRole = "consumer" | "merchant";

interface SmartOnboardingProps {
  onFinish: (userType: UserRole, primaryGoal: string) => Promise<void>;
  appVersion: string;
}

interface GoalOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "lime" | "blue" | "purple" | "orange";
}

export default function SmartOnboarding({
  onFinish,
  appVersion,
}: Readonly<SmartOnboardingProps>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState<"role" | "goal" | "summary">("role");
  const [selectedRole, setSelectedRole] = useState<
    "consumer" | "merchant" | null
  >(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const consumerGoals: GoalOption[] = [
    {
      id: "send_money",
      title: "Send Money",
      description: "Transfer to bank accounts securely",
      icon: <Smartphone size={24} color="currentColor" />,
      color: "lime",
    },
    {
      id: "scan_pay",
      title: "Scan & Pay",
      description: "Quick QR code payments",
      icon: <QrCode size={24} color="currentColor" />,
      color: "blue",
    },
    {
      id: "tap_card",
      title: "Tap to Pay",
      description: "NFC card payments",
      icon: <CreditCard size={24} color="currentColor" />,
      color: "purple",
    },
    {
      id: "bill_pay",
      title: "Pay Bills",
      description: "Airtime, utilities & more",
      icon: <Zap size={24} color="currentColor" />,
      color: "orange",
    },
  ];

  const merchantGoals: GoalOption[] = [
    {
      id: "receive_qr",
      title: "Receive Payments",
      description: "Share QR Code with customers",
      icon: <QrCode size={24} color="currentColor" />,
      color: "lime",
    },
    {
      id: "nfc_terminal",
      title: "Mobile Card Terminal",
      description: "Accept Card Payments Using Your Phone",
      icon: <CreditCard size={24} color="currentColor" />,
      color: "blue",
    },
    {
      id: "inventory",
      title: "Track Sales",
      description: "Real-time Transaction Analytics & Insights",
      icon: <TrendingUp size={24} color="currentColor" />,
      color: "purple",
    },
  ];

  const goalList = selectedRole === "consumer" ? consumerGoals : merchantGoals;

  const handleRoleSelect = (role: "consumer" | "merchant") => {
    setSelectedRole(role);
    setStep("goal");
  };

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
  };

  const handleConfirm = async () => {
    if (!selectedRole || !selectedGoal) return;

    try {
      setIsProcessing(true);

      // Store preferences
      await SecureStore.setItemAsync("user_type_preference", selectedRole);
      await SecureStore.setItemAsync("primary_goal", selectedGoal);
      await SecureStore.setItemAsync("onboarding_shown", "true");

      // Call parent callback
      await onFinish(selectedRole, selectedGoal);
    } catch (error) {
      if (__DEV__)
        console.error("[SmartOnboarding] Error saving preferences:", error);
      // Still proceed on error
      await onFinish(selectedRole, selectedGoal);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackStep = () => {
    if (step === "goal") {
      setSelectedRole(null);
      setStep("role");
    } else if (step === "summary") {
      setSelectedGoal(null);
      setStep("goal");
    }
  };

  const getRoleCardClasses = (role: UserRole | null) => {
    const baseClasses = "rounded-2xl p-6 mb-4 border-2";
    const isConsumerSelected = selectedRole === "consumer";

    if (role === "consumer" && isConsumerSelected) {
      const selectedBg = isDark ? "bg-lime-500/20" : "bg-lime-50";
      return `${baseClasses} ${selectedBg} border-lime-500`;
    }

    if (
      role === "merchant" &&
      !isConsumerSelected &&
      selectedRole === "merchant"
    ) {
      const selectedBg = isDark ? "bg-blue-500/20" : "bg-blue-50";
      return `${baseClasses} ${selectedBg} border-blue-500`;
    }

    const unselectedBg = isDark
      ? "bg-slate-800 border-slate-700"
      : "bg-slate-100 border-slate-200";
    return `${baseClasses} ${unselectedBg}`;
  };

  const getRoleIconBgClasses = (role: UserRole | null) => {
    const isSelected = selectedRole === role;
    if (!isSelected) {
      return isDark ? "bg-slate-700" : "bg-slate-200";
    }

    const selectedBg =
      role === "consumer"
        ? isDark
          ? "bg-lime-500/30"
          : "bg-lime-100"
        : isDark
          ? "bg-blue-500/30"
          : "bg-blue-100";
    return selectedBg;
  };

  const getRoleIconColor = (role: UserRole | null) => {
    if (selectedRole !== role) {
      return isDark ? "#cbd5e1" : "#64748b";
    }

    return role === "consumer" ? "#22c55e" : "#3b82f6";
  };

  const getGoalIconBgClasses = () => {
    return isDark ? "bg-slate-700" : "bg-slate-200";
  };

  // ─── ROLE SELECTION SCREEN ───────────────────────────────────────────────

  if (step === "role") {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow"
        >
          <View className="flex-1 justify-between px-5 pt-6 pb-6">
            <View>
              {/* Header */}
              <View className="mb-8">
                <Text
                  className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"} mb-2`}
                >
                  Welcome to
                </Text>
                <Text
                  className={`text-3xl font-brand font-bold mb-6 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  RuralPay
                </Text>
                <Text
                  className={`text-lg leading-6 ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Let&apos;s tailor your experience. Who are you?
                </Text>
              </View>

              {/* Consumer Card */}
              <Pressable
                onPress={() => handleRoleSelect("consumer")}
                className={getRoleCardClasses("consumer")}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${getRoleIconBgClasses("consumer")}`}
                  >
                    <Users size={24} color={getRoleIconColor("consumer")} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text
                      className={`text-lg font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      I&apos;m a Consumer
                    </Text>
                    <Text
                      className={`text-sm ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Send money & make payments
                    </Text>
                  </View>
                  {selectedRole === "consumer" && (
                    <CheckCircle2 size={24} color="#22c55e" />
                  )}
                </View>
              </Pressable>

              {/* Merchant Card */}
              <Pressable
                onPress={() => handleRoleSelect("merchant")}
                className={getRoleCardClasses("merchant")}
              >
                <View className="flex-row items-center">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center ${getRoleIconBgClasses("merchant")}`}
                  >
                    <Store size={24} color={getRoleIconColor("merchant")} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text
                      className={`text-lg font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      I&apos;m a Merchant
                    </Text>
                    <Text
                      className={`text-sm ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      Receive payments from customers
                    </Text>
                  </View>
                  {selectedRole === "merchant" && (
                    <CheckCircle2 size={24} color="#3b82f6" />
                  )}
                </View>
              </Pressable>
            </View>

            {/* Footer */}
            <View className="mt-8">
              <Button
                label="Continue"
                disabled={!selectedRole || isProcessing}
                onPress={() => setStep("goal")}
              />

              <Text
                className={`text-xs text-center mt-4 ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                v{appVersion}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── GOAL SELECTION SCREEN ──────────────────────────────────────────────

  if (step === "goal") {
    return (
      <SafeAreaView
        edges={["top", "bottom"]}
        className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-grow"
        >
          <View className="flex-1 justify-between px-5 pt-6 pb-6">
            {/* Header with Back Button */}
            <View>
              <View className="mb-12">
                <ScreenHeader
                  title="What's Your Primary Goal?"
                  goBack
                  onBack={handleBackStep}
                  showLanguageSelector={false}
                  useLargerTitle={true}
                />
                <Text
                  className={`text-base leading-5 ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {selectedRole === "consumer"
                    ? "Let's personalize your experience to match your needs"
                    : "We'll set up your merchant dashboard for success"}
                </Text>
              </View>

              {/* Goal Cards */}
              <View className="gap-3 mb-8">
                {goalList.map((goal) => {
                  const isSelected = selectedGoal === goal.id;
                  const bgColor = isDark ? "bg-slate-800" : "bg-white";
                  const iconBgColor = getGoalIconBgClasses();
                  return (
                    <Pressable
                      key={goal.id}
                      onPress={() => handleGoalSelect(goal.id)}
                      className={`rounded-xl p-4 border-2 ${bgColor} border-slate-700`}
                    >
                      <View className="flex-row items-start gap-4">
                        <View
                          className={`w-12 h-12 rounded-lg items-center justify-center ${iconBgColor}`}
                        >
                          <View>{goal.icon}</View>
                        </View>

                        <View className="flex-1">
                          <Text
                            className={`text-base font-bold mb-1 ${
                              isDark ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {goal.title}
                          </Text>
                          <Text
                            className={`text-sm ${
                              isDark ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            {goal.description}
                          </Text>
                        </View>

                        {isSelected && (
                          <CheckCircle2
                            size={20}
                            color="#22c55e"
                            style={{ marginTop: 2 }}
                          />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Footer */}
            <Button
              label={
                selectedGoal
                  ? "Review Your Preferences"
                  : "Select a goal to continue"
              }
              disabled={!selectedGoal || isProcessing}
              onPress={() => setStep("summary")}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── SUMMARY & CONFIRMATION SCREEN ───────────────────────────────────────

  const selectedGoalObj = goalList.find((g) => g.id === selectedGoal);
  const roleDisplay = selectedRole === "consumer" ? "Consumer" : "Merchant";
  const roleIcon = selectedRole === "consumer" ? "👤" : "🏪";

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow"
      >
        <View className="flex-1 justify-between px-5 pt-6 pb-6">
          {/* Header */}
          <View>
            <View className="mb-8">
              <ScreenHeader
                title="All Set! 🎉"
                useLargerTitle
                goBack={false}
                showLanguageSelector={false}
              />
              <Text
                className={`text-lg ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Here&apos;s your personalized setup
              </Text>
            </View>

            {/* Summary Cards */}
            <View className="gap-3 mb-8">
              {/* Account Type Card */}
              <View
                className={`rounded-xl p-4 border ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <Text
                  className={`text-xs font-bold mb-2 uppercase tracking-wider ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Account Type
                </Text>
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-10 h-10 rounded-lg items-center justify-center ${
                      selectedRole === "consumer"
                        ? isDark
                          ? "bg-lime-500/20"
                          : "bg-lime-100"
                        : isDark
                          ? "bg-blue-500/20"
                          : "bg-blue-100"
                    }`}
                  >
                    {selectedRole === "consumer" ? (
                      <Users size={20} color={isDark ? "#a3e635" : "#65a30d"} />
                    ) : (
                      <Store size={20} color={isDark ? "#3b82f6" : "#0284c7"} />
                    )}
                  </View>
                  <Text
                    className={`text-lg font-bold ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {roleIcon} {roleDisplay} Account
                  </Text>
                </View>
              </View>

              {/* Primary Goal Card */}
              <View
                className={`rounded-xl p-4 border ${
                  isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-white border-slate-200"
                }`}
              >
                <Text
                  className={`text-xs font-bold mb-2 uppercase tracking-wider ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Primary Goal
                </Text>
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-10 h-10 rounded-lg items-center justify-center ${
                      isDark ? "bg-purple-500/20" : "bg-purple-100"
                    }`}
                  >
                    {selectedGoalObj?.icon}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {selectedGoalObj?.title}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View className="mb-8">
            <Text
              className={`text-lg text-center leading-5 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {selectedRole === "consumer"
                ? "Your Dashboard is optimized for quick payments and money transfers. Explore all features when you're ready."
                : "Your Merchant Dashboard is configured to help you accept payments and track sales. Get started receiving payments today."}
            </Text>
          </View>

          {/* Footer - Buttons */}
          <View className="gap-3">
            <Button
              label={isProcessing ? "Setting up..." : "Let's Go!"}
              disabled={isProcessing}
              onPress={handleConfirm}
            />

            <Pressable
              onPress={handleBackStep}
              disabled={isProcessing}
              className={`py-3 px-4 rounded-lg items-center border ${
                isDark
                  ? "border-slate-700 bg-slate-800"
                  : "border-slate-200 bg-white"
              }`}
            >
              <Text
                className={`font-semibold ${
                  isDark ? "text-slate-300" : "text-slate-700"
                }`}
              >
                Change Selection
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
