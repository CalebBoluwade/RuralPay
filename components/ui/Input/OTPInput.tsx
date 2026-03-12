import React, { useRef, useState } from "react";
import { TextInput, View, useColorScheme } from "react-native";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

const OTPInput = ({ length = 8, onComplete }: OTPInputProps) => {
  const isDark = useColorScheme() === "dark";
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const digit = text.slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < length - 1) inputs.current[index + 1]?.focus();

    const value = next.join("");
    if (value.length === length) onComplete(value);
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row gap-1 justify-between mb-4">
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={(r) => {
            inputs.current[i] = r;
          }}
          className={`w-12 h-14 rounded-2xl text-center text-xl font-bold border-2 ${
            digit
              ? isDark
                ? "border-lime-500 bg-lime-500/10 text-white"
                : "border-lime-500 bg-lime-50 text-gray-900"
              : isDark
                ? "border-white/20 bg-white/10 text-white"
                : "border-gray-200 bg-gray-50 text-gray-900"
          }`}
          value={digit}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="numeric"
          maxLength={1}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
        />
      ))}
    </View>
  );
};

export default OTPInput;
