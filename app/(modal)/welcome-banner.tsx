import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

interface GuideItem {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
  onPress: () => void;
}

export default function WelcomeBanner() {
  const guides: GuideItem[] = [
    {
      title: "Add Your Card 💳",
      description: "Get your payment game started fr",
      icon: "card-outline",
      color: "#ff6b6b",
      bgColor: "bg-red-100",
      onPress: () => router.push("/(transaction)/ProvisionCard"),
    },
    {
      title: "Track Spending 📊",
      description: "Keep tabs on your coins",
      icon: "analytics-outline",
      color: "#45b7d1",
      bgColor: "bg-blue-100",
      onPress: () => router.push("/(common)/Transaction/SpendingTracker"),
    },
  ];

  const handleWelcomeClose = async () => {
    try {
      // await AsyncStorage.setItem("hasSeenWelcome", "true");
      router.back();
    } catch (error) {
      console.warn("Error saving welcome state:", error);
    }
  };

  return (
    <View className="flex-1 bg-black/70 justify-center items-center p-4">
      <View className="bg-white rounded-3xl p-6 w-full shadow-2xl border-4 border-lime-300">
        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-3xl font-black text-lime-600">
              Hey Bestie! ✨
            </Text>
            <Text className="text-lg text-gray-700 mt-2 font-semibold">
              Let&apos;s get this money! 💸
            </Text>
          </View>
          <Pressable
            onPress={handleWelcomeClose}
            className="bg-gray-100 rounded-full p-2 hover:bg-gray-200"
          >
            <Ionicons name="close" size={20} color="#6b7280" />
          </Pressable>
        </View>

        <ScrollView className="mt-2" showsVerticalScrollIndicator={false}>
          {guides.map((guide, index) => (
            <Pressable
              key={index}
              onPress={guide.onPress}
              className={`${guide.bgColor} rounded-2xl p-4 mb-3 border-2 border-dashed border-gray-300 active:scale-95 transition-transform`}
            >
              <View className="flex-row items-center">
                <View className="w-16 h-16 bg-white rounded-2xl items-center justify-center mr-4 shadow-lg border-2 border-gray-200">
                  <Ionicons name={guide.icon} size={28} color={guide.color} />
                </View>
                <View className="flex-1">
                  <Text className="font-black text-gray-900 text-lg">
                    {guide.title}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1 font-medium">
                    {guide.description}
                  </Text>
                </View>
                <View className="bg-white rounded-full p-2 shadow-sm">
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={guide.color}
                  />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable
          onPress={handleWelcomeClose}
          className="bg-lime-500 rounded-2xl p-4 mt-4 shadow-lg border-2 border-lime-300 active:scale-95"
        >
          <Text className="text-white text-center font-black text-lg">
            Let&apos;s Gooo! 🔥🚀
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
