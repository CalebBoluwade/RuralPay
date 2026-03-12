import { useLanguage } from "@/components/context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, useColorScheme, View } from "react-native";

const LINKS = [
  {
    icon: "mic-outline" as const,
    labelKey: "payments.voice",
    color: { dark: "#84cc16", light: "#65a30d" },
    route: "/(transaction)/VoiceTransactionBanking" as const,
  },
  {
    icon: "phone-portrait-outline" as const,
    labelKey: "payments.ussd",
    color: { dark: "#fb923c", light: "#ea580c" },
    route: "/(transaction)/USSDPay" as const,
  },
  {
    icon: "qr-code-outline" as const,
    labelKey: "payments.qr",
    color: { dark: "#60a5fa", light: "#2563eb" },
    route: "/(transaction)/QRPayments" as const,
  },
  //   {
  //     icon: "qr-code-outline" as const,
  //     labelKey: "payments.qrscan",
  //     color: { dark: "#60a5fa", light: "#2563eb" },
  //     route: "/(merchant)/QRScan" as const,
  //   },
  {
    icon: "bluetooth-outline" as const,
    labelKey: "payments.bluetooth",
    color: { dark: "#a78bfa", light: "#7c3aed" },
    route: "/(transaction)/BluetoothPayments" as const,
  },
];

export default function QuickLinks() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();

  return (
    <View className="flex-1 px-6 py-8">
      <Text
        className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {t("home.quickLinks")}
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {LINKS.map(({ icon, labelKey, color, route }) => (
          <Pressable
            key={labelKey}
            className={`py-5 rounded-2xl items-center backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-gray-50 border border-gray-200 shadow-sm"
            }`}
            style={{
              width: "30.5%",
              shadowColor: isDark ? "#fff" : "#000",
              shadowOpacity: 0.05,
              shadowRadius: 10,
            }}
            onPress={() => {
              router.dismiss();
              router.push(route);
            }}
          >
            <Ionicons
              name={icon}
              size={32}
              color={isDark ? color.dark : color.light}
            />
            <Text
              className={`text-sm mt-3 font-semibold text-center ${
                isDark ? "text-gray-200" : "text-gray-700"
              }`}
            >
              {t(labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* <MerchantQRModal
        showMerchantQRModal={true}
        setShowMerchantQRModal={() => {}}
      /> */}
    </View>
  );
}
