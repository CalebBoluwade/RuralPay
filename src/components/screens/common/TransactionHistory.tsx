import { useAuth } from "@/src/components/context/AuthSessionProvider";
import Card from "@/src/components/ui/Card";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import PaymentService from "@/src/lib/services/PaymentService";
import { ReceiptService } from "@/src/lib/services/ReceiptService";
import { formatAmount } from "@/src/lib/utils/formatAmount";
import DateTimePicker from "expo-datepicker";
import { useRouter } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Download,
  FileText,
  LucideIcon,
  Receipt,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TransactionHistory = ({ merchantName }: { merchantName?: string }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { user } = useAuth();
  const resolvedMerchantName =
    merchantName ?? user?.merchant?.businessName ?? "";

  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>(
    [],
  );
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
  const [pendingStart, setPendingStart] = useState<Date | null>(null);
  const [pendingEnd, setPendingEnd] = useState<Date | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const pickerTempValue = useRef<string | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    loadTransactions(1, true);
  }, []);

  const activeFilters = useRef<{
    startDate: Date | null;
    endDate: Date | null;
    statusFilter: string | null;
  }>({ startDate: null, endDate: null, statusFilter: null });

  const loadTransactions = async (page = 1, reset = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
      reset ? setRefreshing(true) : setLoadingMore(true);
      const {
        startDate: sd,
        endDate: ed,
        statusFilter: sf,
      } = activeFilters.current;
      const data = await PaymentService.FetchAllTransactions(
        sd ? sd.toISOString() : undefined,
        ed ? ed.toISOString() : undefined,
        undefined,
        page,
        sf ?? undefined,
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

  const [downloading, setDownloading] = useState(false);

  const downloadStatement = async () => {
    if (!transactions.length || downloading) return;
    setDownloading(true);
    try {
      await ReceiptService.DownloadStatement(
        transactions,
        resolvedMerchantName,
      );
    } finally {
      setDownloading(false);
    }
  };

  const applyFilters = () => {
    activeFilters.current = {
      startDate: pendingStart,
      endDate: pendingEnd,
      statusFilter: pendingStatus,
    };
    setStartDate(pendingStart);
    setEndDate(pendingEnd);
    setStatusFilter(pendingStatus);
    loadTransactions(1, true);
  };

  const clearFilters = () => {
    activeFilters.current = {
      startDate: null,
      endDate: null,
      statusFilter: null,
    };
    setPendingStart(null);
    setPendingEnd(null);
    setPendingStatus(null);
    setStartDate(null);
    setEndDate(null);
    setStatusFilter(null);
    loadTransactions(1, true);
  };

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

  const renderTransaction = ({
    item,
    index,
  }: {
    item: TransactionHistoryItem;
    index: number;
  }) => {
    const typeInfo = getTransactionTypeLabel(item.txType);
    const isCredit = item.txType.includes("CREDIT");

    return (
      <Pressable
        className={`flex-row items-center px-2 py-1.5 gap-3 ${
          index < filteredTransactions.length - 1
            ? isDark
              ? "border-b border-white/10"
              : "border-b border-slate-100"
            : ""
        }`}
        onPress={() => router.push(`/transaction/${item.transactionId}`)}
      >
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-200/10"}`}
        >
          <typeInfo.icon size={22} color={isCredit ? "#22c55e" : "#ef4444"} />
        </View>
        <View className="flex-1">
          <Text
            className={`text-lg font-brand font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}
            numberOfLines={1}
          >
            {item.transactionId || typeInfo.label}
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
            className={`text-base font-bold ${isCredit ? "text-green-500" : "text-red-500"}`}
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

  const toPickerDate = (d: Date) =>
    `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

  const fromPickerDate = (s: string): Date | null => {
    const parts = s.split("/").map(Number);
    if (parts.length !== 3 || parts.some(isNaN) || parts.some((p) => p === 0))
      return null;
    const [y, m, d] = parts;
    const date = new Date(y, m - 1, d);
    return isNaN(date.getTime()) ? null : date;
  };

  const hasFilters = !!(startDate || endDate || statusFilter);
  const hasPendingFilters = !!(pendingStart || pendingEnd || pendingStatus);
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
            <Card className="overflow-hidden">
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
                    className={`text-base font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {pendingStart
                      ? pendingStart.toLocaleDateString()
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
                    className={`text-base font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {pendingEnd
                      ? pendingEnd.toLocaleDateString()
                      : "Select end date"}
                  </Text>
                </View>
              </Pressable>
            </Card>

            {/* Status filter */}
            <Text
              className={`text-base font-brand font-bold mb-3 mt-5 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Filter by Status
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              {([null, "COMPLETED", "PENDING", "FAILED"] as const).map((s) => {
                const active = pendingStatus === s;
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
                    onPress={() => setPendingStatus(s)}
                    className={`px-4 py-2 rounded-full border ${
                      active
                        ? `${activeColor} border-transparent`
                        : isDark
                          ? "border-white/20 bg-white/5"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-base font-semibold ${
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

            <View className="flex-row gap-3 mt-4">
              {(hasFilters || hasPendingFilters) && (
                <Pressable
                  className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl border border-red-400"
                  onPress={clearFilters}
                >
                  <X size={14} color={isDark ? "#f87171" : "#ef4444"} />
                  <Text
                    className={`text-base font-semibold ${isDark ? "text-red-400" : "text-red-500"}`}
                  >
                    Clear
                  </Text>
                </Pressable>
              )}
              <Pressable
                className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl bg-lime-500"
                onPress={applyFilters}
              >
                <Text className="text-base font-semibold text-white">
                  Apply Filters
                </Text>
              </Pressable>
              <Pressable
                className={`flex-row items-center justify-center gap-2 py-3 px-4 rounded-xl ${
                  isDark ? "bg-slate-800" : "bg-slate-100"
                }`}
                onPress={downloadStatement}
                disabled={downloading || !transactions.length}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#a3e635" />
                ) : (
                  <Download
                    size={18}
                    color={
                      transactions.length
                        ? isDark
                          ? "#a3e635"
                          : "#65a30d"
                        : "#94a3b8"
                    }
                  />
                )}
              </Pressable>
            </View>

            <Text
              className={`text-lg font-brand font-bold mt-6 mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              All Transactions
            </Text>
            {filteredTransactions.length > 0 && (
              <View className="rounded-2xl overflow-hidden" />
            )}
          </View>
        }
        ListEmptyComponent={
          <View className="py-16 items-center gap-3 px-8">
            <Receipt size={44} color={isDark ? "#334155" : "#cbd5e1"} />
            <Text
              className={`text-lg font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              No Transactions Yet
            </Text>
            <Text
              className={`text-lg text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Your Transaction History Will Appear Here once you start making
              payments
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
        className="px-5"
      />

      {showStartDatePicker && (
        <Modal transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View
              className={`rounded-t-3xl px-5 pt-4 pb-8 ${
                isDark ? "bg-slate-900" : "bg-white"
              }`}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Pressable onPress={() => setShowStartDatePicker(false)}>
                  <Text
                    className={`text-base font-semibold ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Text
                  className={`text-base font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Start Date
                </Text>
                <Pressable
                  onPress={() => {
                    const parsed = fromPickerDate(
                      pickerTempValue.current ??
                        toPickerDate(pendingStart ?? new Date()),
                    );
                    if (parsed) setPendingStart(parsed);
                    pickerTempValue.current = null;
                    setShowStartDatePicker(false);
                  }}
                >
                  <Text className="text-base font-bold text-lime-500">
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                date={toPickerDate(pendingStart ?? new Date())}
                onChange={(dateString: string) => {
                  pickerTempValue.current = dateString;
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {showEndDatePicker && (
        <Modal transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View
              className={`rounded-t-3xl px-5 pt-4 pb-8 ${
                isDark ? "bg-slate-900" : "bg-white"
              }`}
            >
              <View className="flex-row justify-between items-center mb-4">
                <Pressable onPress={() => setShowEndDatePicker(false)}>
                  <Text
                    className={`text-base font-semibold ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    Cancel
                  </Text>
                </Pressable>
                <Text
                  className={`text-base font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  End Date
                </Text>
                <Pressable
                  onPress={() => {
                    const parsed = fromPickerDate(
                      pickerTempValue.current ??
                        toPickerDate(pendingEnd ?? new Date()),
                    );
                    if (parsed) setPendingEnd(parsed);
                    pickerTempValue.current = null;
                    setShowEndDatePicker(false);
                  }}
                >
                  <Text className="text-base font-bold text-lime-500">
                    Done
                  </Text>
                </Pressable>
              </View>
              <DateTimePicker
                date={toPickerDate(pendingEnd ?? new Date())}
                onChange={(dateString: string) => {
                  pickerTempValue.current = dateString;
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default TransactionHistory;
