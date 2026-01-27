import { axiosInstance } from "@/lib/api";

class QRCodeService {
  async processScannedQR(
    data: any,
    cardData: { type: string; lastFourDigits: string; cardholderName: string },
  ) {
    const response = await axiosInstance.post("/qr/process", {
      qrData: data,
      cardData,
    });
    return response.data;
  }

  async GeneratePaymentQR(amount: number): Promise<string> {
    const response = await axiosInstance.post("/qr/generate", { amount });
    return response.data.qrImage;
  }
}

export default new QRCodeService();
