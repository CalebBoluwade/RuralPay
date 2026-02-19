import { useLanguage } from "@/components/context/LanguageContext";
import PieChart from "@/components/ui/PieChart";
import ScreenHeader from "@/components/ui/ScreenHeader";
import PaymentService from "@/lib/services/PaymentService";
import { getDatabase } from "@/lib/utils";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SpendingTracker = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [totalSpent, setTotalSpent] = useState(0);
  const [categorySpending, setCategorySpending] = useState<
    Record<string, number>
  >({});

  const categoryEmojis: Record<string, string> = {
    Food: "🍔",
    Restaurant: "🍽️",
    Groceries: "🛒",
    Shopping: "🛍️",
    Transport: "🚗",
    Entertainment: "🎬",
    Bills: "💡",
    Health: "💊",
    Other: "💸",
  };

  const getEmoji = (category: string) => {
    for (const key in categoryEmojis) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        return categoryEmojis[key];
      }
    }
    return categoryEmojis.Other;
  };

  useEffect(() => {
    loadSpendingData();
  }, []);

  const loadSpendingData = async () => {
    try {
      const db = await getDatabase(null);
      if (!db) return;

      const transactions = await PaymentService.FetchAllTransactions();
      const debits = transactions.filter((t) => t.txType?.includes("DEBIT"));

      const total = debits.reduce((sum, t) => sum + t.amount, 0);
      setTotalSpent(total);

      const categories: Record<string, number> = {};
      debits.forEach((t) => {
        const cat = t.paymentMode || "Other";
        categories[cat] = (categories[cat] || 0) + t.amount;
      });
      setCategorySpending(categories);
    } catch (error) {
      console.log(error);
    }
  };

  const categories = Object.entries(categorySpending)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="💰 Spending Tracker"
        // subtitle={t("transactions.spendingTrackerSubtitle")}
        onBack={() => router.back()}
      />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View
          className={`p-6 rounded-3xl mb-6 ${
            isDark
              ? "bg-lime-600/20 border-2 border-lime-500/40"
              : "bg-lime-50 border-2 border-lime-300 shadow-lg"
          }`}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Text className="text-2xl">💸</Text>
            <Text
              className={`text-sm font-semibold ${isDark ? "text-lime-300" : "text-lime-700"}`}
            >
              Total Spent This Month
            </Text>
          </View>
          <Text
            className={`text-5xl font-black ${isDark ? "text-white" : "text-gray-900"}`}
          >
            ₦{totalSpent.toLocaleString()}
          </Text>
          <Text
            className={`text-xs mt-2 ${isDark ? "text-lime-400" : "text-lime-600"}`}
          >
            {totalSpent > 50000
              ? "Whoa! Big spender! 🚀"
              : totalSpent > 20000
                ? "Looking good! 👍"
                : "Nice savings! 🎉"}
          </Text>
        </View>

        {categories.length > 0 && (
          <View className="items-center mb-6">
            <PieChart
              data={categories.map(([_, amount], i) => ({
                value: amount,
                color: ["#84cc16", "#3b82f6", "#22c55e", "#f97316", "#ec4899"][
                  i
                ],
              }))}
              size={200}
            />
          </View>
        )}

        <View className="flex-row items-center gap-2 mb-4">
          <Text className="text-2xl">🏆</Text>
          <Text
            className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Top Spending Categories
          </Text>
        </View>

        {categories.map(([category, amount], index) => {
          const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
          const emoji = getEmoji(category);
          const colors = [
            {
              bar: "bg-lime-500",
              bg: isDark
                ? "bg-lime-500/20 border-lime-500/40"
                : "bg-lime-50 border-lime-300",
            },
            {
              bar: "bg-blue-500",
              bg: isDark
                ? "bg-blue-500/20 border-blue-500/40"
                : "bg-blue-50 border-blue-300",
            },
            {
              bar: "bg-green-500",
              bg: isDark
                ? "bg-green-500/20 border-green-500/40"
                : "bg-green-50 border-green-300",
            },
            {
              bar: "bg-orange-500",
              bg: isDark
                ? "bg-orange-500/20 border-orange-500/40"
                : "bg-orange-50 border-orange-300",
            },
            {
              bar: "bg-pink-500",
              bg: isDark
                ? "bg-pink-500/20 border-pink-500/40"
                : "bg-pink-50 border-pink-300",
            },
          ];
          const color = colors[index % colors.length];

          return (
            <View
              key={category}
              className={`p-5 rounded-3xl mb-4 border-2 ${color.bg} shadow-md`}
            >
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center gap-3">
                  <View
                    className={`w-12 h-12 rounded-2xl items-center justify-center ${color.bar}`}
                  >
                    <Text className="text-2xl">{emoji}</Text>
                  </View>
                  <View>
                    <Text
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {category}
                    </Text>
                    <Text
                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {index === 0
                        ? "🥇 Top Spender"
                        : index === 1
                          ? "🥈 Runner Up"
                          : index === 2
                            ? "🥉 Third Place"
                            : `#${index + 1}`}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text
                    className={`text-xl font-black ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    ₦{amount.toLocaleString()}
                  </Text>
                  <Text
                    className={`text-xs font-bold ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {percentage.toFixed(0)}%
                  </Text>
                </View>
              </View>
              <View
                className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-gray-200"}`}
              >
                <View
                  className={`h-3 rounded-full ${color.bar}`}
                  style={{ width: `${percentage}%` }}
                />
              </View>
            </View>
          );
        })}

        {categories.length === 0 && (
          <View className="py-20 items-center">
            <Text className="text-7xl mb-4">🎉</Text>
            <Text
              className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              No Spending Yet!
            </Text>
            <Text
              className={`text-base text-center px-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Your wallet is safe... for now! 😄
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SpendingTracker;
