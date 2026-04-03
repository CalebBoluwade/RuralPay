import React from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";

const Loading = ({
  loading,
  isInitialLoad,
  accentColor,
  isDark,
  screenName,
}: {
  loading: boolean;
  isInitialLoad: boolean;
  accentColor: string;
  isDark: boolean;
  screenName: string;
}) => {
  return (
    <Modal visible={loading && isInitialLoad} transparent animationType="fade">
      <View
        className={`flex-1 justify-center items-center ${isDark ? "bg-black/80" : "bg-black/40"}`}
      >
        <View
          className={`rounded-3xl p-8 items-center ${
            isDark
              ? "bg-slate-900 border border-white/20"
              : "bg-white border border-slate-200"
          }`}
        >
          <ActivityIndicator size="large" color={accentColor} />
          <Text
            className={`mt-4 text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
          >
            Loading {screenName}...
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default Loading;
