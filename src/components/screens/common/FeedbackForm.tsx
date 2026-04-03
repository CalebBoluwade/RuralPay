import { useLanguage } from "@/src/components/context/LanguageContext";
import OptimizedInput from "@/src/components/ui/Input/OptimizedInput";
import ScreenHeader from "@/src/components/ui/ScreenHeader";
import { UserFeedBack, UserFeedBackSchema } from "@/src/lib/schema/validations";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import * as StoreReview from "expo-store-review";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    useColorScheme,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SECTIONS = [
  {
    name: "email" as const,
    emoji: "❤️",
    label: "auth.email",
    placeholder: "auth.email",
  },
  {
    name: "mostLovedFeature" as const,
    emoji: "❤️",
    label: "feedback.mostLovedFeature.label",
    placeholder: "feedback.mostLovedFeature.placeholder",
  },
  {
    name: "mostHatedFeature" as const,
    emoji: "😤",
    label: "feedback.mostHatedFeature.label",
    placeholder: "feedback.mostHatedFeature.placeholder",
  },
  {
    name: "niceHaveFeature" as const,
    emoji: "✨",
    label: "feedback.niceHaveFeature.label",
    placeholder: "feedback.niceHaveFeature.placeholder",
  },
  {
    name: "generalFeedback" as const,
    emoji: "💬",
    label: "feedback.generalFeedback.label",
    placeholder: "feedback.generalFeedback.placeholder",
  },
];

const FeedbackForm = () => {
  const { t } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [starRating, setStarRating] = useState(0);
  const [storeReviewRequested, setStoreReviewRequested] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFeedBack>({
    resolver: zodResolver(UserFeedBackSchema),
    reValidateMode: "onChange",
  });

  const handleStarPress = async (star: number) => {
    setStarRating(star);
    if (star >= 4 && !storeReviewRequested) {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
        setStoreReviewRequested(true);
      }
    }
  };

  const onSubmit = async (data: UserFeedBack) => {
    if (__DEV__) console.log(data);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      <ScreenHeader title="Share Your Thoughts" onBack={() => router.back()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-4 pb-10"
        >
          {/* Hero */}
          <View
            className={`rounded-3xl p-5 mb-3 ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-100"}`}
          >
            <View className="flex-row gap-3 items-center">
              <Text className="text-3xl mb-2">🙌</Text>
              <Text
                className={`text-xl font-bold font-brand mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Your Voice Shapes RuralPay
              </Text>
            </View>

            <Text
              className={`text-sm leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Every Piece of feedback goes directly to our team. Help us build
              the product you deserve.
            </Text>
          </View>

          {/* Star Rating */}
          <View
            className={`rounded-3xl p-5 mb-3 items-center ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-100"}`}
          >
            <Text
              className={`text-lg font-semibold font-brand mb-1 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Rate Your Experience?
            </Text>
            <View className="flex-row gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => handleStarPress(star)}>
                  <Text
                    className={`${isDark ? "text-white" : "text-slate-900"}`}
                    style={{ fontSize: 36 }}
                  >
                    {star <= starRating ? "⭐" : "☆"}
                  </Text>
                </Pressable>
              ))}
            </View>
            {starRating > 0 && (
              <Text
                className={`text-xs mt-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {starRating === 5
                  ? "Amazing! Thank You So Much! 🎉"
                  : starRating >= 3
                    ? "Thanks! Tell Us How We Can Do Better 👇"
                    : "We're Sorry To Hear That. Please Tell Us More 👇"}
              </Text>
            )}
          </View>

          {/* Feedback Fields */}
          <View
            className={`rounded-3xl p-5 mb-6 ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-gray-100"}`}
          >
            {SECTIONS.map(({ name, emoji, label, placeholder }) => (
              <OptimizedInput
                control={control}
                key={name}
                name={name}
                label={`${t(label)} ${emoji}`}
                placeholder={t(placeholder)}
                keyboardType="default"
                error={errors[name]}
              />
            ))}
          </View>

          {/* Submit */}
          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className={`bg-lime-400 rounded-2xl py-4 shadow-lg mb-4 ${isSubmitting ? "opacity-50" : ""}`}
          >
            <Text className="text-black text-lg font-bold text-center">
              {isSubmitting ? "Sending..." : "Send Feedback 🚀"}
            </Text>
          </Pressable>

          {/* Privacy note */}
          <View className="flex-row justify-center items-center gap-1">
            <Text style={{ fontSize: 14 }}>🔒</Text>
            <Text
              className={`text-xs text-center ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              Not Anonymous — But Your Privacy Is Always Respected.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default FeedbackForm;
