import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuth } from "../components/context/AuthProvider";

console.log("INACTIVITY_TIMEOUT:", process.env.EXPO_PUBLIC_INACTIVITY_TIMEOUT);
const INACTIVITY_TIMEOUT = process.env.EXPO_PUBLIC_INACTIVITY_TIMEOUT
  ? Number.parseInt(process.env.EXPO_PUBLIC_INACTIVITY_TIMEOUT)
  : 5 * 60 * 1000; // 5 Minutes

export const useInactivity = () => {
  const { lock } = useAuth();
  const timer = useRef<number | null>(null);
  const lastBackgroundTime = useRef<number | null>(null);

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lock();
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    resetTimer();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        lastBackgroundTime.current = Date.now();
      }

      if (state === "active" && lastBackgroundTime.current) {
        const diff = Date.now() - lastBackgroundTime.current;

        if (diff > 30_000) {
          lock(); // background > 30s
        }
      }
    });

    return () => {
      if (timer.current) clearTimeout(timer.current);
      subscription.remove();
    };
  }, []);

  return { resetTimer };
};
