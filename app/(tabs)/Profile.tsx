import { useAuth } from "@/components/context/AuthProvider";
import { useLanguage } from "@/components/context/LanguageContext";
import { languageNames } from "@/i18n";
import { PinService } from "@/lib/SecureStorage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const {
    user,
    logout,
    nativeAuthLogin,
    nativeAuthTransactions,
    visibleBalance,
    updateNativeAuthSettings,
    updateVisibleBalance,
  } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [dailyLimit, setDailyLimit] = useState("500");
  const [monthlyLimit, setMonthlyLimit] = useState("5000");
  const [showPinModal, setShowPinModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStep, setPinStep] = useState<"old" | "new">("old");

  const handlePinChange = async () => {
    if (pinStep === "old") {
      // Validate old PIN
      if (oldPin.length !== 6) {
        Alert.alert("Error", "PIN must be 6 digits");
        return;
      }
      const isValid = await PinService.validatePin(oldPin);
      if (!isValid) {
        Alert.alert("Error", "Current PIN is incorrect");
        setOldPin("");
        return;
      }
      setPinStep("new");
    } else {
      // Set new PIN
      if (newPin.length !== 6) {
        Alert.alert("Error", "New PIN must be 6 digits");
        return;
      }
      if (newPin !== confirmPin) {
        Alert.alert("Error", "PINs do not match");
        setConfirmPin("");
        return;
      }
      await PinService.setPin(newPin);
      Alert.alert("Success", "PIN updated successfully");
      setShowPinModal(false);
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setPinStep("old");
    }
  };

  const handleLimitUpdate = () => {
    Alert.alert("Success", "Card limits updated successfully");
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-6 pt-4">
          {/* Header Card */}
          <View
            className={`rounded-2xl p-8 mb-6 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/95 border border-gray-200/50 shadow-sm"
            }`}
          >
            {/* Logout */}
            <TouchableOpacity
              className={`p-2 flex-row justify-end ${isDark ? "text-red-600" : "text-red-700"}`}
              onPress={handleLogout}
            >
              <Ionicons name="power" size={21} color="red" />
            </TouchableOpacity>

            <View className="items-center">
              <View className="w-28 h-28 rounded-full bg-lime-600 justify-center items-center mb-6">
                <Text className="text-4xl text-white font-bold">
                  {(user?.FirstName?.[0] || "U") + (user?.LastName?.[0] || "N")}
                </Text>
              </View>
              <Text
                className={`text-3xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {user?.FirstName + " " + user?.LastName || "User Name"}
              </Text>
              <Text
                className={`text-lg mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {user?.email || "user@example.com"}
              </Text>
              <TouchableOpacity
                className={`px-4 py-2 rounded-full mt-2 ${isDark ? "bg-indigo-500/20" : "bg-indigo-100"}`}
                onPress={() => setShowWalletModal(true)}
              >
                <Text
                  className={`text-sm font-semibold ${isDark ? "text-indigo-300" : "text-indigo-700"}`}
                >
                  {user?.AccountId ? "View Wallet" : "Setup Wallet"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Settings */}
          <View
            className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50 shadow-sm"
            }`}
          >
            <View className="flex-row items-center mb-6">
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                  isDark ? "bg-white/10" : "bg-gray-100"
                }`}
              >
                <Ionicons
                  name="shield-checkmark-sharp"
                  size={24}
                  color={isDark ? "#a78bfa" : "#7c3aed"}
                />
              </View>
              <Text
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {t("profile.security")}
              </Text>
            </View>

            {/* Native Auth Toggles */}
            <View className="mb-6">
              <View
                className={`p-4 rounded-2xl mb-4 backdrop-blur-xl ${
                  isDark
                    ? "bg-white/5 border border-white/10"
                    : "bg-gray-50/80 border border-gray-200/30"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {t("profile.biometricLogin")}
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Use fingerprint or face ID for secure login
                    </Text>
                  </View>
                  <Switch
                    value={nativeAuthLogin}
                    onValueChange={(value) =>
                      updateNativeAuthSettings(value, nativeAuthTransactions)
                    }
                    trackColor={{
                      false: isDark ? "#374151" : "#E5E7EB",
                      true: "#6366F1",
                    }}
                    thumbColor={nativeAuthLogin ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
              </View>

              <View
                className={`p-4 rounded-2xl mb-4 backdrop-blur-xl ${
                  isDark
                    ? "bg-white/5 border border-white/10"
                    : "bg-gray-50/80 border border-gray-200/30"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {t("profile.transactionSecurity")}
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Require biometric authentication for payments
                    </Text>
                  </View>
                  <Switch
                    value={nativeAuthTransactions}
                    onValueChange={(value) =>
                      updateNativeAuthSettings(nativeAuthLogin, value)
                    }
                    trackColor={{
                      false: isDark ? "#374151" : "#E5E7EB",
                      true: "#6366F1",
                    }}
                    thumbColor={nativeAuthTransactions ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
              </View>

              <View
                className={`p-4 rounded-2xl backdrop-blur-xl ${
                  isDark
                    ? "bg-white/5 border border-white/10"
                    : "bg-gray-50/80 border border-gray-200/30"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {t("profile.visibleBalance")}
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      View or Hide Account Balance
                    </Text>
                  </View>
                  <Switch
                    value={visibleBalance}
                    onValueChange={updateVisibleBalance}
                    trackColor={{
                      false: isDark ? "#374151" : "#E5E7EB",
                      true: "#6366F1",
                    }}
                    thumbColor={visibleBalance ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
              </View>
            </View>

            {/* Language Selection */}
            <View className="mb-6">
              <Text
                className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                App Language
              </Text>
              <View className="gap-3">
                {Object.entries(languageNames).map(([key, { label, flag }]) => (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setLanguage(key as any)}
                    className={`p-4 rounded-2xl backdrop-blur-xl ${
                      language === key
                        ? isDark
                          ? "bg-lime-600 border-2 border-lime-400"
                          : "bg-lime-700 border-2 border-lime-500"
                        : isDark
                          ? "bg-white/5 border border-white/10"
                          : "bg-gray-50/80 border border-gray-200/30"
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Text className="text-2xl mr-3">{flag}</Text>
                        <Text
                          className={`text-lg font-semibold ${
                            language === key
                              ? "text-white"
                              : isDark
                                ? "text-white"
                                : "text-gray-900"
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
              </View>
            </View>

            {/* PIN Management */}
            <TouchableOpacity
              className={`p-4 rounded-2xl mb-4 backdrop-blur-xl ${
                isDark
                  ? "bg-indigo-600/30 border border-indigo-500/30"
                  : "bg-indigo-100 border border-indigo-200"
              }`}
              onPress={() => setShowPinModal(true)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons
                    name="key"
                    size={20}
                    color={isDark ? "#a78bfa" : "#7c3aed"}
                  />
                  <Text
                    className={`font-bold ml-3 text-lg ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Change Security PIN
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? "#a78bfa" : "#7c3aed"}
                />
              </View>
            </TouchableOpacity>

            {/* Transaction Limit */}
            <TouchableOpacity
              className={`p-4 rounded-2xl backdrop-blur-xl ${
                isDark
                  ? "bg-emerald-600/30 border border-emerald-500/30"
                  : "bg-emerald-100 border border-emerald-200"
              }`}
              onPress={() => setShowLimitModal(true)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons
                    name="card"
                    size={20}
                    color={isDark ? "#34d399" : "#059669"}
                  />
                  <Text
                    className={`font-bold ml-3 text-lg ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Transaction Limit
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? "#34d399" : "#059669"}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Wallet Modal */}
      <Modal
        visible={showWalletModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View
          className={`flex-1 justify-center items-center px-5 ${isDark ? "bg-black/80" : "bg-black/40"}`}
        >
          <View
            className={`rounded-2xl p-6 w-full max-w-sm backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/95 border border-gray-200/50"
            }`}
          >
            {user?.AccountId ? (
              <>
                <View className="items-center mb-6">
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                      isDark ? "bg-lime-500/20" : "bg-lime-100"
                    }`}
                  >
                    <Ionicons
                      name="wallet"
                      size={32}
                      color={isDark ? "#a78bfa" : "#7c3aed"}
                    />
                  </View>
                  <Text
                    className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Wallet Details
                  </Text>
                </View>

                <View
                  className={`p-4 rounded-xl mb-4 backdrop-blur-xl ${
                    isDark
                      ? "bg-white/5 border border-white/10"
                      : "bg-gray-50/80 border border-gray-200/30"
                  }`}
                >
                  <Text
                    className={`text-sm mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Account ID
                  </Text>
                  <Text
                    className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {user.AccountId}
                  </Text>
                </View>

                <View
                  className={`p-4 rounded-xl mb-6 backdrop-blur-xl ${
                    isDark
                      ? "bg-white/5 border border-white/10"
                      : "bg-gray-50/80 border border-gray-200/30"
                  }`}
                >
                  <Text
                    className={`text-sm mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Balance
                  </Text>
                  <Text
                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    ₦{"0.00"}
                  </Text>
                </View>

                <TouchableOpacity
                  className={`p-4 rounded-xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                  onPress={() => setShowWalletModal(false)}
                >
                  <Text className="text-white text-center font-bold">
                    Close
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View className="items-center mb-6">
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                      isDark ? "bg-orange-500/20" : "bg-orange-100"
                    }`}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={32}
                      color={isDark ? "#fb923c" : "#ea580c"}
                    />
                  </View>
                  <Text
                    className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Setup Wallet
                  </Text>
                  <Text
                    className={`text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    You need to setup your wallet account to start using payment
                    features
                  </Text>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className={`flex-1 p-4 rounded-xl backdrop-blur-xl ${
                      isDark
                        ? "bg-white/5 border border-white/10"
                        : "bg-gray-100 border border-gray-200"
                    }`}
                    onPress={() => setShowWalletModal(false)}
                  >
                    <Text
                      className={`text-center font-bold ${isDark ? "text-white" : "text-gray-800"}`}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 p-4 rounded-xl ${isDark ? "bg-orange-600" : "bg-orange-700"}`}
                    onPress={() => {
                      setShowWalletModal(false);
                      // Navigate to wallet setup
                    }}
                  >
                    <Text className="text-white text-center font-bold">
                      Setup Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Transaction Limit Modal */}
      <Modal
        visible={showLimitModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View
          className={`flex-1 p-2 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
        >
          <SafeAreaView className="flex-1">
            <View className="flex-1 px-6 pt-4">
              <View className="flex-row items-center justify-between mb-6">
                <Text
                  className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Transaction Limit
                </Text>
                <TouchableOpacity onPress={() => setShowLimitModal(false)}>
                  <Ionicons
                    name="close"
                    size={28}
                    color={isDark ? "#fff" : "#000"}
                  />
                </TouchableOpacity>
              </View>

              <View className="mb-6">
                <Text
                  className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Daily Limit
                </Text>
                <View
                  className={`flex-row items-center rounded-2xl ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50/80 border-2 border-gray-200"}`}
                >
                  <View className="bg-emerald-600 px-4 py-4 rounded-l-2xl">
                    <Text className="text-white font-bold text-xl">₦</Text>
                  </View>
                  <TextInput
                    className={`flex-1 p-4 text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                    value={dailyLimit}
                    onChangeText={setDailyLimit}
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text
                  className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Monthly Limit
                </Text>
                <View
                  className={`flex-row items-center rounded-2xl ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50/80 border-2 border-gray-200"}`}
                >
                  <View className="bg-emerald-600 px-4 py-4 rounded-l-2xl">
                    <Text className="text-white font-bold text-xl">₦</Text>
                  </View>
                  <TextInput
                    className={`flex-1 p-4 text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                    value={monthlyLimit}
                    onChangeText={setMonthlyLimit}
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                </View>
              </View>

              <TouchableOpacity
                className={`p-4 rounded-xl ${isDark ? "bg-emerald-600" : "bg-emerald-700"}`}
                onPress={() => {
                  handleLimitUpdate();
                  setShowLimitModal(false);
                }}
              >
                <Text className="text-white text-center font-bold text-lg">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* PIN Change Modal */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowPinModal(false);
          setOldPin("");
          setNewPin("");
          setConfirmPin("");
          setPinStep("old");
        }}
      >
        <View
          className={`flex-1 justify-center items-center px-5 ${isDark ? "bg-black/80" : "bg-black/40"}`}
        >
          <View
            className={`rounded-2xl p-6 w-full backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/80 border border-gray-200/50"
            }`}
          >
            <View className="items-center mb-6">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                  isDark ? "bg-indigo-500/20" : "bg-indigo-100"
                }`}
              >
                <Ionicons
                  name="key"
                  size={32}
                  color={isDark ? "#a78bfa" : "#7c3aed"}
                />
              </View>
              <Text
                className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {pinStep === "old" ? "Verify Current PIN" : "Set New PIN"}
              </Text>
              <Text
                className={`text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {pinStep === "old"
                  ? "Enter your current 6-digit PIN"
                  : "Enter and Confirm your New 6-digit PIN"}
              </Text>
            </View>

            {pinStep === "old" ? (
              <TextInput
                className={`p-4 rounded-xl mb-4 text-lg backdrop-blur-xl ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white"
                    : "bg-white border-2 border-gray-200 text-gray-900"
                }`}
                placeholder="Current PIN"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={oldPin}
                onChangeText={setOldPin}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry
                autoFocus
              />
            ) : (
              <>
                <TextInput
                  className={`p-4 rounded-xl mb-4 text-lg backdrop-blur-xl ${
                    isDark
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-white border-2 border-gray-200 text-gray-900"
                  }`}
                  placeholder="New PIN"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  value={newPin}
                  onChangeText={setNewPin}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                  autoFocus
                />
                <TextInput
                  className={`p-4 rounded-xl mb-4 text-lg backdrop-blur-xl ${
                    isDark
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-white border-2 border-gray-200 text-gray-900"
                  }`}
                  placeholder="Confirm New PIN"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  value={confirmPin}
                  onChangeText={setConfirmPin}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                />
              </>
            )}

            <View className="flex-row gap-2">
              <TouchableOpacity
                className={`flex-1 p-4 rounded-xl backdrop-blur-xl ${
                  isDark
                    ? "bg-white/5 border border-white/10"
                    : "bg-gray-100 border border-gray-200"
                }`}
                onPress={() => {
                  setShowPinModal(false);
                  setOldPin("");
                  setNewPin("");
                  setConfirmPin("");
                  setPinStep("old");
                }}
              >
                <Text
                  className={`text-center font-bold ${isDark ? "text-white" : "text-gray-800"}`}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 p-4 rounded-xl ${isDark ? "bg-indigo-600" : "bg-indigo-700"}`}
                onPress={handlePinChange}
              >
                <Text className="text-white text-center font-bold">
                  {pinStep === "old" ? "Continue" : "Update PIN"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
