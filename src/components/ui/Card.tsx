import React from "react";
import { View, ViewProps, useColorScheme } from "react-native";

interface CardProps extends ViewProps {
  children?: React.ReactNode;
  /** Override the default light-mode background/border classes */
  lightClass?: string;
  /** Override the default dark-mode background/border classes */
  darkClass?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  lightClass = "bg-white border border-slate-200 shadow-sm",
  darkClass = "bg-white/10 border border-white/20",
  className = "",
  ...rest
}) => {
  const isDark = useColorScheme() === "dark";

  return (
    <View
      className={`rounded-2xl ${isDark ? darkClass : lightClass} ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
};

export default Card;
