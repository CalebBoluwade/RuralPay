import CreditCard from "@/assets/images/CreditCard.svg";
import Button from "@/src/components/ui/Button";
import { router } from "expo-router";
import { Text, useColorScheme, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Unauthenticated() {
  const isDark = useColorScheme() === "dark";
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <View className="flex-1 justify-between px-6 pt-8 pb-6">
        <View>
          <Text
            className={`text-lg font-brand mb-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            Welcome to RuralPay
          </Text>
          <Text
            className={`text-3xl font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Sign in to continue
          </Text>
        </View>

        <View className="items-center">
          <CreditCard width={width - 48} height={(width - 48) * 0.8} />
        </View>

        <View className="gap-4">
          <Text
            className={`text-center text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}
          >
            You Need To Be Signed In To Access This Section.
          </Text>

          <Button
            label="Sign In"
            onPress={() => router.replace("/auth/login")}
          />

          <Button
            label="Create Account"
            variant="secondary"
            onPress={() => router.replace("/auth/register")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
