import {
  CHALLENGE_LABELS,
  VerificationResult,
  useLiveness,
} from "@/src/hooks/useLiveness";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  Fingerprint,
  RotateCcw,
  ScanFace,
  ShieldCheck,
} from "lucide-react-native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface LivenessVerificationProps {
  userId: string;
  bvn: string;
  onSuccess: (result: VerificationResult) => void;
  onFailure: (error: string) => void;
}

type ScreenStep = "idle" | "camera" | "success" | "failed";

export default function LivenessVerificationScreen({
  userId,
  bvn,
  onSuccess,
  onFailure,
}: Readonly<LivenessVerificationProps>) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [screenStep, setScreenStep] = useState<ScreenStep>("idle");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const {
    status,
    challenge,
    challengeIndex,
    totalChallenges,
    result,
    error,
    start,
    reset,
  } = useLiveness(cameraRef, bvn);

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  const handleBegin = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        onFailure("Camera Permission Denied.");
        return;
      }
    }
    setScreenStep("camera");
  };

  const handleStart = () => start();

  const handleRetry = () => {
    reset();
    setScreenStep("idle");
  };

  // Watch liveness status and transition screen steps
  if (status === "passed" && screenStep === "camera" && result) {
    onSuccess(result);
    setScreenStep("success");
  }

  if (status === "failed" && screenStep === "camera") {
    setScreenStep("failed");
  }

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
    >
      {/* ── IDLE ── */}
      {screenStep === "idle" && (
        <View className="flex-1 px-5 mt-6 gap-6">
          <View>
            <Text
              className={`text-2xl font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Identity Verification
            </Text>
            <Text
              className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Verify your identity using your face and BVN to proceed.
            </Text>
          </View>

          <View className={`rounded-2xl overflow-hidden ${cardClass}`}>
            <StepItem
              icon={
                <ScanFace size={28} color={isDark ? "#a3e635" : "#65a30d"} />
              }
              title="Face Liveness Check"
              description="Turn your head and blink when prompted"
              isDark={isDark}
              isLast={false}
            />
            <StepItem
              icon={
                <Fingerprint size={28} color={isDark ? "#a3e635" : "#65a30d"} />
              }
              title="BVN Match"
              description="Your selfie is matched against your BVN record"
              isDark={isDark}
              isLast
            />
          </View>

          <Pressable
            className="w-full rounded-2xl py-4 items-center bg-lime-500"
            onPress={handleBegin}
          >
            <Text className="text-sm font-brand font-bold text-white">
              Begin Verification
            </Text>
          </Pressable>

          <Text
            className={`text-xs text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Your Biometric Data is processed securely and never stored on this
            device.
          </Text>
        </View>
      )}

      {/* ── CAMERA / LIVENESS ── */}
      {screenStep === "camera" && (
        <View className="flex-1">
          {/* Camera feed */}
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />

          {/* Overlay */}
          <View className="absolute inset-0 items-center justify-between py-16 px-5">
            {/* Face oval guide */}
            <View className="w-56 h-72 rounded-full border-4 border-lime-400 opacity-70" />

            {/* Challenge card */}
            <View
              className={`w-full rounded-2xl p-5 gap-3 ${isDark ? "bg-slate-900/90" : "bg-white/90"}`}
            >
              {/* Progress dots */}
              <View className="flex-row gap-2 justify-center">
                {Array.from({ length: totalChallenges }).map((_, i) => (
                  <View
                    key={i}
                    className={`h-2 rounded-full ${
                      i < challengeIndex
                        ? "bg-lime-500 w-6"
                        : i === challengeIndex
                          ? "bg-lime-400 w-4"
                          : isDark
                            ? "bg-white/20 w-2"
                            : "bg-slate-200 w-2"
                    }`}
                  />
                ))}
              </View>

              {status === "loading" && (
                <View className="items-center gap-2">
                  <ActivityIndicator size="large" color="#a3e635" />
                  <Text
                    className={`text-sm font-brand font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}
                  >
                    Loading face detection...
                  </Text>
                </View>
              )}

              {status === "ready" && (
                <View className="items-center gap-3">
                  <Text
                    className={`text-base font-brand font-bold text-center ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Position Your Face In The Oval
                  </Text>
                  <Pressable
                    className="w-full rounded-2xl py-3 items-center bg-lime-500"
                    onPress={handleStart}
                  >
                    <Text className="text-sm font-brand font-bold text-white">
                      Start
                    </Text>
                  </Pressable>
                </View>
              )}

              {status === "detecting" && (
                <View className="items-center gap-2">
                  <Text
                    className={`text-base font-brand font-bold text-center ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {CHALLENGE_LABELS[challenge]}
                  </Text>
                  <ActivityIndicator size="small" color="#a3e635" />
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ── SUCCESS ── */}
      {screenStep === "success" && (
        <View className="flex-1 px-5 justify-center gap-4">
          <View className={`rounded-2xl p-6 items-center gap-3 ${cardClass}`}>
            <View
              className={`w-16 h-16 rounded-2xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
            >
              <ShieldCheck size={32} color={isDark ? "#a3e635" : "#65a30d"} />
            </View>
            <Text
              className={`text-lg font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Identity Verified
            </Text>
            <Text
              className={`text-sm text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Your face and BVN have been matched successfully.
            </Text>
          </View>
        </View>
      )}

      {/* ── FAILED ── */}
      {screenStep === "failed" && (
        <View className="flex-1 px-5 justify-center gap-4">
          <View className={`rounded-2xl p-6 items-center gap-3 ${cardClass}`}>
            <View className="w-16 h-16 rounded-2xl items-center justify-center bg-red-500/20">
              <RotateCcw size={32} color={isDark ? "#f87171" : "#ef4444"} />
            </View>
            <Text
              className={`text-lg font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Verification Failed
            </Text>
            <Text
              className={`text-sm text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              {error ?? "We couldn't verify your identity. Please try again."}
            </Text>
            <Pressable
              className="mt-2 w-full rounded-2xl py-4 items-center bg-lime-500"
              onPress={handleRetry}
            >
              <Text className="text-sm font-brand font-bold text-white">
                Try Again
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function StepItem({
  icon,
  title,
  description,
  isDark,
  isLast,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  isDark: boolean;
  isLast: boolean;
}) {
  return (
    <View
      className={`flex-row items-center px-4 py-4 gap-4 ${
        !isLast
          ? isDark
            ? "border-b border-white/10"
            : "border-b border-slate-100"
          : ""
      }`}
    >
      <View
        className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {title}
        </Text>
        <Text
          className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
