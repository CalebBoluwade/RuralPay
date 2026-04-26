import ScreenHeader from "@/src/components/ui/ScreenHeader";
import PaymentService from "@/src/lib/services/PaymentService";
import { router } from "expo-router";
import { Activity, Search, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
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
      if (__DEV__) console.error("Failed to fetch banks", error);
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
    if (uptime >= 95) return "text-green-500";
    if (uptime >= 80) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (uptime: number) => {
    if (uptime >= 95) return "#22c55e";
    if (uptime >= 80) return "#eab308";
    return "#ef4444";
  };

  const filteredBanks = (banks || []).filter((bank) =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
    >
      <ScreenHeader
        title="Bank Uptime"
        subtitle="Live Status of Banking Partners"
        onBack={() => router.back()}
      />

      <View className="px-5 mb-4">
        {/* Search */}
        <View className={`rounded-2xl overflow-hidden ${cardClass}`}>
          <View className="flex-row items-center px-4 py-3 gap-3">
            <Search size={18} color={isDark ? "#64748b" : "#94a3b8"} />
            <TextInput
              className={`flex-1 text-sm font-brand ${isDark ? "text-white" : "text-slate-900"}`}
              placeholder="Search Banks..."
              placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={18} color={isDark ? "#64748b" : "#94a3b8"} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center gap-3">
          <ActivityIndicator
            size="large"
            color={isDark ? "#a3e635" : "#65a30d"}
          />
          <Text
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
          >
            Loading bank status...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 mt-3"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#a3e635"
              colors={["#a3e635"]}
            />
          }
        >
          <Text
            className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Banking Partners ({filteredBanks.length})
          </Text>

          <View className={`rounded-2xl overflow-hidden mb-8 ${cardClass}`}>
            {filteredBanks.length === 0 ? (
              <View className="py-16 items-center gap-3">
                <Activity size={44} color={isDark ? "#334155" : "#cbd5e1"} />
                <Text
                  className={`text-base font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  No Banks Found
                </Text>
                <Text
                  className={`text-sm text-center px-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {searchQuery
                    ? "Try adjusting your search"
                    : "No banking partners available"}
                </Text>
              </View>
            ) : (
              filteredBanks.map((bank, index) => {
                const uptime = Math.round(bank.uptimePrediction || 0);
                return (
                  <View
                    key={bank.bankCode}
                    className={`flex-row items-center px-4 py-4 gap-3 ${
                      index < filteredBanks.length - 1
                        ? isDark
                          ? "border-b border-white/10"
                          : "border-b border-slate-100"
                        : ""
                    }`}
                  >
                    <View
                      className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
                    >
                      <SvgUri uri={bank.logoData} width={24} height={24} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                        numberOfLines={1}
                      >
                        {bank.name}
                      </Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <View
                          className={`h-2 flex-1 rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"} overflow-hidden`}
                        >
                          <View
                            className="h-2 rounded-full"
                            style={{
                              width: `${uptime}%`,
                              backgroundColor: getProgressColor(uptime),
                            }}
                          />
                        </View>
                        <Text
                          className={`text-xs font-bold ${getStatusColor(uptime)}`}
                        >
                          {uptime}%
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default BankUptime;
