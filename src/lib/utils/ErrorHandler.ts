import AppLogger, { ErrorContext, LogLevel } from "../services/AppLogger";
import ToastService from "../services/ToastService";

declare const global: {
  ErrorUtils?: {
    getGlobalHandler: () =>
      | ((error: Error, isFatal?: boolean) => void)
      | undefined;
    setGlobalHandler: (
      handler: (error: Error, isFatal?: boolean) => void,
    ) => void;
  };
};

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  context?: ErrorContext;
}

export class ErrorHandler {
  static async handle(
    error: unknown,
    context?: ErrorContext,
    showToast = true,
  ): Promise<AppError> {
    const appError = this.normalizeError(error, context);

    await AppLogger.logError(appError, context, this.getLogLevel(appError));

    if (showToast) {
      ToastService.error(this.getUserFriendlyMessage(appError));
    }

    return appError;
  }

  static async handleAsync<T>(
    asyncFn: () => Promise<T>,
    context?: ErrorContext,
    showToast = true,
  ): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      await this.handle(error, context, showToast);
      return null;
    }
  }

  private static normalizeError(
    error: unknown,
    context?: ErrorContext,
  ): AppError {
    if (error instanceof Error) {
      const appError = error as AppError;
      appError.context = context;
      return appError;
    }

    if (typeof error === "string") {
      const appError = new Error(error) as AppError;
      appError.context = context;
      return appError;
    }

    if (error && typeof error === "object" && "message" in error) {
      const appError = new Error(String(error.message)) as AppError;
      appError.context = context;
      return appError;
    }

    const appError = new Error("Unknown error occurred") as AppError;
    appError.context = context;
    return appError;
  }

  private static getLogLevel(error: AppError): LogLevel {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return LogLevel.WARN;
    }
    if (error.statusCode && error.statusCode >= 500) {
      return LogLevel.FATAL;
    }
    return LogLevel.ERROR;
  }

  private static getUserFriendlyMessage(error: AppError): string {
    // Network errors
    if (error.message.toLowerCase().includes("network")) {
      return "Please check your internet connection and try again";
    }

    // Authentication errors
    if (error.statusCode === 401) {
      return "Your session has expired. Please log in again";
    }

    // Server errors
    if (error.statusCode && error.statusCode >= 500) {
      return "Server error. Please try again later";
    }

    // Rate limiting
    if (error.statusCode === 429) {
      return "Too many requests. Please wait a moment and try again";
    }

    // Default to original message if it's user-friendly
    if (
      error.message &&
      error.message.length < 100 &&
      !error.message.includes("Error:")
    ) {
      return error.message;
    }

    return "Something went wrong. Please try again";
  }
}

// Global error handler for unhandled promise rejections
if (global?.ErrorUtils) {
  const originalHandler = global.ErrorUtils.getGlobalHandler();

  global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    // Prevent recursive error handling
    if (
      error.message?.includes("handleEvent") ||
      error.stack?.includes("EventTarget.js")
    ) {
      originalHandler?.(error, isFatal);
      return;
    }

    // Only log non-network errors to prevent spam
    if (!error.message?.toLowerCase().includes("network")) {
      AppLogger.logError(
        error,
        {
          action: "globalErrorHandler",
          metadata: { isFatal },
        },
        isFatal ? LogLevel.FATAL : LogLevel.ERROR,
      ).catch(() => {});
    }

    originalHandler?.(error, isFatal);
  });
}
