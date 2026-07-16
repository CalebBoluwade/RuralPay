import { useAuth } from "@/src/components/context/AuthSessionProvider";
import AccountService from "@/src/lib/services/AccountService";
import ToastService from "@/src/lib/services/ToastService";
import { Bell } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Switch, Text, View } from "react-native";

interface NotificationSettings {
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
}

type SettingKey = keyof NotificationSettings;

interface NotificationsSectionProps {
  isDark: boolean;
}

export function NotificationsSection({
  isDark,
}: Readonly<NotificationsSectionProps>) {
  const { user } = useAuth();

  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: user?.notifications?.devicePush ?? true,
    smsNotifications: user?.notifications?.sms ?? true,
    emailNotifications: user?.notifications?.email ?? true,
  });
  const [updating, setUpdating] = useState<SettingKey | null>(null);

  const handleToggle = async (key: SettingKey, value: boolean) => {
    const previous = settings[key];
    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: value }));
    setUpdating(key);

    const result = await AccountService.updateNotificationSettings({
      ...settings,
      [key]: value,
    });

    if (!result.success) {
      // Revert on failure
      setSettings((prev) => ({ ...prev, [key]: previous }));
      ToastService.error(result.message || "Failed to update setting");
    }

    setUpdating(null);
  };

  const rows: { key: SettingKey; title: string; description: string }[] = [
    {
      key: "pushNotifications",
      title: "Push Notifications",
      description: "Receive app notifications about transactions",
    },
    {
      key: "smsNotifications",
      title: "SMS Notifications",
      description: "Get SMS alerts for important updates",
    },
    {
      key: "emailNotifications",
      title: "Email Notifications",
      description: "Receive email notifications and reports",
    },
  ];

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
        {/* {loading && (
          <ActivityIndicator
            size="small"
            color={isDark ? "#a3e635" : "#65a30d"}
            style={{ marginLeft: 8 }}
          />
        )} */}
      </View>

      {rows.map(({ key, title, description }, index) => (
        <View
          key={key}
          className={`p-4 rounded-2xl ${index < rows.length - 1 ? "mb-4" : ""} ${
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
            {updating === key ? (
              <ActivityIndicator
                size="small"
                color={isDark ? "#a3e635" : "#65a30d"}
              />
            ) : (
              <Switch
                value={settings[key]}
                onValueChange={(value) => handleToggle(key, value)}
                disabled={updating !== null}
                trackColor={{
                  false: isDark ? "#374151" : "#E5E7EB",
                  true: "#84cc16",
                }}
                thumbColor={settings[key] ? "#FFFFFF" : "#9CA3AF"}
              />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
