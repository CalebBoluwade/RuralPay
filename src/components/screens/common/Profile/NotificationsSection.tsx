import { Bell } from "lucide-react-native";
import { Switch, Text, View } from "react-native";

interface NotificationsSectionProps {
  isDark: boolean;
  pushNotifications: boolean;
  setPushNotifications: (value: boolean) => void;
  smsNotifications: boolean;
  setSmsNotifications: (value: boolean) => void;
  emailNotifications: boolean;
  setEmailNotifications: (value: boolean) => void;
}

export function NotificationsSection({
  isDark,
  pushNotifications,
  setPushNotifications,
  smsNotifications,
  setSmsNotifications,
  emailNotifications,
  setEmailNotifications,
}: NotificationsSectionProps) {
  const renderSwitch = (
    title: string,
    description: string,
    value: boolean,
    onChange: (value: boolean) => void
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
            className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}
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
          <Bell size={24} color={isDark ? "#a3e635" : "#65a30d"} />
        </View>
        <Text
          className={`text-xl font-brand font-bold ${isDark ? "text-white" : "text-gray-900"}`}
        >
          Notifications
        </Text>
      </View>

      {renderSwitch(
        "Push Notifications",
        "Receive app notifications about transactions",
        pushNotifications,
        setPushNotifications
      )}

      {renderSwitch(
        "SMS Notifications",
        "Get SMS alerts for important updates",
        smsNotifications,
        setSmsNotifications
      )}

      {renderSwitch(
        "Email Notifications",
        "Receive email notifications and reports",
        emailNotifications,
        setEmailNotifications
      )}
    </View>
  );
}
