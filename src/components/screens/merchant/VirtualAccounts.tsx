import AccountService from "@/src/lib/services/AccountService";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function VirtualAccounts({
  showVAModal,
  setShowVAModal,
}: {
  showVAModal: boolean;
  setShowVAModal: (value: boolean) => void;
}) {
  const [vaData, setVaData] = useState<VirtualAccount>();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showVAModal) {
      setLoading(true);
      fetchVirtualAccount();
    }
  }, [showVAModal]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchVirtualAccount = async () => {
    try {
      const response = await AccountService.GetVirtualAccount();
      setVaData(response.virtualAccount);

      const expiryTime = new Date(response?.expiresAt).getTime();
      const now = Date.now();
      const secondsLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));

      setTimeLeft(secondsLeft);
    } catch (error) {
      if (__DEV__) console.error("Error fetching VA:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal
      visible={showVAModal}
      onRequestClose={() => setShowVAModal(false)}
      animationType="slide"
      presentationStyle="formSheet"
    >
      <SafeAreaView className="flex-1 bg-gray-50 p-5">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <>
            <Text className="text-2xl font-bold text-gray-900 mb-6">
              Virtual Account
            </Text>

            {vaData && (
              <View className="bg-white rounded-2xl p-6 shadow-sm">
                <View className="mb-5">
                  <Text className="text-sm text-gray-500 mb-1">
                    Account Number
                  </Text>
                  <Text className="text-xl font-semibold text-gray-900">
                    {vaData.accountNumber}
                  </Text>
                </View>

                <View className="mb-5">
                  <Text className="text-sm text-gray-500 mb-1">
                    Account Name
                  </Text>
                  <Text className="text-xl font-semibold text-gray-900">
                    {vaData.accountName}
                  </Text>
                </View>

                <View className="mb-5">
                  <Text className="text-sm text-gray-500 mb-1">Bank Name</Text>
                  <Text className="text-xl font-semibold text-gray-900">
                    {vaData.bankName}
                  </Text>
                </View>

                <View className="mt-5 pt-5 border-t border-gray-200 items-center">
                  <Text className="text-sm text-gray-500 mb-2">Expires in</Text>
                  <Text
                    className={`text-5xl font-bold mt-2 ${timeLeft < 60 ? "text-red-500" : "text-green-500"}`}
                  >
                    {formatTime(timeLeft)}
                  </Text>
                </View>

                {timeLeft === 0 && (
                  <Text className="text-red-500 text-center mt-4 font-semibold">
                    This virtual account has expired
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
}
