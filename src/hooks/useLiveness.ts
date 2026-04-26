import AccountService from "@/src/lib/services/AccountService";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useCallback, useRef, useState } from "react";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import {
  Face,
  FrameFaceDetectionOptions,
  useFaceDetector,
} from "react-native-vision-camera-face-detector";
import { useRunOnJS } from "react-native-worklets-core";

export type LivenessChallenge = "look_left" | "look_right" | "blink" | "done";
export type LivenessStatus =
  | "idle"
  | "ready"
  | "detecting"
  | "verifying"
  | "passed"
  | "failed";

export interface VerificationResult {
  selfieImageUrl: string;
  livenessJobId: string;
  identityToken: string;
  bvnMatch: boolean;
}

const CHALLENGES: LivenessChallenge[] = ["look_left", "look_right", "blink"];
const CHALLENGE_TIMEOUT_MS = process.env.FACE_DETECTION_CHALLENGE_TIMEOUT
  ? Number.parseInt(process.env.FACE_DETECTION_CHALLENGE_TIMEOUT, 10)
  : 30000;

export const CHALLENGE_LABELS: Record<LivenessChallenge | "done", string> = {
  look_left: "Turn Your Head Left",
  look_right: "Turn Your Head Right",
  blink: "Blink Your Eyes",
  done: "All Done!",
};

const FACE_DETECTOR_OPTIONS: FrameFaceDetectionOptions = {
  performanceMode: "fast",
  landmarkMode: "all",
  classificationMode: "all",
  trackingEnabled: true,
};

export function useLiveness(bvn?: string) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const cameraRef = useRef<Camera>(null);

  const [status, setStatus] = useState<LivenessStatus>("idle");
  const [challenge, setChallenge] = useState<LivenessChallenge>("look_left");
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selfieUri, setSelfieUri] = useState<string>("");
  const [identityToken, setIdentityToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [tooDark, setTooDark] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const challengeIndexRef = useRef(0);
  const isDetectingRef = useRef(false);
  const prevYawRef = useRef<number | null>(null);
  const prevEyeOpenRef = useRef<number | null>(null);

  const { detectFaces } = useFaceDetector(FACE_DETECTOR_OPTIONS);

  const clearTimeout_ = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Passport ratio: 3 wide : 4 tall
  const PASSPORT_W = 300;
  const PASSPORT_H = 400;

  const captureSelfie = async (): Promise<{
    uri: string;
    base64: string;
  } | null> => {
    if (!cameraRef.current) return null;
    const photo = await cameraRef.current.takePhoto({
      flash: "off",
      enableShutterSound: false,
    });
    if (!photo?.path) return null;
    const uri = `file://${photo.path}`;

    // photo dimensions (front camera may be landscape on Android)
    const pw = photo.width;
    const ph = photo.height;
    const longSide = Math.max(pw, ph);
    const shortSide = Math.min(pw, ph);

    // crop a 3:4 region centred on the frame
    const cropH = Math.round(longSide * 0.72); // ~72 % of long side
    const cropW = Math.round(cropH * (3 / 4));
    const originX = Math.round((shortSide - cropW) / 2);
    const originY = Math.round((longSide - cropH) / 2);

    const ctx = ImageManipulator.manipulate(uri);
    ctx.crop({ originX, originY, width: cropW, height: cropH });
    ctx.resize({ width: PASSPORT_W, height: PASSPORT_H });
    const image = await ctx.renderAsync();
    const resized = await image.saveAsync({
      base64: true,
      format: SaveFormat.JPEG,
      compress: 0.85,
    });
    ctx.release();
    image.release();
    return resized.base64 ? { uri: resized.uri, base64: resized.base64 } : null;
  };

  const advanceChallenge = useCallback(
    async (idx: number) => {
      clearTimeout_();

      if (idx >= CHALLENGES.length) {
        isDetectingRef.current = false;
        setStatus("verifying");
        const selfie = await captureSelfie();
        if (!selfie || !bvn) {
          setError("Failed to Capture Selfie.");
          setStatus("failed");
          return;
        }

        const response = await AccountService.ValidateIdentity({
          bvn,
          selfieBase64: selfie.base64,
        });

        if (!response.success) {
          setError(response.message ?? "Unable To Verify Identity.");
          setStatus("failed");
          return;
        }

        setSelfieUri(selfie.uri);
        setIdentityToken(response.details.identityToken ?? "");
        isDetectingRef.current = false;
        setStatus("passed");
        return;
      }

      challengeIndexRef.current = idx;
      setChallengeIndex(idx);
      setChallenge(CHALLENGES[idx]);
      prevYawRef.current = null;
      prevEyeOpenRef.current = null;

      timeoutRef.current = setTimeout(() => {
        isDetectingRef.current = false;
        setError("Challenge Timed Out. Please Try Again.");
        setStatus("failed");
      }, CHALLENGE_TIMEOUT_MS);
    },
    [bvn],
  );

  const onLightingUpdate = useRunOnJS((dark: boolean) => {
    setTooDark(dark);
  }, []);

  const onFaceDetected = useRunOnJS(
    (faces: Face[]) => {
      if (!isDetectingRef.current || !faces.length) return;

      const face = faces[0];
      const current = CHALLENGES[challengeIndexRef.current];

      // face.yawAngle: negative = looking left, positive = looking right
      // face.leftEyeOpenProbability / rightEyeOpenProbability: 0 = closed, 1 = open
      let passed = false;

      if (current === "look_left") {
        passed = (face.yawAngle ?? 0) < -20;
      } else if (current === "look_right") {
        passed = (face.yawAngle ?? 0) > 20;
      } else if (current === "blink") {
        const eyeOpen =
          ((face.leftEyeOpenProbability ?? 1) +
            (face.rightEyeOpenProbability ?? 1)) /
          2;
        if (prevEyeOpenRef.current === null) {
          prevEyeOpenRef.current = eyeOpen;
        } else {
          // detect transition from open → closed
          passed = prevEyeOpenRef.current > 0.7 && eyeOpen < 0.3;
          prevEyeOpenRef.current = eyeOpen;
        }
      }

      if (passed) {
        clearTimeout_();
        advanceChallenge(challengeIndexRef.current + 1);
      }
    },
    [advanceChallenge],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      // Sample Y-plane luminance (YUV: first width*height bytes = luma)
      const buffer = frame.toArrayBuffer();
      const bytes = new Uint8Array(buffer);
      const total = frame.width * frame.height;
      const step = Math.max(1, Math.floor(total / 1000)); // sample ~1000 pixels
      let sum = 0;
      let count = 0;
      for (let i = 0; i < total; i += step) {
        sum += bytes[i];
        count++;
      }
      const avgLuma = sum / count; // 0–255
      onLightingUpdate(avgLuma < 40);

      if (!isDetectingRef.current) return;
      const faces = detectFaces(frame);
      onFaceDetected(faces);
    },
    [onFaceDetected, onLightingUpdate],
  );

  const start = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        setError("Camera Permission Denied.");
        setStatus("failed");
        return;
      }
    }
    setError(null);
    setSelfieUri("");
    challengeIndexRef.current = 0;
    isDetectingRef.current = true;
    setStatus("detecting");
    advanceChallenge(0);
  }, [hasPermission, requestPermission, advanceChallenge]);

  const reset = useCallback(() => {
    clearTimeout_();
    isDetectingRef.current = false;
    setStatus("idle");
    setChallenge("look_left");
    setChallengeIndex(0);
    setSelfieUri("");
    setError(null);
    setTooDark(false);
    setIdentityToken("");
    prevYawRef.current = null;
    prevEyeOpenRef.current = null;
    challengeIndexRef.current = 0;
  }, []);

  const result: VerificationResult | null =
    status === "passed"
      ? {
          selfieImageUrl: selfieUri,
          livenessJobId: `liveness_${Date.now()}`,
          identityToken,
          bvnMatch: !!bvn,
        }
      : null;

  return {
    cameraRef,
    device,
    frameProcessor,
    status,
    challenge,
    challengeIndex,
    totalChallenges: CHALLENGES.length,
    selfieUri,
    result,
    tooDark,
    error,
    start,
    reset,
    requestPermission,
    hasPermission,
  };
}
