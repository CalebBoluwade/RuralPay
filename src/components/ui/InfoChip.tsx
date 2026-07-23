import React, { useState } from "react";
import { Modal, Pressable, Text, useColorScheme, View } from "react-native";

interface InfoChipProps {
  label: string;
  explanation: string;
}

export default function InfoChip({ label, explanation }: InfoChipProps) {
  const [visible, setVisible] = useState(false);
  const isDark = useColorScheme() === "dark";

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
          isDark
            ? "bg-blue-500/15 border border-blue-500/25"
            : "bg-blue-50 border border-blue-100"
        }`}
      >
        <Text
          style={{ fontSize: 12.5 }}
          className={isDark ? "text-blue-300" : "text-blue-600"}
        >
          ⓘ
        </Text>
        <Text
          style={{ fontSize: 12.5 }}
          className={
            isDark
              ? "text-blue-300 font-brand font-semibold"
              : "text-blue-600 font-brand font-semibold"
          }
        >
          {label}
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50 px-8"
          onPress={() => setVisible(false)}
        >
          <View
            className={`rounded-2xl p-5 gap-3 w-full ${
              isDark
                ? "bg-slate-800 border border-white/10"
                : "bg-white border border-slate-200"
            }`}
          >
            <Text
              className={`text-lg font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {label}
            </Text>
            <Text
              className={`text-lg leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              {explanation}
            </Text>
            <Pressable
              onPress={() => setVisible(false)}
              className="bg-lime-400 rounded-xl py-3 items-center mt-1"
            >
              <Text className="text-black font-bold text-base">Got it</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
