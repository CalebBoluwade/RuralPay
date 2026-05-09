import { ExtensionStorage } from "@bacons/apple-targets";
import { NativeModules, Platform } from "react-native";

const APPLE_APP_GROUP = "group.com.zegiftedtechnologies.ruralpay";

const WidgetStorageService = {
  set(key: string, value: string) {
    if (Platform.OS === "ios") {
      try {
        new ExtensionStorage(APPLE_APP_GROUP).set(key, value);
      } catch {}
    } else {
      NativeModules.WidgetStorage?.setItem(key, value);
    }
  },
};

export default WidgetStorageService;
