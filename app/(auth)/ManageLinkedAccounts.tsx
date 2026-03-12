import ScreenHeader from "@/components/ui/ScreenHeader";
import AccountService from "@/lib/services/AccountService";
import ToastService from "@/lib/services/ToastService";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme
} from "react-native";
import { SvgUri } from "react-native-svg";

export default function ManageLinkedAccounts() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [linkedAccounts, setLinkedAccounts] = useState<BalanceEnquiry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadAccountData = async () => {
    try {
      const balance = await AccountService.AccountBalanceEnquiry();
      setLinkedAccounts(
        (balance.accounts ?? [{} as BalanceEnquiry]).slice(0, 3),
      );
      setLoading(false);
    } catch (error) {
      console.warn(error);
      ToastService.error("Failed to load Balance");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountData();
  }, []);

  const handleSetPrimary = (id: string) => {
    setLinkedAccounts((accounts) =>
      accounts.map((acc) => ({ ...acc, isPrimary: acc.id === id })),
    );
  };

  const handleRemoveAccount = (id: string) => {
    Alert.alert(
      "Remove Account",
      "Are you sure you want to unlink this account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            setLinkedAccounts((accounts) =>
              accounts.filter((acc) => acc.id !== id),
            ),
        },
      ],
    );
  };

  return (
    <View className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}>
      <ScrollView
        className="flex-1 px-6 pt-24"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Linked Accounts"
          subtitle={`${linkedAccounts.length} Account${
            linkedAccounts.length > 1 ? "s" : ""
          } Linked`}
          onBack={() => router.back()}
        />

        <Pressable
          className={`px-6 py-5 rounded-2xl backdrop-blur-xl mb-6 ${
            isDark
              ? "bg-lime-500/20 border-2 border-lime-500"
              : "bg-lime-50 border-2 border-lime-500"
          }`}
          onPress={() => router.push("/(common)/LinkBankAccount")}
        >
          <View className="flex-row items-center justify-center gap-3">
            <Ionicons name="add-circle" size={28} color={"#84cc16"} />
            <Text
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Link New Account
            </Text>
          </View>
        </Pressable>

        <Text
          className={`text-lg font-bold mb-4 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Your Accounts
        </Text>

        {linkedAccounts.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons
              name="card-outline"
              size={64}
              color={isDark ? "#84cc16" : "#65a30d"}
            />
            <Text
              className={`text-base mt-4 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No Accounts Linked Yet
            </Text>
          </View>
        ) : (
          linkedAccounts.map((account) => (
            <View
              key={account.id}
              className={`px-6 py-5 rounded-2xl backdrop-blur-xl mb-3 ${
                account.isPrimary
                  ? isDark
                    ? "bg-green-500/20 border-2 border-green-500"
                    : "bg-green-50 border-2 border-green-500"
                  : isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-gray-50 border border-gray-200"
              }`}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-2">
                    <SvgUri uri={account.bankLogo} width={36} height={36} />
                    <Text
                      className={`text-lg font-bold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {account.bankName}
                    </Text>

                    {account.isPrimary && (
                      <View
                        className={`px-2 py-1 rounded-full${
                          isDark ? "bg-green-500/30" : "bg-green-200"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isDark ? "text-green-300" : "text-green-700"
                          }`}
                        >
                          Primary
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    className={`text-base font-semibold ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {account.accountName}
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {account.accountId}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2">
                {!account.isPrimary && (
                  <Pressable
                    className={`flex-1 py-3 rounded-xl ${
                      isDark
                        ? "bg-lime-500/20 border border-lime-500"
                        : "bg-lime-50 border border-lime-500"
                    }`}
                    onPress={() => handleSetPrimary(account.id)}
                  >
                    <Text
                      className={`text-center text-sm font-bold ${
                        isDark ? "text-lime-300" : "text-lime-700"
                      }`}
                    >
                      Set as Primary
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  className={`${
                    account.isPrimary ? "flex-1" : "flex-1"
                  } py-3 rounded-xl ${
                    isDark
                      ? "bg-red-500/20 border border-red-500"
                      : "bg-red-50 border border-red-500"
                  }`}
                  onPress={() => handleRemoveAccount(account.id)}
                >
                  <Text
                    className={`text-center text-sm font-bold ${
                      isDark ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
