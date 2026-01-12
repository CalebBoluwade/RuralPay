import { getDatabase } from "@/components/lib/utils";
import { BankTransferService } from "@/components/services/BankTransferService";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { formatAmount } from "@/lib/formatAmount";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TransactionHistory = () => {
  const router = useRouter();
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
        className="bg-white/80 backdrop-blur mx-4 mb-4 p-5 rounded-3xl border border-white/50 shadow-lg active:bg-white/90"
        onPress={() => router.push(`/(transaction)/${item.txId}`)}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View
              className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                isCredit
                  ? "bg-gradient-to-br from-green-400 to-emerald-500"
                  : "bg-gradient-to-br from-red-400 to-pink-500"
              }`}
            >
              <Text className="text-2xl">{typeInfo.emoji}</Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">
                {typeInfo.label}
              </Text>
              <Text className="text-sm text-gray-600">{item.merchantId}</Text>
            </View>
          </View>
          <Text
            className={`text-lg font-bold ${
              isCredit ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatAmount(item.amount, item.currency, true, isCredit)}
          </Text>
        </View>

        <View className="flex-row justify-between items-center pt-4 border-t border-gray-200">
          <Text className="text-sm text-gray-500">
            {new Date(item.timestamp * 1000).toLocaleDateString()} at{" "}
            {new Date(item.timestamp * 1000).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <View
            className={`px-3 py-1 rounded-full ${
              item.status === "COMPLETED"
                ? "bg-green-100 border border-green-200"
                : "bg-orange-100 border border-orange-200"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                item.status === "COMPLETED"
                  ? "text-green-700"
                  : "text-orange-700"
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
    <SafeAreaView className="flex-1">
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
          <View className="flex-1 justify-center items-center">
            <View className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center mb-6">
              <Text className="text-4xl">📊</Text>
            </View>
            <Text className="text-xl font-semibold text-gray-700 mb-2">
              No Transactions Yet
            </Text>
            <Text className="text-base text-gray-500 text-center px-8">
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
