/**
 * RequestCancellationService
 * Manages AbortController instances for each request/screen
 * Enables cancellation of in-flight requests when screens unmount or navigation occurs
 */

interface CancellationEntry {
  controller: AbortController;
  createdAt: number;
}

class RequestCancellationService {
  private readonly controllers: Map<string, CancellationEntry> = new Map();

  /**
   * Create or retrieve an AbortController for a request
   * @param requestId - Unique identifier for the request (e.g., screen name or request URL)
   * @returns AbortController instance
   */
  createAbortController(requestId: string): AbortController {
    // Cancel previous controller for this ID if exists
    if (this.controllers.has(requestId)) {
      const existing = this.controllers.get(requestId);
      if (!existing?.controller.signal.aborted) {
        existing?.controller.abort();
      }
    }

    const controller = new AbortController();
    this.controllers.set(requestId, {
      controller,
      createdAt: Date.now(),
    });

    return controller;
  }

  /**
   * Get an existing AbortSignal for a request
   * @param requestId - Unique identifier for the request
   * @returns AbortSignal or undefined if not found
   */
  getAbortSignal(requestId: string): AbortSignal | undefined {
    return this.controllers.get(requestId)?.controller.signal;
  }

  /**
   * Cancel a specific request by ID
   * @param requestId - Unique identifier for the request
   */
  cancelRequest(requestId: string): void {
    const entry = this.controllers.get(requestId);
    if (entry && !entry.controller.signal.aborted) {
      entry.controller.abort();
    }
    this.controllers.delete(requestId);
  }

  /**
   * Cancel all active requests
   * Used when app goes background or on critical state changes
   */
  cancelAll(): void {
    this.controllers.forEach((entry) => {
      if (!entry.controller.signal.aborted) {
        entry.controller.abort();
      }
    });
    this.controllers.clear();
  }

  /**
   * Get count of active requests
   */
  getActiveRequestCount(): number {
    return this.controllers.size;
  }

  /**
   * Cleanup old requests that haven't been used
   * Prevents memory leaks from abandoned requests
   * @param maxAgeMs - Maximum age in milliseconds (default 5 minutes)
   */
  cleanupStaleRequests(maxAgeMs: number = 5 * 60 * 1000): void {
    const now = Date.now();
    const staleIds: string[] = [];

    this.controllers.forEach((entry, id) => {
      if (now - entry.createdAt > maxAgeMs && entry.controller.signal.aborted) {
        staleIds.push(id);
      }
    });

    staleIds.forEach((id) => this.controllers.delete(id));

    if (__DEV__ && staleIds.length > 0) {
      console.log(
        `[RequestCancellationService] Cleaned up ${staleIds.length} stale requests`,
      );
    }
  }

  /**
   * Get debug info about active requests
   */
  getDebugInfo(): {
    totalActive: number;
    requests: { id: string; age: number; aborted: boolean }[];
  } {
    const now = Date.now();
    const requests = Array.from(this.controllers.entries()).map(
      ([id, entry]) => ({
        id,
        age: now - entry.createdAt,
        aborted: entry.controller.signal.aborted,
      }),
    );

    return {
      totalActive: this.controllers.size,
      requests,
    };
  }
}

// Export singleton instance
export const requestCancellationService = new RequestCancellationService();

// Cleanup stale requests periodically
setInterval(() => {
  requestCancellationService.cleanupStaleRequests();
}, 60 * 1000); // Every minute
