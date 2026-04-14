import {
  CHALLENGE_LABELS,
  VerificationResult,
  useLiveness,
} from "@/src/hooks/useLiveness";
import { router } from "expo-router";
import {
  Fingerprint,
  RotateCcw,
  ScanFace,
  ShieldCheck,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera } from "react-native-vision-camera";
import ScreenHeader from "../../ui/ScreenHeader";

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

  const {
    cameraRef,
    device,
    frameProcessor,
    status,
    challenge,
    challengeIndex,
    totalChallenges,
    result,
    tooDark,
    error,
    start,
    reset,
  } = useLiveness(bvn);

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

  const handleBegin = async () => {
    setScreenStep("camera");
    await start();
  };

  const handleRetry = () => {
    reset();
    setScreenStep("idle");
  };

  useEffect(() => {
    if (status === "passed" && screenStep === "camera" && result) {
      setScreenStep("success");
      onSuccess(result);
    }
  }, [status, result]);

  useEffect(() => {
    if (status === "failed" && screenStep === "camera") {
      setScreenStep("failed");
      if (error) onFailure(error);
    }
  }, [status, error]);

  return (
    <SafeAreaView
      className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
    >
      <ScreenHeader
        title={
          screenStep === "idle"
            ? "Identity Verification"
            : screenStep === "success"
              ? "Verification Successful"
              : screenStep === "failed"
                ? "Verification Failed"
                : "Liveness Check In Progress"
        }
        subtitle="Verify your identity using your Face"
        goBack
        onBack={() => router.back()}
      />
      {/* ── IDLE ── */}
      {screenStep === "idle" && (
        <View className="flex-1 justify-end px-5 mt-6 gap-6">
          {/* <View>
            <Text
              className={`text-3xl text-center font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Identity Verification
            </Text>
            <Text
              className={`text-lg mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Verify your identity using your face and BVN to proceed.
            </Text>
          </View> */}

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
            <Text className="text-lg font-brand font-bold text-white">
              Begin Verification
            </Text>
          </Pressable>

          <Text
            className={`text-lg text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Your Biometric Data is processed securely and never stored on this
            device.
          </Text>
        </View>
      )}

      {/* ── CAMERA / LIVENESS ── */}
      {screenStep === "camera" && device && (
        <View className="flex-1">
          <Camera
            ref={cameraRef}
            style={{ flex: 1 }}
            device={device}
            isActive
            photo
            frameProcessor={frameProcessor}
            pixelFormat="yuv"
          />

          {/* Overlay */}
          <View className="absolute inset-0 items-center justify-between py-16 px-5">
            {/* Passport-ratio face guide (3:4) */}
            <View className="w-56 h-[298px] rounded-3xl border-4 border-lime-400 opacity-70" />

            {/* Challenge card */}
            <View
              className={`w-full rounded-2xl p-5 gap-3 ${isDark ? "bg-slate-900/90" : "bg-white/90"}`}
            >
              {/* Too dark warning */}
              {tooDark && (
                <View className="w-full rounded-xl px-4 py-2 bg-yellow-500/90 items-center">
                  <Text className="text-lg font-brand font-bold text-white">
                    💡 Too dark — move to a brighter area
                  </Text>
                </View>
              )}

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

              {(status === "detecting" || status === "verifying") && (
                <View className="items-center gap-2">
                  <Text
                    className={`text-lg font-brand font-bold text-center ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {status === "verifying"
                      ? "Verifying your identity…"
                      : CHALLENGE_LABELS[challenge]}
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
              className={`text-lg text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              {error ?? "We Couldn't verify your identity. Please try again."}
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
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  description: string;
  isDark: boolean;
  isLast: boolean;
}>) {
  return (
    <View
      className={`flex-row items-center px-4 py-4 gap-4 ${
        isLast
          ? ""
          : isDark
            ? "border-b border-white/10"
            : "border-b border-slate-100"
      }`}
    >
      <View
        className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text
          className={`text-lg font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {title}
        </Text>
        <Text
          className={`text-lg mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
