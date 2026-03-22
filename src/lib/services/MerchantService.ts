import { axiosInstance } from "../api";

class MerchantService {
  static async registerMerchant(
    data: MerchantRegistrationData,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // API call to register merchant
      const response = await axiosInstance.post("/merchant/onboard", data);

      return response.data;
    } catch {
      return { success: false, message: "Failed to Register Merchant" };
    }
  }

  static async GetMerchantAnalytics(): Promise<MerchantDetails | null> {
    try {
      const response = await axiosInstance.get<MerchantAnaltics>(`/merchant`);
      return response.details;
    } catch (error) {
      console.log(error);

      return null;
    }
  }

  static async updateMerchantProfile(
    userId: string,
    data: Partial<MerchantRegistrationData>,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axiosInstance.put(`/merchant/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      return response.data;
    } catch (error) {
      return { success: false, message: "Failed to update merchant profile" };
    }
  }
}

export default MerchantService;
