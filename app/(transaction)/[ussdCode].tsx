import { BankTransferService } from "@/components/services/BankTransferService";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { ToastService } from "@/hooks/use-toast";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const USSDCodeDetail = () => {
  const { ussdCode } = useLocalSearchParams();
  const router = useRouter();
  const [ussdData, setUssdData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      BankTransferService.FetchUSSDCodeById(ussdCode as string).then(
        (ussdData) => {
          setUssdData(ussdData);
          setLoading(false);
        }
      );
    } catch {
      ToastService.error("Error fetching USSD code:");

      setLoading(false);
    }
  }, [ussdCode]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-indigo-50">
        <View className="flex-1 justify-center items-center">
          <Text className="text-xl font-semibold text-gray-700">Loading USSD Details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-1">
          <ScreenHeader
            title="USSD Code Details"
            subtitle="USSD service information"
            onBack={() => router.back()}
          />
        </View>

        <View className="px-6 pb-8">
          <View className="bg-white/80 backdrop-blur rounded-3xl p-8 shadow-lg border border-white/50 mb-6">
            <View className="items-center">
              <View className="w-28 h-28 rounded-full bg-blue-600 justify-center items-center mb-6 shadow-xl">
                <Text className="text-4xl text-white font-bold">#</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                *{ussdData?.code}#
              </Text>
              <Text className="text-lg text-gray-600">
                {ussdData?.description}
              </Text>
            </View>
          </View>

          <View className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50">
            <Text className="text-2xl font-bold text-gray-900 mb-6">
              USSD Information
            </Text>
            
            <View className="space-y-4">
              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-lg font-medium text-gray-600">Code</Text>
                <Text className="text-lg font-semibold text-gray-900">*{ussdData?.code}#</Text>
              </View>
              
              <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
                <Text className="text-lg font-medium text-gray-600">Provider</Text>
                <Text className="text-lg font-semibold text-gray-900">{ussdData?.provider}</Text>
              </View>
              
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-lg font-medium text-gray-600">Status</Text>
                <View className="bg-green-100 px-4 py-2 rounded-full">
                  <Text className="text-sm font-bold text-green-700">{ussdData?.status}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default USSDCodeDetail;
