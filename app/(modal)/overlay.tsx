import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { ImageBackground, View } from "react-native";

const Overlay = () => {
  return (
    <ImageBackground
      source={{
        uri: "https://images.pexels.com/photos/35255685/pexels-photo-35255685.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      }}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 justify-center items-center bg-black/40">
        <View className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
          <MaterialCommunityIcons name="rocket" size={80} color="#f8fafc" />
        </View>
      </View>
    </ImageBackground>
  );
};

export default Overlay;
