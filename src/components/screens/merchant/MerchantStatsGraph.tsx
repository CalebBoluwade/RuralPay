import { useLanguage } from "@/src/components/context/LanguageContext";
import Card from "@/src/components/ui/Card";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import MerchantService from "@/src/lib/services/MerchantService";
import { formatNaira } from "@/src/lib/utils";
import * as ScreenOrientation from "expo-screen-orientation";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
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

  const loadMerchantData = async () => {
    try {
      const MerchantAnalyticsData =
        await MerchantService.GetMerchantAnalytics();
      if (__DEV__) console.log(MerchantAnalyticsData);

      if (MerchantAnalyticsData) {
        setMerchant(MerchantAnalyticsData);
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
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: withTiming(fade.value === 1 ? 0 : 20) }],
  }));

  if (!merchant)
    return (
      <SafeAreaView className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-gray-50"}`}>
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
          <Text className={`text-2xl font-bold mb-6 ${titleClass}`}>
            {t("merchant.analytics")}
          </Text>

          <View className="flex-row justify-between mb-6">
            <Card lightClass="bg-white shadow" className="p-4 w-[48%]">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.totalVolume")}
              </Text>
              <Text className={`text-lg font-bold mt-1 ${valueClass}`}>
                {formatNaira(merchant.totalCompletedVolume)}
              </Text>
            </Card>
            <Card lightClass="bg-white shadow" className="p-4 w-[48%]">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.totalProfit")}
              </Text>
              <Text className={`text-lg font-bold mt-1 ${valueClass}`}>
                {formatNaira(merchant.totalProfit)}
              </Text>
            </Card>
          </View>

          <Card lightClass="bg-white shadow" className="p-4 mb-6">
            <Text className={`text-xs ${labelClass}`}>
              {t("merchant.totalTransactions")}
            </Text>
            <Text className={`text-xl font-bold mt-1 ${valueClass}`}>
              {merchant.totalCompletedCount}
            </Text>
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
              <Text className={`text-sm text-center py-6 ${labelClass}`}>{t("merchant.noData")}</Text>
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
              <Text className={`text-sm text-center py-6 ${labelClass}`}>{t("merchant.noData")}</Text>
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
              <Text className={`text-sm text-center py-6 ${labelClass}`}>{t("merchant.noData")}</Text>
            )}
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MerchantStatsGraph;
