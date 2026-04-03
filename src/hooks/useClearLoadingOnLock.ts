import { useEffect } from "react";
import { DeviceEventEmitter } from "react-native";

export const useClearLoadingOnLock = (...setLoadingFns: Array<(v: boolean) => void>) => {
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("LOCK_SCREEN_SHOWN", () => {
      setLoadingFns.forEach((fn) => fn(false));
    });
    return () => sub.remove();
  }, []);
};
