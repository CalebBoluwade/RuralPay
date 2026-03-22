import BanksModal from "@/src/components/ui/Modals/BanksModal";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import AccountService from "@/src/lib/services/AccountService";
import PaymentService from "@/src/lib/services/PaymentService";
import { router } from "expo-router";
import { ChevronDown, ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    useColorScheme,
} from "react-native";

export default function LinkBankAccount() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [step, setStep] = useState(0);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [processingDebit, setProcessingDebit] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    const fetchBanks = async () => {
      const banks = await PaymentService.GetBanks();
      setBanks(banks);
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    if (selectedBank && accountNumber.length === 10) {
      performNameEnquiry();
    } else {
      setAccountName("");
    }
  }, [selectedBank, accountNumber]);

  const performNameEnquiry = async () => {
    if (!selectedBank || accountNumber.length !== 10) {
      setAccountName("");
      return;
    }

    setVerifying(true);
    const result = await AccountService.ResolveAccountName(
      selectedBank.code,
      accountNumber,
    );
    setAccountName(
      result.success
        ? result.details.accountName!
        : result.errorMessage || "Account Not Found",
    );
    setVerifying(false);
  };

  const handleDirectDebit = async () => {
    setProcessingDebit(true);
    setTimeout(() => {
      setProcessingDebit(false);
      setStep(1);
    }, 2000);
  };

  const handleLinkAccount = async () => {
    try {
      setLoading(true);

      const x = await AccountService.LinkAccount({
        bankCode: selectedBank?.code!,
        accountNumber,
        IsPrimary: false,
      });

      console.log(x);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (step === 0) {
    return (
      <View className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}>
        <View className="flex-1 px-6 pt-24 justify-between pb-8">
          <View>
            <ScreenHeader
              title="Account Verification"
              onBack={() => router.back()}
            />

            <View className="items-center mt-12 mb-8">
              <View
                className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${
                  isDark
                    ? "bg-lime-500/20 border-2 border-lime-500"
                    : "bg-lime-50 border-2 border-lime-500"
                }`}
              >
                <ShieldCheck size={42} color={isDark ? "#ffffff" : "#60a5fa"} />
              </View>
              <Text
                className={`text-3xl font-brand font-bold text-center mb-4 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Verification Required
              </Text>
              <Text
                className={`text-lg text-center px-4 leading-7 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                To link your bank account securely, we need to verify your
                account ownership.
              </Text>
            </View>

            <View
              className={`px-6 py-6 rounded-3xl mb-6 ${
                isDark
                  ? "bg-white/10 border-2 border-white/20"
                  : "bg-gray-50 border-2 border-gray-200"
              }`}
            >
              <Text
                className={`text-base font-semibold mb-4 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                How it works:
              </Text>
              <View className="space-y-4">
                <View className="flex-row items-start mb-3">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      isDark ? "bg-green-500/20" : "bg-green-100"
                    }`}
                  >
                    <Text
                      className={`text-base font-bold ${
                        isDark ? "text-green-400" : "text-green-700"
                      }`}
                    >
                      1
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 text-base leading-6 pt-1 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    We&apos;ll deduct ₦50 from your account
                  </Text>
                </View>
                <View className="flex-row items-start mb-3">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      isDark ? "bg-green-500/20" : "bg-green-100"
                    }`}
                  >
                    <Text
                      className={`text-base font-bold ${
                        isDark ? "text-green-400" : "text-green-700"
                      }`}
                    >
                      2
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 text-base leading-6 pt-1 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    This confirms you own the account
                  </Text>
                </View>
                <View className="flex-row items-start">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                      isDark ? "bg-green-500/20" : "bg-green-100"
                    }`}
                  >
                    <Text
                      className={`text-base font-bold ${
                        isDark ? "text-green-400" : "text-green-700"
                      }`}
                    >
                      3
                    </Text>
                  </View>
                  <Text
                    className={`flex-1 text-base leading-6 pt-1 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Your Account Will be Linked Instantly
                  </Text>
                </View>
              </View>
            </View>

            <View
              className={`px-6 py-5 rounded-3xl ${
                isDark
                  ? "bg-lime-500/20 border-2 border-lime-500"
                  : "bg-lime-50 border-2 border-lime-500"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className={`text-lg font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Verification Fee
                </Text>
                <Text
                  className={`text-3xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  ₦50
                </Text>
              </View>
              <Text
                className={`text-sm mt-2 ${
                  isDark ? "text-lime-300" : "text-lime-700"
                }`}
              >
                One-time payment • Secure • Instant
              </Text>
            </View>
          </View>

          <View>
            <Pressable
              className={`py-5 rounded-2xl mt-3 mb-3 ${
                processingDebit
                  ? "bg-gray-400"
                  : isDark
                    ? "bg-lime-600"
                    : "bg-lime-600"
              }`}
              onPress={handleDirectDebit}
              disabled={processingDebit}
            >
              {processingDebit ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-center text-xl font-bold">
                  Proceed to Verification
                </Text>
              )}
            </Pressable>

            <Pressable className="py-4" onPress={() => router.back()}>
              <Text
                className={`text-center text-lg font-semibold ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={isDark ? "flex-1 bg-[#0a0a0f]" : "flex-1 bg-white"}>
      <ScrollView
        className="flex-1 px-6 pt-24"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Link Bank Account"
          subtitle={`Step ${step} of 2`}
          onBack={() => router.back()}
        />

        {step === 1 && (
          <View>
            <Text
              className={`text-lg font-brand font-bold mb-4 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Enter Account Details
            </Text>

            <Pressable
              className={`px-6 py-4 rounded-2xl backdrop-blur-xl mb-4 ${
                selectedBank
                  ? isDark
                    ? "bg-lime-500/20 border-2 border-lime-500"
                    : "bg-lime-50 border-2 border-lime-500"
                  : isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-gray-50 border border-gray-200"
              }`}
              onPress={() => setShowBankModal(true)}
            >
              <Text
                className={`text-sm font-semibold mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Selected Bank
              </Text>
              {selectedBank ? (
                <View className="flex-row justify-between items-center">
                  <Text
                    className={`text-lg font-brand font-bold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {selectedBank.name}
                  </Text>
                  <ChevronDown
                    size={24}
                    color={isDark ? "#a78bfa" : "#7c3aed"}
                  />
                </View>
              ) : (
                <Text
                  className={`text-lg ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Choose a bank
                </Text>
              )}
            </Pressable>

            <View className="mb-4">
              <Text
                className={`text-sm font-semibold mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Account Number
              </Text>
              <TextInput
                className={`px-6 py-4 rounded-2xl text-lg font-semibold ${
                  isDark
                    ? "bg-white/10 border border-white/20 text-white"
                    : "bg-gray-50 border border-gray-200 text-gray-900"
                }`}
                placeholder="Enter 10-digit account number"
                placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
                keyboardType="number-pad"
                maxLength={10}
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>

            {verifying && (
              <View
                className={`px-6 py-4 rounded-2xl backdrop-blur-xl mb-4 flex-row items-center ${
                  isDark
                    ? "bg-white/10 border border-white/20"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <ActivityIndicator
                  size="small"
                  color={isDark ? "#a78bfa" : "#7c3aed"}
                />
                <Text
                  className={`ml-3 text-sm ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Verifying account...
                </Text>
              </View>
            )}

            {accountName && !verifying && (
              <View className="mb-4">
                <Text
                  className={`text-sm font-semibold mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Account Name
                </Text>
                <TextInput
                  className={`px-6 py-4 rounded-2xl text-lg font-semibold ${
                    isDark
                      ? "bg-gray-800 border border-gray-700 text-gray-500"
                      : "bg-gray-200 border border-gray-300 text-gray-500"
                  }`}
                  value={accountName}
                  editable={false}
                />
              </View>
            )}

            <Pressable
              className={`py-4 rounded-2xl mt-6 ${
                accountName && !verifying
                  ? isDark
                    ? "bg-lime-600"
                    : "bg-lime-600"
                  : "bg-gray-400"
              }`}
              onPress={handleLinkAccount}
              disabled={!accountName || verifying}
            >
              <Text className="text-white text-center text-lg font-bold">
                Link Account
              </Text>
            </Pressable>

            <BanksModal
              banks={banks}
              visible={showBankModal}
              onClose={() => setShowBankModal(false)}
              onBankSelected={(bank) => {
                setSelectedBank(bank);
                setShowBankModal(false);
              }}
            />
          </View>
        )}
      </ScrollView>

      <Modal visible={loading} transparent animationType="fade">
        <View
          className={`flex-1 justify-center items-center ${
            isDark ? "bg-black/80" : "bg-black/50"
          }`}
        >
          <View
            className={`rounded-3xl p-8 items-center backdrop-blur-xl ${
              isDark
                ? "bg-white/10 border border-white/20"
                : "bg-white border border-gray-200"
            }`}
          >
            <ActivityIndicator
              size="large"
              color={isDark ? "#a78bfa" : "#7c3aed"}
            />
            <Text
              className={`mt-4 text-base font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Linking account...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
