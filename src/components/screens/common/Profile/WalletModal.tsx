import { AlertCircle, CreditCard, Store, Wallet } from "lucide-react-native";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

interface WalletModalProps {
  visible: boolean;
  isDark: boolean;
  user: any;
  dailyLimit: string;
  setDailyLimit: (text: string) => void;
  monthlyLimit: string;
  setMonthlyLimit: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function WalletModal({
  visible,
  isDark,
  user,
  dailyLimit,
  setDailyLimit,
  monthlyLimit,
  setMonthlyLimit,
  onClose,
  onSave,
}: WalletModalProps) {
  const hasWallet = !!user?.accountId;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className={`flex-1 p-6 pt-20 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
        {hasWallet ? (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
              onPress={onSave}
            >
              <Text className="text-black text-center font-bold">
                Save & Close
              </Text>
            </Pressable>
          </ScrollView>
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
                onPress={onClose}
              >
                <Text
                  className={`text-center font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 p-4 rounded-2xl bg-lime-400"
                onPress={onClose}
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
  );
}
