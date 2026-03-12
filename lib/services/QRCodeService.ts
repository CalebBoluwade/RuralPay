import { axiosInstance } from "@/lib/api";

class QRCodeService {
  async processScannedQR(data: string) {
    const response = await axiosInstance.get(`/accounts/qr?token=${data}`);
    return response.details;
  }

  async GeneratePaymentQR(): Promise<string> {
    const response = await axiosInstance.post("/accounts/qr");
    return response.details.qrImage;
  }
}

export default new QRCodeService();
