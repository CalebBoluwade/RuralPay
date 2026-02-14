import ScreenHeader from "@/components/ui/ScreenHeader";
import PaymentService from "@/lib/services/PaymentService";
import { getDatabase } from "@/lib/utils";
import { formatAmount } from "@/lib/utils/formatAmount";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "expo-datepicker";
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
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionHistory[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setRefreshing(true);

      const db = await getDatabase(null);
      if (!db) return;

      const transactions = await PaymentService.FetchAllTransactions();

      console.log(transactions);

      setTransactions(transactions);
      setFilteredTransactions(transactions);
    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterTransactions = () => {
    if (!startDate && !endDate) {
      setFilteredTransactions(transactions);
      return;
    }

    const filtered = transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.transactionDate);
      const start = startDate ? new Date(startDate.setHours(0, 0, 0, 0)) : null;
      const end = endDate ? new Date(endDate.setHours(23, 59, 59, 999)) : null;

      if (start && end) {
        return transactionDate >= start && transactionDate <= end;
      } else if (start) {
        return transactionDate >= start;
      } else if (end) {
        return transactionDate <= end;
      }
      return true;
    });

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setFilteredTransactions(transactions);
  };

  useEffect(() => {
    filterTransactions();
  }, [startDate, endDate, transactions]);

  const getTransactionTypeLabel = (txType: TransactionType) => {
    switch (txType) {
      case "P2P_DEBIT":
        return { icon: "arrow-down-outline" as const, label: "Money Sent" };
      case "P2P_CREDIT":
        return { icon: "arrow-up-outline" as const, label: "Money Received" };
      case "DEBIT":
        return { icon: "arrow-down-outline" as const, label: "Card Payment" };
      case "CREDIT":
        return { icon: "arrow-up-outline" as const, label: "Credit Added" };
      default:
        return { icon: "document-text-outline" as const, label: "Transaction" };
    }
  };

  const getPaymentModeLabel = (mode: PaymentMode) => {
    switch (mode) {
      case "CARD":
        return "💳 Card";
      case "QR":
        return "📱 QR Code";
      case "BANK_TRANSFER":
        return "🏦 Bank Transfer";
      case "USSD":
        return "📞 USSD";
      case "VOICE":
        return "🎤 Voice";
      default:
        return "💸 Payment";
    }
  };

  const renderTransaction = ({ item }: { item: TransactionHistory }) => {
    const typeInfo = getTransactionTypeLabel(item.txType);
    const isCredit = item.txType.includes("CREDIT");

    return (
      <TouchableOpacity
        className={`mx-4 mb-4 p-5 rounded-2xl backdrop-blur-xl ${
          isDark
            ? "bg-white/10 border border-white/20"
            : "bg-white/60 border border-gray-200/50 shadow-sm"
        }`}
        onPress={() =>
          router.push(`/(common)/Transaction/${item.transactionID}`)
        }
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center flex-1">
            <Ionicons
              name={typeInfo.icon}
              size={28}
              color={isCredit ? "#22c55e" : "#ef4444"}
              style={{ marginRight: 16 }}
            />
            <View className="flex-1">
              <Text
                className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {typeInfo.label}
              </Text>
              <Text
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                {getPaymentModeLabel(item.paymentMode)}
              </Text>
              {item.merchantId && (
                <Text
                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {item.merchantId}
                </Text>
              )}
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
            {new Date(item.transactionDate).toLocaleDateString()} at{" "}
            {new Date(item.transactionDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          {item.status === "COMPLETED" && (
            <Text className="text-xs font-semibold text-green-500">
              {item.status}
            </Text>
          )}
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

      {/* Date Filter Section */}
      <View
        className={`mx-4 mb-4 p-4 rounded-2xl ${isDark ? "bg-white/10 border border-white/20" : "bg-white/60 border border-gray-200/50"}`}
      >
        <Text
          className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Filter by Date Range
        </Text>

        <View className="flex-row justify-between mb-3">
          <TouchableOpacity
            className={`flex-1 mr-2 p-3 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              From
            </Text>
            <Text
              className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {startDate ? startDate.toLocaleDateString() : "Select start date"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 ml-2 p-3 rounded-xl ${isDark ? "bg-white/10" : "bg-gray-100"}`}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              To
            </Text>
            <Text
              className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {endDate ? endDate.toLocaleDateString() : "Select end date"}
            </Text>
          </TouchableOpacity>
        </View>

        {(startDate || endDate) && (
          <TouchableOpacity
            className="bg-red-500 p-2 rounded-lg"
            onPress={clearFilters}
          >
            <Text className="text-white text-center font-medium">
              Clear Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.transactionID}
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
              Your Transaction history will appear here once you start making
              payments
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          date={startDate?.toISOString() ?? new Date().toISOString()}
          onChange={(dateString: string) => {
            setShowStartDatePicker(false);
            setStartDate(new Date(dateString));
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          date={endDate?.toISOString() ?? new Date().toISOString()}
          onChange={(dateString: string) => {
            setShowEndDatePicker(false);
            setEndDate(new Date(dateString));
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default TransactionHistory;
