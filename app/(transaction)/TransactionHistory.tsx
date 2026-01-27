import { BankTransferService } from "@/components/services/BankTransferService";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { formatAmount } from "@/lib/formatAmount";
import { getDatabase } from "@/lib/utils";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TransactionHistory = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setRefreshing(true);

      const db = await getDatabase(null);
      if (!db) return;

      const transactions = await BankTransferService.FetchAllTransactions();

      setTransactions(transactions);
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "P2P_DEBIT":
        return { emoji: "📤", label: "Sent Money" };
      case "P2P_CREDIT":
        return { emoji: "📥", label: "Received Money" };
      case "DEBIT":
        return { emoji: "💳", label: "Card Payment" };
      case "CREDIT":
        return { emoji: "💰", label: "Credit Added" };
      default:
        return { emoji: "📝", label: "Transaction" };
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const typeInfo = getTransactionTypeLabel(item.txType);
    const isCredit = (item.txType || "DEBIT").includes("CREDIT");

    return (
      <TouchableOpacity
        className={`mx-4 mb-4 p-5 rounded-2xl backdrop-blur-xl ${
          isDark
            ? "bg-white/10 border border-white/20"
            : "bg-white/60 border border-gray-200/50 shadow-sm"
        }`}
        onPress={() => router.push(`/(transaction)/${item.txId}`)}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View
              className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                isCredit ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <Text className="text-2xl">{typeInfo.emoji}</Text>
            </View>
            <View>
              <Text
                className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {typeInfo.label}
              </Text>
              <Text
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {item.merchantId}
              </Text>
            </View>
          </View>
          <Text
            className={`text-lg font-bold ${
              isCredit ? "text-green-500" : "text-red-500"
            }`}
          >
            {formatAmount(item.amount, item.currency, true, isCredit)}
          </Text>
        </View>

        <View
          className={`flex-row justify-between items-center pt-4 border-t ${
            isDark ? "border-white/10" : "border-gray-200"
          }`}
        >
          <Text
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            {new Date(item.timestamp * 1000).toLocaleDateString()} at{" "}
            {new Date(item.timestamp * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <View
            className={`px-3 py-1 rounded-full ${
              item.status === "COMPLETED"
                ? isDark
                  ? "bg-green-500/20 border border-green-500/30"
                  : "bg-green-100 border border-green-200"
                : isDark
                  ? "bg-orange-500/20 border border-orange-500/30"
                  : "bg-orange-100 border border-orange-200"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                item.status === "COMPLETED"
                  ? "text-green-500"
                  : "text-orange-500"
              }`}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Transaction History"
        subtitle="View all your recent transactions"
        onBack={() => router.back()}
      />

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.txId}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTransactions}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20">
            <View
              className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
                isDark ? "bg-white/10" : "bg-gray-100"
              }`}
            >
              <Text className="text-4xl">📊</Text>
            </View>
            <Text
              className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-700"}`}
            >
              No Transactions Yet
            </Text>
            <Text
              className={`text-base text-center px-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Your transaction history will appear here once you start making
              payments
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

export default TransactionHistory;
