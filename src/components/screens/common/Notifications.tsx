import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Notification = {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    icon: "credit-card-check",
    title: "Payment Successful",
    message: "Your payment of ₦5,000 to Shoprite was successful.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "2",
    icon: "bank-transfer-in",
    title: "Transfer Received",
    message: "You received ₦20,000 from John Doe.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "3",
    icon: "shield-alert",
    title: "Security Alert",
    message: "A new device logged into your account.",
    time: "3 hrs ago",
    read: true,
  },
  {
    id: "4",
    icon: "credit-card-off",
    title: "Card Declined",
    message: "Your card was declined at POS terminal.",
    time: "Yesterday",
    read: true,
  },
];

export default function Notifications() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <View className="flex-1 px-6 pt-4">
        {/* Header */}
        <View className="flex-row items-center mb-8">
          <Pressable onPress={() => router.back()} className="mr-4">
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={isDark ? "#f8fafc" : "#0f172a"}
            />
          </Pressable>
          <Text
            className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Notifications
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {NOTIFICATIONS.map((item) => (
            <Pressable
              key={item.id}
              className={`flex-row items-start gap-4 p-4 rounded-2xl mb-3 border ${
                item.read
                  ? isDark
                    ? "bg-slate-900 border-slate-800"
                    : "bg-white border-slate-200"
                  : isDark
                    ? "bg-slate-800 border-slate-700"
                    : "bg-lime-50 border-lime-200"
              }`}
            >
              <View
                className={`rounded-xl p-2 ${
                  item.read
                    ? isDark
                      ? "bg-slate-700"
                      : "bg-slate-100"
                    : "bg-lime-400"
                }`}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={item.read ? (isDark ? "#94a3b8" : "#64748b") : "#000"}
                />
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text
                    className={`font-semibold text-base ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {item.time}
                  </Text>
                </View>
                <Text
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
                >
                  {item.message}
                </Text>
              </View>
              {!item.read && (
                <View className="w-2 h-2 rounded-full bg-lime-400 mt-1" />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
