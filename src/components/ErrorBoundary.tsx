import AppLogger, { LogLevel } from "@/src/lib/services/AppLogger";
import { router } from "expo-router";
import { AlertCircle } from "lucide-react-native";
import React, { Component, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    AppLogger.logError(
      error,
      {
        screen: "ErrorBoundary",
        action: "componentDidCatch",
        metadata: { errorInfo },
      },
      LogLevel.FATAL,
    );
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: undefined });
    router.replace("/");
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-red-50 rounded-full p-6 mb-6">
            <AlertCircle size={64} color="#ef4444" />
          </View>

          <Text className="text-3xl font-bold text-slate-900 mb-3">Oops!</Text>

          <Text className="text-lg font-semibold text-slate-700 mb-2">
            Something Went Wrong
          </Text>

          <Text className="text-slate-500 text-center mb-8 leading-6 max-w-sm">
            We Encountered An Unexpected Error. Don&apos;t Worry, Your Data Is
            Safe.
          </Text>

          <Pressable
            onPress={this.handleRestart}
            className="bg-slate-900 px-8 py-4 rounded-2xl shadow-lg active:scale-95"
          >
            <Text className="text-white font-semibold text-base">
              Restart App
            </Text>
          </Pressable>

          {__DEV__ && this.state.error && (
            <View className="mt-8 p-4 bg-red-50 rounded-xl border border-red-200 max-w-sm">
              <Text className="text-xs font-mono text-red-800">
                {this.state.error.message}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}
