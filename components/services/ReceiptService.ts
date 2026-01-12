import { Share, Alert } from "react-native";

interface ReceiptData {
  amount: string;
  recipient: string;
  reference: string;
  date: string;
  narration?: string;
  type: string;
  senderName?: string;
  senderAccount?: string;
}

export class ReceiptService {
  static async downloadReceipt(data: ReceiptData): Promise<void> {
    try {
      const receiptText = `
Transaction Receipt
==================

Transaction Type: ${data.type}
Amount: ₦${data.amount}
Recipient: ${data.recipient}
Reference: ${data.reference}
Date: ${data.date}${data.narration ? `\nNarration: ${data.narration}` : ''}${data.senderName ? `\nSender: ${data.senderName}` : ''}

Thank you for using NFC Card Payments
Generated on ${new Date().toLocaleString()}
      `;

      await Share.share({
        message: receiptText,
        title: 'Transaction Receipt'
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share receipt');
    }
  }
}