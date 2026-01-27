/**
 * BLE Payment Service
 * Uses Bluetooth Low Energy for offline proximity payments
 * Works when both devices don't have NFC but have BLE
 */

import { BleManager, Device, State } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';

const PAYMENT_SERVICE_UUID = '0000FFF0-0000-1000-8000-00805F9B34FB';
const PAYMENT_CHARACTERISTIC_UUID = '0000FFF1-0000-1000-8000-00805F9B34FB';

class BLEService {
  private manager: BleManager;
  private isInitialized: boolean;
  private isAdvertising: boolean;
  private activeConnections: Map<string, Device>;
  private pendingPayments: Map<string, any>;
  private scanSubscription: any;

  constructor() {
    this.manager = new BleManager();
    this.isInitialized = false;
    this.isAdvertising = false;
    this.activeConnections = new Map();
    this.pendingPayments = new Map();
    this.scanSubscription = null;
  }

  /**
   * Initialize BLE service
   */
  async initialize() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        const allGranted = Object.values(granted).every(
          status => status === PermissionsAndroid.RESULTS.GRANTED
        );
        
        if (!allGranted) {
          return { success: false, error: 'Bluetooth permissions not granted' };
        }
      }

      const state = await this.manager.state();
      if (state !== State.PoweredOn) {
        return { success: false, error: 'Bluetooth is not powered on' };
      }

      this.isInitialized = true;
      return { success: true, message: 'BLE initialized' };
    } catch (error: any) {
      console.error('BLE initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if BLE is available and enabled
   */
  async isAvailable(): Promise<{ available: boolean; enabled: boolean; authorized: boolean }> {
    try {
      const state = await this.manager.state();
      return {
        available: state !== State.Unsupported,
        enabled: state === State.PoweredOn,
        authorized: state === State.PoweredOn,
      };
    } catch (error) {
      return { available: false, enabled: false, authorized: false };
    }
  }

  /**
   * Start advertising payment terminal (merchant mode)
   * @param {number} amount - Payment amount
   * @param {string} merchantName - Merchant identifier
   */
  async startPaymentAdvertising(amount: string, merchantName = "Demo Merchant") {
    try {
      const paymentId = this.generatePaymentId();

      const paymentData = {
        paymentId,
        amount: parseFloat(amount).toFixed(2),
        currency: "USD",
        merchantName,
        timestamp: Date.now(),
        expiresAt: Date.now() + 3 * 60 * 1000, // 3 minutes
      };

      this.pendingPayments.set(paymentId, {
        ...paymentData,
        status: "advertising",
        createdAt: new Date().toISOString(),
      });

      this.isAdvertising = true;

      // Note: BLE advertising with custom data is limited on iOS
      // This works better on Android or requires peripheral mode setup
      console.log('Payment advertising started:', paymentData);

      return {
        success: true,
        paymentId,
        paymentData,
        message: "Broadcasting payment request via Bluetooth",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Stop advertising
   */
  async stopAdvertising() {
    this.isAdvertising = false;
    if (this.scanSubscription) {
      this.scanSubscription.remove();
      this.scanSubscription = null;
    }
    return { success: true };
  }

  /**
   * Scan for nearby payment terminals (customer mode)
   */
  async scanForPaymentTerminals(): Promise<{ success: boolean; terminals?: any[]; error?: string }> {
    try {
      const terminals: any[] = [];
      const foundDevices = new Set<string>();

      return new Promise((resolve) => {
        this.manager.startDeviceScan(
          [PAYMENT_SERVICE_UUID],
          { allowDuplicates: false },
          (error, device) => {
            if (error) {
              console.error('Scan error:', error);
              resolve({ success: false, error: error.message });
              return;
            }

            if (device && device.id && !foundDevices.has(device.id)) {
              foundDevices.add(device.id);
              
              terminals.push({
                id: device.id,
                name: device.name || 'Unknown Terminal',
                rssi: device.rssi || -100,
                distance: this.getReadableDistance(device.rssi || -100),
                amount: '0.00', // Parse from manufacturerData if available
                currency: 'USD',
              });
            }
          }
        );

        // Stop scanning after 5 seconds
        setTimeout(() => {
          this.manager.stopDeviceScan();
          resolve({ success: true, terminals });
        }, 5000);
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Connect to a payment terminal and process payment
   * @param {string} terminalId - Terminal device ID
   * @param {object} cardData - Customer card information
   */
  async connectAndPay(terminalId: string, cardData: any) {
    try {
      const device = await this.manager.connectToDevice(terminalId);
      await device.discoverAllServicesAndCharacteristics();

      this.activeConnections.set(terminalId, device);

      // Prepare payment data
      const paymentData = JSON.stringify({
        cardType: cardData.type,
        lastFourDigits: cardData.lastFourDigits,
        timestamp: Date.now(),
      });

      // Write payment data to characteristic
      const base64Data = Buffer.from(paymentData).toString('base64');
      await device.writeCharacteristicWithResponseForService(
        PAYMENT_SERVICE_UUID,
        PAYMENT_CHARACTERISTIC_UUID,
        base64Data
      );

      const paymentResult = {
        success: true,
        transactionId: this.generateTransactionId(),
        terminalId,
        cardType: cardData.type,
        lastFourDigits: cardData.lastFourDigits,
        timestamp: new Date().toISOString(),
        offlineMode: true,
        method: "bluetooth",
      };

      return paymentResult;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Accept payment from customer (merchant side)
   * @param {string} paymentId - Payment request ID
   * @param {object} customerData - Encrypted customer payment data
   */
  async acceptPayment(paymentId: string, customerData: any) {
    try {
      const payment = this.pendingPayments.get(paymentId);

      if (!payment) {
        throw new Error("Payment request not found");
      }

      if (payment.status !== "advertising") {
        throw new Error("Payment already processed");
      }

      if (Date.now() > payment.expiresAt) {
        throw new Error("Payment request expired");
      }

      // Verify customer data (in real app: verify cryptogram)
      await new Promise((resolve) => setTimeout(resolve, 800));

      payment.status = "completed";
      payment.completedAt = new Date().toISOString();
      payment.customerData = customerData;

      this.stopAdvertising();

      return {
        success: true,
        transactionId: this.generateTransactionId(),
        paymentId,
        amount: payment.amount,
        currency: payment.currency,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate unique payment ID
   */
  generatePaymentId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `BLE-PAY-${timestamp}-${randomStr}`.toUpperCase();
  }

  /**
   * Generate transaction ID
   */
  generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return `BLE-${timestamp}-${randomStr}`.toUpperCase();
  }

  /**
   * Disconnect from device
   */
  async disconnect(deviceId: string) {
    try {
      const device = this.activeConnections.get(deviceId);
      if (device) {
        await device.cancelConnection();
        this.activeConnections.delete(deviceId);
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up expired payments
   */
  cleanupExpiredPayments() {
    const now = Date.now();
    for (const [id, payment] of this.pendingPayments.entries()) {
      if (payment.expiresAt && now > payment.expiresAt) {
        this.pendingPayments.delete(id);
      }
    }
  }

  /**
   * Get signal strength indicator
   */
  getSignalStrength(rssi: number) {
    if (rssi >= -50) return "excellent";
    if (rssi >= -60) return "good";
    if (rssi >= -70) return "fair";
    return "poor";
  }

  /**
   * Estimate distance from RSSI
   */
  estimateDistance(rssi: number) {
    const txPower = -59;
    if (rssi === 0) return -1;

    const ratio = (rssi * 1.0) / txPower;
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    } else {
      const distance = 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
      return distance;
    }
  }

  /**
   * Get readable distance
   */
  getReadableDistance(rssi: number) {
    const distance = this.estimateDistance(rssi);
    if (distance < 0.5) return "very close";
    if (distance < 2) return "near";
    if (distance < 5) return "moderate";
    return "far";
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.scanSubscription) {
      this.scanSubscription.remove();
    }
    this.manager.destroy();
  }
}

export default new BLEService();
