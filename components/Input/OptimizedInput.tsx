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
  return (
    <View className="mb-5">
      <Text className="text-base font-semibold mb-2 text-white">
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
                className={`h-16 bg-white rounded-lg p-3 text-base border ${
                  error || validationError
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder={placeholder}
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
