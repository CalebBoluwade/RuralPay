const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const withBLEPermissions = (config) => {
  // Android permissions
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    // Standard permissions — no special flags needed
    const plainPermissions = [
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_ADVERTISE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
    ];

    plainPermissions.forEach((permission) => {
      if (!androidManifest['uses-permission'].find((p) => p.$['android:name'] === permission)) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    // BLUETOOTH_SCAN requires neverForLocation when BLE is not used to derive
    // physical location — which is the case here (BLE is used for proximity
    // payments only). Without this flag, Play Store auto-flags the app for
    // location policy review and may reject it.
    const scanPermission = androidManifest['uses-permission'].find(
      (p) => p.$['android:name'] === 'android.permission.BLUETOOTH_SCAN'
    );
    if (!scanPermission) {
      androidManifest['uses-permission'].push({
        $: {
          'android:name': 'android.permission.BLUETOOTH_SCAN',
          'android:usesPermissionFlags': 'neverForLocation',
        },
      });
    } else {
      // Ensure the flag is set even if the entry already exists
      scanPermission.$['android:usesPermissionFlags'] = 'neverForLocation';
    }

    return config;
  });

  // iOS permissions
  config = withInfoPlist(config, (config) => {
    config.modResults.NSBluetoothAlwaysUsageDescription =
      'RuralPay uses Bluetooth to process contactless payments between nearby devices';
    config.modResults.NSBluetoothPeripheralUsageDescription =
      'RuralPay uses Bluetooth to process contactless payments between nearby devices';
    // Do NOT inject UIBackgroundModes here — BLE advertising and scanning are
    // foreground-only in this app (merchant initiates payment, user confirms).
    // bluetooth-peripheral in background requires App Store justification and
    // is a common rejection reason for payment apps without a genuine background
    // BLE use case. UIBackgroundModes is managed in app.config.ts infoPlist.

    return config;
  });

  return config;
};

module.exports = withBLEPermissions;
