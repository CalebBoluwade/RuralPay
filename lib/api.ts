import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { config } from "./config";
import { ErrorHandler } from "./utils/ErrorHandler";

const AUTH_TOKEN_KEY = "auth_token";

export const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        const fullUrl = config.baseURL
          ? `${config.baseURL}${config.url}`
          : config.url;
        console.log(
          `[API Request] ${config.method?.toUpperCase()} ${fullUrl} ${token}`,
        );
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
        action: "request_interceptor_error",
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
  (response) => response,
  async (error) => {
    // Only log API errors, not network connectivity issues
    if (error.response?.status && error.response.status !== 0) {
      await ErrorHandler.handle(
        error,
        {
          action: "API_Response",
          metadata: {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
          },
        },
        false,
      );
    }

    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync("user_data");
      router.replace("/(auth)/Login");
    }

    return {
      status: error.response?.status, // Extracts HTTP status from the error response.
      message: error.message, // Extracts the error message.
      data: error.response?.data, // Extracts response data from the error.
    };
  },
);
