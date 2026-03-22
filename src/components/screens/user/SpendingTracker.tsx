import { useLanguage } from "@/src/components/context/LanguageContext";
import PieChart from "@/src/components/ui/PieChart";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import PaymentService from "@/src/lib/services/PaymentService";
import { categoryEmojis } from "@/src/lib/utils/narrationCategories";
import { useRouter } from "expo-router";
import { TrendingUp } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, View, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORY_COLORS = [
  { bar: "#a3e635", bg: "bg-lime-500/20" },
  { bar: "#60a5fa", bg: "bg-blue-500/20" },
  { bar: "#34d399", bg: "bg-emerald-500/20" },
  { bar: "#fb923c", bg: "bg-orange-500/20" },
  { bar: "#f472b6", bg: "bg-pink-500/20" },
];

const SpendingTracker = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [totalSpent, setTotalSpent] = useState(0);
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({});

  const getEmoji = (category: string) => {
    for (const key in categoryEmojis) {
      if (category.toLowerCase().includes(key.toLowerCase())) return categoryEmojis[key];
    }
    return categoryEmojis.Other;
  };

  useEffect(() => { loadSpendingData(); }, []);

  const loadSpendingData = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      const data = await PaymentService.FetchAllTransactions(startDate, endDate);
      const debits = data.transactions.filter((tx) => tx.txType?.includes("DEBIT"));
      setTotalSpent(debits.reduce((sum, tx) => sum + tx.amount, 0));
      const cats: Record<string, number> = {};
      debits.forEach((tx) => {
        const cat = tx.narration || "Other";
        cats[cat] = (cats[cat] || 0) + tx.amount;
      });
      setCategorySpending(cats);
    } catch (error) {
      console.log(error);
    }
  };

  const categories = Object.entries(categorySpending).sort(([, a], [, b]) => b - a).slice(0, 5);

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  const spendingLabel =
    totalSpent > 50000 ? "Whoa! Big spender! 🚀"
    : totalSpent > 20000 ? "Looking good! 👍"
    : "Nice savings! 🎉";

  return (
    <SafeAreaView className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}>
      <ScreenHeader title="Spending Tracker" onBack={() => router.back()} />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Total spent card */}
        <View className={`rounded-2xl p-5 mb-6 mt-4 ${cardClass}`}>
          <View className="flex-row items-center gap-3 mb-3">
            <View className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}>
              <TrendingUp size={22} color={isDark ? "#a3e635" : "#65a30d"} />
            </View>
            <View>
              <Text className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Total Spent This Month
              </Text>
              <Text className={`text-2xl font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                ₦{totalSpent.toLocaleString()}
              </Text>
            </View>
          </View>
          <Text className={`text-xs ${isDark ? "text-lime-400" : "text-lime-600"}`}>
            {spendingLabel}
          </Text>
        </View>

        {/* Pie chart */}
        {categories.length > 0 && (
          <View className="items-center mb-6">
            <PieChart
              data={categories.map(([_, amount], i) => ({
                value: amount,
                color: CATEGORY_COLORS[i % CATEGORY_COLORS.length].bar,
              }))}
              size={200}
            />
          </View>
        )}

        {/* Category breakdown */}
        {categories.length > 0 && (
          <>
            <Text className={`text-base font-brand font-bold mb-3 ${isDark ? "text-white" : "text-slate-900"}`}>
              Top Spending Categories
            </Text>
            <View className={`rounded-2xl overflow-hidden mb-8 ${cardClass}`}>
              {categories.map(([category, amount], index) => {
                const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                const emoji = getEmoji(category);
                const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                const rank = index === 0 ? "🥇 Top" : index === 1 ? "🥈 2nd" : index === 2 ? "🥉 3rd" : `#${index + 1}`;

                return (
                  <View
                    key={category}
                    className={`px-4 py-4 ${index < categories.length - 1 ? isDark ? "border-b border-white/10" : "border-b border-slate-100" : ""}`}
                  >
                    <View className="flex-row items-center gap-3 mb-3">
                      <View className={`w-12 h-12 rounded-xl items-center justify-center ${color.bg}`}>
                        <Text className="text-2xl">{emoji}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className={`text-sm font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`} numberOfLines={1}>
                          {category}
                        </Text>
                        <Text className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {rank}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          ₦{amount.toLocaleString()}
                        </Text>
                        <Text className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          {percentage.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <View className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-white/10" : "bg-slate-100"}`}>
                      <View
                        className="h-2 rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: color.bar }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {categories.length === 0 && (
          <View className="py-16 items-center gap-3">
            <Text className="text-6xl">🎉</Text>
            <Text className={`text-base font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              No Spending Yet!
            </Text>
            <Text className={`text-sm text-center px-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Your wallet is safe... for now! 😄
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SpendingTracker;
