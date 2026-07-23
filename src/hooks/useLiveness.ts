import AccountService from "@/src/lib/services/AccountService";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useCallback, useRef, useState } from "react";
import { Image } from "react-native";
import {
  CameraRef,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from "react-native-vision-camera";
import {
  FaceDetectorOptions,
  useFaceDetectorOutput,
  type Face,
} from "react-native-vision-camera-face-detector";

export type LivenessChallenge = "look_left" | "look_right" | "blink_or_smile" | "done";
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

const CHALLENGES: LivenessChallenge[] = ["look_left", "look_right", "blink_or_smile"];
const CHALLENGE_TIMEOUT_MS = process.env
  .EXPO_PUBLIC_FACE_DETECTION_CHALLENGE_TIMEOUT
  ? Number.parseInt(
      process.env.EXPO_PUBLIC_FACE_DETECTION_CHALLENGE_TIMEOUT,
      10,
    )
  : 30000;

export const CHALLENGE_LABELS: Record<LivenessChallenge | "done", string> = {
  look_left: "Turn Your Head Left",
  look_right: "Turn Your Head Right",
  blink_or_smile: "Blink or Smile",
  done: "All Done!",
};

const FACE_DETECTOR_OPTIONS: FaceDetectorOptions = {
  performanceMode: "accurate",
  trackingEnabled: true,
  cameraFacing: "front",
  runClassifications: true,
};

export function useLiveness(bvn?: string) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const cameraRef = useRef<CameraRef>(null);

  const [status, setStatus] = useState<LivenessStatus>("idle");
  const [challenge, setChallenge] = useState<LivenessChallenge>("look_left");
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selfieUri, setSelfieUri] = useState<string>("");
  const [identityToken, setIdentityToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [tooDark, setTooDark] = useState(false);
  const noFaceFramesRef = useRef(0);

  const [livenessJobId, setLivenessJobId] = useState<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const challengeIndexRef = useRef(0);
  const isDetectingRef = useRef(false);
  const blinkPhaseRef = useRef<"waiting_close" | "closed">("waiting_close");

  const clearTimeout_ = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const PASSPORT_W = 300;
  const PASSPORT_H = 400;

  const photoOutput = usePhotoOutput();

  const captureSelfie = async (): Promise<{
    uri: string;
    base64: string;
  } | null> => {
    const photo = await photoOutput.capturePhotoToFile(
      { flashMode: "off", enableShutterSound: false },
      {},
    );
    if (!photo?.filePath) return null;
    const uri = `file://${photo.filePath}`;

    const { width: pw, height: ph } = await new Promise<{
      width: number;
      height: number;
    }>((resolve, reject) =>
      Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject),
    );
    const longSide = Math.max(pw, ph);
    const shortSide = Math.min(pw, ph);

    const cropH = Math.round(longSide * 0.72);
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
        setStatus("verifying");
        const selfie = await captureSelfie();
        isDetectingRef.current = false;
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
        setLivenessJobId(`liveness_${Date.now()}`);
        isDetectingRef.current = false;
        setStatus("passed");
        return;
      }

      challengeIndexRef.current = idx;
      setChallengeIndex(idx);
      setChallenge(CHALLENGES[idx]);
      blinkPhaseRef.current = "waiting_close";

      timeoutRef.current = setTimeout(() => {
        isDetectingRef.current = false;
        setError("Challenge Timed Out. Please Try Again.");
        setStatus("failed");
      }, CHALLENGE_TIMEOUT_MS);
    },
    [bvn],
  );

  const faceDetectorOutput = useFaceDetectorOutput({
    ...FACE_DETECTOR_OPTIONS,
    onFacesDetected: (faces: Face[]) => {
      if (!isDetectingRef.current) return;
      if (!faces.length) {
        noFaceFramesRef.current += 1;
        if (noFaceFramesRef.current > 30) setTooDark(true);
        return;
      }
      noFaceFramesRef.current = 0;
      setTooDark(false);

      const face = faces[0];
      const current = CHALLENGES[challengeIndexRef.current];
      let passed = false;

      if (current === "look_left") {
        passed = (face.yawAngle ?? 0) > 20;
      } else if (current === "look_right") {
        passed = (face.yawAngle ?? 0) < -20;
      } else if (current === "blink_or_smile") {
        const smile = face.smilingProbability ?? 0;
        if (smile > 0.75) {
          passed = true;
        } else {
          const leftEye = face.leftEyeOpenProbability ?? 1;
          const rightEye = face.rightEyeOpenProbability ?? 1;
          const eyeOpen = (leftEye + rightEye) / 2;
          if (blinkPhaseRef.current === "waiting_close" && eyeOpen < 0.3) {
            blinkPhaseRef.current = "closed";
          } else if (blinkPhaseRef.current === "closed" && eyeOpen > 0.7) {
            passed = true;
          }
        }
      }

      if (passed) {
        clearTimeout_();
        advanceChallenge(challengeIndexRef.current + 1);
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      setStatus("failed");
    },
  });

  const outputs = [faceDetectorOutput, photoOutput];

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
    noFaceFramesRef.current = 0;
    setIdentityToken("");
    setLivenessJobId("");
    blinkPhaseRef.current = "waiting_close";
    challengeIndexRef.current = 0;
  }, []);

  const result: VerificationResult | null =
    status === "passed"
      ? {
          selfieImageUrl: selfieUri,
          livenessJobId,
          identityToken,
          bvnMatch: !!bvn,
        }
      : null;

  return {
    cameraRef,
    device,
    outputs,
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
