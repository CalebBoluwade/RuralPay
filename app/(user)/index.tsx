import { useAuth } from "@/components/context/AuthProvider";
import { useLanguage } from "@/components/context/LanguageContext";
import BalanceCard from "@/components/ui/BalanceCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import AccountService from "@/lib/services/AccountService";
import PaymentService from "@/lib/services/PaymentService";
import ToastService from "@/lib/services/ToastService";
import { PinService } from "@/lib/utils/SecureStorage";
import { ArrowUp, ArrowUpDown, ChevronRight, Clock, CreditCard, KeyRound, QrCode, Receipt, Store, Zap } from "lucide-react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QUICK_ACTIONS: { id: string; label: string; icon: React.FC<{ size: number; color: string }>; route: string }[] = [
  { id: "send", label: "Send", icon: ArrowUp, route: "/(common)/Transaction/BankTransfers" },
  { id: "qr", label: "QR Pay", icon: QrCode, route: "/(transaction)/QRPayments" },
  { id: "history", label: "History", icon: Clock, route: "/(common)/Transaction/TransactionHistory" },
  { id: "card", label: "Cards", icon: CreditCard, route: "/(transaction)/TokenizedCards" },
];

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

export default function Index() {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionHistory[]
  >([]);
  const [accountEnquiry, setAccountEnquiry] = useState<AccountBalanceEnquiry>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasPIN, setHasPIN] = useState(true);
  const { user } = useAuth();

  const headerAnim = useFadeSlide(0);
  const balanceAnim = useFadeSlide(80);
  const actionsAnim = useFadeSlide(160);
  const todosAnim = useFadeSlide(240);
  const txAnim = useFadeSlide(320);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.goodMorning");
    if (hour < 18) return t("home.goodAfternoon");
    return t("home.goodEvening");
  };

  useEffect(() => {
    loadAccountData();
    checkFirstVisit();
  }, []);

  const loadAccountData = async () => {
    const pin = await PinService.hasPin();
    setHasPIN(pin);
    try {
      await Location.getForegroundPermissionsAsync();
      const [transactions, balance] = await Promise.all([
        PaymentService.FetchRecentTransactions(3),
        AccountService.AccountBalanceEnquiry(),
      ]);
      setRecentTransactions(transactions);
      setAccountEnquiry(balance ?? [{} as BalanceEnquiry]);
    } catch (error) {
      console.warn(error);
      ToastService.error("Failed to Load Account Data");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccountData();
    setRefreshing(false);
  };

  const checkFirstVisit = async () => {
    try {
      // const hasSeenWelcome =
      // (await AsyncStorage.getItem("hasSeenWelcome")) === "true";
      // if (!hasSeenWelcome) router.push("/(modal)/welcome-banner");
    } catch (error) {
      console.warn("Error checking first visit:", error);
    }
  };

  const todos = [
    {
      key: "link",
      show: true,
      icon: <Store size={28} color={isDark ? "#a3e635" : "#65a30d"} />,
      title: "Link Account",
      subtitle: "Add accounts. Start transacting today!",
      route: "/(common)/LinkBankAccount",
    },
    {
      key: "pin",
      show: !hasPIN,
      icon: <KeyRound size={28} color={isDark ? "#a3e635" : "#65a30d"} />,
      title: "Setup Your PIN",
      subtitle: "Create a 6-digit PIN to protect your account.",
      route: "/(common)/LinkBankAccount",
    },
    {
      key: "transact",
      show: !(recentTransactions || []).length,
      icon: <Zap size={28} color={isDark ? "#a3e635" : "#65a30d"} />,
      title: "Start Transacting Today",
      subtitle: "Make your first payment.",
      route: "/Payments",
    },
  ].filter((t) => t.show);

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#a3e635"
            colors={["#a3e635"]}
          />
        }
      >
        {/* Header */}
        <Animated.View style={headerAnim}>
          <ScreenHeader
            goBack={false}
            title={getGreeting()}
            subtitle={user?.FirstName || "User"}
          />
        </Animated.View>

        {/* Balance */}
        <Animated.View style={balanceAnim}>
          <BalanceCard accountEnquiry={accountEnquiry!} loading={loading} />
        </Animated.View>

        <View className="px-5 mt-4">
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
                    <action.icon size={28} color={isDark ? "#a3e635" : "#65a30d"} />
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

          {/* To-Dos */}
          {todos.length > 0 && (
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
                    onPress={() => router.push(todo.route as any)}
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
                        className={`text-sm font-brand font-bold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {todo.title}
                      </Text>
                      <Text
                        className={`text-xs mt-0.5 ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {todo.subtitle}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={isDark ? "#64748b" : "#94a3b8"} />
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Recent Transactions */}
          <Animated.View style={txAnim} className="mb-6">
            <Pressable
              className="flex-row justify-between items-center mb-3"
              onPress={() =>
                router.push("/(common)/Transaction/TransactionHistory")
              }
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
                  className={`text-xs font-brand font-semibold ${isDark ? "text-lime-400" : "text-lime-600"}`}
                >
                  See all
                </Text>
                <ChevronRight size={14} color={isDark ? "#a3e635" : "#65a30d"} />
              </View>
            </Pressable>

            <View className={`rounded-2xl overflow-hidden ${cardClass}`}>
              <FlatList
                data={recentTransactions}
                keyExtractor={(item) =>
                  item.transactionId + item.transactionDate
                }
                renderItem={({ item, index }) => (
                  <Pressable
                    className={`flex-row items-center px-4 py-4 gap-3 ${
                      index < recentTransactions.length - 1
                        ? isDark
                          ? "border-b border-white/10"
                          : "border-b border-slate-100"
                        : ""
                    }`}
                    onPress={() =>
                      router.push(`/(common)/Transaction/${item.transactionId}`)
                    }
                  >
                    <View className="bg-lime-500/20 rounded-xl w-12 h-12 items-center justify-center">
                      <ArrowUpDown size={26} color={isDark ? "#a3e635" : "#65a30d"} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-semibold ${
                          isDark ? "text-white" : "text-slate-900"
                        }`}
                        numberOfLines={1}
                      >
                        {item.merchantId || item.paymentMode}
                      </Text>
                      <Text
                        className={`text-xs mt-0.5 ${
                          isDark ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        {new Date(item.transactionDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text
                      className={`text-sm font-bold ${
                        isDark ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      -₦{item.amount.toLocaleString()}
                    </Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View className="py-10 items-center gap-2">
                    <Receipt size={40} color={isDark ? "#334155" : "#cbd5e1"} />
                    <Text
                      className={`text-sm font-medium ${
                        isDark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      No recent transactions
                    </Text>
                  </View>
                }
                scrollEnabled={false}
              />
            </View>
          </Animated.View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Initial Load Modal */}
      <Modal
        visible={loading && isInitialLoad}
        transparent
        animationType="fade"
      >
        <View
          className={`flex-1 justify-center items-center ${isDark ? "bg-black/80" : "bg-black/40"}`}
        >
          <View
            className={`rounded-3xl p-8 items-center ${
              isDark
                ? "bg-slate-900 border border-white/20"
                : "bg-white border border-slate-200"
            }`}
          >
            <ActivityIndicator size="large" color="#a3e635" />
            <Text
              className={`mt-4 text-sm font-semibold ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              Loading your account...
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
