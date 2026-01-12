import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { View } from "react-native";

const Overlay = () => {
  return (
    <View className="flex-1 justify-center items-center bg-gradient-to-br from-slate-900/90 to-black/95">
      <View className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
        <MaterialCommunityIcons name="rocket" size={80} color="#f8fafc" />
      </View>
    </View>
  );
};

export default Overlay;
