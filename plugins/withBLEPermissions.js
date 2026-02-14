const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const withBLEPermissions = (config) => {
  // Android permissions
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_ADVERTISE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
    ];

    permissions.forEach((permission) => {
      if (!androidManifest['uses-permission'].find((p) => p.$['android:name'] === permission)) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    return config;
  });

  // iOS permissions
  config = withInfoPlist(config, (config) => {
    config.modResults.NSBluetoothAlwaysUsageDescription =
      'This app uses Bluetooth to process contactless payments';
    config.modResults.NSBluetoothPeripheralUsageDescription =
      'This app uses Bluetooth to process contactless payments';
    config.modResults.UIBackgroundModes = ['bluetooth-central', 'bluetooth-peripheral'];

    return config;
  });

  return config;
};

module.exports = withBLEPermissions;
