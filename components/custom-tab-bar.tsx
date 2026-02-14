import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, useColorScheme, View } from "react-native";

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: Readonly<BottomTabBarProps>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  return (
    <View
      className={`px-5 mb-10 bg-transparent`}
      style={{
        shadowColor: "transparent",
        elevation: 0,
      }}
    >
      <View
        className={`flex-row px-2 py-5 rounded-full ${isDark ? "bg-black/50" : "bg-white"}`}
      >
        {state.routes
          .slice(0, Math.floor(state.routes.length / 2))
          .map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                className="flex-1 items-center justify-center"
              >
                {options.tabBarIcon?.({
                  focused: isFocused,
                  color: isFocused
                    ? isDark
                      ? "#84cc16"
                      : "#65a30d"
                    : isDark
                      ? "#6b7280"
                      : "#9ca3af",
                  size: 24,
                })}
              </Pressable>
            );
          })}

        <Pressable
          className={`flex-1 items-center justify-center rounded-3xl py-3 px-2 ${isDark ? "bg-lime-500" : "bg-lime-600"}`}
          onPress={() => {
            router.push("/(transaction)/QRScan");
          }}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="white" />
        </Pressable>

        {state.routes
          .slice(Math.floor(state.routes.length / 2))
          .map((route, index) => {
            const { options } = descriptors[route.key];
            const actualIndex = Math.floor(state.routes.length / 2) + index;
            const isFocused = state.index === actualIndex;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                className="flex-1 items-center justify-center"
              >
                {options.tabBarIcon?.({
                  focused: isFocused,
                  color: isFocused
                    ? isDark
                      ? "#84cc16"
                      : "#65a30d"
                    : isDark
                      ? "#6b7280"
                      : "#9ca3af",
                  size: 24,
                })}
              </Pressable>
            );
          })}
      </View>
    </View>
  );
}
