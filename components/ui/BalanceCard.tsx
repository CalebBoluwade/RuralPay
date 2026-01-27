import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import AccountService from "../services/AccountService";
import ToastService from "../services/ToastService";

interface BalanceCardProps {
  showNFC?: boolean;
  accounts?: BalanceEnquiry[];
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
  accounts: externalAccounts,
  loading: externalLoading,
  onRefresh,
  onAccountChange,
}) => {
  const { visibleBalance, updateVisibleBalance } = useAuth();
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalAccounts, setInternalAccounts] = useState<BalanceEnquiry[]>(
    [],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const loading =
    externalLoading !== undefined ? externalLoading : internalLoading;
  const accounts = externalAccounts || internalAccounts;

  const loadAccountData = async () => {
    try {
      const balance = await AccountService.AccountBalance();
      setInternalAccounts((balance || []).slice(0, 3));
      setInternalLoading(false);
    } catch (error) {
      console.warn(error);
      ToastService.error("Failed to load Balance");
      setInternalLoading(false);
    }
  };

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    if (!externalAccounts) {
      loadAccountData();
    }
  }, [externalAccounts]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + CARD_MARGIN));
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (accounts.length > 0 && onAccountChange) {
      onAccountChange(accounts[currentIndex] || null);
    }
  }, [currentIndex, accounts, onAccountChange]);

  return loading ? (
    <View className="bg-green-800 shadow-lg border border-green-700 rounded-2xl p-6 mb-8 mx-3">
      <ActivityIndicator size="large" color="#fff" />
    </View>
  ) : accounts.length === 0 ? (
    <View className="bg-lime-700 rounded-2xl shadow-lg border border-lime-600 px-6 py-5 mx-6">
      <View className="flex-row justify-between items-center">
        <Text className="text-white text-xl font-medium">Balance</Text>
        <Text className="text-white text-right text-xl font-bold">NA</Text>
      </View>
      <Text className="text-white text-3xl font-bold mb-6">₦0.00</Text>
      <Text className="text-white/70 text-center">
        No Wallet / Accounts available
      </Text>
    </View>
  ) : (
    <View className="mb-4">
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
          {accounts.map((account, index) => (
            <View
              key={account.accountId}
              className="bg-lime-700 rounded-2xl shadow-lg border border-lime-600 px-6 py-5"
              style={{
                width: CARD_WIDTH,
                marginRight: index < accounts.length - 1 ? CARD_MARGIN : 0,
              }}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-white text-lg font-medium">Balance</Text>
                <Text className="text-white text-right text-lg font-bold">
                  {account.accountId || "NA"}
                </Text>
              </View>

              <Text className="text-white text-2xl font-bold mb-4">
                {account.currency || "₦"}
                {visibleBalance
                  ? account.availableBalance?.toLocaleString() || "0.00"
                  : "••••••"}
              </Text>

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

                  <TouchableOpacity
                    className={`p-2 rounded-2xl items-center ${
                      isDark
                        ? "bg-white/10 border border-white/20"
                        : "bg-gray-50 border border-gray-200 shadow-sm"
                    }`}
                    onPress={() => router.push("/(transaction)/QRPayments")}
                    style={{
                      shadowColor: isDark ? "#fff" : "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="qrcode-scan"
                      size={16}
                      color={isDark ? "#fff" : "#000"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {accounts.length > 1 && (
        <View
          className="flex-row mt-3 gap-2"
          style={{ paddingLeft: CARD_PADDING }}
        >
          {accounts.map((_, index) => (
            <View
              key={index + 1}
              className={`h-2 rounded-full ${
                index === currentIndex ? "bg-green-600 w-6" : "bg-gray-400 w-2"
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default BalanceCard;
