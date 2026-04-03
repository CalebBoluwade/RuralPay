import { axiosInstance } from "@/src/lib/api";

class QRCodeService {
  async processScannedQR(data: string) {
    const response = await axiosInstance.get(`/account/qr?token=${data}`);
    return response.details;
  }

  async GeneratePaymentQR(): Promise<string> {
    try {
      const response =
        await axiosInstance.post<APIResponse<{ qrImage: string }>>(
          "/account/qr",
        );

      return response.details.qrImage;
    } catch (error) {
      if (__DEV__) console.log(error);

      return "";
    }
  }
}

export default new QRCodeService();
