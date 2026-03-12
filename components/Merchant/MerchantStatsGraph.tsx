import MerchantService from "@/lib/services/MerchantService";
import { formatNaira } from "@/lib/utils";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import ScreenHeader from "../ui/ScreenHeader";

const screenWidth = Dimensions.get("window").width;
const COLORS = ["#4f86c6", "#f4a261", "#2a9d8f", "#e76f51"];

const MerchantStatsGraph = () => {
  const [merchant, setMerchant] = useState<MerchantDetails>();
  const [loading, setLoading] = React.useState(true);
  const fade = useSharedValue(0);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    loadMerchantData();
  }, []);

  const loadMerchantData = async () => {
    try {
      const MerchantAnalyticsData =
        await MerchantService.GetMerchantAnalytics();
      console.log(MerchantAnalyticsData);

      if (MerchantAnalyticsData) {
        setMerchant(MerchantAnalyticsData);
      }
    } catch (error) {
      console.warn("Failed to load merchant data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadMerchantData();
    setLoading(false);
  };

  useEffect(() => {
    fade.value = withTiming(1, { duration: 800 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: withTiming(fade.value === 1 ? 0 : 20) }],
  }));

  if (!merchant) return null;

  const barCountData = merchant.byStatus.map((item, i) => ({
    value: item.transactionCount,
    label: item.status,
    frontColor: COLORS[i % COLORS.length],
  }));

  const barVolumeData = merchant.byStatus.map((item, i) => ({
    value: item.totalAmount,
    label: item.status,
    frontColor: COLORS[i % COLORS.length],
  }));

  const pieData = merchant.byStatus.map((item, i) => ({
    value: item.transactionCount,
    text: item.status,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <SafeAreaView
      className={`flex-1 --bg-gray-50 p-4 ${isDark ? "bg-[#0a0a0f]" : "bg-white"}`}
    >
      <ScrollView
        className={`flex-1`}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#a78bfa" : "#7c3aed"}
          />
        }
      >
        <ScreenHeader goBack title="Sales Analytics" />
        <Animated.View style={animatedStyle}>
          <Text className="text-2xl font-bold mb-6">Merchant Analytics</Text>

          <View className="flex-row justify-between mb-6">
            <View className="bg-white rounded-2xl p-4 shadow w-[48%]">
              <Text className="text-gray-500 text-xs">Total Volume</Text>
              <Text className="text-lg font-bold mt-1">
                {formatNaira(merchant.totalCompletedVolume)}
              </Text>
            </View>
            <View className="bg-white rounded-2xl p-4 shadow w-[48%]">
              <Text className="text-gray-500 text-xs">Total Profit</Text>
              <Text className="text-lg font-bold mt-1">
                {formatNaira(merchant.totalProfit)}
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow mb-6">
            <Text className="text-gray-500 text-xs">Total Transactions</Text>
            <Text className="text-xl font-bold mt-1">
              {merchant.totalCompletedCount}
            </Text>
          </View>

          <View className="bg-white rounded-2xl p-4 shadow mb-6">
            <Text className="text-base font-semibold mb-4">
              Transactions by Status
            </Text>
            <BarChart
              data={barCountData}
              width={screenWidth - 80}
              barWidth={32}
              noOfSections={4}
              isAnimated
              xAxisLabelTextStyle={{ fontSize: 10 }}
            />
          </View>

          <View className="bg-white rounded-2xl p-4 shadow mb-6">
            <Text className="text-base font-semibold mb-4">
              Status Distribution
            </Text>
            <PieChart
              data={pieData}
              donut
              innerRadius={50}
              radius={100}
              isAnimated
              textSize={10}
              centerLabelComponent={() => (
                <Text className="text-xs text-gray-500">Status</Text>
              )}
            />
          </View>

          <View className="bg-white rounded-2xl p-4 shadow mb-10">
            <Text className="text-base font-semibold mb-4">
              Volume by Status
            </Text>
            <BarChart
              data={barVolumeData}
              width={screenWidth - 80}
              barWidth={32}
              noOfSections={4}
              isAnimated
              xAxisLabelTextStyle={{ fontSize: 10 }}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MerchantStatsGraph;
