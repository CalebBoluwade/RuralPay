import { ErrorContext } from "@/src/lib/services/AppLogger";
import { ErrorHandler } from "@/src/lib/utils/ErrorHandler";
import { useCallback } from "react";

export const useErrorHandler = () => {
  const handleError = useCallback(
    async (error: unknown, context?: ErrorContext, showToast = true) => {
      return await ErrorHandler.handle(error, context, showToast);
    },
    [],
  );

  const handleAsync = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      context?: ErrorContext,
      showToast = true,
    ): Promise<T | null> => {
      return await ErrorHandler.handleAsync(asyncFn, context, showToast);
    },
    [],
  );

  return { handleError, handleAsync };
};
