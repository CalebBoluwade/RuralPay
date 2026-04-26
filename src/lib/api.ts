import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { DeviceEventEmitter } from "react-native";
import { ErrorHandler } from "./utils/ErrorHandler";

const AUTH_TOKEN_KEY = "auth_token";

// Flag to prevent duplicate SESSION_EXPIRED events
let sessionExpiredEmitted = false;

// Listen for reset signal from AuthSessionProvider
DeviceEventEmitter.addListener("RESET_SESSION_EXPIRY_FLAG", () => {
  sessionExpiredEmitted = false;
  if (__DEV__) {
    console.log("[API] Session expiry flag reset for next login");
  }
});

// Extend AxiosRequestConfig to track retry attempts and AbortController
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
    signal?: AbortSignal;
  }

  interface AxiosInstance {
    post<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<T>;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    put<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<T>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    patch<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<T>;
  }
}

export const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT || 30000),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    if (__DEV__) console.log("URL:", config.baseURL + (config.url ?? ""));

    try {
      const isAuthEndpoint = config.url?.startsWith("/auth/");
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token && !isAuthEndpoint) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      if (__DEV__)
        console.error(
          "Error in request interceptor:",
          error,
          "for URL:",
          config.url,
        );
      await ErrorHandler.handle(
        error,
        {
          action: "request_interceptor",
          metadata: { url: config.url },
        },
        false,
      );
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync("user_data");
    }

    return config;
  },
  async (axiosError) => {
    // Handles request errors.
    await ErrorHandler.handle(
      axiosError,
      {
        action: "Request_Interceptor_Error",
        metadata: { url: axiosError.config?.url },
      },
      false,
    );

    return {
      status: axiosError.response?.status, // Extracts HTTP status from the error response.
      message: axiosError.message, // Extracts the error message.
      data: axiosError.response?.data, // Extracts response data from the error.
    };
  },
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: Error | null, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    // Handle AbortError - don't log as failure, just silently ignore
    if (error.name === "AbortError" || error.code === "ECONNABORTED") {
      if (__DEV__) {
        console.log("[API] Request cancelled (AbortError)");
      }

      console.log(error);
      return Promise.reject(error);
    }

    // Only log API errors, not network connectivity issues or expected auth failures
    const isAuthEndpointError = originalRequest?.url?.startsWith("/auth/");
    if (
      error.response?.status &&
      error.response.status !== 0 &&
      !isAuthEndpointError
    ) {
      await ErrorHandler.handle(
        error,
        {
          action: "API_Response",
          metadata: {
            url: originalRequest?.url,
            method: originalRequest?.method,
            status: error.response?.status,
          },
        },
        false,
      );
    }

    // Handle 401 Unauthorized — emit event for AuthSessionProvider instead of immediate redirect
    // Skip auth endpoints: a 401 on /auth/* means wrong credentials, not session expiry
    const isAuthEndpoint = originalRequest?.url?.startsWith("/auth/");
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      // Clear auth data
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("user_data");

      // Emit SESSION_EXPIRED event only once to prevent duplicates
      if (!sessionExpiredEmitted) {
        sessionExpiredEmitted = true;
        DeviceEventEmitter.emit("SESSION_EXPIRED");

        if (__DEV__) {
          console.log("[API] 401 Unauthorized - SESSION_EXPIRED Event Emitted");
        }
      }

      // Return rejected promise without throwing to prevent error propagation
      return Promise.reject(new Error("Session expired. Please log in again."));
    }

    // Handle 423 Locked — show lock screen for PIN re-entry
    if (error.response?.status === 423 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          return axios(originalRequest);
        } catch (err) {
          throw err;
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      router.push("/lock-screen");
      DeviceEventEmitter.emit("LOCK_SCREEN_SHOWN");

      try {
        await new Promise<void>((resolve, reject) => {
          const successSub = DeviceEventEmitter.addListener(
            "PIN_SUCCESS",
            () => {
              successSub.remove();
              cancelSub.remove();
              isRefreshing = false;
              processQueue(null);
              resolve();
            },
          );

          const cancelSub = DeviceEventEmitter.addListener("PIN_CANCEL", () => {
            successSub.remove();
            cancelSub.remove();
            isRefreshing = false;
            const cancelError = new Error("User cancelled PIN");
            processQueue(cancelError);
            reject(cancelError);
          });
        });

        return axios(originalRequest);
      } catch (err) {
        isRefreshing = false;
        throw err;
      }
    }

    return error;
  },
);

function toError(error: unknown): Error {
  if (error instanceof Error) return error;

  const axiosError = error as any;
  const message =
    axiosError?.response?.data?.errorMessage ||
    axiosError?.message ||
    "An unexpected error occurred";

  return new Error(message);
}
