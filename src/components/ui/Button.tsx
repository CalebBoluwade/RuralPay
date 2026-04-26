import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  useColorScheme,
} from "react-native";

interface ButtonProps extends Omit<PressableProps, "style"> {
  className?: string;
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  label,
  loading = false,
  disabled,
  variant = "primary",
  onPress,
  className: _className,
  ...rest
}) => {
  const isDark = useColorScheme() === "dark";
  const isDisabled = disabled || loading;

  const styles = {
    primary: {
      bg: isDisabled
        ? isDark
          ? "bg-white/10"
          : "bg-slate-200"
        : isDark
          ? "bg-lime-400"
          : "bg-lime-500",
      text: isDisabled
        ? isDark
          ? "text-slate-500"
          : "text-slate-400"
        : "text-black",
      spinnerColor: "#000000",
    },
    secondary: {
      bg: isDisabled
        ? isDark
          ? "bg-white/5 border border-white/10"
          : "bg-slate-50 border border-slate-100"
        : isDark
          ? "bg-white/10 border border-white/20"
          : "bg-slate-100 border border-slate-200",
      text: isDisabled
        ? isDark
          ? "text-white/30"
          : "text-slate-400"
        : isDark
          ? "text-white"
          : "text-slate-900",
      spinnerColor: isDark ? "#a78bfa" : "#7c3aed",
    },
    danger: {
      bg: isDisabled
        ? isDark
          ? "bg-red-500/20"
          : "bg-red-100"
        : isDark
          ? "bg-red-500"
          : "bg-red-600",
      text: isDisabled
        ? isDark
          ? "text-red-300"
          : "text-red-400"
        : "text-white",
      spinnerColor: "#ffffff",
    },
  } as const;

  const { bg: bgClass, text: textClass } = styles[variant];

  return (
    <Pressable
      className={`w-full rounded-2xl py-5 px-4 justify-center items-center ${bgClass} ${isDisabled ? "opacity-60" : ""}`}
      onPress={onPress}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isDark ? "#a78bfa" : "#7c3aed"} />
      ) : (
        <Text className={`text-base text-center font-brand ${textClass}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

export default Button;
