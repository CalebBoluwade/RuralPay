import React from "react";
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
}: OptimizedInputProps<T>) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="mb-5">
      <Text className={`text-base font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
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
              <TextInput
                className={`h-16 rounded-2xl p-3 text-base backdrop-blur-xl ${
                  error || validationError
                    ? isDark ? "border-2 border-red-500 bg-red-500/10 text-white" : "border-2 border-red-500 bg-red-50 text-gray-900"
                    : isDark ? "bg-white/10 border border-white/20 text-white" : "bg-white/60 border border-gray-200/50 text-gray-900"
                }`}
                placeholder={placeholder}
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                onChangeText={onChange}
                value={displayValue || value}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                maxLength={maxLength}
                editable={editable && !onPress}
                pointerEvents={onPress ? "none" : "auto"}
              />
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
