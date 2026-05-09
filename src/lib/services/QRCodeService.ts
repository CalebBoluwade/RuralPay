import { axiosInstance } from "@/src/lib/api";
import WidgetStorageService from "@/src/lib/services/WidgetStorageService";

class QRCodeService {
  async processScannedQR(data: string): Promise<ScannedQRData> {
    const response = await axiosInstance.get(`/account/qr?token=${data}`);
    return response.details;
  }

  async GeneratePaymentQR(): Promise<string> {
    const response = await axiosInstance.post<APIResponse<{ qrImage: string }>>(
      "/account/qr",
    );
    const qr = response.details.qrImage;
    try { WidgetStorageService.set("merchant_qr_b64", qr); } catch {}
    return qr;
  }
}

export default new QRCodeService();
