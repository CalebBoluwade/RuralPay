import ScreenHeader from "@/src/components/ui/ScreenHeader";
import PaymentService from "@/src/lib/services/PaymentService";
import { formatAmount } from "@/src/lib/utils/formatAmount";
import DateTimePicker from "expo-datepicker";
import { useRouter } from "expo-router";
import {
    ArrowDown,
    ArrowUp,
    CalendarDays,
    FileText,
    LucideIcon,
    Receipt,
    X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TransactionHistory = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    hasMore: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    loadTransactions(1, true);
  }, []);

  const loadTransactions = async (page = 1, reset = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      reset ? setRefreshing(true) : setLoadingMore(true);
      const data = await PaymentService.FetchAllTransactions(
        startDate ? startDate.toISOString() : undefined,
        endDate ? endDate.toISOString() : undefined,
        undefined,
        page,
        statusFilter ?? undefined,
      );
      setTransactions((prev) =>
        reset ? data.transactions : [...prev, ...data.transactions],
      );
      setPagination({
        page: data.page,
        total: data.total,
        hasMore: data.hasMore,
      });
    } catch (error) {
      if (__DEV__) console.log(error);
    } finally {
      reset ? setRefreshing(false) : setLoadingMore(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    loadTransactions(1, true);
  }, [startDate, endDate, statusFilter]);

  const loadMore = () => {
    if (pagination.hasMore && !loadingMore && !refreshing) {
      loadTransactions(pagination.page + 1);
    }
  };

  const getTransactionTypeLabel = (
    txType: TransactionType,
  ): { icon: LucideIcon; label: string } => {
    switch (txType) {
      case "P2P_DEBIT":
        return { icon: ArrowDown, label: "Money Sent" };
      case "P2P_CREDIT":
        return { icon: ArrowUp, label: "Money Received" };
      case "DEBIT":
        return { icon: ArrowDown, label: "Card Payment" };
      case "CREDIT":
        return { icon: ArrowUp, label: "Credit Added" };
      default:
        return { icon: FileText, label: "Transaction" };
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

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  const renderTransaction = ({
    item,
    index,
  }: {
    item: TransactionHistory;
    index: number;
  }) => {
    const typeInfo = getTransactionTypeLabel(item.txType);
    const isCredit = item.txType.includes("CREDIT");

    return (
      <Pressable
        className={`flex-row items-center px-4 py-4 gap-3 ${
          index < filteredTransactions.length - 1
            ? isDark
              ? "border-b border-white/10"
              : "border-b border-slate-100"
            : ""
        }`}
        onPress={() => router.push(`/transaction/${item.transactionId}`)}
      >
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
        >
          <typeInfo.icon size={22} color={isCredit ? "#22c55e" : "#ef4444"} />
        </View>
        <View className="flex-1">
          <Text
            className={`text-sm font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            numberOfLines={1}
          >
            {item.merchantId || typeInfo.label}
          </Text>
          <Text
            className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            {getPaymentModeLabel(item.paymentMode)} ·{" "}
            {new Date(item.transactionDate).toLocaleDateString()}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text
            className={`text-sm font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}
          >
            {formatAmount(item.amount, item.currency, true, isCredit)}
          </Text>
          <Text
            className={`text-xs font-semibold ${
              item.status === "COMPLETED"
                ? "text-green-500"
                : item.status === "PENDING"
                  ? isDark
                    ? "text-yellow-400"
                    : "text-yellow-500"
                  : item.status === "FAILED"
                    ? "text-red-500"
                    : isDark
                      ? "text-slate-400"
                      : "text-slate-500"
            }`}
          >
            {item.status}
          </Text>
        </View>
      </Pressable>
    );
  };

  const hasFilters = !!(startDate || endDate || statusFilter);
  const filteredTransactions = transactions;

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
    >
      <ScreenHeader title="Transaction History" onBack={() => router.back()} />

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.transactionId}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTransactions(1, true)}
            tintColor="#a3e635"
            colors={["#a3e635"]}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#a3e635" />
            </View>
          ) : pagination.total > 0 ? (
            <Text
              className={`text-xs text-center py-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Showing {transactions.length} of {pagination.total}
            </Text>
          ) : null
        }
        ListHeaderComponent={
          <View className="px-5 mt-4 mb-4">
            {/* Date filter */}
            <Text
              className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Filter by Date
            </Text>
            <View className={`rounded-2xl overflow-hidden ${cardClass}`}>
              <Pressable
                className={`flex-row items-center px-4 py-4 gap-4 ${isDark ? "border-b border-white/10" : "border-b border-slate-100"}`}
                onPress={() => setShowStartDatePicker(true)}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
                >
                  <CalendarDays
                    size={22}
                    color={isDark ? "#a3e635" : "#65a30d"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    From
                  </Text>
                  <Text
                    className={`text-sm font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {startDate
                      ? startDate.toLocaleDateString()
                      : "Select start date"}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                className="flex-row items-center px-4 py-4 gap-4"
                onPress={() => setShowEndDatePicker(true)}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
                >
                  <CalendarDays
                    size={22}
                    color={isDark ? "#a3e635" : "#65a30d"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    To
                  </Text>
                  <Text
                    className={`text-sm font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {endDate ? endDate.toLocaleDateString() : "Select end date"}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Status filter */}
            <Text
              className={`text-base font-brand font-bold mb-3 mt-5 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Filter by Status
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              {([null, "COMPLETED", "PENDING", "FAILED"] as const).map((s) => {
                const active = statusFilter === s;
                const label = s ?? "All";
                const activeColor =
                  s === "COMPLETED"
                    ? "bg-green-500"
                    : s === "PENDING"
                      ? isDark
                        ? "bg-yellow-400"
                        : "bg-yellow-500"
                      : s === "FAILED"
                        ? "bg-red-500"
                        : "bg-lime-500";
                return (
                  <Pressable
                    key={label}
                    onPress={() => setStatusFilter(s)}
                    className={`px-4 py-2 rounded-full border ${
                      active
                        ? `${activeColor} border-transparent`
                        : isDark
                          ? "border-white/20 bg-white/5"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active
                          ? "text-white"
                          : isDark
                            ? "text-slate-300"
                            : "text-slate-600"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {hasFilters && (
              <Pressable
                className="flex-row items-center justify-center gap-2 mt-3 py-2"
                onPress={() => {
                  setStartDate(null);
                  setEndDate(null);
                  setStatusFilter(null);
                }}
              >
                <X size={14} color={isDark ? "#f87171" : "#ef4444"} />
                <Text
                  className={`text-sm font-semibold ${isDark ? "text-red-400" : "text-red-500"}`}
                >
                  Clear Filters
                </Text>
              </Pressable>
            )}

            <Text
              className={`text-base font-brand font-bold mt-6 mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              All Transactions
            </Text>
            {filteredTransactions.length > 0 && (
              <View className={`rounded-2xl overflow-hidden ${cardClass}`} />
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="py-16 items-center gap-3 px-8">
            <Receipt size={44} color={isDark ? "#334155" : "#cbd5e1"} />
            <Text
              className={`text-base font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              No Transactions Yet
            </Text>
            <Text
              className={`text-sm text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Your transaction history will appear here once you start making
              payments
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        className="px-5"
      />

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
