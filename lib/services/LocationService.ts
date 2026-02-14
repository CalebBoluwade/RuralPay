import * as Location from "expo-location";
import ToastService from "./ToastService";

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        ToastService.warning("Location permission not granted");
        return null;
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        ToastService.warning("Location services disabled");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 0,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy!,
      };
    } catch (error) {
      ToastService.error("Unable to get location");
      return null;
    }
  }
}
