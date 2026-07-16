import { router } from "expo-router";
import {
  ChevronRight,
  Link2,
  MessageSquareHeart,
  Pencil,
  Power,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface ProfileHeaderProps {
  readonly isDark: boolean;
  readonly user: User | null;
  readonly onEdit: () => void;
  readonly onLogout: () => void;
}

const themeClasses = {
  card: (isDark: boolean) =>
    `rounded-2xl ${isDark ? "bg-slate-900 border border-slate-700" : "bg-white border border-slate-200"}`,
  button: (isDark: boolean) =>
    `p-3 rounded-2xl ${isDark ? "bg-slate-800 border border-slate-700" : "bg-slate-100 border border-slate-200"}`,
  text: {
    title: (isDark: boolean) => (isDark ? "text-white" : "text-slate-900"),
    subtitle: (isDark: boolean) =>
      isDark ? "text-slate-400" : "text-slate-600",
  },
  icon: {
    light: (isDark: boolean) => (isDark ? "#a3e635" : "#65a30d"),
  },
};

function UserAvatar({ user }: Readonly<{ user: User | null }>) {
  const initials =
    user?.role === "merchant" && user.merchant
      ? (user.merchant.businessName[0] || "U") +
        (user.merchant.businessName[1] || "M")
      : (user?.firstName?.[0] || "U") + (user?.lastName?.[0] || "N");

  return (
    <View className="w-16 h-16 rounded-full bg-lime-400 justify-center items-center mb-4">
      <Text className="text-2xl text-white font-bold">{initials}</Text>
    </View>
  );
}

function ProfileActionButtons({
  isDark,
  onEdit,
  onLogout,
}: Readonly<{
  isDark: boolean;
  onEdit: () => void;
  onLogout: () => void;
}>) {
  return (
    <View className="flex-row justify-end gap-2 mb-4">
      <Pressable className={themeClasses.button(isDark)} onPress={onEdit}>
        <Pencil size={13} color={isDark ? "white" : "black"} />
      </Pressable>
      <Pressable className={themeClasses.button(isDark)} onPress={onLogout}>
        <Power size={16} color="#ef4444" />
      </Pressable>
    </View>
  );
}

export function ProfileHeader({
  isDark,
  user,
  onEdit,
  onLogout,
}: Readonly<ProfileHeaderProps>) {
  return (
    <>
      <View className={`${themeClasses.card(isDark)} px-6 py-3 mb-4`}>
        <View className="flex-row justify-between items-center">
          <UserAvatar user={user} />
          <ProfileActionButtons
            isDark={isDark}
            onEdit={onEdit}
            onLogout={onLogout}
          />
        </View>
        <ProfileInfoDisplay user={user} isDark={isDark} />
      </View>

      <Pressable
        className={`${themeClasses.card(isDark)} px-6 py-3 mb-4`}
        onPress={() => router.push("/user/manageLinkedAccounts")}
      >
        <View className="flex-row items-center gap-4">
          <Link2 size={26} color={themeClasses.icon.light(isDark)} />
          <View className="flex-1">
            <Text
              className={`text-lg font-brand font-bold ${themeClasses.text.title(isDark)}`}
            >
              Manage Linked Accounts
            </Text>
            <Text
              className={`text-base mt-1 ${themeClasses.text.subtitle(isDark)}`}
            >
              Link & Manage your Bank Accounts
            </Text>
          </View>
          <ChevronRight size={22} color={themeClasses.icon.light(isDark)} />
        </View>
      </Pressable>

      <Pressable
        className={`${themeClasses.card(isDark)} px-6 py-3 mb-4`}
        onPress={() => router.push("/feedback")}
      >
        <View className="flex-row items-center gap-4">
          <MessageSquareHeart
            size={26}
            color={themeClasses.icon.light(isDark)}
          />
          <View className="flex-1">
            <Text
              className={`text-lg font-brand font-bold ${themeClasses.text.title(isDark)}`}
            >
              Share Feedback
            </Text>
            <Text
              className={`text-base mt-1 ${themeClasses.text.subtitle(isDark)}`}
            >
              Help us build the product you deserve
            </Text>
          </View>
          <ChevronRight size={22} color={themeClasses.icon.light(isDark)} />
        </View>
      </Pressable>
    </>
  );
}

function ProfileInfoDisplay({
  user,
  isDark,
}: Readonly<{ user: User | null; isDark: boolean }>) {
  const {
    Mail,
    Phone,
    ShieldCheck,
    ShieldX,
    User,
  } = require("lucide-react-native");
  const iconColor = isDark ? "#9ca3af" : "#6b7280";

  return (
    <>
      <InfoRow
        icon={<User size={18} color={iconColor} />}
        text={`${user?.firstName} ${user?.lastName}`}
        isBold={true}
        isDark={isDark}
      />
      <InfoRow
        icon={<Mail size={18} color={iconColor} />}
        text={user?.email || ""}
        isDark={isDark}
      />
      <InfoRow
        icon={<ShieldCheck size={18} color={iconColor} />}
        text={user?.BVN || "Not Provided"}
        isDark={isDark}
      />
      <InfoRow
        icon={<Phone size={18} color={iconColor} />}
        text={user?.phoneNumber || ""}
        isDark={isDark}
      />

      <View className="flex-row items-center gap-2 mb-4">
        <View className="flex-row items-center gap-1 bg-lime-400/20 border border-lime-400/40 rounded-xl px-3 py-1">
          {user?.kycStatus === "VERIFIED" ? (
            <ShieldCheck size={14} color="#84cc16" />
          ) : (
            <ShieldX size={14} color="#84cc16" />
          )}
          <Text className="text-lime-400 text-base font-semibold">
            {user?.kycLevel ?? "NOT VERIFIED"}
          </Text>
        </View>
        <View className="bg-slate-700/40 border border-slate-600/40 rounded-xl px-3 py-1">
          <Text
            className={`text-base font-semibold ${themeClasses.text.subtitle(isDark)}`}
          >
            KYC Level {user?.kycLevel ?? 1}
          </Text>
        </View>
      </View>
    </>
  );
}

function InfoRow({
  icon,
  text,
  isBold,
  isDark,
}: Readonly<{
  icon: React.ReactNode;
  text: string;
  isBold?: boolean;
  isDark: boolean;
}>) {
  return (
    <View className="flex-row items-center gap-1 mb-2">
      {icon}
      <Text
        className={`text-lg ${isBold ? "font-brand font-bold mb-1" : ""} ${
          isDark ? "text-gray-400" : "text-gray-600"
        } ${isBold && isDark ? "text-white" : ""}`}
      >
        {text}
      </Text>
    </View>
  );
}
