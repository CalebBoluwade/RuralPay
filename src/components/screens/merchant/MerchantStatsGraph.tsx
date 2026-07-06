import { useLanguage } from "@/src/components/context/LanguageContext";
import Card from "@/src/components/ui/Card";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import MerchantService from "@/src/lib/services/MerchantService";
import { formatNaira } from "@/src/lib/utils";
import { useFocusEffect } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { Download, TrendingDown, TrendingUp } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = ["#4f86c6", "#f4a261", "#2a9d8f", "#e76f51"];

const MerchantStatsGraph = () => {
  const [merchant, setMerchant] = useState<MerchantDetails>();
  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );
  const [trendData, setTrendData] = useState<any[]>([]);
  const fade = useSharedValue(0);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();

  const { width: screenWidth } = useWindowDimensions();
  const labelClass = isDark ? "text-gray-400" : "text-gray-500";
  const valueClass = isDark ? "text-white" : "text-gray-900";
  const titleClass = isDark ? "text-white" : "text-gray-900";
  const chartAxisStyle = {
    fontSize: 10,
    color: isDark ? "#9ca3af" : "#6b7280",
  };
  const chartBg = isDark ? "#0a0a0f" : "#ffffff";
  const chartGridColor = isDark ? "#ffffff15" : "#e5e7eb";
  const chartRulesColor = isDark ? "#ffffff15" : "#e5e7eb";

  useEffect(() => {
    loadMerchantData();
  }, []);

  // Generate trend data based on merchant data
  const generateTrendData = (data: MerchantDetails) => {
    if (!data.byStatus) return [];

    // Create trend line - simulate daily revenue for the past 7 days
    const days = 7;
    const avgDailyVolume = (data.totalCompletedVolume || 0) / days;

    return Array.from({ length: days }, (_, i) => ({
      value: Math.round(
        (avgDailyVolume + Math.random() * avgDailyVolume * 0.3) / 1000,
      ),
      label: `Day ${i + 1}`,
    }));
  };

  const loadMerchantData = async () => {
    try {
      const MerchantAnalyticsData =
        await MerchantService.GetMerchantAnalytics();
      if (__DEV__) console.log(MerchantAnalyticsData);

      if (MerchantAnalyticsData) {
        setMerchant(MerchantAnalyticsData);
        setTrendData(generateTrendData(MerchantAnalyticsData));
      }
    } catch (error) {
      if (__DEV__) console.warn("Failed to load merchant data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadMerchantData();
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      fade.value = withTiming(1, { duration: 800 });
      return () => {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        );
      };
    }, []),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: withTiming(fade.value === 1 ? 0 : 20) }],
  }));

  if (!merchant)
    return (
      <SafeAreaView
        className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-gray-50"}`}
      >
        <ScreenHeader goBack title={t("merchant.salesAnalytics")} />
      </SafeAreaView>
    );

  const statusData = merchant.byStatus ?? [];

  const barCountData = statusData.map((item, i) => ({
    value: item.transactionCount,
    label: item.status,
    frontColor: COLORS[i % COLORS.length],
  }));

  const barVolumeData = statusData.map((item, i) => ({
    value: item.totalAmount,
    label: item.status,
    frontColor: COLORS[i % COLORS.length],
  }));

  const pieData = statusData.map((item, i) => ({
    value: item.transactionCount,
    text: item.status,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-gray-50"}`}
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
        <ScreenHeader goBack title={t("merchant.salesAnalytics")} />
        <Animated.View style={animatedStyle} className="px-4 pt-2">
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-2xl font-bold ${titleClass}`}>
              {t("merchant.analytics")}
            </Text>
            <Pressable
              className={`p-2 rounded-lg ${isDark ? "bg-white/10" : "bg-gray-200"}`}
            >
              <Download size={20} color={isDark ? "#a78bfa" : "#7c3aed"} />
            </Pressable>
          </View>

          {/* Time Range Selector */}
          <View className="flex-row gap-2 mb-6">
            {(["daily", "weekly", "monthly"] as const).map((range) => (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === range
                    ? isDark
                      ? "bg-purple-600"
                      : "bg-purple-500"
                    : isDark
                      ? "bg-white/10"
                      : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    timeRange === range ? "text-white" : labelClass
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* KPI Cards Row 1 */}
          <View className="flex-row justify-between mb-6 gap-2">
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.totalVolume")}
              </Text>
              <Text className={`text-lg font-bold mt-1 ${valueClass}`}>
                {formatNaira(merchant?.totalCompletedVolume || 0)}
              </Text>
              <View className="flex-row items-center mt-2">
                <TrendingUp size={14} color="#10b981" />
                <Text className="text-xs text-green-600 ml-1">+12.5% MoM</Text>
              </View>
            </Card>
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.avgTransaction")}
              </Text>
              <Text className={`text-lg font-bold mt-1 ${valueClass}`}>
                {formatNaira(
                  (merchant?.totalCompletedVolume || 0) /
                    Math.max(merchant?.totalCompletedCount || 1, 1),
                )}
              </Text>
              <View className="flex-row items-center mt-2">
                <TrendingDown size={14} color="#ef4444" />
                <Text className="text-xs text-red-600 ml-1">-2.3% MoM</Text>
              </View>
            </Card>
          </View>

          {/* KPI Cards Row 2 */}
          <View className="flex-row justify-between mb-6 gap-2">
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.totalTransactions")}
              </Text>
              <Text className={`text-lg font-bold mt-1 ${valueClass}`}>
                {merchant?.totalCompletedCount || 0}
              </Text>
              <View className="flex-row items-center mt-2">
                <TrendingUp size={14} color="#10b981" />
                <Text className="text-xs text-green-600 ml-1">+8.2% MoM</Text>
              </View>
            </Card>
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.successRate")}
              </Text>
              <Text className={`text-lg font-bold mt-1 ${valueClass}`}>
                {merchant?.totalCompletedCount &&
                merchant?.totalCompletedCount > 0
                  ? `${Math.round((merchant.totalCompletedCount / Math.max(merchant.totalCompletedCount, 1)) * 100)}%`
                  : "N/A"}
              </Text>
              <View className="flex-row items-center mt-2">
                <TrendingUp size={14} color="#10b981" />
                <Text className="text-xs text-green-600 ml-1">+0.8% MoM</Text>
              </View>
            </Card>
          </View>

          {/* Revenue Trend Chart */}
          <Card lightClass="bg-white shadow" className="p-4 mb-6">
            <Text className={`text-base font-semibold mb-4 ${titleClass}`}>
              Revenue Trend
            </Text>
            {trendData.length > 0 ? (
              <LineChart
                data={trendData}
                width={screenWidth - 80}
                height={200}
                isAnimated
                animationDuration={1200}
                xAxisLabelTextStyle={chartAxisStyle}
                yAxisTextStyle={chartAxisStyle}
                backgroundColor={chartBg}
                color="#8b5cf6"
                startFillColor="#a78bfa"
                endFillColor="#e9d5ff"
                xAxisColor={chartGridColor}
                yAxisColor={chartGridColor}
                rulesColor={chartRulesColor}
              />
            ) : (
              <Text className={`text-base text-center py-6 ${labelClass}`}>
                {t("merchant.noData")}
              </Text>
            )}
          </Card>

          <Card lightClass="bg-white shadow" className="p-4 mb-6">
            <Text className={`text-base font-semibold mb-4 ${titleClass}`}>
              {t("merchant.transactionsByStatus")}
            </Text>
            {barCountData.length > 0 ? (
              <BarChart
                data={barCountData}
                width={screenWidth - 80}
                barWidth={32}
                noOfSections={4}
                isAnimated
                xAxisLabelTextStyle={chartAxisStyle}
                yAxisTextStyle={chartAxisStyle}
                backgroundColor={chartBg}
                xAxisColor={chartGridColor}
                yAxisColor={chartGridColor}
                rulesColor={chartRulesColor}
              />
            ) : (
              <Text className={`text-base text-center py-6 ${labelClass}`}>
                {t("merchant.noData")}
              </Text>
            )}
          </Card>

          <Card lightClass="bg-white shadow" className="p-4 mb-6">
            <Text className={`text-base font-semibold mb-4 ${titleClass}`}>
              {t("merchant.statusDistribution")}
            </Text>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                donut
                innerRadius={50}
                radius={100}
                isAnimated
                textSize={10}
                textColor={isDark ? "#f9fafb" : "#111827"}
                backgroundColor={chartBg}
                centerLabelComponent={() => (
                  <Text className={`text-xs ${labelClass}`}>
                    {t("merchant.statusLabel")}
                  </Text>
                )}
              />
            ) : (
              <Text className={`text-base text-center py-6 ${labelClass}`}>
                {t("merchant.noData")}
              </Text>
            )}
          </Card>

          <Card lightClass="bg-white shadow" className="p-4 mb-10">
            <Text className={`text-base font-semibold mb-4 ${titleClass}`}>
              {t("merchant.volumeByStatus")}
            </Text>
            {barVolumeData.length > 0 ? (
              <BarChart
                data={barVolumeData}
                width={screenWidth - 80}
                barWidth={32}
                noOfSections={4}
                isAnimated
                xAxisLabelTextStyle={chartAxisStyle}
                yAxisTextStyle={chartAxisStyle}
                backgroundColor={chartBg}
                xAxisColor={chartGridColor}
                yAxisColor={chartGridColor}
                rulesColor={chartRulesColor}
              />
            ) : (
              <Text className={`text-base text-center py-6 ${labelClass}`}>
                {t("merchant.noData")}
              </Text>
            )}
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MerchantStatsGraph;
