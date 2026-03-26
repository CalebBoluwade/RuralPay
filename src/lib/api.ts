import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { config } from "./config";
import { ErrorHandler } from "./utils/ErrorHandler";

const AUTH_TOKEN_KEY = "auth_token";

// Extend AxiosRequestConfig to track retry attempts
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
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
  baseURL: config.apiUrl,
  timeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT || 30000),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const isAuthEndpoint = config.url?.startsWith("/auth/");
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token && !isAuthEndpoint) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
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

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    // Only log API errors, not network connectivity issues
    if (error.response?.status && error.response.status !== 0) {
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

    // Handle 401 Unauthorized — attempt token refresh once
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Dynamically import to avoid circular dependency
        const { authService } = await import("./services/AuthService");
        const newToken = await authService.refreshToken();

        if (newToken) {
          // Update the failed request's Authorization header and retry
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed — fall through to logout
      }

      // Refresh failed or no refresh token — clear session and redirect
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("user_data");
      router.replace("/auth/lock-screen");
    }

    // Handle 403 Forbidden — lock screen (permissions issue, not auth)
    if (error.response?.status === 403) {
      router.replace("/auth/login");
    }

    return Promise.reject(error);
  },
);
