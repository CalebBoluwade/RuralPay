import { useAuth } from "@/components/context/AuthProvider";
import { Redirect, router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    console.log(user?.role);
    if (isAuthenticated) {
      if (user?.role === "merchant") {
        router.push("/(merchant)");
      } else if (user?.role === "consumer") {
        router.push("/(user)");
      }
    }
  }, [isAuthenticated, user]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return <Redirect href="/(auth)/Login" />;
}
