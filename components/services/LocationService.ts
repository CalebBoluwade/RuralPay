import * as Location from "expo-location";
import ToastService from "./ToastService";

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.warn("Location permission not granted");
        return null;
      }

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        throw new Error(
          "Location services are disabled. Please enable them in device settings."
        );
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy!,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error getting location:", error);
      }

      ToastService.error("Unable to Get Device Location:");
      return null;
    }
  }
}
