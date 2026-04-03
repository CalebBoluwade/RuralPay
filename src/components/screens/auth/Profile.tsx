import { useAuth } from "@/src/components/context/AuthSessionProvider";
import { useLanguage } from "@/src/components/context/LanguageContext";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { useIdentityGate } from "@/src/hooks/useIdentityGate";
import ToastService from "@/src/lib/services/ToastService";
import { biometricService, PinService } from "@/src/lib/utils/SecureStorage";
import * as LocalAuthentication from "expo-local-authentication";
import { router } from "expo-router";
import {
  AlertCircle,
  ChevronRight,
  CreditCard,
  Key,
  Link2,
  Mail,
  MessageSquareHeart,
  Pencil,
  Phone,
  Power,
  ShieldCheck,
  ShieldX,
  Store,
  User,
  Wallet,
} from "lucide-react-native";
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
  const [editedFirstName, setEditedFirstName] = useState(user?.firstName || "");
  const [editedLastName, setEditedLastName] = useState(user?.lastName || "");

  const { requireVerification } = useIdentityGate({ ttl: 3 * 60 * 1000 });

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
      await PinService.setPIN(newPin);
      ToastService.success("PIN Updated Successfully");

      setShowPinModal(false);
      setOldPin("");
      setNewPin("");
      setConfirmPin("");
      setPinStep("old");
    }
  };

  const handleLimitUpdate = () => {
    requireVerification(() => {
      // Only runs after liveness passes
      Alert.alert("Success", "Card limits Updated Successfully");
    });
  };

  const handleBiometricLoginToggle = async (value: boolean) => {
    if (value) {
      const isAvailable = await biometricService.isBiometricAvailable();
      if (!isAvailable) {
        ToastService.error("Biometric Authentication Is Not Available");
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
        ToastService.error("Biometric Authentication Is Not Available");
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
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const handleEdit = () => {
    setEditedFirstName(user?.firstName || "");
    setEditedLastName(user?.lastName || "");
    setShowEditModal(true);
  };

  const handleSaveDetails = () => {
    // TODO: Add API call to update user details
    if (user) {
      user.firstName = editedFirstName;
      user.lastName = editedLastName;
    }
    ToastService.success("Profile Updated Successfully!");
    setShowEditModal(false);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
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
            className={`rounded-2xl px-6 py-3 mb-4 ${
              isDark
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            <View className="flex-row justify-between items-center">
              <View className="w-16 h-16 rounded-full bg-lime-400 justify-center items-center mb-4">
                <Text className="text-2xl text-white font-bold">
                  {(user?.firstName?.[0] || "U") + (user?.lastName?.[0] || "N")}
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-end gap-2 mb-4">
                <Pressable
                  className={`p-3 rounded-2xl ${
                    isDark
                      ? "bg-slate-800 border border-slate-700"
                      : "bg-slate-100 border border-slate-200"
                  }`}
                  onPress={handleEdit}
                >
                  <Pencil size={13} color={isDark ? "white" : "black"} />
                </Pressable>

                <Pressable
                  className={`p-3 rounded-2xl ${
                    isDark
                      ? "bg-slate-800 border border-slate-700"
                      : "bg-slate-100 border border-slate-200"
                  }`}
                  onPress={handleLogout}
                >
                  <Power size={16} color="#ef4444" />
                </Pressable>
              </View>
            </View>

            {/* Profile Info */}

            <View className="flex-row items-center gap-1 mb-2">
              <User size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
              <Text
                className={`text-xl font-brand font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {user?.firstName + " " + user?.lastName}
              </Text>
            </View>

            <View className="flex-row items-center gap-1 mb-2">
              <Mail size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
              <Text
                className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {user?.email}
              </Text>
            </View>

            <View className="flex-row items-center gap-1 mb-2">
              <ShieldCheck size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
              <Text
                className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {user?.BVN || "Not Provided"}
              </Text>
            </View>

            <View className="flex-row items-center gap-1 mb-2">
              <Phone size={18} color={isDark ? "#9ca3af" : "#6b7280"} />
              <Text
                className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {user?.phoneNumber}
              </Text>
            </View>

            <View className="flex-row items-center gap-2 mb-4">
              <View className="flex-row items-center gap-1 bg-lime-400/20 border border-lime-400/40 rounded-xl px-3 py-1">
                {user?.kycStatus === "VERIFIED" ? (
                  <ShieldCheck size={14} color="#84cc16" />
                ) : (
                  <ShieldX size={14} color="#84cc16" />
                )}
                <Text className={`text-lime-400 text-sm font-semibold`}>
                  {user?.kycLevel ?? "NOT VERIFIED"}
                </Text>
              </View>
              <View className="bg-slate-700/40 border border-slate-600/40 rounded-xl px-3 py-1">
                <Text
                  className={`text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  KYC Level {user?.kycLevel ?? 1}
                </Text>
              </View>
            </View>

            <Pressable
              className="bg-lime-400 rounded-2xl py-4"
              onPress={() => setShowWalletModal(true)}
              // activeOpacity={0.8}
            >
              <Text className="text-black text-center font-bold">
                {user?.accountId ? "View Wallet" : "Setup Wallet"}
              </Text>
            </Pressable>
          </View>

          <Pressable
            className={`px-6 py-3 mb-4 rounded-2xl ${
              isDark
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
            onPress={() => router.push("/user/manageLinkedAccounts")}
          >
            <View className="flex-row items-center gap-4">
              <Link2 size={26} color={isDark ? "#a3e635" : "#65a30d"} />
              <View className="flex-1">
                <Text
                  className={`text-lg font-brand font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Manage Linked Accounts
                </Text>
                <Text
                  className={`text-sm mt-1 ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Link & Manage your Bank Accounts
                </Text>
              </View>
              <ChevronRight size={22} color={isDark ? "#a3e635" : "#65a30d"} />
            </View>
          </Pressable>

          <Pressable
            className={`px-6 py-3 mb-4 rounded-2xl ${
              isDark
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
            onPress={() => router.push("/feedback")}
          >
            <View className="flex-row items-center gap-4">
              <MessageSquareHeart
                size={26}
                color={isDark ? "#a3e635" : "#65a30d"}
              />
              <View className="flex-1">
                <Text
                  className={`text-lg font-brand font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Share Feedback
                </Text>
                <Text
                  className={`text-sm mt-1 ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Help us build the product you deserve
                </Text>
              </View>
              <ChevronRight size={22} color={isDark ? "#a3e635" : "#65a30d"} />
            </View>
          </Pressable>

          {/* Security Settings */}
          <View
            className={`rounded-2xl p-6 mb-6 ${
              isDark
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            <View className="flex-row items-center mb-6">
              <View
                className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                  isDark ? "bg-slate-800" : "bg-slate-100"
                }`}
              >
                <ShieldCheck size={24} color={isDark ? "#84cc16" : "#65a30d"} />
              </View>
              <Text
                className={`text-xl font-brand font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {t("profile.security")}
              </Text>
            </View>

            {/* Native Auth Toggles */}
            <View className="mb-6">
              <View
                className={`p-4 rounded-2xl mb-4 ${
                  isDark
                    ? "bg-slate-800 border border-slate-700"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t("profile.biometricLogin")}
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
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
                className={`p-4 rounded-2xl mb-4 ${
                  isDark
                    ? "bg-slate-800 border border-slate-700"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t("profile.transactionSecurity")}
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
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
                className={`p-4 rounded-2xl ${
                  isDark
                    ? "bg-slate-800 border border-slate-700"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {t("profile.visibleBalance")}
                    </Text>
                    <Text
                      className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
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
              className={`p-4 rounded-2xl ${
                isDark
                  ? "bg-lime-400/10 border border-lime-400/30"
                  : "bg-lime-50 border border-lime-200"
              }`}
              onPress={() => setShowPinModal(true)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Key size={20} color={isDark ? "#84cc16" : "#65a30d"} />
                  <Text
                    className={`font-bold ml-3 text-lg ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Change Security PIN
                  </Text>
                </View>
                <ChevronRight
                  size={20}
                  color={isDark ? "#84cc16" : "#65a30d"}
                />
              </View>
            </Pressable>
          </View>
        </View>

        <View>
          <Text className="text-center text-red-400 text-lg font-semibold">
            Delete Account
          </Text>
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
            className={`rounded-2xl p-6 w-full ${
              isDark
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            <View className="items-center mb-6">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                  isDark ? "bg-lime-500/20" : "bg-lime-100"
                }`}
              >
                <Pencil size={28} color={isDark ? "#84cc16" : "#65a30d"} />
              </View>
              <Text
                className={`text-2xl font-brand font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Edit Profile
              </Text>
              <Text
                className={`text-center mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                Update your personal information
              </Text>
            </View>

            <View className="mb-4">
              <Text
                className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                First Name
              </Text>
              <TextInput
                className={`p-4 rounded-2xl text-lg ${
                  isDark
                    ? "bg-slate-800 border border-slate-700 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-900"
                }`}
                placeholder="Enter first name"
                placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                value={editedFirstName}
                onChangeText={setEditedFirstName}
                autoCapitalize="words"
              />
            </View>

            <View className="mb-6">
              <Text
                className={`text-sm font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
              >
                Last Name
              </Text>
              <TextInput
                className={`p-4 rounded-2xl text-lg ${
                  isDark
                    ? "bg-slate-800 border border-slate-700 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-900"
                }`}
                placeholder="Enter last name"
                placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                value={editedLastName}
                onChangeText={setEditedLastName}
                autoCapitalize="words"
              />
            </View>

            <View className="flex-row gap-3">
              <Pressable
                className={`flex-1 p-4 rounded-2xl ${
                  isDark
                    ? "bg-slate-800 border border-slate-700"
                    : "bg-slate-100 border border-slate-200"
                }`}
                onPress={() => setShowEditModal(false)}
              >
                <Text
                  className={`text-center font-bold text-base ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 p-4 rounded-2xl bg-lime-400"
                onPress={handleSaveDetails}
              >
                <Text className="text-black text-center font-bold text-base">
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
          className={`flex-1 p-6 pt-20 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
        >
          {/* <View
          className={`rounded-2xl p-6 w-full max-w-sm backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/95 border border-gray-200/50"
          }`}
        > */}
          {user?.accountId ? (
            <>
              <View className="items-center mb-6">
                <View
                  className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                    isDark ? "bg-lime-400/20" : "bg-lime-100"
                  }`}
                >
                  <Wallet size={32} color={isDark ? "#a3e635" : "#65a30d"} />
                </View>
                <Text
                  className={`text-2xl font-brand font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  Wallet Details
                </Text>
              </View>

              <View
                className={`p-4 rounded-2xl mb-4 ${
                  isDark
                    ? "bg-slate-900 border border-slate-700"
                    : "bg-white border border-slate-200"
                }`}
              >
                <Text
                  className={`text-sm mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Account ID
                </Text>
                <Text
                  className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {user.accountId}
                </Text>
              </View>

              <View
                className={`p-4 rounded-2xl mb-4 ${
                  isDark
                    ? "bg-slate-900 border border-slate-700"
                    : "bg-white border border-slate-200"
                }`}
              >
                <Text
                  className={`text-sm mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  Balance
                </Text>
                <Text
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  ₦{"0.00"}
                </Text>
              </View>

              {/* Merchant Information */}
              <View
                className={`p-6 rounded-2xl mb-6 ${
                  isDark
                    ? "bg-slate-900 border border-slate-700"
                    : "bg-white border border-slate-200"
                }`}
              >
                <View className="flex-row items-center mb-6">
                  <Store size={24} color={isDark ? "#a3e635" : "#65a30d"} />
                  <Text
                    className={`text-xl font-brand font-bold ml-3 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Merchant Info
                  </Text>
                </View>
                <View className="space-y-4">
                  <View className="flex-row justify-between py-2">
                    <Text
                      className={`text-base font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Business Name
                    </Text>
                    <Text
                      className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {user?.firstName + " " + user?.lastName || "N/A"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between py-2">
                    <Text
                      className={`text-base font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Merchant ID
                    </Text>
                    <Text
                      className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {user?.accountId?.slice(-8) || "N/A"}
                    </Text>
                  </View>
                  <View className="flex-row justify-between py-2">
                    <Text
                      className={`text-base font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Status
                    </Text>
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 bg-lime-400 rounded-full mr-3" />
                      <Text
                        className={`text-base font-bold ${isDark ? "text-lime-400" : "text-lime-600"}`}
                      >
                        Active
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Transaction Limits */}
              <View
                className={`p-6 rounded-2xl mb-6 ${
                  isDark
                    ? "bg-slate-900 border border-slate-700"
                    : "bg-white border border-slate-200"
                }`}
              >
                <View className="flex-row items-center mb-6">
                  <CreditCard
                    size={24}
                    color={isDark ? "#a3e635" : "#65a30d"}
                  />
                  <Text
                    className={`text-xl font-brand font-bold ml-3 ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Transaction Limits
                  </Text>
                </View>
                <View className="space-y-4">
                  <View className="py-2">
                    <Text
                      className={`text-base font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Daily Limit
                    </Text>
                    <View
                      className={`flex-row items-center rounded-2xl ${
                        isDark
                          ? "bg-slate-800 border border-slate-700"
                          : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <View className="bg-lime-400 px-3 py-3 rounded-l-2xl">
                        <Text className="text-black font-bold text-lg">₦</Text>
                      </View>
                      <TextInput
                        className={`flex-1 p-3 text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                        value={dailyLimit}
                        onChangeText={setDailyLimit}
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                      />
                    </View>
                  </View>
                  <View className="py-2">
                    <Text
                      className={`text-base font-semibold mb-2 ${isDark ? "text-slate-300" : "text-slate-700"}`}
                    >
                      Monthly Limit
                    </Text>
                    <View
                      className={`flex-row items-center rounded-2xl ${
                        isDark
                          ? "bg-slate-800 border border-slate-700"
                          : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <View className="bg-lime-400 px-3 py-3 rounded-l-2xl">
                        <Text className="text-black font-bold text-lg">₦</Text>
                      </View>
                      <TextInput
                        className={`flex-1 p-3 text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                        value={monthlyLimit}
                        onChangeText={setMonthlyLimit}
                        keyboardType="numeric"
                        placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                className="bg-lime-400 rounded-2xl py-4"
                onPress={() => {
                  handleLimitUpdate();
                  setShowWalletModal(false);
                }}
              >
                <Text className="text-black text-center font-bold">
                  Save & Close
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <View className="items-center mb-6">
                <View
                  className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                    isDark ? "bg-lime-400/20" : "bg-lime-100"
                  }`}
                >
                  <AlertCircle
                    size={32}
                    color={isDark ? "#a3e635" : "#65a30d"}
                  />
                </View>
                <Text
                  className={`text-2xl font-brand font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Setup Wallet
                </Text>
                <Text
                  className={`text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  You need to setup your wallet account to start using payment
                  features
                </Text>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  className={`flex-1 p-4 rounded-2xl ${
                    isDark
                      ? "bg-slate-800 border border-slate-700"
                      : "bg-slate-100 border border-slate-200"
                  }`}
                  onPress={() => setShowWalletModal(false)}
                >
                  <Text
                    className={`text-center font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  className="flex-1 p-4 rounded-2xl bg-lime-400"
                  onPress={() => {
                    setShowWalletModal(false);
                  }}
                >
                  <Text className="text-black text-center font-bold">
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
            className={`rounded-2xl p-6 w-full ${
              isDark
                ? "bg-slate-900 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            <View className="items-center mb-6">
              <View
                className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                  isDark ? "bg-lime-400/20" : "bg-lime-100"
                }`}
              >
                <Key size={32} color={isDark ? "#a3e635" : "#65a30d"} />
              </View>
              <Text
                className={`text-2xl font-brand font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {pinStep === "old" ? "Verify Current PIN" : "Set New PIN"}
              </Text>
              <Text
                className={`text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}
              >
                {pinStep === "old"
                  ? "Enter your current 6-digit PIN"
                  : "Enter and Confirm your New 6-digit PIN"}
              </Text>
            </View>

            {pinStep === "old" ? (
              <TextInput
                className={`p-4 rounded-2xl mb-4 text-lg ${
                  isDark
                    ? "bg-slate-800 border border-slate-700 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-900"
                }`}
                placeholder="Current PIN"
                placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
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
                  className={`p-4 rounded-2xl mb-4 text-lg ${
                    isDark
                      ? "bg-slate-800 border border-slate-700 text-white"
                      : "bg-slate-50 border border-slate-200 text-slate-900"
                  }`}
                  placeholder="New PIN"
                  placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
                  value={newPin}
                  onChangeText={setNewPin}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                  autoFocus
                />
                <TextInput
                  className={`p-4 rounded-2xl mb-4 text-lg ${
                    isDark
                      ? "bg-slate-800 border border-slate-700 text-white"
                      : "bg-slate-50 border border-slate-200 text-slate-900"
                  }`}
                  placeholder="Confirm New PIN"
                  placeholderTextColor={isDark ? "#94a3b8" : "#64748b"}
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
                className={`flex-1 p-4 rounded-2xl ${
                  isDark
                    ? "bg-slate-800 border border-slate-700"
                    : "bg-slate-100 border border-slate-200"
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
                  className={`text-center font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 p-4 rounded-2xl bg-lime-400"
                onPress={handlePinChange}
              >
                <Text className="text-black text-center font-bold">
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
