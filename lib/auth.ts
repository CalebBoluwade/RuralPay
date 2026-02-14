import * as SecureStore from "expo-secure-store";
import { axiosInstance } from "./api";
import { ErrorHandler } from "./utils/ErrorHandler";

const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";
const USER_ROLE_KEY = "user_role";

class AuthService {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post("/auth/login", {
        identifier: identifier,
        password: password,
      });

      const authResponse: AuthResponse = response.data;
      await this.storeAuthData(authResponse);

      return authResponse;
    } catch (error: any) {
      await ErrorHandler.handle(
        error,
        {
          action: "Login",
          metadata: { identifier },
        },
        false,
      );

      const message =
        (error.error ?? "").includes("credentials") ||
        error.response?.status === 401
          ? "Invalid Credentials"
          : error.response?.status === 429
            ? "Too many login attempts. Please try again later"
            : "Login failed. Please check your connection and try again";

      throw new Error(message);
    }
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    bvn: string;
  }): Promise<AuthResponse> {
    try {
      const payload = {
        FirstName: String(data.firstName).trim(),
        LastName: String(data.lastName).trim(),
        Email: String(data.email).trim(),
        Password: String(data.password),
        PhoneNumber: String(data.phoneNumber).trim(),
        BVN: String(data.bvn).trim(),
      };

      const response = await axiosInstance.post("/auth/register", payload);

      const authResponse: AuthResponse = response.data;
      await this.storeAuthData(authResponse);
      return authResponse;
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

      throw new Error(message);
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await axiosInstance.post("/auth/logout");
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      return { success: true, message: "Logged out successfully" };
    } catch {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      return { success: true, message: "Logged out locally" };
    }
  }

  async getStoredAuthData(): Promise<AuthResponse | null> {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);

      if (token && userData) {
        return {
          token,
          user: JSON.parse(userData),
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

  private async storeAuthData(authResponse: AuthResponse): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, authResponse.token);
      await SecureStore.setItemAsync(
        USER_DATA_KEY,
        JSON.stringify(authResponse.user),
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
