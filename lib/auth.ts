import * as SecureStore from "expo-secure-store";
import { axiosInstance } from "./api";

const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    console.log('AuthService.login called:', { email });
    
    // Demo credentials - bypass API for testing
    if (email === 'demo@example.com' && password === 'demo123') {
      const demoResponse: AuthResponse = {
        token: 'demo_token_12345',
        user: {
          id: 'demo_user_1',
          email: 'demo@example.com',
          FirstName: 'Demo',
          LastName: 'User',
          AccountId: "1234567890"
        }
      };
      await this.storeAuthData(demoResponse);
      return demoResponse;
    }
    
    try {
      console.log(`Making API request to ${axiosInstance.defaults.baseURL}/auth/login with payload:`, {
        email: email,
        password: '***'
      });
      
      const response = await axiosInstance.post('/auth/login', { 
        email: email, 
        password: password 
      });
      
      console.log('Login API response:', {
        status: response.status,
        data: response.data
      });
      
      const authResponse: AuthResponse = response.data;
      await this.storeAuthData(authResponse);
      console.log('Auth data stored successfully');
      return authResponse;
    } catch (error: any) {
      const message = error.response?.data?.message || 
        error.response?.status === 401 ? 'Invalid email or password' :
        error.response?.status === 429 ? 'Too many login attempts. Please try again later' :
        'Login failed. Please check your connection and try again';
      throw new Error(message);
    }
  }

  async register(firstName: string, lastName: string, email: string, password: string): Promise<AuthResponse> {
    console.log('AuthService.register called:', { firstName, lastName, email });
    
    try {
      const payload = {
        FirstName: String(firstName).trim(),
        LastName: String(lastName).trim(),
        Email: String(email).trim(),
        Password: String(password)
      };
      
      console.log('Making API request to /auth/register with payload:', {
        ...payload,
        Password: '***'
      });
      
      const response = await axiosInstance.post('/auth/register', payload);
      
      console.log('Registration API response:', {
        status: response.status,
        data: response.data
      });
      
      const authResponse: AuthResponse = response.data;
      await this.storeAuthData(authResponse);
      console.log('Auth data stored successfully');
      return authResponse;
    } catch (error: any) {
      console.error('Registration API error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });
      
      const message = error.response?.data?.message ||
        error.response?.status === 409 ? 'Email already exists' :
        error.response?.status === 400 ? 'Invalid registration details' :
        'Registration failed. Please try again';
      throw new Error(message);
    }
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      await axiosInstance.post('/auth/logout');
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      return { success: true, message: 'Logged out successfully' };
    } catch (error: any) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      return { success: true, message: 'Logged out locally' };
    }
  }

  async getStoredAuthData(): Promise<AuthResponse | null> {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      
      if (token && userData) {
        return {
          token,
          user: JSON.parse(userData)
        };
      }
    } catch (error) {
      console.error("Error getting stored auth data:", error);
    }
    
    return null;
  }

  private async storeAuthData(authResponse: AuthResponse): Promise<void> {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, authResponse.token);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(authResponse.user));
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw new Error('Failed to save login information');
    }
  }
}

export const authService = new AuthService();