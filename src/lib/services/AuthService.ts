import * as SecureStore from "expo-secure-store";
import { axiosInstance } from "../api";
import { LoginAPIResponseMessage } from "../utils";
import { ErrorHandler } from "../utils/ErrorHandler";
import { DeviceService } from "./Device";
import EncryptionService from "./EncryptionService";
import ToastService from "./ToastService";

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_DATA_KEY = "user_data";

class AuthService {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    let pushToken: string | undefined;

    try {
      pushToken = await DeviceService.registerForPushNotificationsAsync();
    } catch (error) {
      if (__DEV__) {
        console.warn(
          "[AuthService] Failed to register for push notifications. Continuing without push token.",
          error,
        );
      }
      pushToken = undefined;
    }

    try {
      const deviceInfo = await DeviceService.getDeviceInfo();

      if (__DEV__) console.log(deviceInfo, pushToken);

      const userKeyConfig = await EncryptionService.RetrieveUserKey();

      const response = await axiosInstance.post<AuthResponse>("/auth/login", {
        identifier: identifier,
        password: userKeyConfig.useEncryptedPayload
          ? await EncryptionService.EncryptPII(password)
          : password,
        // password,
        deviceInfo: deviceInfo,
        pushToken: pushToken ?? undefined,
      });

      ToastService.success(response.message);

      if (response.success) {
        await this.storeAuthData(response.details);
      }

      return response;
    } catch (error: any) {
      await ErrorHandler.handle(
        error,
        {
          action: "Login",
          screen: "Login",
          metadata: { identifier },
        },
        false,
      );

      const message = LoginAPIResponseMessage(error.response?.status ?? 0);

      throw new Error(message);
    }
  }

  async register(
    data: RegisterData,
  ): Promise<APIResponse<{ userId: string }> | null> {
    let pushToken: string | undefined;

    try {
      pushToken = await DeviceService.registerForPushNotificationsAsync();
    } catch (error) {
      if (__DEV__) {
        console.warn(
          "[AuthService] Failed to register for push notifications. Continuing without push token.",
          error,
        );
      }
    }

    try {
      const payload = {
        FirstName: String(data.firstName).trim(),
        LastName: String(data.lastName).trim(),
        Username: String(data.userName).trim(),
        Email: String(data.email).trim(),
        Password: String(data.password),
        PhoneNumber: String(data.phoneNumber).trim(),
        BVN: String(data.bvn).trim(),
        IdentityToken: String(data.identityToken),
        pushToken: pushToken,
      };

      const response = await axiosInstance.post<
        APIResponse<{ userId: string }>
      >("/auth", payload);

      return response;
    } catch (error: any) {
      await ErrorHandler.handle(
        error,
        {
          action: "Register",
          metadata: { email: data.email, phoneNumber: data.phoneNumber },
        },
        false,
      );

      let message = "Registration Failed. Please try again";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 409) {
        message = "Email Already Exists";
      } else if (error.response?.status === 400) {
        message = "Invalid registration details";
      } else if (error.message && !error.message.includes("Network")) {
        message = error.message;
      } else if (!error.response) {
        message = "Network error. Please check your connection";
      }

      ToastService.warning(message);

      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<string | null> {
    try {
      if (!refreshToken) return null;

      if (__DEV__)
        console.log(
          "Attempting token refresh with refresh token:",
          refreshToken,
        );

      // Use raw axios — bypasses the axiosInstance interceptors to prevent
      // an infinite retry loop if the refresh endpoint itself returns 401.
      const { data } = await axiosInstance.post("/auth/refresh", {
        refreshToken,
      });

      const { token, refreshToken: newRefreshToken } = data?.details ?? data;

      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);

      return token;
    } catch {
      return null;
    }
  }

  async forgotPassword(identifier: string): Promise<boolean> {
    try {
      const response = await axiosInstance.post<
        APIResponse<{ success: boolean }>
      >("/auth/forgot-password", { identifier });
      return response.success;
    } catch {
      return false;
    }
  }

  async resetPassword(data: {
    token: string;
    password: string;
  }): Promise<boolean> {
    try {
      const response = await axiosInstance.post<
        APIResponse<{ success: boolean }>
      >("/auth/reset-password", data);
      return response.success;
    } catch {
      return false;
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (token) {
        // Fire-and-forget — don't let a failed logout API call block local cleanup
        axiosInstance.post("/auth/logout").catch(() => {});
      }

      // Always clear local auth data regardless of API call outcome
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      return { success: true, message: "Logged out successfully" };
    } catch (error) {
      if (__DEV__) {
        console.error("[AuthService] Logout error:", error);
      }
      // Even if logout fails, always clear local auth data
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      return { success: true, message: "Logged out locally" };
    }
  }

  async DeleteAccount(): Promise<APIResponse<{}>> {
    try {
      const response = await axiosInstance.delete("/account/delete");
      return response;
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to Delete Account";
      return { message, success: false, details: {} };
    }
  }

  async getStoredAuthData(): Promise<AuthResponse | null> {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);

      if (token && userData) {
        return {
          message: "",
          success: true,
          details: {
            token,
            refreshToken: refreshToken ?? "",
            user: JSON.parse(userData),
          },
        };
      }
    } catch (error) {
      await ErrorHandler.handle(
        error as Error,
        {
          action: "getStoredAuthData",
        },
        false,
      );
    }

    return null;
  }

  private async storeAuthData(details: AuthResponse["details"]): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, details.token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, details.refreshToken);
      await SecureStore.setItemAsync(
        USER_DATA_KEY,
        JSON.stringify(details.user),
      );
    } catch (error) {
      await ErrorHandler.handle(error as Error, {
        action: "storeAuthData",
      });
      throw new Error("Failed to save login information");
    }
  }
}

export const authService = new AuthService();
