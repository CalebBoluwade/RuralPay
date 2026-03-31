import AccountService from "@/src/lib/services/AccountService";
import * as blazeface from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import { CameraView } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { useCallback, useEffect, useRef, useState } from "react";

export type LivenessChallenge = "look_left" | "look_right" | "blink" | "done";
export type LivenessStatus =
  | "idle"
  | "loading"
  | "ready"
  | "detecting"
  | "passed"
  | "failed";

export interface VerificationResult {
  selfieImageUrl: string;
  livenessJobId: string;
  kycJobId?: string;
  bvnMatch: boolean;
}

const CHALLENGES: LivenessChallenge[] = ["look_left", "look_right", "blink"];
const CHALLENGE_TIMEOUT_MS = 5000;
const DETECTION_INTERVAL_MS = 200;

export const CHALLENGE_LABELS: Record<LivenessChallenge | "done", string> = {
  look_left: "Turn your head left",
  look_right: "Turn your head right",
  blink: "Blink your eyes",
  done: "All done!",
};

interface FaceBox {
  topLeft: [number, number];
  bottomRight: [number, number];
  landmarks: number[][];
  probability: number;
}

export function useLiveness(
  cameraRef: React.RefObject<CameraView | null>,
  bvn?: string,
) {
  const [status, setStatus] = useState<LivenessStatus>("idle");
  const [challenge, setChallenge] = useState<LivenessChallenge>("look_left");
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selfieUri, setSelfieUri] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const modelRef = useRef<blazeface.BlazeFaceModel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFaceRef = useRef<FaceBox | null>(null);
  const challengeIndexRef = useRef(0);

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const initialize = useCallback(async () => {
    try {
      setStatus("loading");
      await tf.setBackend("cpu");

      await tf.ready();
      modelRef.current = await blazeface.load({
        maxFaces: 1,
        scoreThreshold: 0.9,
        iouThreshold: 0.7,
      });
      setStatus("ready");
    } catch (e) {
      if (__DEV__) console.log(e);
      setError("Failed to Load Face Detection Model.");
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    initialize();
    return () => clearTimers();
  }, []);

  const captureSelfie = async (): Promise<{
    uri: string;
    base64: string;
  } | null> => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.6,
      base64: false,
      skipProcessing: true,
    });
    if (!photo?.uri) return null;
    const resized = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ resize: { width: 512, height: 512 } }],
      { base64: true, format: ImageManipulator.SaveFormat.JPEG },
    );
    return resized.base64 ? { uri: resized.uri, base64: resized.base64 } : null;
  };

  const detectFace = async (): Promise<FaceBox | null> => {
    if (!cameraRef.current || !modelRef.current) return null;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: false,
        skipProcessing: true,
      });
      if (!photo?.uri) return null;

      const resized = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 128, height: 128 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG },
      );
      if (!resized.base64) return null;
      const imageData = Uint8Array.from(atob(resized.base64), (c) =>
        c.charCodeAt(0),
      );
      const imageTensor = tf.tensor3d(imageData, [128, 128, 3], "int32");
      const predictions = await modelRef.current.estimateFaces(
        imageTensor,
        false,
      );
      tf.dispose(imageTensor);

      if (!predictions.length) return null;
      const p = predictions[0] as any;
      return {
        topLeft: p.topLeft as [number, number],
        bottomRight: p.bottomRight as [number, number],
        landmarks: p.landmarks as number[][],
        probability: Array.isArray(p.probability)
          ? p.probability[0]
          : p.probability,
      };
    } catch {
      return null;
    }
  };

  // Landmark indices for BlazeFace: 0=right eye, 1=left eye, 2=nose, 3=mouth, 4=right ear, 5=left ear
  const checkChallenge = (
    face: FaceBox,
    current: LivenessChallenge,
  ): boolean => {
    const prev = prevFaceRef.current;
    const lm = face.landmarks;

    if (current === "look_left") {
      // nose moves left relative to midpoint between ears
      const nosX = lm[2][0];
      const midX = (lm[4][0] + lm[5][0]) / 2;
      return nosX < midX - 12;
    }

    if (current === "look_right") {
      const nosX = lm[2][0];
      const midX = (lm[4][0] + lm[5][0]) / 2;
      return nosX > midX + 12;
    }

    if (current === "blink") {
      if (!prev) return false;
      // eye Y landmarks move closer together (eyes close)
      const prevEyeDist = Math.abs(prev.landmarks[0][1] - prev.landmarks[1][1]);
      const currEyeDist = Math.abs(lm[0][1] - lm[1][1]);
      return currEyeDist < prevEyeDist * 0.6;
    }

    return false;
  };

  const advanceChallenge = useCallback(async (idx: number) => {
    clearTimers();

    if (idx >= CHALLENGES.length) {
      const selfie = await captureSelfie();
      if (!selfie || !bvn) {
        setError("Failed to capture selfie.");
        setStatus("failed");
        return;
      }
      const response = await AccountService.ValidateIdentity({
        bvn,
        selfieBase64: selfie.base64,
      });
      if (!response.success) {
        setError(response.message ?? "Identity verification failed.");
        setStatus("failed");
        return;
      }
      setSelfieUri(selfie.uri);
      setStatus("passed");
      return;
    }

    const current = CHALLENGES[idx];
    challengeIndexRef.current = idx;
    setChallengeIndex(idx);
    setChallenge(current);
    prevFaceRef.current = null;

    // Timeout if user doesn't complete challenge
    timeoutRef.current = setTimeout(() => {
      clearTimers();
      setError("Challenge timed out. Please try again.");
      setStatus("failed");
    }, CHALLENGE_TIMEOUT_MS);

    intervalRef.current = setInterval(async () => {
      const face = await detectFace();
      if (!face || face.probability < 0.75) {
        prevFaceRef.current = null;
        return;
      }

      if (checkChallenge(face, CHALLENGES[challengeIndexRef.current])) {
        clearTimers();
        prevFaceRef.current = null;
        // Schedule next challenge to avoid creating timers during interval callback
        setTimeout(() => advanceChallenge(challengeIndexRef.current + 1), 0);
      } else {
        prevFaceRef.current = face;
      }
    }, DETECTION_INTERVAL_MS);
  }, [bvn]);

  const start = useCallback(() => {
    if (__DEV__) console.log(modelRef.current);
    if (!modelRef.current) return;
    setError(null);
    setStatus("detecting");
    setSelfieUri("");
    challengeIndexRef.current = 0;
    advanceChallenge(0);
  }, [advanceChallenge]);

  const reset = useCallback(() => {
    clearTimers();
    setStatus("ready");
    setChallenge("look_left");
    setChallengeIndex(0);
    setSelfieUri("");
    setError(null);
    prevFaceRef.current = null;
    challengeIndexRef.current = 0;
  }, []);

  const result: VerificationResult | null =
    status === "passed"
      ? {
          selfieImageUrl: selfieUri,
          livenessJobId: `liveness_${Date.now()}`,
          bvnMatch: !!bvn,
        }
      : null;

  return {
    status,
    challenge,
    challengeIndex,
    totalChallenges: CHALLENGES.length,
    selfieUri,
    result,
    error,
    start,
    reset,
  };
}
