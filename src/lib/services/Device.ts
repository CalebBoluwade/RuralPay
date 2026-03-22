import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

export class DeviceService {
  static async registerForPushNotificationsAsync() {
    if (!Device.isDevice) return; // Push doesn't work on emulators
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;

    return token;
  }

  static async getDeviceInfo() {
    const deviceInfo = {
      model: Device.modelName,
      os: Device.osName,
      osVersion: Device.osVersion,
      isPhysicalDevice: Device.isDevice,
    };

    return deviceInfo;
  }
}

export default new DeviceService();
