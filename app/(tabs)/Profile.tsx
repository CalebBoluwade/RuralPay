import { useAuth } from "@/components/context/AuthProvider";
import { PinService } from "@/components/lib/SecureStorage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const {
    user,
    logout,
    nativeAuthLogin,
    nativeAuthTransactions,
    visibleBalance,
    updateNativeAuthSettings,
    updateVisibleBalance,
  } = useAuth();
  const [dailyLimit, setDailyLimit] = useState("500");
  const [monthlyLimit, setMonthlyLimit] = useState("5000");
  const [showPinChange, setShowPinChange] = useState(false);
  const [newPin, setNewPin] = useState("");

  const handlePinChange = async () => {
    if (newPin.length === 6) {
      await PinService.setPin(newPin);
      Alert.alert("Success", "PIN updated successfully");
      setNewPin("");
      setShowPinChange(false);
    } else {
      Alert.alert("Error", "PIN must be 6 digits");
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
    <SafeAreaView className="flex-1 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="px-6 pt-4">
          {/* Header Card */}
          <View className="bg-white/80 backdrop-blur rounded-3xl p-8 shadow-lg border border-white/50 mb-6">
            <View className="items-center">
              <View className="w-28 h-28 rounded-full bg-purple-600 justify-center items-center mb-6 shadow-xl">
                <Text className="text-4xl text-white font-bold drop-shadow-lg">
                  {(user?.FirstName?.[0] || "U") + (user?.LastName?.[0] || "N")}
                </Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                {user?.FirstName + " " + user?.LastName || "User Name"}
              </Text>
              <Text className="text-lg text-gray-600 mb-1">
                {user?.email || "user@example.com"}
              </Text>
              <View className="bg-indigo-100 px-4 py-2 rounded-full mt-2">
                <Text className="text-sm font-semibold text-indigo-700">
                  ID: {user?.AccountId ?? "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Security Settings */}
          <View className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50 mb-6">
            <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 rounded-2xl bg-black/10 items-center justify-center mr-4">
                <Ionicons
                  name="shield-checkmark-sharp"
                  size={24}
                  color="indigo"
                />
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                Security & Privacy
              </Text>
            </View>

            {/* Native Auth Toggles */}
            <View className="mb-6">
              <View className="bg-gray-50/80 p-4 rounded-2xl mb-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      Biometric Login
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Use fingerprint or face ID for secure login
                    </Text>
                  </View>
                  <Switch
                    value={nativeAuthLogin}
                    onValueChange={(value) =>
                      updateNativeAuthSettings(value, nativeAuthTransactions)
                    }
                    trackColor={{ false: "#E5E7EB", true: "#6366F1" }}
                    thumbColor={nativeAuthLogin ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
              </View>

              <View className="bg-gray-50/80 p-4 rounded-2xl mb-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      Transaction Security
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Require biometric authentication for payments
                    </Text>
                  </View>
                  <Switch
                    value={nativeAuthTransactions}
                    onValueChange={(value) =>
                      updateNativeAuthSettings(nativeAuthLogin, value)
                    }
                    trackColor={{ false: "#E5E7EB", true: "#6366F1" }}
                    thumbColor={nativeAuthTransactions ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
              </View>

              <View className="bg-gray-50/80 p-4 rounded-2xl">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900 mb-1">
                      Visible Balance
                    </Text>
                    <Text className="text-sm text-gray-600">
                      View or Hide Account Balance
                    </Text>
                  </View>
                  <Switch
                    value={visibleBalance}
                    onValueChange={updateVisibleBalance}
                    trackColor={{ false: "#E5E7EB", true: "#6366F1" }}
                    thumbColor={visibleBalance ? "#FFFFFF" : "#9CA3AF"}
                  />
                </View>
              </View>
            </View>

            {/* PIN Management */}
            <TouchableOpacity
              className="bg-indigo-800/30 p-4 rounded-2xl shadow-lg"
              onPress={() => setShowPinChange(!showPinChange)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="key" size={20} color="" />
                  <Text className="font-bold ml-3 text-lg">
                    Change Security PIN
                  </Text>
                </View>
                <Ionicons
                  name={showPinChange ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="white"
                />
              </View>
            </TouchableOpacity>

            {showPinChange && (
              <View className="mt-4 bg-gray-50/80 p-4 rounded-2xl">
                <TextInput
                  className="bg-white border-2 border-gray-200 p-4 rounded-xl text-gray-900 mb-4 text-lg"
                  placeholder="Enter new 6-digit PIN"
                  placeholderTextColor="#9CA3AF"
                  value={newPin}
                  onChangeText={setNewPin}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry
                />
                <TouchableOpacity
                  className="bg-emerald-600 p-4 rounded-xl shadow-lg"
                  onPress={handlePinChange}
                >
                  <Text className="text-white text-center font-bold text-lg">
                    Update PIN
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Card Limits */}
          <View className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50 mb-6">
            <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 items-center justify-center mr-4">
                <Ionicons name="card" size={24} color="indigo" />
              </View>
              <Text className="text-2xl font-bold text-gray-900">
                Spending Limits
              </Text>
            </View>

            <View>
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Daily Spending Limit
                </Text>
                <View className="flex-row items-center bg-gray-50/80 rounded-2xl border-2 border-gray-200">
                  <View className="bg-emerald-700 px-4 py-4 rounded-l-2xl">
                    <Text className="text-white font-bold text-xl">$</Text>
                  </View>
                  <TextInput
                    className="flex-1 p-4 text-gray-900 text-xl font-semibold"
                    value={dailyLimit}
                    onChangeText={setDailyLimit}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Monthly Spending Limit
                </Text>
                <View className="flex-row items-center bg-gray-50/80 rounded-2xl border-2 border-gray-200">
                  <View className="bg-emerald-700 px-4 py-4 rounded-l-2xl">
                    <Text className="text-white font-bold text-xl">$</Text>
                  </View>
                  <TextInput
                    className="flex-1 p-4 text-gray-900 text-xl font-semibold"
                    value={monthlyLimit}
                    onChangeText={setMonthlyLimit}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                className="bg-emerald-800 p-4 rounded-2xl shadow-lg"
                onPress={handleLimitUpdate}
              >
                <Text className="text-white text-center font-bold text-lg">
                  Save Spending Limits
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            className="bg-red-700 p-5 rounded-3xl shadow-lg mb-4"
            onPress={handleLogout}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out" size={24} color="white" />
              <Text className="text-white text-center font-bold text-lg ml-3">
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
