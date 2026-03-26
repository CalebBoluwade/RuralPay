import { integrityService } from "@/src/lib/services/IntegrityService";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useDeviceIntegrity() {
  const [isCompromised, setIsCompromised] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const appState = useRef(AppState.currentState);

  const runCheck = async () => {
    integrityService.resetCache();
    const compromised = await integrityService.isDeviceCompromised();
    setIsCompromised(compromised);
    setIsChecking(false);
  };

  useEffect(() => {
    runCheck();

    const sub = AppState.addEventListener(
      "change",
      (next: AppStateStatus) => {
        if (appState.current.match(/inactive|background/) && next === "active") {
          runCheck();
        }
        appState.current = next;
      }
    );

    return () => sub.remove();
  }, []);

  return { isCompromised, isChecking };
}
