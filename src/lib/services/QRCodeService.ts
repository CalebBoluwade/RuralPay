import { axiosInstance } from "@/src/lib/api";
import WidgetStorageService from "@/src/lib/services/WidgetStorageService";

class QRCodeService {
  async processScannedQR(data: string): Promise<ScannedQRData> {
    const response = await axiosInstance.get(`/merchant/qr?token=${data}`);
    return response.details;
  }

  async GeneratePaymentQR(qrSize?: number): Promise<string> {
    if (__DEV__) console.log("[QRCodeService] GeneratePaymentQR Called");
    const response = await axiosInstance.post<APIResponse<{ qrImage: string }>>(
      "/merchant/qr",
      qrSize ? { size: qrSize } : {},
    );
    const qr = response.details.qrImage;
    if (__DEV__)
      console.log(`[QRCodeService] QR received, length=${qr?.length ?? 0}`);

    // Validate base64 before storing
    if (qr) {
      const cleanQR = qr.trim(); // Remove whitespace/newlines
      if (__DEV__)
        console.log(`[QRCodeService] QR cleaned, length=${cleanQR.length}`);

      try {
        WidgetStorageService.set("merchant_qr_b64", cleanQR);
      } catch (e) {
        console.error(
          "[QRCodeService] Failed to write merchant_qr_b64 to widget storage",
          e,
        );
      }
    }

    return qr;
  }
}

export default new QRCodeService();
