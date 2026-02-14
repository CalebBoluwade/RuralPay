# BLE Advertising Setup

## Install Dependencies
```bash
npm install react-native-ble-advertiser
cd ios && pod install
```

## Android Setup
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
```

## iOS Setup  
Add to `ios/Info.plist`:
```xml
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app uses Bluetooth to advertise payment terminals</string>
```

## Usage
The BLE service now supports true advertising:
- Merchant devices can advertise payment requests
- Customer devices can scan and connect
- Payment data is encoded in BLE service data

## Testing
1. Run on two devices
2. One device: Set as merchant, enter amount, start advertising
3. Other device: Set as customer, scan for terminals
4. Should find the advertising merchant device