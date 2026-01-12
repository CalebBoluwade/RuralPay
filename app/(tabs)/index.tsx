import AccountService from "@/components/services/AccountService";
import { BankTransferService } from "@/components/services/BankTransferService";
import BalanceCard from "@/components/ui/BalanceCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Index() {
  const router = useRouter();
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    try {
      const [account, transactions] = await Promise.all([
        AccountService.getAccountData(),
        BankTransferService.FetchRecentTransactions(2),
      ]);

      setRecentTransactions(transactions);
    } catch (error) {
      console.warn(error);
      Alert.alert("Error", "Failed to load account data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadAccountData();
  };

  const handleBankTransfer = () => {
    Alert.alert("Bank Transfer", "Navigate to bank transfer screen");
  };

  const handleUSSDPayments = () => {
    Alert.alert("USSD Payments", "Navigate to USSD payments screen");
  };

  const handleQuickPay = () => {
    Alert.alert("Quick Pay", "Navigate to quick pay screen");
  };

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
      }}
      className="flex-1"
    >
      <View className="flex-1 pt-24 bg-black/40">
        <View className="flex-1 pt-15 px-5">
          <BalanceCard showNFC />

          {/* Quick Links */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-white mb-4">
              Quick Links
            </Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 bg-white/20 py-4 mx-1 rounded-lg items-center border border-white/30"
                onPress={handleBankTransfer}
              >
                <Ionicons name="card-outline" size={24} color="white" />
                <Text className="text-white text-xs mt-2 font-medium">
                  Bank Transfer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-white/20 py-4 mx-1 rounded-lg items-center border border-white/30"
                onPress={handleUSSDPayments}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color="white"
                />
                <Text className="text-white text-xs mt-2 font-medium">
                  USSD Payments
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-white/20 py-4 mx-1 rounded-lg items-center border border-white/30"
                onPress={handleQuickPay}
              >
                <Ionicons name="wallet-outline" size={24} color="white" />
                <Text className="text-white text-xs mt-2 font-medium">
                  Quick Pay
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="--flex-1">
            <Text className="text-lg font-bold text-white mb-4">
              Recent Transactions
            </Text>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.txId}
                  className="flex-row justify-between py-3 border-b border-white/20"
                  onPress={() =>
                    router.push(`/(transaction)/${transaction.txId}`)
                  }
                >
                  <View>
                    <Text className="text-base text-white">
                      {transaction.txId}
                    </Text>
                    <Text className="text-base text-white">
                      {transaction.merchantId}
                    </Text>
                  </View>
                  <View className="flex-col">
                    <Text className="text-xs text-white/70">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </Text>
                    <Text className="text-base font-semibold text-white">
                      -₦{transaction.amount.toLocaleString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="flex-row justify-center py-3">
                <Text className="text-base font-semibold text-white">
                  No Recent Transactions
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            className="bg-white/20 py-3 px-5 rounded-lg mb-5 items-center border border-white/30"
            onPress={handleRefresh}
          >
            <Text className="text-white text-sm font-semibold">
              Refresh Account Data
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={loading} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center">
          <View className="bg-white/10 rounded-xl p-6 items-center">
            <ActivityIndicator size="large" color="#fff" />
            <Text className="mt-3 text-base text-white">Loading...</Text>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}
