import { useLanguage } from "@/src/components/context/LanguageContext";
import Card from "@/src/components/ui/Card";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import MerchantService from "@/src/lib/services/MerchantService";
import { formatNaira } from "@/src/lib/utils";
import { useFocusEffect } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { TrendingDown, TrendingUp } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#10b981",
  PENDING: "#f59e0b",
  FAILED_SETTLEMENT: "#ef4444",
  CARD_PAYMENT_REJECTED: "#f97316",
  CANCELLED: "#6b7280",
};

const MODE_COLORS: Record<string, string> = {
  CARD: "#4f86c6",
  QR: "#2a9d8f",
  BANK_TRANSFER: "#8b5cf6",
  USSD: "#f4a261",
  BLE: "#e76f51",
};

const FALLBACK_COLORS = [
  "#4f86c6",
  "#f4a261",
  "#2a9d8f",
  "#e76f51",
  "#8b5cf6",
  "#10b981",
];

// gifted-charts reserves ~50px internally for the y-axis label area
const Y_AXIS_OFFSET = 50;
const CARD_H_PADDING = 32; // p-4 = 16 each side

const shortLabel = (label: string) =>
  label
    .replaceAll(/_/g, " ")
    .replace(/PAYMENT|SETTLEMENT/g, "")
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

const formatCompact = (amount: number) => {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount}`;
};

/** Dot + label row used in every legend */
function LegendDot({
  color,
  label,
}: Readonly<{ color: string; label: string }>) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }}
      />
      <Text style={{ fontSize: 10, color: "#6b7280" }}>{label}</Text>
    </View>
  );
}

const MerchantStatsGraph = () => {
  const [merchant, setMerchant] = useState<MerchantDetails>();
  const [loading, setLoading] = React.useState(true);
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">(
    "weekly",
  );
  const [trendData, setTrendData] = useState<any[]>([]);
  // measured inner width of the chart cards
  const [cardWidth, setCardWidth] = useState(0);
  const fade = useSharedValue(0);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();

  const labelClass = isDark ? "text-gray-400" : "text-gray-500";
  const valueClass = isDark ? "text-white" : "text-gray-900";
  const titleClass = isDark ? "text-white" : "text-gray-900";
  const chartAxisStyle = { fontSize: 9, color: isDark ? "#9ca3af" : "#6b7280" };
  const chartBg = isDark ? "#0a0a0f" : "#ffffff";
  const chartGridColor = isDark ? "#ffffff15" : "#e5e7eb";

  // safe chart width: card inner width minus gifted-charts' internal y-axis reservation
  const chartWidth = cardWidth > 0 ? cardWidth - Y_AXIS_OFFSET : 0;

  useEffect(() => {
    loadMerchantData();
  }, []);

  const generateTrendData = (data: MerchantDetails) => {
    const days = 7;
    const avg = (data.totalCompletedVolume || 0) / days;
    return Array.from({ length: days }, (_, i) => ({
      value: Math.round((avg + Math.random() * avg * 0.3) / 1000),
      label: `D${i + 1}`,
    }));
  };

  const loadMerchantData = async () => {
    try {
      const data = await MerchantService.GetMerchantAnalytics();
      if (data) {
        setMerchant(data);
        setTrendData(generateTrendData(data));
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
        <ScreenHeader goBack title={t("merchant.merchantSalesAnalytics")} />
      </SafeAreaView>
    );

  const statusData = merchant.byStatus ?? [];
  const modeData = merchant.byPaymentMode ?? [];
  const totalTx = statusData.reduce((s, i) => s + i.transactionCount, 0);
  const successRate =
    totalTx > 0
      ? Math.round(
          ((statusData.find((s) => s.status === "COMPLETED")
            ?.transactionCount ?? 0) /
            totalTx) *
            100,
        )
      : 0;

  // dynamic bar width: spread bars evenly across available space
  const barWidthForCount = (count: number) =>
    chartWidth > 0
      ? Math.max(16, Math.floor((chartWidth - 20) / Math.max(count, 1)) - 8)
      : 24;

  const topLabel = (text: string) => {
    const TopLabel = () => (
      <Text
        style={{
          fontSize: 9,
          color: isDark ? "#d1d5db" : "#374151",
          marginBottom: 2,
        }}
      >
        {text}
      </Text>
    );
    TopLabel.displayName = "TopLabel";
    return TopLabel;
  };

  const barCountData = statusData.map((item, i) => ({
    value: item.transactionCount,
    label: shortLabel(item.status),
    frontColor:
      STATUS_COLORS[item.status] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    topLabelComponent: topLabel(String(item.transactionCount)),
  }));

  const barVolumeData = statusData.map((item, i) => ({
    value: item.totalAmount / 1000,
    label: shortLabel(item.status),
    frontColor:
      STATUS_COLORS[item.status] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    topLabelComponent: topLabel(formatCompact(item.totalAmount)),
  }));

  const statusPieData = statusData.map((item, i) => ({
    value: item.transactionCount,
    color:
      STATUS_COLORS[item.status] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  const modePieData = modeData.map((item, i) => ({
    value: item.totalAmount,
    color:
      MODE_COLORS[item.paymentMode] ??
      FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  const modeBarData = modeData.map((item, i) => ({
    value: item.totalAmount / 1000,
    label: item.paymentMode,
    frontColor:
      MODE_COLORS[item.paymentMode] ??
      FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    topLabelComponent: topLabel(formatCompact(item.totalAmount)),
  }));

  const modeTotal = modeData.reduce((s, i) => s + i.totalAmount, 0);

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-gray-50"}`}
    >
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={isDark ? "#a78bfa" : "#7c3aed"}
          />
        }
      >
        <Animated.View style={animatedStyle} className="px-4 pt-2">
          {/* Header */}
          <ScreenHeader
            goBack={false}
            title={t("merchant.merchantSalesAnalytics")}
            menuItems={[]}
          />

          {/* Time Range */}
          <View className="flex-row gap-2 mb-5">
            {(["daily", "weekly", "monthly"] as const).map((range) => (
              <Pressable
                key={range}
                onPress={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg ${
                  timeRange === range
                    ? isDark
                      ? "bg-lime-600"
                      : "bg-lime-500"
                    : isDark
                      ? "bg-white/10"
                      : "bg-gray-200"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${timeRange === range ? "text-white" : labelClass}`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* KPI Row 1 */}
          <View className="flex-row gap-2 mb-3">
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.totalVolume")}
              </Text>
              <Text
                className={`text-base font-bold mt-1 ${valueClass}`}
                numberOfLines={1}
              >
                {formatNaira(merchant.totalCompletedVolume)}
              </Text>
              <View className="flex-row items-center mt-1">
                <TrendingUp size={12} color="#10b981" />
                <Text className="text-xs text-green-600 ml-1">+12.5% MoM</Text>
              </View>
            </Card>
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.totalProfit")}
              </Text>
              <Text
                className={`text-base font-bold mt-1 ${valueClass}`}
                numberOfLines={1}
              >
                {formatNaira(merchant.totalProfit)}
              </Text>
              <View className="flex-row items-center mt-1">
                <TrendingUp size={12} color="#10b981" />
                <Text className="text-xs text-green-600 ml-1">+5.1% MoM</Text>
              </View>
            </Card>
          </View>

          {/* KPI Row 2 */}
          <View className="flex-row gap-2 mb-3">
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.totalTransactions")}
              </Text>
              <Text className={`text-base font-bold mt-1 ${valueClass}`}>
                {merchant.totalCompletedCount}
              </Text>
              <View className="flex-row items-center mt-1">
                <TrendingUp size={12} color="#10b981" />
                <Text className="text-xs text-green-600 ml-1">+8.2% MoM</Text>
              </View>
            </Card>
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                {t("merchant.successRate")}
              </Text>
              <Text className={`text-base font-bold mt-1 ${valueClass}`}>
                {successRate}%
              </Text>
              <View className="flex-row items-center mt-1">
                {successRate >= 50 ? (
                  <TrendingUp size={12} color="#10b981" />
                ) : (
                  <TrendingDown size={12} color="#ef4444" />
                )}
                <Text
                  className={`text-xs ml-1 ${successRate >= 50 ? "text-green-600" : "text-red-500"}`}
                >
                  {successRate >= 50 ? "On track" : "Needs attention"}
                </Text>
              </View>
            </Card>
          </View>

          {/* KPI Row 3 — Today */}
          <View className="flex-row gap-2 mb-5">
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                Today&apos;s Volume
              </Text>
              <Text
                className={`text-base font-bold mt-1 ${valueClass}`}
                numberOfLines={1}
              >
                {formatNaira(merchant.todayCompletedVolume)}
              </Text>
              <Text className={`text-xs mt-1 ${labelClass}`}>
                {merchant.todayCompletedCount} txns
              </Text>
            </Card>
            <Card lightClass="bg-white shadow" className="p-4 flex-1">
              <Text className={`text-xs ${labelClass}`}>
                Today&apos;s Profit
              </Text>
              <Text
                className="text-base font-bold mt-1 text-green-500"
                numberOfLines={1}
              >
                {formatNaira(merchant.todayProfit)}
              </Text>
              <Text className={`text-xs mt-1 ${labelClass}`}>
                Avg{" "}
                {formatNaira(
                  merchant.todayCompletedCount > 0
                    ? merchant.todayProfit / merchant.todayCompletedCount
                    : 0,
                )}
                /txn
              </Text>
            </Card>
          </View>

          {/* measure card width once — all charts share this */}
          <View
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width - CARD_H_PADDING;
              if (w !== cardWidth) setCardWidth(w);
            }}
          >
            {/* Revenue Trend */}
            <Card lightClass="bg-white shadow" className="p-4 mb-5">
              <Text className={`text-sm font-semibold mb-3 ${titleClass}`}>
                Revenue Trend (₦K)
              </Text>
              {chartWidth > 0 && trendData.length > 0 ? (
                <LineChart
                  data={trendData}
                  width={chartWidth}
                  height={180}
                  isAnimated
                  animationDuration={1200}
                  xAxisLabelTextStyle={chartAxisStyle}
                  yAxisTextStyle={chartAxisStyle}
                  backgroundColor={chartBg}
                  color="#8b5cf6"
                  startFillColor="#a78bfa"
                  endFillColor={isDark ? "#1e1b4b" : "#ede9fe"}
                  xAxisColor={chartGridColor}
                  yAxisColor={chartGridColor}
                  rulesColor={chartGridColor}
                  curved
                />
              ) : (
                <Text className={`text-sm text-center py-6 ${labelClass}`}>
                  {t("merchant.noData")}
                </Text>
              )}
            </Card>

            {/* Transactions by Status */}
            <Card lightClass="bg-white shadow" className="p-4 mb-5">
              <Text className={`text-sm font-semibold ${titleClass}`}>
                {t("merchant.transactionsByStatus")}
              </Text>
              <Text className={`text-xs mb-3 ${labelClass}`}>
                Count per status
              </Text>
              {chartWidth > 0 && barCountData.length > 0 ? (
                <>
                  <BarChart
                    data={barCountData}
                    width={chartWidth}
                    barWidth={barWidthForCount(barCountData.length)}
                    noOfSections={4}
                    isAnimated
                    xAxisLabelTextStyle={chartAxisStyle}
                    yAxisTextStyle={chartAxisStyle}
                    backgroundColor={chartBg}
                    xAxisColor={chartGridColor}
                    yAxisColor={chartGridColor}
                    rulesColor={chartGridColor}
                  />
                  <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-3">
                    {statusData.map((item, i) => (
                      <LegendDot
                        key={item.status}
                        color={
                          STATUS_COLORS[item.status] ??
                          FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                        }
                        label={`${item.status.replace(/_/g, " ")}  ${item.transactionCount}`}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <Text className={`text-sm text-center py-6 ${labelClass}`}>
                  {t("merchant.noData")}
                </Text>
              )}
            </Card>

            {/* Status Distribution Pie */}
            <Card lightClass="bg-white shadow" className="p-4 mb-5">
              <Text className={`text-sm font-semibold mb-4 ${titleClass}`}>
                {t("merchant.statusDistribution")}
              </Text>
              {statusPieData.length > 0 ? (
                <>
                  <View className="items-center mb-4">
                    <PieChart
                      data={statusPieData}
                      donut
                      innerRadius={50}
                      radius={90}
                      isAnimated
                      backgroundColor={chartBg}
                      centerLabelComponent={() => (
                        <View className="items-center">
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              color: isDark ? "#fff" : "#111827",
                            }}
                          >
                            {totalTx}
                          </Text>
                          <Text
                            style={{
                              fontSize: 9,
                              color: isDark ? "#9ca3af" : "#6b7280",
                            }}
                          >
                            total
                          </Text>
                        </View>
                      )}
                    />
                  </View>
                  {/* legend — full width rows, no squeezing */}
                  <View style={{ gap: 8 }}>
                    {statusData.map((item, i) => {
                      const color =
                        STATUS_COLORS[item.status] ??
                        FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                      const pct =
                        totalTx > 0
                          ? Math.round((item.transactionCount / totalTx) * 100)
                          : 0;
                      return (
                        <View
                          key={item.status}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: color,
                            }}
                          />
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 11,
                              color: isDark ? "#d1d5db" : "#374151",
                            }}
                          >
                            {item.status.replace(/_/g, " ")}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: isDark ? "#9ca3af" : "#6b7280",
                              marginRight: 8,
                            }}
                          >
                            {pct}%
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "600",
                              color: isDark ? "#fff" : "#111827",
                              minWidth: 24,
                              textAlign: "right",
                            }}
                          >
                            {item.transactionCount}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <Text className={`text-sm text-center py-6 ${labelClass}`}>
                  {t("merchant.noData")}
                </Text>
              )}
            </Card>

            {/* Volume by Status */}
            <Card lightClass="bg-white shadow" className="p-4 mb-5">
              <Text className={`text-sm font-semibold ${titleClass}`}>
                {t("merchant.volumeByStatus")}
              </Text>
              <Text className={`text-xs mb-3 ${labelClass}`}>Amount in ₦K</Text>
              {chartWidth > 0 && barVolumeData.length > 0 ? (
                <>
                  <BarChart
                    data={barVolumeData}
                    width={chartWidth}
                    barWidth={barWidthForCount(barVolumeData.length)}
                    noOfSections={4}
                    isAnimated
                    xAxisLabelTextStyle={chartAxisStyle}
                    yAxisTextStyle={chartAxisStyle}
                    backgroundColor={chartBg}
                    xAxisColor={chartGridColor}
                    yAxisColor={chartGridColor}
                    rulesColor={chartGridColor}
                  />
                  <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-3">
                    {statusData.map((item, i) => (
                      <LegendDot
                        key={item.status}
                        color={
                          STATUS_COLORS[item.status] ??
                          FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                        }
                        label={`${item.status.replace(/_/g, " ")}  ${formatCompact(item.totalAmount)}`}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <Text className={`text-sm text-center py-6 ${labelClass}`}>
                  {t("merchant.noData")}
                </Text>
              )}
            </Card>

            {/* Volume by Payment Mode — bar */}
            <Card lightClass="bg-white shadow" className="p-4 mb-5">
              <Text className={`text-sm font-semibold ${titleClass}`}>
                Volume by Payment Mode
              </Text>
              <Text className={`text-xs mb-3 ${labelClass}`}>Amount in ₦K</Text>
              {chartWidth > 0 && modeBarData.length > 0 ? (
                <>
                  <BarChart
                    data={modeBarData}
                    width={chartWidth}
                    barWidth={barWidthForCount(modeBarData.length)}
                    noOfSections={4}
                    isAnimated
                    xAxisLabelTextStyle={chartAxisStyle}
                    yAxisTextStyle={chartAxisStyle}
                    backgroundColor={chartBg}
                    xAxisColor={chartGridColor}
                    yAxisColor={chartGridColor}
                    rulesColor={chartGridColor}
                  />
                  <View className="flex-row flex-wrap gap-x-4 gap-y-2 mt-3">
                    {modeData.map((item, i) => (
                      <LegendDot
                        key={item.paymentMode}
                        color={
                          MODE_COLORS[item.paymentMode] ??
                          FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                        }
                        label={`${item.paymentMode}  ${formatCompact(item.totalAmount)}  ·  ${item.transactionCount} txns`}
                      />
                    ))}
                  </View>
                </>
              ) : (
                <Text className={`text-sm text-center py-6 ${labelClass}`}>
                  {t("merchant.noData")}
                </Text>
              )}
            </Card>

            {/* Payment Mode Split — pie */}
            <Card lightClass="bg-white shadow" className="p-4 mb-10">
              <Text className={`text-sm font-semibold mb-4 ${titleClass}`}>
                Payment Mode Split
              </Text>
              {modePieData.length > 0 ? (
                <>
                  <View className="items-center mb-4">
                    <PieChart
                      data={modePieData}
                      donut
                      innerRadius={50}
                      radius={90}
                      isAnimated
                      backgroundColor={chartBg}
                      centerLabelComponent={() => (
                        <View className="items-center">
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "700",
                              color: isDark ? "#fff" : "#111827",
                            }}
                          >
                            {formatCompact(modeTotal)}
                          </Text>
                          <Text
                            style={{
                              fontSize: 9,
                              color: isDark ? "#9ca3af" : "#6b7280",
                            }}
                          >
                            total
                          </Text>
                        </View>
                      )}
                    />
                  </View>
                  <View style={{ gap: 8 }}>
                    {modeData.map((item, i) => {
                      const color =
                        MODE_COLORS[item.paymentMode] ??
                        FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                      const pct =
                        modeTotal > 0
                          ? Math.round((item.totalAmount / modeTotal) * 100)
                          : 0;
                      return (
                        <View
                          key={item.paymentMode}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: color,
                            }}
                          />
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 11,
                              color: isDark ? "#d1d5db" : "#374151",
                            }}
                          >
                            {item.paymentMode}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: isDark ? "#9ca3af" : "#6b7280",
                              marginRight: 8,
                            }}
                          >
                            {pct}%
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "600",
                              color: isDark ? "#fff" : "#111827",
                            }}
                          >
                            {formatCompact(item.totalAmount)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <Text className={`text-sm text-center py-6 ${labelClass}`}>
                  {t("merchant.noData")}
                </Text>
              )}
            </Card>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MerchantStatsGraph;
