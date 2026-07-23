import { integrityService } from "@/src/lib/services/IntegrityService";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useDeviceIntegrity() {
  const [isCompromised, setIsCompromised] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const appState = useRef(AppState.currentState);

  const runCheck = async (resetCache = false) => {
    if (resetCache) integrityService.resetCache();
    const compromised = await integrityService.isDeviceCompromised();
    setIsCompromised(compromised);
    setIsChecking(false);
  };

  useEffect(() => {
    runCheck(); // cold start — use cache if available

    const sub = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && next === "active") {
          runCheck(true); // foreground resume — bust cache
        }
        appState.current = next;
      }
    );

    return () => sub.remove();
  }, []);

  return { isCompromised, isChecking };
}
