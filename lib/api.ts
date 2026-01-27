import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { config } from "./config";

const AUTH_TOKEN_KEY = "auth_token";

export const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
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
        // Log the actual request URL for debugging
        const fullUrl = config.baseURL
          ? `${config.baseURL}${config.url}`
          : config.url;
        console.log(
          `[API Request] ${config.method?.toUpperCase()} ${fullUrl} ===>`,
          token,
        );
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync("user_data");
      router.replace("/(auth)/login");
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // console.error("API Response Error:", error.response.data);
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync("user_data");
      router.replace("/(auth)/login");
    }
    return Promise.reject(error.response?.data || error.message);
  },
);
