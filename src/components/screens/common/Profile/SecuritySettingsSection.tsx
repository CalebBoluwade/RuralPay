import { useLanguage } from "@/src/components/context/LanguageContext";
import { ChevronRight, Key, ShieldCheck } from "lucide-react-native";
import { Pressable, Switch, Text, View } from "react-native";

interface SecuritySettingsSectionProps {
  isDark: boolean;
  nativeAuthLogin: boolean;
  onBiometricLoginToggle: (value: boolean) => void;
  nativeAuthTransactions: boolean;
  onTransactionSecurityToggle: (value: boolean) => void;
  visibleBalance: boolean;
  onVisibleBalanceToggle: (value: boolean) => void;
  onPinPress: () => void;
}

export function SecuritySettingsSection({
  isDark,
  nativeAuthLogin,
  onBiometricLoginToggle,
  nativeAuthTransactions,
  onTransactionSecurityToggle,
  visibleBalance,
  onVisibleBalanceToggle,
  onPinPress,
}: SecuritySettingsSectionProps) {
  const { t } = useLanguage();

  const renderSecurityToggle = (
    title: string,
    description: string,
    value: boolean,
    onChange: (value: boolean) => void,
  ) => (
    <View
      className={`p-4 rounded-2xl mb-4 ${
        isDark
          ? "bg-slate-800 border border-slate-700"
          : "bg-slate-50 border border-slate-200"
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            className={`text-lg font-semibold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {title}
          </Text>
          <Text
            className={`text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            {description}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{
            false: isDark ? "#374151" : "#E5E7EB",
            true: "#84cc16",
          }}
          thumbColor={value ? "#FFFFFF" : "#9CA3AF"}
        />
      </View>
    </View>
  );

  return (
    <View
      className={`rounded-2xl p-6 mb-6 ${
        isDark
          ? "bg-slate-900 border border-slate-700"
          : "bg-white border border-slate-200"
      }`}
    >
      <View className="flex-row items-center mb-6">
        <View
          className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
            isDark ? "bg-slate-800" : "bg-slate-100"
          }`}
        >
          <ShieldCheck size={24} color={isDark ? "#84cc16" : "#65a30d"} />
        </View>
        <Text
          className={`text-xl font-brand font-bold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          {t("profile.security")}
        </Text>
      </View>

      <View className="mb-6">
        {renderSecurityToggle(
          t("profile.biometricLogin"),
          "Use fingerprint or face ID for secure login",
          nativeAuthLogin,
          onBiometricLoginToggle,
        )}

        {renderSecurityToggle(
          t("profile.transactionSecurity"),
          "Require biometric authentication for payments",
          nativeAuthTransactions,
          onTransactionSecurityToggle,
        )}

        {renderSecurityToggle(
          t("profile.visibleBalance"),
          "View or Hide Account Balance",
          visibleBalance,
          onVisibleBalanceToggle,
        )}
      </View>

      <Pressable
        className={`p-4 rounded-2xl ${
          isDark
            ? "bg-lime-400/10 border border-lime-400/30"
            : "bg-lime-50 border border-lime-200"
        }`}
        onPress={onPinPress}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Key size={20} color={isDark ? "#84cc16" : "#65a30d"} />
            <Text
              className={`font-bold ml-3 text-lg ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Change Security PIN
            </Text>
          </View>
          <ChevronRight size={20} color={isDark ? "#84cc16" : "#65a30d"} />
        </View>
      </Pressable>
    </View>
  );
}
