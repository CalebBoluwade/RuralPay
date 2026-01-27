import { BankTransferService } from "@/components/services/BankTransferService";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TransactionFailure from "@/components/ui/Transaction/TransactionFailure";
import TransactionPin from "@/components/ui/Transaction/TransactionPin";
import TransactionSuccess from "@/components/ui/Transaction/TransactionSuccess";
import { ToastService } from "@/hooks/use-toast";
import {
    FontAwesome5,
    Ionicons,
    MaterialCommunityIcons,
} from "@expo/vector-icons";
import { AudioModule, RecordingPresets, useAudioRecorder } from "expo-audio";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VoiceTransactionBanking = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState<
    | "SELECT_COMMAND"
    | "RECORDING"
    | "PROCESSING"
    | "ENTER_PIN"
    | "SUCCESS"
    | "FAILURE"
  >("SELECT_COMMAND");
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) =>
    console.log("Recording status:", status),
  );
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [commandType, setCommandType] = useState<
    "balance" | "transfer" | "payment"
  >("balance");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Speech.speak("Voice banking ready. Select a command to begin.", {
      language: "en",
    });
  }, []);

  const handleVoiceCommand = (type: "balance" | "transfer" | "payment") => {
    setCommandType(type);
    startRecording();
  };

  const startRecording = async () => {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        ToastService.error("Microphone Permission Required");
        return;
      }

      await recorder.prepareToRecordAsync();
      recorder.record();

      setIsRecording(true);
      setStep("RECORDING");

      speak(`Speak now.`);

      setTimeout(() => {
        if (recorder.isRecording) stopRecording();
      }, 8000);
    } catch (err) {
      ToastService.error("Failed to Start Recording");
    }
  };

  const stopRecording = async () => {
    if (!recorder.isRecording) return;

    setIsRecording(false);
    setStep("PROCESSING");
    await recorder.stop();

    const uri = recorder.uri;
    if (uri) {
      await processVoiceCommand(uri);
    }
  };

  const processVoiceCommand = async (audioUri: string) => {
    console.log(audioUri);

    try {
      // Read the audio file
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const reader = new FileReader();
      const audioBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });

      const voiceTranscript =
        await BankTransferService.TranscribeVoiceCommand(audioBase64);

      await handleVoiceBankingTransferCommand(voiceTranscript);
    } catch (error) {
      console.error("Error processing voice command:", error);
    }
  };

  const recordConfirmation = async (): Promise<string> => {
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true);

    await new Promise((resolve) => setTimeout(resolve, 5000));

    await recorder.stop();
    setIsRecording(false);
    return recorder.uri || "";
  };

  const handleVoiceBankingTransferCommand = async (command: string) => {
    const voiceTranscript = command.toLowerCase();

    const amountMatch = voiceTranscript.match(/(\d+)/);
    const extractedAmount = amountMatch ? amountMatch[1] : "100";
    setAmount(extractedAmount);

    const recipientMatch =
      voiceTranscript.match(/to\s+(\w+)/) || voiceTranscript.match(/(\w+)$/);
    setRecipient(recipientMatch ? recipientMatch[1] : "Account");

    speak(
      `Transfer ${extractedAmount} Naira to ${recipientMatch ? recipientMatch[1] : "Account"}. Say YES to confirm, or NO to cancel.`,
    );

    const confirmationUri = await recordConfirmation();
    const response = await fetch(confirmationUri);
    const blob = await response.blob();
    const reader = new FileReader();
    const audioBase64 = await new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });

    const confirmation =
      await BankTransferService.TranscribeVoiceCommand(audioBase64);

    console.log("Confirmation transcription:", confirmation);

    if (confirmation.toLowerCase().includes("yes") || confirmation.toLowerCase().includes("yeah") || confirmation.toLowerCase().includes("confirm")) {
      setStep("ENTER_PIN");
    } else {
      setStep("SELECT_COMMAND");
      speak("Transaction cancelled.");
    }
  };

  // Text-to-speech response
  const speak = (text: string) => {
    Speech.speak(text, {
      language: "en-US",
      pitch: 1,
      rate: 0.9,
    });
  };

  const handlePinSuccess = async () => {
    try {
      const response =
        commandType === "transfer"
          ? `Transfer of ${amount} Naira to ${recipient} completed successfully.`
          : `Payment of ${amount} Naira processed successfully.`;

      Speech.speak(response, { language: "en" });

      setPaymentResult({
        amount: amount,
        recipient: recipient,
        reference: (commandType === "transfer" ? "TXN" : "PAY") + Date.now(),
      });
      setStep("SUCCESS");
    } catch (err) {
      setError("Transaction Failed");
      setStep("FAILURE");
    }
  };

  const handleRetry = () => {
    setStep("SELECT_COMMAND");
    setError("");
    setTranscription("");
  };

  const handleClose = () => {
    router.back();
  };

  const renderSelectCommand = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Voice Banking"
        subtitle="Select a voice command to get started"
        onBack={() => router.back()}
      />

      <View className="flex-1 px-6">
        <View
          className={`rounded-2xl p-6 mb-6 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <Text
            className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Voice Commands
          </Text>

          <TouchableOpacity
            onPress={() => handleVoiceCommand("balance")}
            className={`p-6 rounded-2xl mb-4 ${isDark ? "bg-indigo-600" : "bg-indigo-700"}`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                  <FontAwesome5 name="money-check" size={28} color="white" />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    Check Balance
                  </Text>
                  <Text className="text-blue-100 text-sm">
                    Voice balance inquiry
                  </Text>
                </View>
              </View>
              <Ionicons name="mic" size={24} color="white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleVoiceCommand("transfer")}
            className={`p-6 rounded-2xl mb-4 ${isDark ? "bg-emerald-600" : "bg-emerald-700"}`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                  <Ionicons
                    name="arrow-forward-circle"
                    size={28}
                    color="white"
                  />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    Voice Transfer
                  </Text>
                  <Text className="text-green-100 text-sm">
                    Send money by voice
                  </Text>
                </View>
              </View>
              <Ionicons name="mic" size={24} color="white" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleVoiceCommand("payment")}
            className={`p-6 rounded-2xl ${isDark ? "bg-purple-600" : "bg-purple-700"}`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="credit-card"
                    size={28}
                    color="white"
                  />
                </View>
                <View>
                  <Text className="text-white font-bold text-lg">
                    Voice Payment
                  </Text>
                  <Text className="text-purple-100 text-sm">
                    Pay bills by voice
                  </Text>
                </View>
              </View>
              <Ionicons name="mic" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderRecording = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Voice Recording"
        subtitle={`Recording ${commandType} command`}
        onBack={() => setStep("SELECT_COMMAND")}
      />

      <View className="flex-1 justify-center px-6">
        <View
          className={`rounded-2xl p-8 items-center mb-8 backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <TouchableOpacity
            className={`w-32 h-32 rounded-full items-center justify-center mb-6 ${
              isRecording ? "bg-red-500 animate-pulse" : "bg-blue-500"
            }`}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic"}
              size={64}
              color="white"
            />
          </TouchableOpacity>

          <Text
            className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {isRecording ? "Listening..." : "Ready to Record"}
          </Text>
          <Text
            className={`text-lg text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {isRecording
              ? "Speak your command clearly"
              : "Tap to start recording"}
          </Text>
        </View>

        {transcription && (
          <View
            className={`rounded-2xl p-4 backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white/60 border border-gray-200/50"
            }`}
          >
            <Text
              className={`text-sm uppercase tracking-wide mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Command Detected
            </Text>
            <Text
              className={`text-lg italic ${isDark ? "text-white" : "text-gray-900"}`}
            >
              &quot;{transcription}&quot;
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );

  const renderProcessing = () => (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}
    >
      <ScreenHeader
        title="Processing"
        subtitle="Analyzing voice command"
        onBack={() => setStep("SELECT_COMMAND")}
      />

      <View className="flex-1 justify-center px-6">
        <View
          className={`rounded-2xl p-8 items-center backdrop-blur-xl ${
            isDark
              ? "bg-white/10 border border-white/20"
              : "bg-white/60 border border-gray-200/50 shadow-sm"
          }`}
        >
          <ActivityIndicator
            size="large"
            color={isDark ? "#a78bfa" : "#7c3aed"}
          />
          <Text
            className={`text-xl font-semibold mt-4 ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Processing Command...
          </Text>
          <Text
            className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Please wait while we analyze your voice
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderEnterPin = () => (
    <TransactionPin
      paymentMessage={`Enter PIN to Authorize Voice Banking ${commandType} of ₦${amount} to ({accountName}) [{bankName}]`}
      showPinModal={true}
      onSuccess={handlePinSuccess}
      onCancel={() => setStep("SELECT_COMMAND")}
    />
  );

  return (
    <>
      {step === "SELECT_COMMAND" && renderSelectCommand()}
      {step === "RECORDING" && renderRecording()}
      {step === "PROCESSING" && renderProcessing()}
      {step === "ENTER_PIN" && renderEnterPin()}
      {step === "SUCCESS" && (
        <TransactionSuccess
          data={{
            amount: paymentResult?.amount || amount,
            recipient: paymentResult?.recipient || recipient,
            reference: paymentResult?.reference || "VOICE" + Date.now(),
            date: new Date().toLocaleDateString(),
            type: `Voice ${commandType.charAt(0).toUpperCase() + commandType.slice(1)}`,
          }}
          onClose={handleClose}
          onDownloadReceipt={() => {}}
        />
      )}
      {step === "FAILURE" && (
        <TransactionFailure
          error={error}
          onRetry={handleRetry}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default VoiceTransactionBanking;
