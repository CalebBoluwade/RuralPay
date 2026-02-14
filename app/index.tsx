import { useAuth } from "@/components/context/AuthProvider";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (isAuthenticated) {
    if (userRole === "merchant") {
      return <Redirect href="/(merchant)" />;
    } else if (userRole === "consumer") {
      return <Redirect href="/(user)" />;
    }
  }

  return <Redirect href="/(auth)/Login" />;
}
