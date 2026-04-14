import { useAuth } from "@/src/components/context/AuthSessionProvider";
import { useClearLoadingOnLock } from "@/src/hooks/useClearLoadingOnLock";
import NFCPayments from "@/src/components/screens/merchant/CardTapNFCPayments";
import MerchantQRModal from "@/src/components/screens/merchant/MerchantQR";
import VirtualAccounts from "@/src/components/screens/merchant/VirtualAccounts";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import MerchantService from "@/src/lib/services/MerchantService";
import PaymentService from "@/src/lib/services/PaymentService";
import { router } from "expo-router";
import {
  ArrowUpDown,
  BarChart2,
  ChevronRight,
  CreditCard,
  QrCode,
  Receipt,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MerchantDashboardSkeleton } from "@/src/components/ui/DashboardSkeleton";

const QUICK_ACTIONS: {
  id: string;
  label: string;
  icon: React.FC<{ size: number; color: string }>;
  route: string;
}[] = [
  { id: "analytics", label: "Analytics", icon: BarChart2, route: "merchant/sales-analytics" },
  { id: "services", label: "Services", icon: Zap, route: "merchant/services" },
];

function useFadeSlide(delay: number) {
  const anim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return { opacity: anim, transform: [{ translateY }] };
}

export default function MerchantDashboard() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [showMerchantPayModal, setShowMerchantPayModal] = useState(false);
  const [showMerchantQRModal, setShowMerchantQRModal] = useState(false);
  const [showVAModal, setShowVAModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [stats, setStats] = useState<MerchantDetails | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionHistoryItem[]>([]);
  useClearLoadingOnLock(setLoading, setRefreshing);

  const headerAnim = useFadeSlide(0);
  const statsAnim = useFadeSlide(80);
  const actionsAnim = useFadeSlide(160);
  const menuAnim = useFadeSlide(240);
  const txAnim = useFadeSlide(320);

  const FetchMerchantData = async () => {
    try {
      const [paginatedTransactions, merchantStats] = await Promise.all([
        PaymentService.FetchRecentTransactions(3),
        MerchantService.GetMerchantAnalytics(),
      ]);
      setRecentTransactions(paginatedTransactions.transactions);
      setStats(merchantStats);
    } catch (error) {
      if (__DEV__) console.error("Error Fetching Merchant Data:", error);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await FetchMerchantData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    FetchMerchantData();
  }, []);

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  const accentColor = isDark ? "#a3e635" : "#65a30d";

  const menuItems = [
    {
      id: "uptime",
      label: "Bank Uptime",
      subtitle: "Quick Industry Status Check",
      icon: Wifi,
      onPress: () => router.push("merchant/bank-uptime" as any),
    },
    {
      id: "nfc",
      label: "Accept NFC Payments",
      subtitle: "Tap Customer Card To Receive Payment",
      icon: CreditCard,
      onPress: () => setShowMerchantPayModal(true),
    },
    {
      id: "qr",
      label: "QR Generator",
      subtitle: "Generate your business QR code",
      icon: QrCode,
      onPress: () => setShowMerchantQRModal(true),
    },
    {
      id: "services",
      label: "Services",
      subtitle: "Card management & More",
      icon: TrendingUp,
      onPress: () => router.push("merchant/services" as any),
    },
  ];

  if (isInitialLoad) {
    return (
      <SafeAreaView className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}>
        <ScreenHeader
          goBack={false}
          title={user?.merchant?.businessName || "Your Business"}
          subtitle="Merchant Dashboard"
        />
        <MerchantDashboardSkeleton isDark={isDark} />
      </SafeAreaView>
    );
  }

  const ListHeader = (
    <>
      <Animated.View style={headerAnim}>
        <ScreenHeader
          goBack={false}
          title={user?.merchant?.businessName || "Your Business"}
          subtitle="Merchant Dashboard"
        />
      </Animated.View>

      {/* Stats */}
      <Animated.View style={statsAnim} className="flex-row gap-3 mt-2 mb-5">
        {[
          {
            label: "Today's Revenue",
            value: `₦${(stats?.todayCompletedVolume ?? 0).toLocaleString()}`,
          },
          {
            label: "Today's Transactions",
            value: String(stats?.todayCompletedCount ?? 0),
          },
        ].map((stat) => (
          <View key={stat.label} className={`flex-1 p-4 rounded-2xl ${cardClass}`}>
            <Text className={`text-xs font-semibold mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {stat.label}
            </Text>
            {loading ? (
              <View className={`h-8 w-24 rounded-lg mt-1 ${isDark ? "bg-white/10" : "bg-slate-200"}`} />
            ) : (
              <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                {stat.value}
              </Text>
            )}
          </View>
        ))}
      </Animated.View>

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
                <action.icon size={28} color={accentColor} />
              </View>
              <Text className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Menu Items */}
      <Animated.View style={menuAnim} className="mb-6">
        <Text className={`text-base font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
          Actions
        </Text>
        <View className={`rounded-2xl overflow-hidden ${cardClass}`}>
          {menuItems.map((item, index) => (
            <Pressable
              key={item.id}
              className={`flex-row items-center px-4 py-4 gap-4 ${
                index < menuItems.length - 1
                  ? isDark
                    ? "border-b border-white/10"
                    : "border-b border-slate-100"
                  : ""
              }`}
              onPress={item.onPress}
            >
              <View
                className={`w-12 h-12 rounded-xl items-center justify-center ${
                  isDark ? "bg-lime-500/20" : "bg-lime-50"
                }`}
              >
                <item.icon size={24} color={accentColor} />
              </View>
              <View className="flex-1">
                <Text className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {item.label}
                </Text>
                <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {item.subtitle}
                </Text>
              </View>
              <ChevronRight size={18} color={isDark ? "#64748b" : "#94a3b8"} />
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Recent Transactions header */}
      <Animated.View style={txAnim}>
        <Pressable
          className="flex-row justify-between items-center mb-3"
          onPress={() => router.push("/transaction-history")}
        >
          <Text className={`text-base font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Recent Transactions
          </Text>
          <View className="flex-row items-center gap-1">
            <Text className={`text-xs font-brand font-semibold ${isDark ? "text-lime-400" : "text-lime-600"}`}>
              See all
            </Text>
            <ChevronRight size={14} color={accentColor} />
          </View>
        </Pressable>
      </Animated.View>
    </>
  );

  return (
    <SafeAreaView className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}>
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.transactionId + item.transactionDate}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={accentColor}
            colors={[accentColor]}
          />
        }
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ItemSeparatorComponent={() => (
          <View className={isDark ? "border-b border-white/10" : "border-b border-slate-100"} />
        )}
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center py-4 gap-3"
            onPress={() => router.push(`/transaction/${item.transactionId}`)}
          >
            <View className="bg-lime-500/20 rounded-xl w-12 h-12 items-center justify-center">
              <ArrowUpDown size={26} color={accentColor} />
            </View>
            <View className="flex-1">
              <Text
                className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                numberOfLines={1}
              >
                {item.paymentMode}
              </Text>
              <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {new Date(item.transactionDate).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-col gap-2 items-end">
              <Text className={`text-sm font-bold ${isDark ? "text-red-400" : "text-red-500"}`}>
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
                  className={`text-sm font-bold ${
                    item.status === "COMPLETED" ? "text-green-500" : "text-orange-500"
                  }`}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="py-10 items-center gap-2">
            <Receipt size={40} color={isDark ? "#334155" : "#cbd5e1"} />
            <Text className={`text-sm font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              No recent transactions
            </Text>
          </View>
        }
        ListFooterComponent={<View className="h-24" />}
      />

      <NFCPayments
        showMerchantPayModal={showMerchantPayModal}
        setShowMerchantPayModal={setShowMerchantPayModal}
      />
      <VirtualAccounts showVAModal={showVAModal} setShowVAModal={setShowVAModal} />
      <MerchantQRModal
        showMerchantQRModal={showMerchantQRModal}
        setShowMerchantQRModal={setShowMerchantQRModal}
      />
    </SafeAreaView>
  );
}
