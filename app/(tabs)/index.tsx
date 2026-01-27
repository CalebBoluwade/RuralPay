import { useAuth } from "@/components/context/AuthProvider";
import { useLanguage } from "@/components/context/LanguageContext";
import AccountService from "@/components/services/AccountService";
import { BankTransferService } from "@/components/services/BankTransferService";
import BalanceCard from "@/components/ui/BalanceCard";
import { ToastService } from "@/hooks/use-toast";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

export default function Index() {
  const router = useRouter();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [accounts, setAccounts] = useState<BalanceEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.goodMorning");
    if (hour < 18) return t("home.goodAfternoon");
    return t("home.goodEvening");
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      const [transactions, balance] = await Promise.all([
        BankTransferService.FetchRecentTransactions(2),
        AccountService.AccountBalance(),
      ]);

      setRecentTransactions(transactions);
      setAccounts(balance.slice(0, 3));
    } catch (error) {
      console.warn(error);
      ToastService.error("Failed to load account data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccountData();
    setRefreshing(false);
  };

  return (
    <View className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}>
      <ScrollView
        className="flex-1 pt-24"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#a78bfa" : "#7c3aed"}
            colors={[isDark ? "#a78bfa" : "#7c3aed"]}
          />
        }
      >
        <View className="flex flex-row items-center px-5 mb-4">
          <Text
            className={`text-xl ${isDark ? "text-white/80" : "text-black/80"}`}
          >
            {getGreeting()},{" "}
          </Text>
          <Text
            className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}
          >
            {user?.FirstName + " " + user?.LastName || "User Name"}
          </Text>
        </View>

        <BalanceCard showNFC accounts={accounts} loading={loading} />
        <View className="pt-15 px-5">
          {/* Quick Links */}
          <View className="mb-6 mt-3 px-2">
            <Text
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {t("home.quickLinks")}
            </Text>
            <View className="flex-row justify-between gap-2 mb-3">
              <TouchableOpacity
                className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                  isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-gray-50 border border-gray-200 shadow-sm"
                }`}
                onPress={() =>
                  router.push("/(transaction)/VoiceTransactionBanking")
                }
                style={{
                  shadowColor: isDark ? "#fff" : "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                }}
              >
                <Ionicons
                  name="mic-outline"
                  size={28}
                  color={isDark ? "#84cc16" : "#65a30d"}
                />
                <Text
                  className={`text-xs mt-2 font-semibold text-wrap break-words ${
                    isDark ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  {t("payments.voice")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                  isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-gray-50 border border-gray-200 shadow-sm"
                }`}
                onPress={() => router.push("/(transaction)/USSDPay")}
                style={{
                  shadowColor: isDark ? "#fff" : "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                }}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={28}
                  color={isDark ? "#fb923c" : "#ea580c"}
                />
                <Text
                  className={`text-xs mt-2 font-semibold ${
                    isDark ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  {t("payments.ussd")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                  isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-gray-50 border border-gray-200 shadow-sm"
                }`}
                onPress={() => router.push("/(transaction)/NFCPayments")}
                style={{
                  shadowColor: isDark ? "#fff" : "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                }}
              >
                <Ionicons
                  name="wallet-outline"
                  size={28}
                  color={isDark ? "#34d399" : "#059669"}
                />
                <Text
                  className={`text-xs mt-2 font-semibold ${
                    isDark ? "text-gray-200" : "text-gray-700"
                  }`}
                >
                  Quick Pay
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              className={`px-6 py-4 rounded-2xl backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200 shadow-sm"
              }`}
              onPress={() => router.push("/(transaction)/ManageLinkedAccounts")}
              style={{
                shadowColor: isDark ? "#fff" : "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
              }}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name="link"
                  size={24}
                  color={isDark ? "#60a5fa" : "#2563eb"}
                />
                <View className="flex-1">
                  <Text
                    className={`text-base font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Manage Linked Accounts
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Link & Manage your Bank Accounts
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-6 py-4 rounded-2xl backdrop-blur-xl mt-3 ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200 shadow-sm"
              }`}
              onPress={() => router.push("/(transaction)/SpendingTracker")}
              style={{
                shadowColor: isDark ? "#fff" : "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
              }}
            >
              <View className="flex-row items-center gap-3">
                <Ionicons
                  name="pie-chart"
                  size={24}
                  color={isDark ? "#34d399" : "#059669"}
                />
                <View className="flex-1">
                  <Text
                    className={`text-base font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Spending Tracker
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Track your Expenses & Spending
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View className="mb-6">
            <Text
              className={`text-lg font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Recent Transactions
            </Text>
            <View
              className={`rounded-2xl backdrop-blur-xl p-4 ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200 shadow-sm"
              }`}
            >
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction, index) => (
                  <TouchableOpacity
                    key={transaction.txId}
                    className={`flex-row justify-between py-4 ${
                      index !== recentTransactions.length - 1
                        ? isDark
                          ? "border-b border-white/10"
                          : "border-b border-gray-200/30"
                        : ""
                    }`}
                    onPress={() =>
                      router.push(`/(transaction)/${transaction.txId}`)
                    }
                  >
                    <View className="flex-1 flex-row items-center gap-3">
                      <View className="bg-indigo-600 rounded-full p-2">
                        <Ionicons
                          name="swap-vertical"
                          size={28}
                          color={"#fff"}
                        />
                      </View>

                      <View>
                        <Text
                          className={`text-sm font-semibold ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {transaction.merchantId}
                        </Text>

                        <Text
                          className={`text-xs mt-1 ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {transaction.txId.slice(0, 16)}...
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text
                        className={`text-base font-bold ${
                          isDark ? "text-red-400" : "text-red-600"
                        }`}
                      >
                        -₦{transaction.amount.toLocaleString()}
                      </Text>
                      <Text
                        className={`text-xs mt-1 ${
                          isDark ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View className="py-8 items-center">
                  <Ionicons
                    name="receipt-outline"
                    size={48}
                    color={isDark ? "#4b5563" : "#9ca3af"}
                  />
                  <Text
                    className={`text-sm font-medium mt-3 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    No Recent Transactions
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={loading} transparent animationType="fade">
        <View
          className={`flex-1 justify-center items-center ${
            isDark ? "bg-black/80" : "bg-black/50"
          }`}
        >
          <View
            className={`rounded-3xl p-8 items-center backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white border border-gray-200"
            }`}
          >
            <ActivityIndicator
              size="large"
              color={isDark ? "#a78bfa" : "#7c3aed"}
            />
            <Text
              className={`mt-4 text-base font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Loading...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
