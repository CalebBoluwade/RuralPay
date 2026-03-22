/**
 * BLE Payment Service
 * Uses Bluetooth Low Energy for offline proximity payments
 * Works when both devices don't have NFC but have BLE
 */

import { PermissionsAndroid, Platform } from "react-native";
import BLEAdvertiser from "react-native-ble-advertiser";
import { BleManager, State } from "react-native-ble-plx";
import PaymentService from "./PaymentService";

const fromBase64 = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const readUInt32LE = (buf: Uint8Array, offset: number): number =>
  buf[offset] | (buf[offset + 1] << 8) | (buf[offset + 2] << 16) | (buf[offset + 3] << 24);

// UUIDs for the Broadcast Handshake Protocol
const MERCHANT_SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
const CUSTOMER_SERVICE_UUID = "87654321-4321-4321-4321-cba987654321";

class BLEService {
  private readonly manager: BleManager;
  private isInitialized = false;
  private isAdvertising = false;
  private currentPaymentRequest: any = null;

  constructor() {
    this.manager = new BleManager();
  }

  async initialize() {
    try {
      if (this.isInitialized) return { success: true };

      // Request permissions
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]);

        const allGranted = Object.values(granted).every(
          (permission) => permission === PermissionsAndroid.RESULTS.GRANTED,
        );

        if (!allGranted) {
          throw new Error("Bluetooth Permissions not granted");
        }
      }

      // Wait for Bluetooth to be ready
      const state = await this.manager.state();
      if (state !== State.PoweredOn) {
        throw new Error("Bluetooth not enabled");
      }

      this.isInitialized = true;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async startAdvertising(paymentData: any) {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) return initResult;
      }

      const transactionId = PaymentService.generateTransactionId();
      const amountCents = Math.round(
        Number.parseFloat(paymentData.amount) * 100,
      );

      this.currentPaymentRequest = {
        ...paymentData,
        transactionId,
      };

      // 6 bytes: 4 for amount (Little Endian) + 2 for transaction ID hash (Numeric)
      const txIdNum = parseInt(transactionId.split("-").pop() || "0", 10);
      const dataArray = [
        amountCents & 0xff,
        (amountCents >> 8) & 0xff,
        (amountCents >> 16) & 0xff,
        (amountCents >> 24) & 0xff,
        txIdNum & 0xff,
        (txIdNum >> 8) & 0xff,
      ];

      await BLEAdvertiser.setCompanyId(0x004c);
      await BLEAdvertiser.broadcast(MERCHANT_SERVICE_UUID, dataArray, {
        advertiseMode: 0,
        txPowerLevel: 2,
        connectable: false, // Broadcast only
        includeDeviceName: true,
        includeTxPowerLevel: false,
      });

      this.isAdvertising = true;
      return {
        success: true,
        paymentId: transactionId,
        message: "Terminal advertising payment request",
      };
    } catch (error: any) {
      console.log(error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop advertising
   */
  async stopAdvertising() {
    this.isAdvertising = false;
    this.currentPaymentRequest = null;

    try {
      await BLEAdvertiser.stopBroadcast();
    } catch (error) {
      console.warn("Error Stopping BLE Advertising:", error);
    }

    return { success: true };
  }

  /**
   * Scan for nearby payment terminals (customer mode)
   */
  async scanForPaymentTerminals(): Promise<{
    success: boolean;
    terminals?: any[];
    error?: string;
  }> {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return { success: false, error: initResult.error };
        }
      }

      const terminals: any[] = [];
      const foundDevices = new Map<string, any>();

      return new Promise((resolve) => {
        this.manager.startDeviceScan(
          [MERCHANT_SERVICE_UUID],
          { allowDuplicates: false },
          async (error, device) => {
            if (error) {
              console.error("Scan error:", error);
              this.manager.stopDeviceScan();
              resolve({ success: false, error: error.message });
              return;
            }

            if (device && device.id && !foundDevices.has(device.id)) {
              // Check if device advertises payment service
              // When using setCompanyId, data is in manufacturerData
              // Format: <CompanyID (2 bytes)> <Data>
              if (device.manufacturerData) {
                try {
                  const buffer = fromBase64(device.manufacturerData);

                  // We expect 2 bytes (Company ID) + 6 bytes (Data) = 8 bytes
                  if (buffer.length >= 8) {
                    // Skip first 2 bytes (Company ID)
                    const serviceData = buffer.slice(2);

                    // Read Little Endian to match startAdvertising
                    const amountCents = readUInt32LE(serviceData, 0);

                    const paymentInfo = {
                      amount: (amountCents / 100).toFixed(2),
                      currency: "NGN",
                      merchantName: device.name || "Unknown Terminal",
                    };

                    foundDevices.set(device.id, {
                      id: device.id,
                      name: paymentInfo.merchantName,
                      rssi: device.rssi || -100,
                      distance: this.getReadableDistance(device.rssi || -100),
                      amount: paymentInfo.amount,
                      currency: paymentInfo.currency,
                    });

                    terminals.push(foundDevices.get(device.id));
                  }
                } catch (e) {
                  console.error("Error parsing service data:", e);
                }
              }
            }
          },
        );

        setTimeout(() => {
          this.manager.stopDeviceScan();
          resolve({ success: true, terminals });
        }, 5000);
      });
    } catch (error: any) {
      this.manager.stopDeviceScan();
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Broadcast payment confirmation (Customer Side)
   * Replaces "Connect and Pay" since we lack a GATT Server
   */
  async connectAndPay(terminalId: string, amount: any) {
    try {
      // Stop scanning to allow advertising
      this.manager.stopDeviceScan();

      const transactionId = PaymentService.generateTransactionId();
      const amountCents = Math.round(Number.parseFloat(amount) * 100);

      // Payload: Amount (4 bytes) + Status (1 byte)
      const dataArray = [
        amountCents & 0xff,
        (amountCents >> 8) & 0xff,
        (amountCents >> 16) & 0xff,
        (amountCents >> 24) & 0xff,
        0x01, // Success
      ];

      await BLEAdvertiser.setCompanyId(0x004c);
      await BLEAdvertiser.broadcast(CUSTOMER_SERVICE_UUID, dataArray, {
        advertiseMode: 0,
        txPowerLevel: 2,
        connectable: false,
        includeDeviceName: false,
        includeTxPowerLevel: false,
      });

      // Wait for merchant to pick it up
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await BLEAdvertiser.stopBroadcast();

      return {
        success: true,
        transactionId: transactionId,
        message: "Payment broadcasted",
      };
    } catch (error: any) {
      await BLEAdvertiser.stopBroadcast();
      return {
        success: false,
        error: error.message || "Connection failed",
      };
    }
  }

  /**
   * Accept payment from customer (merchant/terminal mode)
   * Not used in broadcast flow, but kept for interface compatibility
   */
  async acceptPayment(paymentId: string, cardData: any) {
    return { success: true };
  }

  /**
   * Start scanning for Customer Payment Broadcasts (Merchant Side)
   */
  async startPaymentServer(onPaymentReceived: (payment: any) => void) {
    try {
      if (!this.isInitialized) {
        const initResult = await this.initialize();
        if (!initResult.success) return initResult;
      }

      // Scan for CUSTOMER broadcasts
      this.manager.startDeviceScan(
        [CUSTOMER_SERVICE_UUID],
        { allowDuplicates: true },
        async (error, device) => {
          if (error) {
            console.error("Server scan error:", error);
            return;
          }

          if (device && device.manufacturerData) {
            try {
              const buffer = fromBase64(device.manufacturerData);

              // Expect 2 bytes (Company ID) + 5 bytes (Data) = 7 bytes
              if (buffer.length >= 7) {
                // Skip Company ID
                const data = buffer.slice(2);
                const amountCents = readUInt32LE(data, 0);
                const status = data[4];
                const receivedAmount = (amountCents / 100).toFixed(2);

                // Simple verification
                if (
                  this.currentPaymentRequest &&
                  Math.abs(
                    parseFloat(receivedAmount) -
                      parseFloat(this.currentPaymentRequest.amount),
                  ) < 0.1 &&
                  status === 0x01
                ) {
                  this.manager.stopDeviceScan();
                  await this.stopAdvertising();

                  onPaymentReceived({
                    amount: receivedAmount,
                    currency: "NGN",
                    transactionId: PaymentService.generateTransactionId(),
                    timestamp: Date.now(),
                  });
                }
              }
            } catch (err) {
              console.error("Error processing payment:", err);
            }
          }
        },
      );

      return { success: true, message: "Payment server started" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop payment server
   */
  async stopPaymentServer() {
    this.manager.stopDeviceScan();
    await this.stopAdvertising();
    return { success: true };
  }

  private generatePaymentId(): string {
    return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getReadableDistance(rssi: number): string {
    if (rssi > -50) return "Very Close (<1m)";
    if (rssi > -70) return "Close (1-3m)";
    if (rssi > -85) return "Medium (3-10m)";
    return "Far (>10m)";
  }
}

export default new BLEService();
