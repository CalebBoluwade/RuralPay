import { useAuth } from "@/src/components/context/AuthProvider";
import NFCPayments from "@/src/components/screens/merchant/CardTapNFCPayments";
import MerchantQRModal from "@/src/components/screens/merchant/MerchantQR";
import VirtualAccounts from "@/src/components/screens/merchant/VirtualAccounts";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import MerchantService from "@/src/lib/services/MerchantService";
import { router } from "expo-router";
import {
  BarChart2,
  ChevronRight,
  CreditCard,
  QrCode,
  Settings,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QUICK_ACTIONS: {
  id: string;
  label: string;
  icon: React.FC<{ size: number; color: string }>;
  route: string;
}[] = [
  {
    id: "provision",
    label: "Provision",
    icon: CreditCard,
    route: "/(transaction)/ProvisionCard",
  },
  {
    id: "manage",
    label: "Manage",
    icon: Settings,
    route: "/(transaction)/CardManagement",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart2,
    route: "merchant/sales-analytics",
  },
  {
    id: "services",
    label: "Services",
    icon: Zap,
    route: "merchant/services",
  },
];

const MENU_ACTIONS: {
  id: string;
  label: string;
  subtitle: string;
  icon: React.FC<{ size: number; color: string }>;
  onPress: () => void;
}[] = [];

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

  const headerAnim = useFadeSlide(0);
  const statsAnim = useFadeSlide(80);
  const actionsAnim = useFadeSlide(160);
  const menuAnim = useFadeSlide(240);

  const fetchStats = async () => {
    const data = await MerchantService.GetMerchantAnalytics();
    setStats(data);
  };

  useEffect(() => {
    fetchStats().finally(() => {
      setLoading(false);
      setIsInitialLoad(false);
    });
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

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

  const accentColor = isDark ? "#a3e635" : "#65a30d";

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
            tintColor={accentColor}
            colors={[accentColor]}
          />
        }
      >
        {/* Header */}
        <Animated.View style={headerAnim}>
          <ScreenHeader
            goBack={false}
            title={user?.merchant?.businessName || "Your Business"}
            subtitle="Merchant Dashboard"
          />
        </Animated.View>

        {/* Stats */}
        <Animated.View style={statsAnim} className="px-5 mt-2 flex-row gap-3">
          {[
            {
              label: "Today's Revenue",
              value: loading
                ? "—"
                : `₦${(stats?.todayCompletedVolume ?? 0).toLocaleString()}`,
            },
            {
              label: "Today's Transactions",
              value: loading ? "—" : String(stats?.todayCompletedCount ?? 0),
            },
          ].map((stat) => (
            <View
              key={stat.label}
              className={`flex-1 p-4 rounded-2xl ${cardClass}`}
            >
              <Text
                className={`text-xs font-semibold mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {stat.label}
              </Text>
              {loading ? (
                <View
                  className={`h-8 w-24 rounded-lg mt-1 ${
                    isDark ? "bg-white/10" : "bg-slate-200"
                  }`}
                />
              ) : (
                <Text
                  className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {stat.value}
                </Text>
              )}
            </View>
          ))}
        </Animated.View>

        <View className="px-5 mt-5">
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
                  <Text
                    className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Menu Items */}
          <Animated.View style={menuAnim} className="mb-6">
            <Text
              className={`text-base font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
            >
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
                    className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
                  >
                    <item.icon size={24} color={accentColor} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {item.label}
                    </Text>
                    <Text
                      className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
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
            <ActivityIndicator size="large" color={accentColor} />
            <Text
              className={`mt-4 text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
            >
              Loading dashboard...
            </Text>
          </View>
        </View>
      </Modal>

      <NFCPayments
        showMerchantPayModal={showMerchantPayModal}
        setShowMerchantPayModal={setShowMerchantPayModal}
      />
      <VirtualAccounts
        showVAModal={showVAModal}
        setShowVAModal={setShowVAModal}
      />
      <MerchantQRModal
        showMerchantQRModal={showMerchantQRModal}
        setShowMerchantQRModal={setShowMerchantQRModal}
      />
    </SafeAreaView>
  );
}
