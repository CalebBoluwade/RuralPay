import { ExtensionStorage } from "@bacons/apple-targets";
import { NativeModules, Platform } from "react-native";

const APPLE_APP_GROUP = "group.com.zegiftedtechnologies.ruralpay";

const WidgetStorageService = {
  set(key: string, value: string) {
    if (__DEV__)
      console.log(
        `[WidgetStorage] set key="${key}" valueLen=${value.length} platform=${Platform.OS}`,
      );

    if (Platform.OS === "ios") {
      try {
        const widgetStorage = new ExtensionStorage(APPLE_APP_GROUP);
        widgetStorage.set(key, value);
        if (__DEV__)
          console.log(
            `[WidgetStorage] iOS ExtensionStorage write OK key="${key}"`,
          );

        // Reload widget timelines so the new value renders immediately
        if (NativeModules.WidgetStorage?.reloadWidgets) {
          (widgetStorage as any).reloadWidgets();
          console.log("[WidgetStorage] Reloading widgets after iOS write");
          NativeModules.WidgetStorage.reloadWidgets();
        }
      } catch (e) {
        console.error(`[WidgetStorage] iOS write FAILED key="${key}"`, e);
      }
    } else {
      if (!NativeModules.WidgetStorage) {
        console.error(
          "[WidgetStorage] NativeModules.WidgetStorage is NULL — Module not linked",
        );
        return;
      }
      NativeModules.WidgetStorage.setItem(key, value);
      if (__DEV__)
        console.log(`[WidgetStorage] Android setItem OK key="${key}"`);
    }
  },
};

export default WidgetStorageService;
