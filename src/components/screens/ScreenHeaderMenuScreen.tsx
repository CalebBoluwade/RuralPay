import { menuItemsStore } from "@/src/lib/menuItemsStore";
import { router } from "expo-router";
import { Pressable, Text, useColorScheme, View } from "react-native";

export default function ScreenHeaderMenuScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const items = menuItemsStore.get();

  return (
    <View className="flex-1 px-6 pt-6">
      {items.map((item, index) => (
        <Pressable
          key={index}
          className={`flex-row items-center px-4 py-4 rounded-2xl mb-3 ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-gray-50 border border-gray-200"
          }`}
          onPress={() => {
            router.back();
            setTimeout(() => item.onPress(), 300);
          }}
        >
          {item.icon && (
            <item.icon
              size={20}
              color={isDark ? "white" : "black"}
              style={{ marginRight: 12 }}
            />
          )}
          <Text
            className={`text-base font-medium ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
