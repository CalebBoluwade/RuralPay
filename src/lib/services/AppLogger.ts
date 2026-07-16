import Analytics from "./Analytics";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface ErrorContext {
  userId?: string;
  screen?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class AppLogger {
  private readonly logLevel: LogLevel = __DEV__
    ? LogLevel.DEBUG
    : LogLevel.WARN;

  async LogInfo(message: string, context?: ErrorContext) {
    if (this.logLevel <= LogLevel.INFO) {
      await Analytics.logEvent("APP_INFO", { message, context });
    }
  }

  async logError(
    error: Error,
    context?: ErrorContext,
    level: LogLevel = this.logLevel,
  ) {
    // Send to analytics
    await Analytics.logEvent("APP_ERROR", {
      // stack: error.stack,
      timestamp: new Date().toISOString(),
      error_message: error.message,
      error_level: LogLevel[level],
      screen: context?.screen,
      action: context?.action,
    });
  }

  async logWarning(message: string, context?: ErrorContext) {
    if (this.logLevel <= LogLevel.WARN) {
      await Analytics.logEvent("APP_WARN", { message, context });
    }
  }
}

export default new AppLogger();
