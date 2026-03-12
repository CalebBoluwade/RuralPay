import ScreenHeader from "@/components/ui/ScreenHeader";
import PaymentService from "@/lib/services/PaymentService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";

const BankUptime = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBanks = async () => {
    try {
      const data = await PaymentService.GetBanks();
      setBanks(data);
    } catch (error) {
      console.error("Failed to fetch banks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBanks();
    setRefreshing(false);
  };

  const getStatusColor = (uptime: number) => {
    if (uptime >= 95) return "text-emerald-500";
    if (uptime >= 80) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (uptime: number) => {
    if (uptime >= 95) return "bg-emerald-500";
    if (uptime >= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  const filteredBanks = (banks || []).filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
      edges={["top"]}
    >
      <ScreenHeader
        title="Bank Uptime"
        subtitle="Live Status of Banking Partners"
        onBack={() => router.back()}
      />

      <View className="px-6 mb-4">
        <View
          className={`flex-row items-center px-4 h-12 rounded-xl border ${
            isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"
          }`}
        >
          <Ionicons
            name="search"
            size={20}
            color={isDark ? "#9ca3af" : "#6b7280"}
          />
          <TextInput
            className={`flex-1 ml-3 text-base ${
              isDark ? "text-white" : "text-gray-900"
            }`}
            placeholder="Search banks..."
            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Ionicons
              name="close-circle"
              size={20}
              color={isDark ? "#9ca3af" : "#6b7280"}
              onPress={() => setSearchQuery("")}
            />
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator
            size="large"
            color={isDark ? "#a78bfa" : "#7c3aed"}
          />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? "#a78bfa" : "#7c3aed"}
            />
          }
        >
          <View className="flex-row flex-wrap justify-between pb-8">
            {(filteredBanks || []).map((bank) => {
              const uptime = Math.round(bank.uptimePrediction || 0);
              return (
                <View
                  key={bank.code}
                  className={`w-full p-4 mb-3 rounded-2xl border flex-row items-center ${
                    isDark
                      ? "bg-white/5 border-white/10"
                      : "bg-white border-gray-100 shadow-sm"
                  }`}
                >
                  <View className="mr-4">
                    <SvgUri uri={bank.logoData} width={40} height={40} />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text
                        className={`font-bold text-lg flex-1 mr-2 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                        numberOfLines={1}
                      >
                        {bank.name}
                      </Text>
                      <View
                        className={`px-2 py-1 rounded-full ${
                          uptime >= 90
                            ? "bg-emerald-500/10"
                            : uptime >= 80
                              ? "bg-yellow-500/10"
                              : "bg-red-500/10"
                        }`}
                      >
                        <Text
                          className={`text-sm font-bold ${getStatusColor(
                            uptime,
                          )}`}
                        >
                          {uptime}%
                        </Text>
                      </View>
                    </View>
                    <View className="h-1.5 w-full bg-gray-200/20 rounded-full overflow-hidden">
                      <View
                        className={`h-full rounded-full ${getProgressColor(
                          uptime,
                        )}`}
                        style={{ width: `${uptime}%` }}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default BankUptime;
