import { useAuth } from "@/src/components/context/AuthProvider";
import QRCodeService from "@/src/lib/services/QRCodeService";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Download, QrCode, Share, Store, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
      const QRresult = await QRCodeService.GeneratePaymentQR();
      setQRData(QRresult);
    } catch (error) {
      if (__DEV__) console.error("Failed to generate QR code:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (showMerchantQRModal) GetPaymentQR();
  }, [showMerchantQRModal]);

  const handleShare = async () => {
    try {
      await RNShare.share({
        message: `Pay ${user!.merchant?.businessName || "Us"} Easily! Scan our QR Code or Use Merchant ID: ${user!.merchant?.id}`,
      });
    } catch (error) {
      if (__DEV__) console.error(error);
    }
  };

  const handlePrint = async () => {
    if (!qrData || !user?.merchant) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f1f5f9;
    }
    .card {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
      width: 90%;
      border: 1px solid #e2e8f0;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #65a30d;
      margin-bottom: 10px;
    }
    .merchant-name {
      font-size: 32px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #64748b;
      font-size: 18px;
      margin-bottom: 30px;
    }
    .qr-container {
      background: #ffffff;
      padding: 20px;
      border-radius: 16px;
      border: 2px dashed #e2e8f0;
      display: inline-block;
      margin-bottom: 30px;
    }
    .qr-image {
      width: 300px;
      height: 300px;
      display: block;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #94a3b8;
      font-size: 14px;
    }
    .brand {
      font-weight: 700;
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">RuralPay</div>
    <div class="merchant-name">${user.merchant.businessName}</div>
    <div class="subtitle">Scan to Pay</div>
    
    <div class="qr-container">
      <img src="data:image/png;base64,${qrData}" class="qr-image" />
    </div>
    
    <div class="footer">
      Powered by <span class="brand">RuralPay</span>
    </div>
  </div>
</body>
</html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF");
      if (__DEV__) console.error(error);
    }
  };

  const cardClass = isDark
    ? "bg-white/10 border border-white/20"
    : "bg-white border border-slate-200 shadow-sm";

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
          <View className={`rounded-2xl p-5 mb-6 mt-4 ${cardClass}`}>
            <View className="flex-row items-center gap-3 mb-3">
              <View
                className={`w-12 h-12 rounded-xl items-center justify-center ${isDark ? "bg-lime-500/20" : "bg-lime-50"}`}
              >
                <Store size={22} color={isDark ? "#a3e635" : "#65a30d"} />
              </View>
              <View>
                <Text
                  className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
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
              className={`text-base ${isDark ? "text-lime-400" : "text-lime-600"}`}
            >
              Customers can scan this QR code to pay you instantly
            </Text>
          </View>

          {/* QR Code */}
          <View className={`rounded-2xl p-6 mb-6 items-center ${cardClass}`}>
            <View className="flex-row items-center gap-2 mb-4">
              <QrCode size={20} color={isDark ? "#a3e635" : "#65a30d"} />
              <Text
                className={`text-lg  font-brand font-bold ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Scan to Pay
              </Text>
            </View>

            <View className="bg-white p-4 rounded-2xl mb-4">
              {isLoading ? (
                <View className="w-96 h-96 items-center justify-center">
                  <ActivityIndicator size="large" color="#a3e635" />
                  <Text
                    className={`text-sm mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}
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
                <View className="w-96 h-96 p-3 items-center justify-center">
                  <Text className="text-slate-400">Failed to Load QR Code</Text>
                </View>
              )}
            </View>

            <Text
              className={`text-base text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Let your customer&apos;s camera scan this QR code to receive
              payment
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3 mb-8">
            <Pressable
              onPress={handleShare}
              className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl ${isDark ? "bg-white/10" : "bg-slate-100"}`}
            >
              <Share size={18} color={isDark ? "#fff" : "#64748b"} />
              <Text
                className={`font-brand font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Share
              </Text>
            </Pressable>

            <Pressable
              onPress={handlePrint}
              className="flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-lime-400"
            >
              <Download size={18} color="white" />
              <Text className="font-brand font-bold text-sm text-white">
                Save PDF
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default MerchantQRDisplay;
