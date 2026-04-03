import AccountService from "@/src/lib/services/AccountService";
import ToastService from "@/src/lib/services/ToastService";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SvgUri } from "react-native-svg";
import { useAuth } from "../context/AuthSessionProvider";

interface BalanceCardProps {
  accountEnquiry?: AccountBalanceEnquiry;
  loading?: boolean;
  onRefresh?: () => void;
  onAccountChange?: (account: BalanceEnquiry | null) => void;
}

const { width } = Dimensions.get("window");
const CARD_PADDING = 4;
const CARD_WIDTH = width - 50;
const CARD_MARGIN = 8;

const BalanceCard: React.FC<BalanceCardProps> = ({
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
      const accounts = await AccountService.AccountBalanceEnquiry();
      setInternalAccounts(accounts);
      setInternalLoading(false);
    } catch (error) {
      if (__DEV__) console.warn(error);
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
    if (!accountEnquiry && !loading) {
      loadAccountData();
    }
    if (accountEnquiry) {
      setInternalLoading(false);
    }
  }, [accountEnquiry, loading]);

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
      <View className="bg-lime-800/75 shadow-lg border border-lime-300 rounded-2xl p-6 mb-8 mx-3">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!allAccounts?.accounts?.length) {
    return (
      <View
        className={`bg-lime-800/75 rounded-2xl shadow-lg border-2 border-dashed ${
          isDark
            ? "bg-lime-600/20 border-lime-300"
            : "bg-lime-50 border-lime-800 shadow-lg"
        } py-5 px-4 mx-4`}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-base font-medium">
            No Accounts available
          </Text>
          <Text className="text-white text-right text-xl font-bold">NA</Text>
        </View>
        <Text className="text-white text-3xl font-bold">₦0.00</Text>
      </View>
    );
  }

  return (
    <View className="mb-2" style={{ paddingLeft: CARD_PADDING }}>
      <View>
        {/* Daily Spending Progress Bar */}
        <View
          className={`px-4 py-5 mb-3 mx-2 rounded-xl ${isDark ? "bg-white/10" : "bg-black/10"}`}
        >
          <View className="flex-row justify-between items-center mb-1">
            <Text className={`${isDark ? "text-white/80" : ""} text-sm`}>
              Daily Spending
            </Text>
            <Text className={`${isDark ? "text-white/80" : ""} text-sm`}>
              {visibleBalance
                ? `₦${(allAccounts.dailySpent || 0).toLocaleString()} / ₦${(allAccounts.dailyLimit || 1000).toLocaleString()}`
                : "•••• / ••••"}
            </Text>
          </View>
          <View
            className={`${isDark ? "bg-white/10" : "bg-black/20"} h-2 rounded-full overflow-hidden`}
          >
            <View
              className={`h-full rounded-full ${getProgressColor(getSpendingProgress(allAccounts))}`}
              style={{ width: `${getSpendingProgress(allAccounts)}%` }}
            />
          </View>
        </View>

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
              className={`bg-lime-700 rounded-2xl border border-lime-600 ${
                isDark
                  ? "bg-lime-600/20 border-2 border-lime-500/40"
                  : "bg-lime-50 border-2 border-lime-300"
              } px-3 py-2 mx-3 ${account.accountId === allAccounts.accounts?.[currentIndex]?.accountId ? "border-2 border-dashed border-lime-300" : ""}`}
              style={{
                width: CARD_WIDTH,
                marginRight:
                  index < (allAccounts.accounts?.length || 0) - 1
                    ? CARD_MARGIN
                    : 0,
              }}
              aria-disabled={account.status !== "ACTIVE"}
            >
              <View className="flex-row items-center gap-4">
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
                  <SvgUri uri={account.bankLogo} width={25} height={25} />
                </View>

                <View>
                  <Text className="text-white text-lg font-brand font-bold">
                    {account.accountId || "NA"}
                  </Text>

                  <Text className="text-white text-sm font-brand font-semibold">
                    {account.accountName || "NA"}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-end items-center gap-3">
                <Pressable
                  onPress={() => updateVisibleBalance(!visibleBalance)}
                >
                  {visibleBalance ? (
                    <Eye size={20} color="white" />
                  ) : (
                    <EyeOff size={20} color="white" />
                  )}
                </Pressable>

                <Text className="text-white text-xl font-brand font-bold">
                  {account.currency || "₦"}
                  {visibleBalance
                    ? account.availableBalance?.toLocaleString() || "0.00"
                    : "••••••"}
                </Text>
              </View>

              <View className="flex-row justify-between items-baseline"></View>

              {/* {account.isPrimary && (
                <View className="bg-yellow-500 px-2 py-1 rounded-full mb-2 self-start">
                  <Text className="text-black text-xs font-bold">PRIMARY</Text>
                </View>
              )} */}

              {/* <View className="flex-col gap-3">
                <View className="flex-row items-center gap-2">

                  <View className="flex-1" />

                </View>
              </View> */}
            </View>
          ))}
        </ScrollView>
      </View>

      {(allAccounts.accounts?.length || 0) > 1 && (
        <View
          className="flex-row mt-3 gap-2 px-4 mx-3"
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
