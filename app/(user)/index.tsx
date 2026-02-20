import { useAuth } from "@/components/context/AuthProvider";
import { useLanguage } from "@/components/context/LanguageContext";
import BalanceCard from "@/components/ui/BalanceCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import AccountService from "@/lib/services/AccountService";
import PaymentService from "@/lib/services/PaymentService";
import ToastService from "@/lib/services/ToastService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function Index() {
  const router = useRouter();
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

  const { user } = useAuth();

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
    try {
      await Location.getForegroundPermissionsAsync();

      const [transactions, balance] = await Promise.all([
        PaymentService.FetchRecentTransactions(3),
        AccountService.AccountBalance(),
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
      const hasSeenWelcome =
        (await AsyncStorage.getItem("hasSeenWelcome")) === "true";

      if (!hasSeenWelcome) {
        router.push("/(modal)/welcome-banner");
      }
    } catch (error) {
      console.warn("Error checking first visit:", error);
    }
  };

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}
    >
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#a78bfa" : "#7c3aed"}
            colors={[isDark ? "#a78bfa" : "#7c3aed"]}
          />
        }
      >
        <ScreenHeader
          goBack={false}
          title={getGreeting()}
          subtitle={user?.FirstName || "User Name"}
        />

        <BalanceCard accountEnquiry={accountEnquiry!} loading={loading} />

        <View className="px-6 mt-2">
          {/* Merchant Section */}
          <View className="mb-8">
            <Text
              className={`text-xl font-bold mb-6 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              My To-Do&apos;s ✨
            </Text>

            <Pressable
              className={`px-6 py-5 rounded-2xl backdrop-blur-xl border ${
                isDark
                  ? "border-lime-600/30"
                  : "border-lime-300 bg-gray-50 shadow-lg"
              }`}
              onPress={async () => router.push("/(common)/LinkBankAccount")}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className={`p-3 rounded-xl ${
                    isDark ? "bg-lime-500/30" : "bg-lime-300/50"
                  }`}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={28}
                    color={"#fff"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-lg font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Link Account
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      isDark ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    Add Accounts. Start Transacting Today!
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  // color={isDark ? "#a78bfa" : "#7c3aed"}
                />
              </View>
            </Pressable>
          </View>

          {/* Recent Transactions */}
          <View className="mb-4">
            <Pressable
              className="flex-row justify-between items-center gap-3 mb-6"
              onPress={() =>
                router.push("/(common)/Transaction/TransactionHistory")
              }
            >
              <Text
                className={`text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Recent Transactions
              </Text>

              <Ionicons
                name="chevron-forward-outline"
                size={21}
                className={`${isDark ? "text-white" : "text-gray-50"}`}
              />
            </Pressable>

            <View
              className={`rounded-2xl backdrop-blur-xl border border-lime-600/30 ${
                isDark ? "bg-white/10" : "bg-gray-50 shadow-lg"
              }`}
            >
              <FlatList
                data={recentTransactions}
                keyExtractor={(item) =>
                  item.transactionID + item.transactionDate
                }
                renderItem={({ item }) => (
                  <Pressable
                    className={`flex-row justify-between p-4 ${
                      isDark
                        ? "border-b border-white/10"
                        : "border-b border-gray-200/30"
                    }`}
                    onPress={() =>
                      router.push(`/(common)/Transaction/${item.transactionID}`)
                    }
                  >
                    <View className="flex-1 flex-row items-center gap-3">
                      <View className="bg-lime-600 rounded-full p-2">
                        <Ionicons name="swap-vertical" size={28} color="#fff" />
                      </View>
                      <View>
                        <Text
                          className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {item.paymentMode}
                        </Text>
                        <Text
                          className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {item.merchantId}
                        </Text>
                        <Text
                          className={`text-base mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {item.transactionID}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text
                        className={`text-base font-bold ${isDark ? "text-red-400" : "text-red-600"}`}
                      >
                        -₦{item.amount.toLocaleString()}
                      </Text>
                      <Text
                        className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {new Date(item.transactionDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View className="py-8 items-center">
                    <Ionicons
                      name="receipt-outline"
                      size={48}
                      color={isDark ? "#4b5563" : "#9ca3af"}
                    />
                    <Text
                      className={`text-sm font-medium mt-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      No Recent Transactions
                    </Text>
                  </View>
                }
                scrollEnabled={false}
              />
            </View>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      <Modal
        visible={loading && isInitialLoad}
        transparent
        animationType="fade"
      >
        <View
          className={`flex-1 justify-center items-center ${
            isDark ? "bg-black/80" : "bg-black/50"
          }`}
        >
          <View
            className={`rounded-3xl p-8 items-center backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white border border-gray-200"
            }`}
          >
            <ActivityIndicator
              size="large"
              color={isDark ? "#a78bfa" : "#7c3aed"}
            />
            <Text
              className={`mt-4 text-base font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Loading...
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
