import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { maskAccountNumber, maskCardNumber } from "../utils";

export class ReceiptService {
  private static isSharing = false;

  static async DownloadStatement(
    transactions: TransactionHistoryItem[],
    merchantName: string,
  ): Promise<void> {
    if (this.isSharing) return;
    this.isSharing = true;
    try {
      const totalIn = transactions
        .filter((tx) => tx.txType.includes("CREDIT"))
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      const totalOut = transactions
        .filter((tx) => !tx.txType.includes("CREDIT"))
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

      const rows = transactions
        .map((tx) => {
          const date = new Date(tx.transactionDate).toLocaleDateString();
          const type = tx.txType.replace("_", " ");
          const amount = `₦${Number(tx.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
          const color = tx.txType.includes("CREDIT") ? "#16a34a" : "#dc2626";
          const txStatus = tx.status.replaceAll("_", " ");

          return `<tr>
            <td>${date}</td>
            <td style="font-size:11px;word-break:break-all">${tx.transactionId}</td>
            <td>${type}</td>
            <td>${tx.paymentMode}</td>
            <td style="color:${color};font-weight:700">${amount}</td>
            <td>${txStatus}</td>
          </tr>`;
        })
        .join("");

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
    .container{max-width:700px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)}
    .header{background:#000;padding:20px 32px}
    .header h1{color:#a3e635;margin:0;font-size:20px}
    .body{padding:24px 32px}
    h2{margin:0 0 4px;font-size:18px}
    p{color:#4b5563;margin:0 0 20px;font-size:13px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{background:#f9fafb;text-align:left;padding:10px 8px;border-bottom:2px solid #e5e7eb;color:#374151}
    td{padding:9px 8px;border-bottom:1px solid #f0f0f0;color:#111;vertical-align:top}
    tr:last-child td{border-bottom:none}
    .footer{background:#f9fafb;padding:16px 32px;text-align:center;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb}
  </style>
</head>
<body>
<div class="container">
  <div class="header"><h1>RuralPay</h1></div>
  <div class="body">
    <h2>Transaction Statement</h2>
    <p>Generated on ${new Date().toLocaleString()} &mdash; ${transactions.length} transaction(s)</p>
    <div style="display:flex;gap:16px;margin-bottom:24px">
      <div style="flex:1;background:#f0fdf4;border-left:4px solid #16a34a;padding:14px 16px;border-radius:4px">
        <p style="margin:0 0 4px;font-size:11px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Total In</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#16a34a">&#8358;${totalIn.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
      </div>
      <div style="flex:1;background:#fef2f2;border-left:4px solid #dc2626;padding:14px 16px;border-radius:4px">
        <p style="margin:0 0 4px;font-size:11px;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Total Out</p>
        <p style="margin:0;font-size:18px;font-weight:700;color:#dc2626">&#8358;${totalOut.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
    ${merchantName ? `<p style="font-size:13px;color:#374151;margin-bottom:20px"><strong>Merchant:</strong> ${merchantName}</p>` : ""}
    <table>
      <thead><tr><th>Date</th><th>Transaction ID</th><th>Type</th><th>Mode</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <div class="footer">&copy; RuralPay. Automated Statement &mdash; do not reply.</div>
</div>
</body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const fileName = `RuralPay_Statement_${Date.now()}.pdf`;
      const sourceFile = new File(uri);
      const newFile = new File(Paths.document, fileName);
      sourceFile.move(newFile);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newFile.uri, {
          mimeType: "application/pdf",
          dialogTitle: "RuralPay Transaction Statement",
        });
      } else {
        Alert.alert("Statement Saved", `PDF saved to: ${newFile.uri}`, [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      if (__DEV__) console.error("Error generating statement:", error);
      Alert.alert("Error", "Failed to generate statement. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      this.isSharing = false;
    }
  }

  static async PrintMerchantQR(qrData: string, merchant: { businessName: string }): Promise<void> {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background-color:#f1f5f9}
    .card{background:white;padding:40px;border-radius:20px;box-shadow:0 4px 6px rgba(0,0,0,0.1);text-align:center;max-width:400px;width:90%;border:1px solid #e2e8f0}
    .logo{font-size:24px;font-weight:bold;color:#65a30d;margin-bottom:10px}
    .merchant-name{font-size:32px;font-weight:800;color:#0f172a;margin-bottom:8px}
    .subtitle{color:#64748b;font-size:18px;margin-bottom:30px}
    .qr-container{background:#ffffff;padding:20px;border-radius:16px;border:2px dashed #e2e8f0;display:inline-block;margin-bottom:30px}
    .qr-image{width:300px;height:300px;display:block}
    .footer{margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:14px}
    .brand{font-weight:700;color:#0f172a}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">RuralPay</div>
    <div class="merchant-name">${merchant.businessName}</div>
    <div class="subtitle">Scan to Pay</div>
    <div class="qr-container"><img src="data:image/png;base64,${qrData}" class="qr-image" /></div>
    <div class="footer">Powered by <span class="brand">RuralPay</span></div>
  </div>
</body>
</html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF");
      if (__DEV__) console.error(error);
    }
  }

  static async DownloadTransactionReceipt(receipt: ReceiptData): Promise<void> {
    if (this.isSharing) return;
    this.isSharing = true;
    try {
      const transactionDate = receipt.transactionDate
        ? new Date(receipt.transactionDate).toLocaleString()
        : new Date().toLocaleString();

      const merchant = receipt.merchantName || "";
      const cardMask = receipt.cardLast4
        ? `****-****-****-${receipt.cardLast4}`
        : receipt.fromAccount
          ? maskCardNumber(receipt.fromAccount)
          : "";

      const htmlContent = `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Transaction Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0; }
    .container { max-width:600px; margin:40px auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .header { background:#000; padding:24px 32px; display:flex; align-items:center; gap:12px; }
    .header h1 { color:#a3e635; margin:0; font-size:20px; }
    .body { padding:32px; color:#111; }
    .amount-box { background:#f0fdf4; border-left:4px solid #a3e635; padding:16px 20px; border-radius:4px; margin:20px 0; }
    .amount-box .amount { font-size:28px; font-weight:700; color:#4d7c0f; }
    .detail-row { display:flex; justify-content:space-between; width:100%; padding:8px 0; border-bottom:1px solid #f0f0f0; font-size:14px; }
    .detail-row:last-child { border-bottom:none; }
    .label { color:#6b7280; margin-right:6px; }
    .value { font-weight:600; color:#111; }
    .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; text-transform:uppercase; background:#ecfccb; color:#3f6212; }
    .footer { background:#f9fafb; padding:20px 32px; text-align:center; font-size:12px; color:#4b5563; border-top:1px solid #e5e7eb; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>RuralPay</h1>
  </div>
  <div class="body">
    <h2 style="font-size:22px;margin:0 0 4px;">Transaction Receipt</h2>
    <p style="color:#4b5563;margin:0 0 20px;">Here's a Summary Of Your Transaction.</p>

    <div class="amount-box">
      <p style="margin:0 0 2px;font-size:12px;color:#4d7c0f;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Amount</p>
      <div class="amount">₦${Number.parseFloat(receipt.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</div>
      <div style="margin-top:6px;"><span class="status-badge">Approved</span></div>
    </div>

    <div style="margin-bottom:24px;">
      ${
        receipt.paymentMode === "CARD"
          ? `
      <div class="detail-row">
        <span class="label">Merchant</span>
        <span class="value">${merchant}</span>
      </div>
      ${
        cardMask
          ? `
      <div class="detail-row">
        <span class="label">Card Number</span>
        <span class="value">${cardMask}</span>
      </div>`
          : ""
      }`
          : ""
      }

      ${
        receipt.paymentMode === "QR"
          ? `
      <div class="detail-row">
        <span class="label">Merchant</span>
        <span class="value">${merchant}</span>
      </div>`
          : ""
      }

      ${
        receipt.paymentMode === "BANK_TRANSFER" && receipt.senderAccount
          ? `
      <div class="detail-row">
        <span class="label">Sender Account</span>
        <span class="value">${maskAccountNumber(receipt.senderAccount)}</span>
      </div>`
          : ""
      }

      ${
        receipt.paymentMode === "USSD"
          ? `
      <div class="detail-row">
        <span class="label">USSD Code</span>
        <span class="value">*123#</span>
      </div>`
          : ""
      }

      ${
        receipt.toAccount
          ? `
      <div class="detail-row">
        <span class="label">Recipient</span>
        <span class="value">${receipt.toAccount}</span>
      </div>`
          : ""
      }

      ${
        receipt.senderName
          ? `
      <div class="detail-row">
        <span class="label">Sender</span>
        <span class="value">${receipt.senderName}</span>
      </div>`
          : ""
      }

      <div class="detail-row">
        <span class="label">Payment Type</span>
        <span class="value">${receipt.paymentMode.toUpperCase()}</span>
      </div>
      <div class="detail-row">
        <span class="label">Date / Time</span>
        <span class="value">${transactionDate}</span>
      </div>
      ${
        receipt.reference
          ? `
      <div class="detail-row">
        <span class="label">Reference</span>
        <span class="value">${receipt.reference}</span>
      </div>`
          : ""
      }
      <div class="detail-row">
        <span class="label">Transaction ID</span>
        <span class="value" style="font-size:12px;word-break:break-all;">${receipt.transactionId}</span>
      </div>
      ${
        receipt.responseMessage || (receipt as any).message
          ? `
      <div class="detail-row">
        <span class="label">Message</span>
        <span class="value">${receipt.responseMessage || (receipt as any).message}</span>
      </div>`
          : ""
      }
      ${
        receipt.paymentMode === "CARD" && receipt.stan
          ? `
      <div class="detail-row">
        <span class="label">STAN</span>
        <span class="value">${receipt.stan}</span>
      </div>`
          : ""
      }
      ${
        receipt.paymentMode === "CARD" && receipt.rrn
          ? `
      <div class="detail-row">
        <span class="label">RRN</span>
        <span class="value">${receipt.rrn}</span>
      </div>`
          : ""
      }
      ${
        receipt.paymentMode === "CARD" && receipt.responseCode
          ? `
      <div class="detail-row">
        <span class="label">Response Code</span>
        <span class="value">${receipt.responseCode}</span>
      </div>`
          : ""
      }

      ${
        receipt.narration
          ? `
      <div class="detail-row">
        <span class="label">Description</span>
        <span class="value">${receipt.narration}</span>
      </div>`
          : ""
      }
    </div>
  </div>
  <div class="footer">
    &copy; RuralPay. This is an Automated Notification — Please do not reply.
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

      // generate unique name
      const fileName = `RuralPay_Receipt_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.pdf`;

      const sourceFile = new File(uri);
      const newFile = new File(Paths.document, fileName);

      // move the file
      sourceFile.move(newFile);

      // Check if sharing is available and share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newFile.uri, {
          mimeType: "application/pdf",
          dialogTitle: "RuralPay Transaction Receipt",
        });
      } else {
        Alert.alert(
          "Receipt Generated",
          `Receipt PDF Has Been Saved To: ${newFile.uri}`,
          [{ text: "OK" }],
        );
      }
    } catch (error) {
      if (__DEV__) console.error("Error Generating Receipt PDF:", error);
      Alert.alert(
        "Error",
        "Failed to Generate Receipt PDF. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      this.isSharing = false;
    }
  }
}
