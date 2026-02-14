import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Control,
  Controller,
  FieldError,
  FieldValues,
  Path,
} from "react-hook-form";
import {
  KeyboardTypeOptions,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

interface OptimizedInputProps<T extends FieldValues> {
  label: string;
  placeholder: string;
  control: Control<T>;
  name: Path<T>;
  error?: FieldError;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  maxLength?: number;
  onPress?: () => void;
  editable?: boolean;
  displayValue?: string;
  showPasswordToggle?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

const OptimizedInput = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  keyboardType = "default",
  secureTextEntry = false,
  maxLength,
  onPress,
  editable = true,
  displayValue,
  showPasswordToggle = false,
  autoCapitalize = "sentences",
}: OptimizedInputProps<T>) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View className="mb-5">
      <Text
        className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
      >
        {label}
      </Text>
      <Controller
        control={control}
        name={name}
        render={({
          field: { onChange, value },
          fieldState: { error: validationError },
        }) => (
          <View>
            <TouchableOpacity
              onPress={onPress}
              disabled={!onPress}
              activeOpacity={onPress ? 0.7 : 1}
            >
              <View className="relative">
                <TextInput
                  className={`h-16 rounded-2xl p-3 text-base backdrop-blur-xl ${
                    showPasswordToggle ? "pr-12" : ""
                  } ${
                    error || validationError
                      ? isDark
                        ? "border-2 border-red-500 bg-red-500/10 text-white"
                        : "border-2 border-red-500 bg-red-50 text-gray-900"
                      : isDark
                        ? "border-2 border-emerald-500/40 text-white"
                        : "border-2 border-emerald-400 text-gray-900"
                  }`}
                  placeholder={placeholder}
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  onChangeText={onChange}
                  value={displayValue || value}
                  keyboardType={keyboardType}
                  secureTextEntry={
                    showPasswordToggle ? !isPasswordVisible : secureTextEntry
                  }
                  maxLength={maxLength}
                  editable={editable && !onPress}
                  pointerEvents={onPress ? "none" : "auto"}
                  autoCapitalize={autoCapitalize}
                />
                {showPasswordToggle && (
                  <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    style={{ transform: [{ translateY: -12 }] }}
                  >
                    <Ionicons
                      name={isPasswordVisible ? "eye-off" : "eye"}
                      size={24}
                      color={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

            {(error?.message || validationError?.message) && (
              <Text className="text-red-500 text-sm mt-1">
                {error?.message || validationError?.message}
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
};

export default OptimizedInput;
