import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export class ReceiptService {
  static async DownloadTransactionReceipt(receipt: ReceiptData): Promise<void> {
    try {
      const transactionDate = receipt.transactionDate
        ? new Date(receipt.transactionDate).toLocaleString()
        : new Date().toLocaleString();

      const merchantId = receipt.merchantName || "MID123456789";
      const terminalId = receipt.terminalId || "TID987654321";
      const cardMask = receipt.cardLast4
        ? `****-****-****-${receipt.cardLast4}`
        : "****-****-****-1234";

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Transaction Receipt</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              margin: 20px;
              background: white;
              color: black;
            }
            .receipt {
              max-width: 400px;
              margin: 0 auto;
              border: 2px solid #000;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .subtitle {
              font-size: 14px;
              margin-bottom: 10px;
            }
            .section {
              margin: 15px 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .label {
              font-weight: bold;
            }
            .amount {
              font-size: 20px;
              font-weight: bold;
              text-align: center;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              border-top: 2px solid #000;
              padding-top: 15px;
              margin-top: 15px;
              font-size: 12px;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="title">RURAL PAYMENTS</div>
              <div class="subtitle">TRANSACTION RECEIPT</div>
            </div>
            
            <div class="section">
              ${
                receipt.paymentMode === "CARD"
                  ? `
              <div class="row">
                <span class="label">MERCHANT ID:</span>
                <span>${merchantId}</span>
              </div>
              <div class="row">
                <span class="label">TERMINAL ID:</span>
                <span>${terminalId}</span>
              </div>`
                  : ""
              }
              <div class="row">
                <span class="label">TRANSACTION ID:</span>
                <span>${receipt.transactionId}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="section">
              <div class="row">
                <span class="label">TRANSACTION TYPE:</span>
                <span>${receipt.paymentMode.toUpperCase()}</span>
              </div>
              <div class="row">
                <span class="label">DATE/TIME:</span>
                <span>${transactionDate}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="section">
              ${
                receipt.paymentMode === "CARD"
                  ? `
              <div class="row">
                <span class="label">CARD NUMBER:</span>
                <span>${cardMask}</span>
              </div>`
                  : ""
              }
              ${
                receipt.paymentMode === "QR"
                  ? `
              <div class="row">
                <span class="label">MERCHANT ID:</span>
                <span>${merchantId}</span>
              </div>`
                  : ""
              }
              ${
                receipt.paymentMode === "BANK_TRANSFER" && receipt.senderAccount
                  ? `
              <div class="row">
                <span class="label">SENDER ACCOUNT:</span>
                <span>${receipt.senderAccount}</span>
              </div>`
                  : ""
              }
              ${
                receipt.paymentMode === "USSD"
                  ? `
              <div class="row">
                <span class="label">USSD CODE:</span>
                <span>*123#</span>
              </div>`
                  : ""
              }
              <div class="amount">
                ₦${parseFloat(receipt.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>
              ${
                receipt.toAccount
                  ? `
              <div class="row">
                <span class="label">RECIPIENT:</span>
                <span>${receipt.toAccount}</span>
              </div>`
                  : ""
              }
              ${
                receipt.senderName
                  ? `
              <div class="row">
                <span class="label">SENDER:</span>
                <span>${receipt.senderName}</span>
              </div>`
                  : ""
              }
              ${
                receipt.narration
                  ? `
              <div class="row">
                <span class="label">DESCRIPTION:</span>
                <span>${receipt.narration}</span>
              </div>`
                  : ""
              }
            </div>
            
            <div class="divider"></div>
            
            <div class="section">
              <div class="row">
                <span class="label">REFERENCE:</span>
                <span>${receipt.reference}</span>
              </div>
              <div class="row">
                <span class="label">STATUS:</span>
                <span style="color: green; font-weight: bold;">APPROVED</span>
              </div>
              <div class="row">
                <span class="label">RESPONSE CODE:</span>
                <span>00</span>
              </div>
            </div>
            
            <div class="footer">
              <div style="font-weight: bold; margin-bottom: 10px;">TRANSACTION SUCCESSFUL</div>
              <div style="margin-bottom: 10px;">PLEASE KEEP THIS RECEIPT</div>
              <div>Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Check if sharing is available and share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Transaction Receipt",
        });
      } else {
        Alert.alert(
          "Receipt Generated",
          `Receipt PDF has been saved to: ${uri}`,
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      if (__DEV__) console.error("Error generating receipt PDF:", error);
      Alert.alert(
        "Error",
        "Failed to generate receipt PDF. Please try again.",
        [{ text: "OK" }],
      );
    }
  }
}
