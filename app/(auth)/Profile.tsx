import { useAuth } from "@/components/context/AuthProvider";
import { useLanguage } from "@/components/context/LanguageContext";
import ScreenHeader from "@/components/ui/ScreenHeader";
import ToastService from "@/lib/services/ToastService";
import { biometricService, PinService } from "@/lib/utils/SecureStorage";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
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
  const { t } = useLanguage();
  const [dailyLimit, setDailyLimit] = useState("500");
  const [monthlyLimit, setMonthlyLimit] = useState("5000");
  const [showPinModal, setShowPinModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedFirstName, setEditedFirstName] = useState(user?.FirstName || "");
  const [editedLastName, setEditedLastName] = useState(user?.LastName || "");

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
      const isValid = await PinService.ValidatePin(oldPin);
      if (!isValid) {
        ToastService.error("Current PIN is Incorrect");
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
      ToastService.success("PIN Updated Successfully");

      setShowPinModal(false);
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setPinStep("old");
    }
  };

  const handleLimitUpdate = () => {
    Alert.alert("Success", "Card limits Updated Successfully");
  };

  const handleBiometricLoginToggle = async (value: boolean) => {
    if (value) {
      const isAvailable = await biometricService.isBiometricAvailable();
      if (!isAvailable) {
        ToastService.error("Biometric authentication is not available");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable Biometric Login",
        fallbackLabel: "Use passcode",
      });

      if (!result.success) {
        ToastService.error("Authentication failed");
        return;
      }
    }
    await updateNativeAuthSettings(value, nativeAuthTransactions);
  };

  const handleTransactionSecurityToggle = async (value: boolean) => {
    if (value) {
      const isAvailable = await biometricService.isBiometricAvailable();
      if (!isAvailable) {
        ToastService.error("Biometric authentication is not available");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable Transaction Security",
        fallbackLabel: "Use passcode",
      });

      if (!result.success) {
        ToastService.error("Authentication failed");
        return;
      }
    }
    await updateNativeAuthSettings(nativeAuthLogin, value);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/Login");
        },
      },
    ]);
  };

  const handleEdit = () => {
    setEditedFirstName(user?.FirstName || "");
    setEditedLastName(user?.LastName || "");
    setShowEditModal(true);
  };

  const handleSaveDetails = () => {
    // TODO: Add API call to update user details
    if (user) {
      user.FirstName = editedFirstName;
      user.LastName = editedLastName;
    }
    ToastService.success("Profile Updated Successfully!");
    setShowEditModal(false);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Profile"
        subtitle="Everything You"
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-6 pt-4">
          {/* Header Card */}
          <View
            className={`rounded-2xl p-6 mb-4 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/95 border border-gray-200/50 shadow-sm"
            }`}
          >
            <View className="flex-row justify-between items-center">
              <View className="w-16 h-16 rounded-full bg-lime-600 justify-center items-center mb-4">
                <Text className="text-2xl text-white font-bold">
                  {(user?.FirstName?.[0] || "U") + (user?.LastName?.[0] || "N")}
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-end gap-2 mb-4">
                <Pressable
                  className={`p-3 rounded-xl ${
                    isDark ? "bg-white/10" : "bg-gray-100"
                  }`}
                  onPress={handleEdit}
                  // activeOpacity={0.7}
                >
                  <Feather
                    name="edit-2"
                    size={18}
                    color={isDark ? "white" : "black"}
                  />
                </Pressable>

                <Pressable
                  className={`p-3 rounded-xl ${
                    isDark ? "bg-red-500/20" : "bg-red-100"
                  }`}
                  onPress={handleLogout}
                  // activeOpacity={0.7}
                >
                  <Ionicons name="power" size={20} color="#ef4444" />
                </Pressable>
              </View>
            </View>

            {/* Profile Info */}

            <View className="flex-row items-center gap-1 mb-2">
              <Ionicons
                name="person-outline"
                size={18}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
              <Text
                className={`text-xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {user?.FirstName + " " + user?.LastName}
              </Text>
            </View>

            <View className="flex-row items-center gap-1 mb-2">
              <Ionicons
                name="mail"
                size={18}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
              <Text
                className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {user?.email}
              </Text>
            </View>

            <View className="flex-row items-center gap-1 mb-4">
              <Ionicons
                name="call"
                size={18}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
              <Text
                className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {user?.phoneNumber}
              </Text>
            </View>

            <Pressable
              className={`px-6 py-3 rounded-xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
              onPress={() => setShowWalletModal(true)}
              // activeOpacity={0.8}
            >
              <Text className="text-white font-bold">
                {user?.AccountId ? "View Wallet" : "Setup Wallet"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            className={`px-6 py-5 mb-4 rounded-2xl backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-gray-50 border border-gray-200 shadow-sm"
            }`}
            onPress={() => router.push("/(auth)/ManageLinkedAccounts")}
            // activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-4">
              <Ionicons
                name="link"
                size={26}
                color={isDark ? "#60a5fa" : "#2563eb"}
              />
              <View className="flex-1">
                <Text
                  className={`text-lg font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Manage Linked Accounts
                </Text>
                <Text
                  className={`text-sm mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Link & Manage your Bank Accounts
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={22}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
            </View>
          </Pressable>

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
                  color={isDark ? "#84cc16" : "#65a30d"}
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
                    onValueChange={handleBiometricLoginToggle}
                    trackColor={{
                      false: isDark ? "#374151" : "#E5E7EB",
                      true: "#84cc16",
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
                    onValueChange={handleTransactionSecurityToggle}
                    trackColor={{
                      false: isDark ? "#374151" : "#E5E7EB",
                      true: "#84cc16",
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
                      true: "#84cc16",
                    }}
                    thumbColor={visibleBalance ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
              </View>
            </View>

            {/* PIN Management */}
            <Pressable
              className={`p-4 rounded-2xl backdrop-blur-xl ${
                isDark
                  ? "bg-lime-600/30 border border-lime-500/30"
                  : "bg-lime-100 border border-lime-200"
              }`}
              onPress={() => setShowPinModal(true)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons
                    name="key"
                    size={20}
                    color={isDark ? "#84cc16" : "#65a30d"}
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
                  color={isDark ? "#84cc16" : "#65a30d"}
                />
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View
          className={`flex-1 justify-center items-center px-5 ${isDark ? "bg-black/80" : "bg-black/40"}`}
        >
          <View
            className={`rounded-2xl p-6 w-full backdrop-blur-xl ${
              isDark
                ? "bg-gray-900 border border-white/20"
                : "bg-white border border-gray-200/50"
            }`}
          >
            <View className="items-center mb-6">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                  isDark ? "bg-lime-500/20" : "bg-lime-100"
                }`}
              >
                <Feather
                  name="edit-2"
                  size={28}
                  color={isDark ? "#84cc16" : "#65a30d"}
                />
              </View>
              <Text
                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Edit Profile
              </Text>
              <Text
                className={`text-center mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Update your personal information
              </Text>
            </View>

            <View className="mb-4">
              <Text
                className={`text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                First Name
              </Text>
              <TextInput
                className={`p-4 rounded-xl text-lg ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white"
                    : "bg-gray-50 border-2 border-gray-200 text-gray-900"
                }`}
                placeholder="Enter first name"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={editedFirstName}
                onChangeText={setEditedFirstName}
                autoCapitalize="words"
              />
            </View>

            <View className="mb-6">
              <Text
                className={`text-sm font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Last Name
              </Text>
              <TextInput
                className={`p-4 rounded-xl text-lg ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white"
                    : "bg-gray-50 border-2 border-gray-200 text-gray-900"
                }`}
                placeholder="Enter last name"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={editedLastName}
                onChangeText={setEditedLastName}
                autoCapitalize="words"
              />
            </View>

            <View className="flex-row gap-3">
              <Pressable
                className={`flex-1 p-4 rounded-xl ${
                  isDark
                    ? "bg-white/5 border border-white/10"
                    : "bg-gray-100 border border-gray-200"
                }`}
                onPress={() => setShowEditModal(false)}
                // activeOpacity={0.7}
              >
                <Text
                  className={`text-center font-bold text-base ${isDark ? "text-white" : "text-gray-800"}`}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 p-4 rounded-xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                onPress={handleSaveDetails}
                // activeOpacity={0.8}
              >
                <Text className="text-white text-center font-bold text-base">
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Wallet Modal */}
      <Modal
        visible={showWalletModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View
          className={`flex-1 p-6 pt-20 ${isDark ? "bg-black/80" : "bg-black/40"}`}
        >
          {/* <View
          className={`rounded-2xl p-6 w-full max-w-sm backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/95 border border-gray-200/50"
          }`}
        > */}
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
                    color={isDark ? "#ffffff" : "#7c3aed"}
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
                className={`p-4 rounded-xl mb-4 backdrop-blur-xl ${
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

              {/* Merchant Information */}
              <View
                className={`p-6 rounded-xl mb-6 backdrop-blur-xl ${
                  isDark
                    ? "bg-blue-600/20 border border-blue-500/30"
                    : "bg-blue-50/80 border border-blue-200/50"
                }`}
              >
                <View className="flex-row items-center mb-6">
                  <Ionicons
                    name="storefront"
                    size={24}
                    color={isDark ? "#60a5fa" : "#2563eb"}
                  />
                  <Text
                    className={`text-xl font-bold ml-3 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Merchant Info
                  </Text>
                </View>
                <View className="space-y-4">
                  <View className="flex-row justify-between py-2">
                    <Text
                      className={`text-base font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Business Name
                    </Text>
                    <Text
                      className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {user?.FirstName + " " + user?.LastName || "N/A"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between py-2">
                    <Text
                      className={`text-base font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Merchant ID
                    </Text>
                    <Text
                      className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {user?.AccountId?.slice(-8) || "N/A"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between py-2">
                    <Text
                      className={`text-base font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Status
                    </Text>
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                      <Text
                        className={`text-base font-bold ${isDark ? "text-green-400" : "text-green-600"}`}
                      >
                        Active
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Transaction Limits */}
              <View
                className={`p-6 rounded-xl mb-6 backdrop-blur-xl ${
                  isDark
                    ? "bg-emerald-600/20 border border-emerald-500/30"
                    : "bg-emerald-50/80 border border-emerald-200/50"
                }`}
              >
                <View className="flex-row items-center mb-6">
                  <Ionicons
                    name="card"
                    size={24}
                    color={isDark ? "#34d399" : "#059669"}
                  />
                  <Text
                    className={`text-xl font-bold ml-3 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Transaction Limits
                  </Text>
                </View>
                <View className="space-y-4">
                  <View className="py-2">
                    <Text
                      className={`text-base font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Daily Limit
                    </Text>
                    <View
                      className={`flex-row items-center rounded-xl ${
                        isDark
                          ? "bg-white/10 border border-white/20"
                          : "bg-gray-50/80 border border-gray-200"
                      }`}
                    >
                      <View className="bg-emerald-600 px-3 py-3 rounded-l-xl">
                        <Text className="text-white font-bold text-lg">₦</Text>
                      </View>
                      <TextInput
                        className={`flex-1 p-3 text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        value={dailyLimit}
                        onChangeText={setDailyLimit}
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                    </View>
                  </View>
                  <View className="py-2">
                    <Text
                      className={`text-base font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Monthly Limit
                    </Text>
                    <View
                      className={`flex-row items-center rounded-xl ${
                        isDark
                          ? "bg-white/10 border border-white/20"
                          : "bg-gray-50/80 border border-gray-200"
                      }`}
                    >
                      <View className="bg-emerald-600 px-3 py-3 rounded-l-xl">
                        <Text className="text-white font-bold text-lg">₦</Text>
                      </View>
                      <TextInput
                        className={`flex-1 p-3 text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        value={monthlyLimit}
                        onChangeText={setMonthlyLimit}
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                className={`p-4 rounded-xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                onPress={() => {
                  handleLimitUpdate();
                  setShowWalletModal(false);
                }}
              >
                <Text className="text-white text-center font-bold">
                  Save & Close
                </Text>
              </Pressable>
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
                <Pressable
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
                </Pressable>
                <Pressable
                  className={`flex-1 p-4 rounded-xl ${isDark ? "bg-orange-600" : "bg-orange-700"}`}
                  onPress={() => {
                    setShowWalletModal(false);
                    // Navigate to wallet setup
                  }}
                >
                  <Text className="text-white text-center font-bold">
                    Setup Now
                  </Text>
                </Pressable>
              </View>
            </>
          )}
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
                  isDark ? "bg-lime-500/20" : "bg-lime-100"
                }`}
              >
                <Ionicons
                  name="key"
                  size={32}
                  color={isDark ? "#84cc16" : "#65a30d"}
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
              <Pressable
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
              </Pressable>
              <Pressable
                className={`flex-1 p-4 rounded-xl ${isDark ? "bg-lime-600" : "bg-lime-700"}`}
                onPress={handlePinChange}
              >
                <Text className="text-white text-center font-bold">
                  {pinStep === "old" ? "Continue" : "Update PIN"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
