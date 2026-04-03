/**
 * useAbortable Hook
 * Provides AbortController for cancelling requests when screen unmounts
 *
 * Usage:
 * const { abortController, requestId } = useAbortable('screen-name')
 *
 * useEffect(() => {
 *   const data = await fetchData(abortController.signal)
 *   return () => abortController.abort()
 * }, [])
 */

import { requestCancellationService } from "@/src/lib/services/RequestCancellationService";
import { useEffect, useRef } from "react";

interface UseAbortableReturn {
  abortController: AbortController;
  requestId: string;
  cancel: () => void;
}

/**
 * Create an AbortController for managing request cancellation
 * @param screenName - Unique identifier for the screen/component (should be stable)
 * @returns Object with abortController, requestId, and cancel function
 *
 * Automatically cancels when component unmounts
 */
export function useAbortable(screenName: string): UseAbortableReturn {
  const requestIdRef = useRef<string>(
    `${screenName}-${Date.now()}-${Math.random()}`,
  );
  const controllerRef = useRef<AbortController | null>(null);

  // Always create a fresh controller on mount (handles remounts correctly)
  if (controllerRef.current === null || controllerRef.current.signal.aborted) {
    requestIdRef.current = `${screenName}-${Date.now()}-${Math.random()}`;
    controllerRef.current = requestCancellationService.createAbortController(
      requestIdRef.current,
    );
  }

  const cancel = () => {
    requestCancellationService.cancelRequest(requestIdRef.current);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, []);

  return {
    abortController: controllerRef.current,
    requestId: requestIdRef.current,
    cancel,
  };
}

/**
 * Hook to cancel a request from a specific screen
 * Useful if you need to cancel from a different component
 *
 * @param requestId - The request ID to cancel
 */
export function useCancelRequest(requestId: string) {
  return () => {
    requestCancellationService.cancelRequest(requestId);
  };
}

/**
 * Hook to cancel all active requests
 * Use sparingly - usually triggered by app state changes
 */
export function useCancelAllRequests() {
  return () => {
    requestCancellationService.cancelAll();
  };
}
