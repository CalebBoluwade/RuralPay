import { VerificationResult } from "@/src/hooks/useLiveness";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";

type VerificationStatus = "unverified" | "pending" | "verified" | "expired";

interface IdentityGateOptions {
  /** How long a verification remains valid (ms). Default: 5 min */
  ttl?: number;
  /** Router href to the liveness screen */
  verificationRoute?: string;
}

export function useIdentityGate(options: IdentityGateOptions = {}) {
  const {
    ttl = 5 * 60 * 1000,
    verificationRoute = "/common/LivenessVerificationScreen",
  } = options;

  const [status, setStatus] = useState<VerificationStatus>("unverified");
  const [verifiedAt, setVerifiedAt] = useState<number | null>(null);
  const [verifiedResult, setVerifiedResult] =
    useState<VerificationResult | null>(null);

  // Stable ref so the callback passed to the screen survives re-renders
  const pendingActionRef = useRef<(() => void) | null>(null);

  const isVerified = useCallback(() => {
    if (status !== "verified" || verifiedAt === null) return false;
    return Date.now() - verifiedAt < ttl;
  }, [status, verifiedAt, ttl]);

  /**
   * Gate a sensitive action behind liveness verification.
   * If already verified within TTL, runs the action immediately.
   * Otherwise navigates to the liveness screen; on success marks verified
   * and runs the action.
   */
  const requireVerification = useCallback(
    (sensitiveAction: () => void) => {
      if (isVerified()) {
        sensitiveAction();
        return;
      }

      pendingActionRef.current = sensitiveAction;
      setStatus("pending");

      router.push({
        pathname: verificationRoute as any,
        params: {
          // Serialise a flag — the screen calls onSuccess which we handle via
          // the onVerified callback pattern below
        },
      });
    },
    [isVerified, verificationRoute],
  );

  /** Call this from the liveness screen's onSuccess prop */
  const onVerified = useCallback((result: VerificationResult) => {
    setStatus("verified");
    setVerifiedAt(Date.now());
    setVerifiedResult(result);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, []);

  const invalidate = useCallback(() => {
    setStatus("unverified");
    setVerifiedAt(null);
    setVerifiedResult(null);
  }, []);

  return {
    isVerified,
    requireVerification,
    onVerified,
    invalidate,
    status,
    verifiedResult,
  };
}
