import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import ToastService from "./ToastService";

export class DeviceService {
  static async registerForPushNotificationsAsync() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (!Device.isDevice)
      throw new Error("Must use physical device for Push Notifications");

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      ToastService.error("Permissions not granted for push notification!");
      throw new Error("Permissions not granted for push notifications");
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;

    if (__DEV__) console.log("Push Notification Token:", token);

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
