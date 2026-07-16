import { AppColor } from "@/src/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NotFound = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const router = useRouter();

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <View className="flex-1 justify-center items-center px-6 gap-3">
        <Text
          className={`text-2xl font-bold text-center ${isDark ? "text-white" : "text-slate-900"}`}
        >
          Transaction Not Found
        </Text>
        <Text
          className={`text-base text-center ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          The Transaction You&apos;re Looking For Doesn&apos;t Exist
        </Text>
        <Pressable
          className={`${AppColor(isDark).buttonBackground} rounded-2xl px-8 py-4 mt-4`}
          onPress={router.back}
        >
          <Text className="text-black text-base font-bold">← Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default NotFound;
