import ScreenHeader from "@/components/ui/ScreenHeader";
import QRCodeService from "@/lib/services/QRCodeService";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthProvider";

const MerchantQRModal = ({
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

  const GetPaymentQR = async () => {
    const QRresult = await QRCodeService.GeneratePaymentQR();

    setQRData(QRresult);
  };

  useEffect(() => {
    GetPaymentQR();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Pay ${user!.merchant?.businessName || "Us"} Easily! Scan our QR Code or Use Merchant ID: ${user!.merchant?.id}`,
      });
    } catch (error) {
      console.error(error);
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
      background-color: #f5f5f5;
    }
    .card {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 400px;
      width: 90%;
      border: 1px solid #e5e7eb;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #4f46e5;
      margin-bottom: 10px;
    }
    .merchant-name {
      font-size: 32px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 18px;
      margin-bottom: 30px;
    }
    .qr-container {
      background: #ffffff;
      padding: 20px;
      border-radius: 16px;
      border: 2px dashed #e5e7eb;
      display: inline-block;
      margin-bottom: 30px;
    }
    .qr-image {
      width: 250px;
      height: 250px;
      display: block;
    }
    .footer {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 14px;
    }
    .brand {
      font-weight: 600;
      color: #4f46e5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">NFC Payments</div>
    <div class="merchant-name">${user.merchant.businessName}</div>
    <div class="subtitle">Scan to Pay</div>
    
    <div class="qr-container">
      <img src="data:image/png;base64,${qrData}" class="qr-image" />
    </div>
    
    <div class="footer">
      Powered by <span class="brand">NFC Card Payments</span>
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
      console.error(error);
    }
  };

  return (
    <Modal
      visible={showMerchantQRModal}
      transparent
      animationType="fade"
      presentationStyle="pageSheet"
    >
      <View className={`${isDark ? "bg-[#0a0a0f]" : "bg-[#f5f5fa]"}`}>
        <SafeAreaView className="p-6">
          <ScreenHeader
            title="Scan Merchant QR Code"
            subtitle=""
            onBack={() => setShowMerchantQRModal(false)}
          />

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              padding: 24,
            }}
          >
            <View className="items-center">
              <View
                className={`w-full max-w-sm rounded-3xl p-8 items-center shadow-xl ${
                  isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-white shadow-gray-200/50"
                }`}
              >
                <View className="items-center mb-8">
                  <View
                    className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${
                      isDark ? "bg-indigo-500/20" : "bg-indigo-50"
                    }`}
                  >
                    <Ionicons
                      name="storefront"
                      size={32}
                      color={isDark ? "#a78bfa" : "#4f46e5"}
                    />
                  </View>
                  <Text
                    className={`text-2xl font-bold text-center mb-1 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {user?.merchant?.businessName || "Merchant Name"}
                  </Text>
                  <Text
                    className={`text-sm ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Scan to Pay
                  </Text>
                </View>

                <View className="bg-white p-4 rounded-2xl mb-6 shadow-sm">
                  {qrData ? (
                    <Image
                      source={{ uri: `data:image/png;base64,${qrData}` }}
                      className="w-64 h-64"
                      resizeMode="contain"
                    />
                  ) : (
                    <View className="w-64 h-64 items-center justify-center bg-gray-50 rounded-xl">
                      <ActivityIndicator size="large" color="#4f46e5" />
                    </View>
                  )}
                </View>

                <Text
                  className={`text-center text-xs ${
                    isDark ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  ID: {user?.merchant?.id || "..."}
                </Text>
              </View>

              <View className="flex-row gap-4 mt-8 w-full max-w-sm">
                <Pressable
                  onPress={handleShare}
                  className={`flex-1 py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                    isDark ? "bg-white/10" : "bg-gray-100"
                  }`}
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={isDark ? "white" : "black"}
                  />
                  <Text
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Share
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handlePrint}
                  className={`flex-1 py-4 rounded-2xl flex-row items-center justify-center gap-2 ${
                    isDark ? "bg-lime-600" : "bg-lime-800"
                  }`}
                >
                  <Ionicons name="print-outline" size={20} color="white" />
                  <Text className="font-semibold text-white">Save PDF</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          {/* <View
            className={`justify-center items-center rounded-2xl p-4 my-12 ${isDark ? "bg-white/10 border border-white/20" : "bg-white/60 border border-gray-200/50"}`}
          >
            <Image
              source={{ uri: `data:image/png;base64,${qrData}` }}
              className="w-96 h-96 max-w-96 max-h-96 rounded-2xl"
              resizeMode="contain"
            />
          </View>

          <View>
            <View
              className={`${isDark ? "bg-[#f5f5fa]" : "bg-[#0a0a0f]"} p-4 flex-row justify-center items-center gap-2 rounded-lg mb-2`}
            >
              <Ionicons name="business-outline" size={24} />
              <Text
                className={`font-semibold text-2xl ${isDark ? "text-lime-500" : "text-white"}`}
              >
                {merchant?.businessName}
              </Text>
            </View>

            <Text
              className={`font-semibold text-lg ${isDark ? "text-gray-900" : "text-white"}`}
            >
              {merchant?.commisionRate}
            </Text>

            <Text className="text-gray-400 my-4 p-2">
              Experience Fast, Secure, Hassle-Free Transactions, Scan The QR
              Code and Complete Your Transaction Seamlessly!
            </Text>
          </View> */}
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default MerchantQRModal;
