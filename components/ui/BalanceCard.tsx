import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthProvider";
import AccountService from "../services/AccountService";

interface BalanceCardProps {
  cardNumber?: string;
  showNFC?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  cardNumber = "•••• •••• •••• 4829",
  showNFC = true,
}) => {
  const { user, visibleBalance, updateVisibleBalance } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState<BalanceEnquiry | null>(null);

  const loadAccountData = async () => {
    try {
      const balance = await AccountService.getAccountBalance(user?.AccountId!);

      console.log(balance);

      setUserBalance(balance);
      setLoading(false);
    } catch (error) {
      console.warn(error);
      Alert.alert("Error", "Failed to load Balance");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  return loading ? (
    <View className="bg-green-800/50 backdrop-blur shadow-lg border border-white/50 rounded-2xl p-6 mb-8">
      <ActivityIndicator size="large" color="#fff" />
    </View>
  ) : (
    <View className="bg-green-700/45 backdrop-blur rounded-2xl shadow-lg border border-white/50 p-6 mb-4">
      <View className="flex flex-row items-center mb-2">
        <Text className="text-base text-white/80">Good Morning, </Text>
        <Text className="text-xl font-bold text-white">
          {user?.FirstName || ""}
        </Text>
      </View>

      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white text-base opacity-90">Balance</Text>

        <Text className="text-white text-right text-xl font-bold mb-2">
          {userBalance?.identifier || "NA"}
        </Text>
      </View>
      <View className="flex flex-row justify-between items-center gap-3">
        <View className="flex flex-row justify-between items-center gap-3">
          <TouchableOpacity
            onPress={() => updateVisibleBalance(!visibleBalance)}
          >
            <Ionicons
              name={visibleBalance ? "eye" : "eye-off"}
              size={20}
              color="white"
            />
          </TouchableOpacity>

          <Text className="text-white text-3xl font-bold">
            {userBalance?.currency || "₦"}
            {visibleBalance
              ? userBalance?.availableBalance?.toLocaleString() || "0.00"
              : "••••••"}
          </Text>
        </View>

        {showNFC && (
          <View className="bg-white/20 px-2 py-1 rounded">
            <Text className="text-white text-xs font-bold">NFC</Text>
          </View>
        )}
      </View>

      <Text className="text-white text-base opacity-80">{cardNumber}</Text>
    </View>
  );
};

export default BalanceCard;
