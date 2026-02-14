import AccountService from "@/lib/services/AccountService";
import ToastService from "@/lib/services/ToastService";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SvgUri } from "react-native-svg";
import { useAuth } from "../context/AuthProvider";

interface BalanceCardProps {
  showNFC?: boolean;
  accountEnquiry?: AccountBalanceEnquiry;
  loading?: boolean;
  onRefresh?: () => void;
  onAccountChange?: (account: BalanceEnquiry | null) => void;
}

const { width } = Dimensions.get("window");
const CARD_PADDING = 16;
const CARD_WIDTH = width - CARD_PADDING * 2;
const CARD_MARGIN = 12;

const BalanceCard: React.FC<BalanceCardProps> = ({
  showNFC = true,
  accountEnquiry,
  loading,
  onRefresh,
  onAccountChange,
}) => {
  const { visibleBalance, updateVisibleBalance } = useAuth();
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalAccounts, setInternalAccounts] =
    useState<AccountBalanceEnquiry>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const allAccounts = accountEnquiry ?? internalAccounts;

  const loadAccountData = async () => {
    try {
      const accounts = await AccountService.AccountBalance();
      setInternalAccounts(accounts);
      setInternalLoading(false);
    } catch (error) {
      console.warn(error);
      ToastService.error("Failed to load Balance");
      setInternalLoading(false);
    }
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const getSpendingProgress = (accounts: AccountBalanceEnquiry) => {
    const dailySpent = accounts.dailySpent || 0;
    const dailyLimit = accounts.dailyLimit || 1000;
    return Math.min((dailySpent / dailyLimit) * 100, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress <= 50) return "bg-green-500";
    if (progress <= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  useEffect(() => {
    if (!accountEnquiry) {
      loadAccountData();
    }
  }, [accountEnquiry]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN));
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (
      allAccounts?.accounts &&
      allAccounts.accounts.length > 0 &&
      onAccountChange
    ) {
      onAccountChange(allAccounts.accounts[currentIndex] || null);
    }
  }, [currentIndex, allAccounts, onAccountChange]);

  if (loading || internalLoading) {
    return (
      <View className="bg-green-800 shadow-lg border border-green-700 rounded-2xl p-6 mb-8 mx-3">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!allAccounts?.accounts?.length) {
    return (
      <View
        className={`bg-lime-800/75 rounded-2xl shadow-lg border-2 border-dashed border-lime-300 ${
          isDark ? "bg-lime-600/20" : "bg-lime-50 shadow-lg"
        } px-6 py-4 mx-4`}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-xl font-medium">Balance</Text>
          <Text className="text-white text-right text-xl font-bold">NA</Text>
        </View>
        <Text className="text-white text-3xl font-bold mb-6">₦0.00</Text>
        <Text className="text-white/70 text-center">
          No Wallet / Accounts available
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-2">
      <View style={{ paddingLeft: CARD_PADDING }}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          decelerationRate="fast"
        >
          {allAccounts.accounts.map((account, index) => (
            <View
              key={account.accountId}
              className={`bg-lime-800/75 rounded-2xl border border-lime-600 ${
                isDark
                  ? "bg-lime-600/20 border-2 border-lime-500/40"
                  : "bg-lime-50 border-2 border-lime-300"
              } px-6 py-4 ${account.accountId === allAccounts.accounts?.[currentIndex]?.accountId ? "border-2 border-dashed border-lime-300" : ""}`}
              style={{
                width: CARD_WIDTH,
                marginRight:
                  index < (allAccounts.accounts?.length || 0) - 1
                    ? CARD_MARGIN
                    : 0,
              }}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-white text-lg font-medium">Balance</Text>
                <Text className="text-white text-right text-lg font-bold">
                  {account.accountId || "NA"}
                </Text>
              </View>

              <Text className="text-white text-2xl font-bold mb-2">
                {account.currency || "₦"}
                {visibleBalance
                  ? account.availableBalance?.toLocaleString() || "0.00"
                  : "••••••"}
              </Text>

              {account.isPrimary && (
                <View className="bg-yellow-500 px-2 py-1 rounded-full mb-2 self-start">
                  <Text className="text-black text-xs font-bold">PRIMARY</Text>
                </View>
              )}

              {/* Daily Spending Progress Bar */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-white/80 text-xs">Daily Spending</Text>
                  <Text className="text-white/80 text-xs">
                    {visibleBalance
                      ? `₦${(allAccounts.dailySpent || 0).toLocaleString()} / ₦${(allAccounts.dailyLimit || 1000).toLocaleString()}`
                      : "•••• / ••••"}
                  </Text>
                </View>
                <View className="bg-white/20 h-2 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${getProgressColor(getSpendingProgress(allAccounts))}`}
                    style={{ width: `${getSpendingProgress(allAccounts)}%` }}
                  />
                </View>
              </View>

              <View className="flex-col gap-3">
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => updateVisibleBalance(!visibleBalance)}
                  >
                    <Ionicons
                      name={visibleBalance ? "eye" : "eye-off"}
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                  <Text
                    className="text-white/90 text-base flex-1"
                    numberOfLines={1}
                  >
                    {visibleBalance ? account.cardId : "•••• •••• •••• ••••"}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  <View className="bg-white/20 px-2 py-1 rounded">
                    <Text
                      className={`${
                        account.status === "ACTIVE"
                          ? "text-green-400"
                          : "text-red-400"
                      } text-xs font-bold`}
                    >
                      {account.status}
                    </Text>
                  </View>

                  {showNFC && (
                    <View className="bg-white/20 px-2 py-1 rounded">
                      <Text className="text-white text-xs font-bold">NFC</Text>
                    </View>
                  )}

                  <View className="flex-1" />

                  <View
                    className={`p-1 rounded-2xl items-center ${
                      isDark
                        ? "bg-white/10 border border-white/20"
                        : "bg-gray-50 border border-gray-200 shadow-sm"
                    }`}
                    style={{
                      shadowColor: isDark ? "#fff" : "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                    }}
                  >
                    <SvgUri uri={account.bankLogo} width={30} height={30} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {(allAccounts.accounts?.length || 0) > 1 && (
        <View
          className="flex-row mt-3 gap-2"
          style={{ paddingLeft: CARD_PADDING }}
        >
          {allAccounts.accounts?.map((_, index) => (
            <View
              key={index + 1}
              className={`h-2 rounded-full ${
                index === currentIndex
                  ? "bg-lime-800/75 w-6"
                  : "bg-gray-400 w-2"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default BalanceCard;
