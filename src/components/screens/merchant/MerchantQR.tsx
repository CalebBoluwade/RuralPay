import { useAuth } from "@/src/components/context/AuthSessionProvider";
import Button from "@/src/components/ui/Button";
import Card from "@/src/components/ui/Card";
import AppLogger from "@/src/lib/services/AppLogger";
import QRCodeService from "@/src/lib/services/QRCodeService";
import { ReceiptService } from "@/src/lib/services/ReceiptService";
import { QrCode, Store, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  Share as RNShare,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MerchantQRDisplay = ({
  showMerchantQRModal,
  setShowMerchantQRModal,
}: {
  showMerchantQRModal: boolean;
  setShowMerchantQRModal: (value: boolean) => void;
}) => {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [qrData, setQRData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const GetPaymentQR = async () => {
    setIsLoading(true);
    try {
      const QRresult = await QRCodeService.GeneratePaymentQR(512);
      setQRData(QRresult);
    } catch (error) {
      AppLogger.logError(error as Error, {
        action: "Failed to Generate QR Code",
        screen: MerchantQRDisplay.name,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showMerchantQRModal && !qrData) GetPaymentQR();
  }, [showMerchantQRModal]);

  const handleShare = async () => {
    try {
      await RNShare.share({
        message: `Pay ${user!.merchant?.businessName || "Us"} Easily! Scan our QR Code or Use Merchant ID: ${user!.merchant?.id}`,
      });
    } catch (error) {
      AppLogger.logError(error as Error, {
        action: "Failed to Share QR Code",
        screen: MerchantQRDisplay.name,
      });
    }
  };

  const handlePrint = async () => {
    if (!qrData || !user?.merchant) return;
    await ReceiptService.PrintMerchantQR(qrData, user.merchant);
  };

  return (
    <Modal
      visible={showMerchantQRModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMerchantQRModal(false)}
    >
      <SafeAreaView
        className={isDark ? "flex-1 bg-slate-950" : "flex-1 bg-slate-50"}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <Text
            className={`text-2xl font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Payment QR Code
          </Text>
          <Pressable
            onPress={() => setShowMerchantQRModal(false)}
            className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-white/10" : "bg-slate-100"}`}
          >
            <X size={22} color={isDark ? "#fff" : "#64748b"} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
        >
          {/* Merchant info */}
          <Card className="p-5 mb-6 mt-4">
            <View className="flex-row items-center gap-3 mb-3">
              <View
                className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
              >
                <Store size={22} color={isDark ? "#a3e635" : "#65a30d"} />
              </View>
              <View>
                <Text
                  className={`text-base ${isDark ? "text-slate-400" : "text-slate-500"}`}
                >
                  Business Name
                </Text>
                <Text
                  className={`text-xl font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  {user?.merchant?.businessName || "Merchant Name"}
                </Text>
              </View>
            </View>
            <Text
              className={`text-lg ${isDark ? "text-lime-400" : "text-lime-600"}`}
            >
              Customers Can Scan This QR Code To Pay You Instantly
            </Text>
          </Card>

          {/* QR Code */}
          <Card className="p-4 items-center">
            <View className="flex-row items-center gap-2 mb-4">
              <QrCode size={20} color={isDark ? "#a3e635" : "#65a30d"} />
              <Text
                className={`text-2xl font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Scan to Pay
              </Text>
            </View>

            <View className="--bg-white px-4 rounded-2xl mb-4">
              {isLoading ? (
                <View className="w-96 h-96 items-center justify-center">
                  <ActivityIndicator size="large" color="#a3e635" />
                  <Text
                    className={`text-lg mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Generating QR code...
                  </Text>
                </View>
              ) : qrData ? (
                <Image
                  source={{ uri: `data:image/png;base64,${qrData}` }}
                  className="w-96 h-96"
                  resizeMode="contain"
                />
              ) : (
                <View className="w-96 h-96 p-3 items-center justify-center gap-3">
                  <Text className="text-slate-400">Failed to Load QR Code</Text>
                  <Pressable
                    onPress={GetPaymentQR}
                    className="px-4 py-2 bg-lime-500/20 rounded-xl"
                  >
                    <Text className="text-lime-600 font-semibold text-base">
                      Retry
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            <Text
              className={`text-lg text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Let your customer&apos;s camera scan this QR code to receive
              payment
            </Text>
          </Card>

          {/* Actions */}
          <View className="flex-col gap-3 mb-8">
            <Button
              variant="secondary"
              label="Share"
              onPress={handleShare}
              className="flex-1 flex-row gap-2"
            />
            <Button
              label="Save As PDF"
              onPress={handlePrint}
              className="flex-1"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default MerchantQRDisplay;
