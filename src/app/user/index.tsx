import { useAuth } from "@/src/components/context/AuthSessionProvider";
import { useLanguage } from "@/src/components/context/LanguageContext";
import BalanceCard from "@/src/components/ui/BalanceCard";
import { DashboardSkeleton } from "@/src/components/ui/DashboardSkeleton";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { useAbortable } from "@/src/hooks/useAbortable";
import { useClearLoadingOnLock } from "@/src/hooks/useClearLoadingOnLock";
import AccountService from "@/src/lib/services/AccountService";
import PaymentService from "@/src/lib/services/PaymentService";
import ToastService from "@/src/lib/services/ToastService";
import { PinService } from "@/src/lib/utils/SecureStorage";
import * as Location from "expo-location";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Clock,
  CreditCard,
  KeyRound,
  Nfc,
  QrCode,
  Store,
  Zap,
} from "lucide-react-native";
import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const PinSetupModal = lazy(
  () => import("@/src/components/ui/Modals/PinSetupModal"),
);

const QUICK_ACTIONS: {
  id: string;
  label: string;
  icon: React.FC<{ size: number; color: string }>;
  route: string;
}[] = [
  { id: "send", label: "Send", icon: ArrowUp, route: "user/bank-transfers" },
  { id: "qr", label: "Scan & Pay", icon: QrCode, route: "/user/qrPayments" },
  {
    id: "history",
    label: "History",
    icon: Clock,
    route: "/transaction-history",
  },
  { id: "card", label: "Cards", icon: CreditCard, route: "user/cards" },
  { id: "tap", label: "Tap Card", icon: Nfc, route: "user/tapPayments" },
] as const;

function useFadeSlide(delay: number) {
  const anim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity: anim, transform: [{ translateY }] };
}

function humanisePaymentMode(mode: string): string {
  const map: Record<string, string> = {
    BANK_TRANSFER: "Bank Transfer",
    QR: "QR Payment",
    NFC: "Tap Card Payment",
    USSD: "USSD Payment",
    BLUETOOTH: "Nearby Payment",
    CARD: "Card Payment",
    WALLET: "Wallet Payment",
  };
  return map[mode?.toUpperCase()] ?? mode;
}

export default function Index() {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { abortController } = useAbortable("home-dashboard");
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionHistoryItem[]
  >([]);
  const [accountEnquiry, setAccountEnquiry] = useState<AccountBalanceEnquiry>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasPIN, setHasPIN] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const { user, isFirstLogin, clearFirstLogin } = useAuth();
  useClearLoadingOnLock(setLoading, setRefreshing);

  const dismissFirstActionPrompt = async (route?: string) => {
    await SecureStore.setItemAsync("first_action_prompt_shown", "true");
    clearFirstLogin();
    if (route) router.push(route as any, {});
  };

  const headerAnim = useFadeSlide(0);
  const todosAnim = useFadeSlide(80); // hero on first login — animates before balance
  const balanceAnim = useFadeSlide(160);
  const actionsAnim = useFadeSlide(240);
  const txAnim = useFadeSlide(320);

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
    const pin = await PinService.hasPin();
    setHasPIN(pin);
    try {
      await Location.getForegroundPermissionsAsync();
      const [paginatedTransactions, balance] = await Promise.all([
        PaymentService.FetchRecentTransactions(5, abortController.signal),
        AccountService.AccountBalanceEnquiry(abortController.signal),
      ]);
      setRecentTransactions(paginatedTransactions.transactions);
      setAccountEnquiry(balance ?? [{} as BalanceEnquiry]);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        if (__DEV__) console.warn(error);
        ToastService.error("Failed to Load Account Data");
      }
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAccountData();
    } finally {
      setRefreshing(false);
    }
  };

  const hasLinkedAccount = !!accountEnquiry?.accounts?.length;

  const todos = [
    {
      key: "link",
      show: !hasLinkedAccount,
      icon: <Store size={28} color={isDark ? "#a3e635" : "#65a30d"} />,
      title: "Step 1 — Link Your Bank Account",
      subtitle:
        "Do this first. You need a linked account to send or receive money.",
      route: "/link-account",
    },
    {
      key: "pin",
      show: !hasPIN,
      icon: <KeyRound size={28} color={isDark ? "#a3e635" : "#65a30d"} />,
      title: hasLinkedAccount
        ? "Step 1 — Set Your PIN"
        : "Step 2 — Set Your PIN",
      subtitle: "Your PIN protects every payment. Takes 30 seconds.",
      route: null,
    },
    {
      key: "transact",
      show: hasLinkedAccount && hasPIN && !(recentTransactions || []).length,
      icon: <Zap size={28} color={isDark ? "#a3e635" : "#65a30d"} />,
      title: "You're all set — Make Your First Payment",
      subtitle: "Send money or scan a QR code to get started.",
      route: "user/bank-transfers",
    },
  ].filter((t) => t.show);

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  const ListHeader = useCallback(
    () => (
      <>
        <Animated.View style={headerAnim}>
          <ScreenHeader
            goBack={false}
            title={getGreeting()}
            subtitle={user?.firstName || "User"}
          />
        </Animated.View>

        {/* On first login (no linked account) todos are the hero — shown above balance */}
        {!hasLinkedAccount && todos.length > 0 && (
          <Animated.View style={todosAnim} className="mb-4">
            <Text
              className={`text-base font-brand font-bold mb-3 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              My To-Do&apos;s ✨
            </Text>
            <View className={`rounded-2xl overflow-hidden ${cardClass}`}>
              {todos.map((todo, index) => (
                <Pressable
                  key={todo.key}
                  className={`flex-row items-center px-4 py-4 gap-4 ${
                    index < todos.length - 1
                      ? isDark
                        ? "border-b border-white/10"
                        : "border-b border-slate-100"
                      : ""
                  }`}
                  onPress={() =>
                    todo.key === "pin"
                      ? setShowPinModal(true)
                      : router.push(todo.route as any)
                  }
                >
                  <View
                    className={`w-12 h-12 rounded-xl items-center justify-center ${
                      isDark ? "bg-lime-500/20" : "bg-lime-50"
                    }`}
                  >
                    {todo.icon}
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base font-brand font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {todo.title}
                    </Text>
                    <Text
                      className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      {todo.subtitle}
                    </Text>
                  </View>
                  <ChevronRight
                    size={18}
                    color={isDark ? "#64748b" : "#94a3b8"}
                  />
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        <Animated.View style={balanceAnim}>
          <BalanceCard accountEnquiry={accountEnquiry!} loading={loading} />
        </Animated.View>

        <View className="mt-4">
          {/* Quick Actions */}
          <Animated.View style={actionsAnim} className="mb-6">
            <View className="flex-row gap-3">
              {QUICK_ACTIONS.map((action) => (
                <Pressable
                  key={action.id}
                  className="flex-1 items-center"
                  onPress={() => router.push(action.route as any)}
                >
                  <View
                    className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                      isDark
                        ? "bg-white/10 border border-white/20"
                        : "bg-white border border-slate-200 shadow-sm"
                    }`}
                  >
                    <action.icon
                      size={28}
                      color={isDark ? "#a3e635" : "#65a30d"}
                    />
                  </View>
                  <Text
                    className={`text-xs font-brand font-semibold ${
                      isDark ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* To-Dos — shown here only when user has a linked account */}
          {hasLinkedAccount && todos.length > 0 && (
            <Animated.View style={todosAnim} className="mb-6">
              <Text
                className={`text-base font-brand font-bold mb-3 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                My To-Do&apos;s ✨
              </Text>
              <View className={`rounded-2xl overflow-hidden ${cardClass}`}>
                {todos.map((todo, index) => (
                  <Pressable
                    key={todo.key}
                    className={`flex-row items-center px-4 py-4 gap-4 ${
                      index < todos.length - 1
                        ? isDark
                          ? "border-b border-white/10"
                          : "border-b border-slate-100"
                        : ""
                    }`}
                    onPress={() =>
                      todo.key === "pin"
                        ? setShowPinModal(true)
                        : router.push(todo.route as any)
                    }
                  >
                    <View
                      className={`w-12 h-12 rounded-xl items-center justify-center ${
                        isDark ? "bg-lime-500/20" : "bg-lime-50"
                      }`}
                    >
                      {todo.icon}
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-base font-brand font-bold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {todo.title}
                      </Text>
                      <Text
                        className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {todo.subtitle}
                      </Text>
                    </View>
                    <ChevronRight
                      size={18}
                      color={isDark ? "#64748b" : "#94a3b8"}
                    />
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Recent Transactions header — only shown when there are transactions */}
          <Animated.View style={txAnim}>
            {recentTransactions.length > 0 && (
              <Pressable
                className="flex-row justify-between items-center mb-3"
                onPress={() => router.push("/transaction-history")}
              >
                <Text
                  className={`text-base font-brand font-bold ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  Recent Transactions
                </Text>
                <View className="flex-row items-center gap-1">
                  <Text
                    className={`text-xs font-brand font-semibold ${
                      isDark ? "text-lime-400" : "text-lime-600"
                    }`}
                  >
                    See all
                  </Text>
                  <ChevronRight
                    size={14}
                    color={isDark ? "#a3e635" : "#65a30d"}
                  />
                </View>
              </Pressable>
            )}
            {!recentTransactions.length && !loading && (
              <Text
                className={`text-base font-brand font-bold mb-3 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                What Would You Like To Do? 👇
              </Text>
            )}
          </Animated.View>
        </View>
      </>
    ),
    [
      isDark,
      headerAnim,
      balanceAnim,
      actionsAnim,
      todosAnim,
      txAnim,
      accountEnquiry,
      loading,
      recentTransactions,
      todos,
      cardClass,
      hasLinkedAccount,
      user,
      t,
    ],
  );

  if (isInitialLoad) {
    return (
      <SafeAreaView
        className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
      >
        <ScreenHeader
          goBack={false}
          title={getGreeting()}
          subtitle={user?.firstName || "User"}
        />
        <DashboardSkeleton isDark={isDark} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
    >
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.transactionId + item.transactionDate}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#a3e635"
            colors={["#a3e635"]}
          />
        }
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => (
          <View
            className={
              isDark ? "border-b border-white/10" : "border-b border-slate-100"
            }
          />
        )}
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center py-4 gap-3"
            onPress={() => router.push(`/transaction/${item.transactionId}`)}
          >
            <View className="bg-lime-500/20 rounded-xl w-12 h-12 items-center justify-center">
              <ArrowUpDown size={26} color={isDark ? "#a3e635" : "#65a30d"} />
            </View>
            <View className="flex-1">
              <Text
                className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                numberOfLines={1}
              >
                {humanisePaymentMode(item.paymentMode)}
              </Text>
              <Text
                className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {new Date(item.transactionDate).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-col gap-2 items-end">
              <Text
                className={`text-base font-bold ${isDark ? "text-red-400" : "text-red-500"}`}
              >
                -₦{item.amount.toLocaleString()}
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
                  className={`text-base font-bold ${
                    item.status === "COMPLETED"
                      ? "text-green-500"
                      : "text-orange-500"
                  }`}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          !loading && !isInitialLoad ? (
            <View
              className={`mx-1 mb-4 rounded-2xl overflow-hidden ${cardClass}`}
            >
              {[
                {
                  key: "send",
                  emoji: "💸",
                  title: "Send Money",
                  subtitle: "Transfer To Any Nigerian Bank Account",
                  route: "user/bank-transfers",
                },
                {
                  key: "scan",
                  emoji: "📷",
                  title: "Scan & Pay",
                  subtitle: "Point Your Camera At A Merchant's QR code",
                  route: "/user/qrPayments",
                },
                {
                  key: "tap",
                  emoji: "📲",
                  title: "Tap to Pay",
                  subtitle: "Hold your phone near a payment terminal",
                  route: "user/tapPayments",
                },
              ].map((item, index, arr) => (
                <Pressable
                  key={item.key}
                  className={`flex-row items-center px-4 py-4 gap-4 ${
                    index < arr.length - 1
                      ? isDark
                        ? "border-b border-white/10"
                        : "border-b border-slate-100"
                      : ""
                  }`}
                  onPress={() => router.push(item.route as any)}
                >
                  <View
                    className={`w-12 h-12 rounded-xl items-center justify-center ${
                      isDark ? "bg-lime-500/20" : "bg-lime-50"
                    }`}
                  >
                    <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-base font-bold ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className={`text-base mt-0.5 ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                  <ChevronRight
                    size={18}
                    color={isDark ? "#64748b" : "#94a3b8"}
                  />
                </Pressable>
              ))}
            </View>
          ) : null
        }
        ListFooterComponent={<View className="h-24" />}
      />

      {showPinModal && (
        <Suspense fallback={null}>
          <PinSetupModal
            visible={showPinModal}
            onComplete={() => {
              setShowPinModal(false);
              setHasPIN(true);
            }}
            onCancel={() => setShowPinModal(false)}
          />
        </Suspense>
      )}

      {/* First-login action prompt — shown once, dismissed permanently */}
      <Modal
        visible={isFirstLogin}
        transparent
        animationType="slide"
        onRequestClose={() => dismissFirstActionPrompt()}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
        >
          <View
            className={`rounded-t-3xl px-6 pt-6 pb-10 gap-4 ${
              isDark ? "bg-slate-900" : "bg-white"
            }`}
          >
            <View className="items-center gap-1 mb-2">
              <Text
                className={`text-xl font-bold text-center ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Welcome to RuralPay 🎉
              </Text>
              <Text
                className={`text-base text-center ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                What Would You Like To Do First?
              </Text>
            </View>

            {[
              {
                emoji: "🔗",
                title: "Link My Bank Account",
                subtitle: "Start here — Required before sending money",
                route: "/link-account",
                highlight: true,
              },
              {
                emoji: "💸",
                title: "Send Money",
                subtitle: "Transfer to any Nigerian bank account",
                route: "user/bank-transfers",
                highlight: false,
              },
              {
                emoji: "📷",
                title: "Scan & Pay",
                subtitle: "Point your camera at a merchant QR code",
                route: "/user/qrPayments",
                highlight: false,
              },
            ].map((item, index, arr) => (
              <Pressable
                key={item.title}
                onPress={() => dismissFirstActionPrompt(item.route)}
                className={`flex-row items-center gap-4 p-4 rounded-2xl ${
                  item.highlight
                    ? isDark
                      ? "bg-lime-500/20 border border-lime-500/40"
                      : "bg-lime-50 border border-lime-300"
                    : isDark
                      ? "bg-white/5 border border-white/10"
                      : "bg-slate-50 border border-slate-200"
                }`}
              >
                <View
                  className={`w-14 h-14 rounded-2xl items-center justify-center ${
                    item.highlight
                      ? isDark
                        ? "bg-lime-500/30"
                        : "bg-lime-100"
                      : isDark
                        ? "bg-white/10"
                        : "bg-white"
                  }`}
                >
                  <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base font-bold ${
                      item.highlight
                        ? isDark
                          ? "text-lime-400"
                          : "text-lime-700"
                        : isDark
                          ? "text-white"
                          : "text-slate-900"
                    }`}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className={`text-base mt-0.5 ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {item.subtitle}
                  </Text>
                </View>
                <ChevronRight
                  size={18}
                  color={isDark ? "#64748b" : "#94a3b8"}
                />
              </Pressable>
            ))}

            <Pressable
              onPress={() => dismissFirstActionPrompt()}
              className="py-2 items-center"
            >
              <Text
                className={`text-base font-bold ${
                  isDark ? "text-slate-500" : "text-slate-400"
                }`}
              >
                I&apos;ll Explore On My Own
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
