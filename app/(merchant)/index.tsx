import { useAuth } from "@/components/context/AuthProvider";
import MerchantQRModal from "@/components/Merchant/MerchantQRScan";
import NFCPayments from "@/components/Merchant/NFCPayments";
import VirtualAccounts from "@/components/Merchant/VirtualAccounts";
import ScreenHeader from "@/components/ui/ScreenHeader";
import MerchantService from "@/lib/services/MerchantService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";

export default function MerchantDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [merchant, setMerchant] = useState<MerchantAnaltyics>();

  const [showMerchantPayModal, setShowMerchantPayModal] = useState(false);
  const [showMerchantQRModal, setShowMerchantQRModal] = useState(false);
  const [showVAModal, setShowVAModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    revenue: 124500,
    transactions: 89,
    customers: 247,
  });

  useEffect(() => {
    loadMerchantData();
  }, []);

  const loadMerchantData = async () => {
    try {
      const merchantProfile = await MerchantService.GetMerchantAnalytics();
      if (merchantProfile) {
        setMerchant(merchantProfile);
      }
    } catch (error) {
      console.warn("Failed to load merchant data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMerchantData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      id: "qr",
      icon: "qr-code-outline",
      label: "QR Code",
      color: isDark ? "#10b981" : "#059669",
      route: "/(merchant)/qr-generator",
    },
    {
      id: "provision",
      icon: "card-outline",
      label: "Provision",
      color: isDark ? "#3b82f6" : "#2563eb",
      route: "/(transaction)/ProvisionCard",
    },
    {
      id: "manage",
      icon: "settings-outline",
      label: "Manage",
      color: isDark ? "#f59e0b" : "#d97706",
      route: "/(transaction)/CardManagement",
    },
    {
      id: "analytics",
      icon: "bar-chart-outline",
      label: "Analytics",
      color: isDark ? "#a78bfa" : "#7c3aed",
      route: "/(merchant)/sales-analytics",
    },
  ];

  if (loading) {
    return (
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-[#0a0a0f]" : "bg-white"}`}
      >
        <ActivityIndicator
          size="large"
          color={isDark ? "#a78bfa" : "#7c3aed"}
        />
      </View>
    );
  }

  return (
    <>
      <View className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}>
        <ScrollView
          className="flex-1 pt-20"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? "#a78bfa" : "#7c3aed"}
            />
          }
        >
          <ScreenHeader
            goBack={false}
            title={user?.merchant?.businessName || "Your Business at a Glance"}
            subtitle={"Merchant Dashboard"}
          />

          {/* Stats Cards */}
          <View className="px-6 mt-3 flex-row gap-3">
            <View
              className={`flex-1 p-4 rounded-2xl ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"}`}
            >
              <View className="flex-row justify-between items-center">
                <Ionicons
                  name="cash-outline"
                  size={21}
                  color={isDark ? "#10b981" : "#059669"}
                />
                <Text
                  className={`text-base font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Today&apos;s Revenue
                </Text>
              </View>

              <Text
                className={`text-2xl text-right font-bold mt-2 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                ₦{stats.revenue.toLocaleString()}
              </Text>
            </View>

            <View
              className={`flex-1 p-4 rounded-2xl ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"}`}
            >
              <View className="flex-row justify-between items-center">
                <Ionicons
                  name="swap-horizontal-outline"
                  size={24}
                  color={isDark ? "#3b82f6" : "#2563eb"}
                />

                <Text
                  className={`text-base font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Transactions
                </Text>
              </View>

              <Text
                className={`text-2xl text-right font-bold mt-2 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {stats.transactions}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="px-6 mt-5">
            <Text
              className={`text-xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Quick Actions
            </Text>

            <Pressable
              className={`px-6 py-4 rounded-2xl mb-4 ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"}`}
              onPress={() => router.push("/(merchant)/BankUptime")}
            >
              <View className="flex-row items-center gap-4">
                <Ionicons
                  name="pulse"
                  size={24}
                  color={isDark ? "#34d399" : "#059669"}
                />
                <View className="flex-1">
                  <Text
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Bank Uptime
                  </Text>
                  <Text
                    className={`text-base mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Quick Industry Status Check
                  </Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              className={`px-6 py-4 rounded-2xl mb-4 ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"}`}
              onPress={() => setShowMerchantPayModal(true)}
            >
              <View className="flex-row items-center gap-4">
                <Ionicons
                  name="card"
                  size={24}
                  color={isDark ? "#34d399" : "#059669"}
                />
                <View className="flex-1">
                  <Text
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Accept NFC Payments
                  </Text>
                  <Text
                    className={`text-base mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Tap Customer Card To Receive Payment
                  </Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              className={`px-6 py-4 rounded-2xl mb-4 ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"}`}
              onPress={() => router.push("/(merchant)/MerchantServices")}
            >
              <View className="flex-row items-center gap-4">
                <Ionicons
                  name="compass"
                  size={24}
                  color={isDark ? "#34d399" : "#059669"}
                />
                <View className="flex-1">
                  <Text
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Services
                  </Text>
                  <Text
                    className={`text-base mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Card management & More
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          <View className="flex-row flex-wrap items-center gap-3 mt-5 px-5">
            {/* <Pressable
              className={`flex-1 py-5 rounded-2xl items-center backdrop-blur-xl ${
                isDark
                  ? "bg-white/10 border border-white/20"
                  : "bg-gray-50 border border-gray-200 shadow-sm"
              }`}
              onPress={() => setShowMerchantQRModal(true)}
              style={{
                shadowColor: isDark ? "#fff" : "#000",
                shadowOpacity: 0.05,
                shadowRadius: 10,
              }}
            >
              <Ionicons
                name="qr-code-outline"
                size={32}
                color={isDark ? "#10b981" : "#059669"}
              />
              <Text
                className={`text-sm mt-3 font-semibold text-center ${
                  isDark ? "text-gray-200" : "text-gray-700"
                }`}
              >
                QR Generator
              </Text>
            </Pressable> */}

            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                onPress={() => action.route && router.push(action.route as any)}
                className={`p-4 rounded-2xl items-center ${isDark ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"}`}
              >
                <Ionicons
                  name={action.icon as any}
                  size={32}
                  color={action.color}
                />
                <Text
                  className={`text-sm mt-2 font-semibold ${isDark ? "text-gray-200" : "text-gray-700"}`}
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

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
    </>
  );
}
