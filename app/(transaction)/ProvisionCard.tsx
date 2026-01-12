import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { z } from 'zod'
import OptimizedInput from '../../components/Input/OptimizedInput'

const customerSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  cardType: z.enum(['debit', 'credit'])
})

type CustomerData = z.infer<typeof customerSchema>

const ProvisionCard = () => {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [nfcWriting, setNfcWriting] = useState(false)

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CustomerData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerName: '',
      email: '',
      phone: '',
      cardType: 'debit'
    }
  })

  const watchedValues = watch()

  const handleNext = handleSubmit(() => {
    setStep(2)
  })

  const handleNfcWrite = async () => {
    setNfcWriting(true)
    // Simulate NFC write
    setTimeout(() => {
      setNfcWriting(false)
      Alert.alert('Success', 'Card provisioned successfully')
      setStep(1)
      reset()
    }, 3000)
  }

  if (step === 2) {
    return (
      <View className="flex-1 bg-gradient-to-b from-blue-50 to-white">
        <View className="px-6 pt-12 pb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">NFC Card Writing</Text>
          <Text className="text-lg text-gray-600">Position your card near the device</Text>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <View className={`w-56 h-56 rounded-full justify-center items-center mb-8 ${
            nfcWriting ? 'bg-gradient-to-br from-green-400 to-blue-500' : 'bg-gradient-to-br from-blue-400 to-purple-500'
          } shadow-2xl`}>
            <View className="w-40 h-40 rounded-full bg-white/20 backdrop-blur justify-center items-center">
              <Text className="text-6xl">{nfcWriting ? '⚡' : '💳'}</Text>
            </View>
          </View>

          <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
            {nfcWriting ? 'Writing Data...' : 'Ready to Write'}
          </Text>
          <Text className="text-lg text-gray-600 text-center mb-10 px-4">
            {nfcWriting ? 'Keep the card steady and close to your device' : 'Hold the NFC card against the back of your device'}
          </Text>

          <View className="bg-white/80 backdrop-blur p-6 rounded-2xl border border-white/50 mb-10 w-full shadow-lg">
            <Text className="text-lg font-bold text-gray-800 mb-4">Card Details</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Customer</Text>
                <Text className="font-semibold text-gray-900">{watchedValues.customerName}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Email</Text>
                <Text className="font-medium text-gray-900">{watchedValues.email}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Phone</Text>
                <Text className="font-medium text-gray-900">{watchedValues.phone}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Type</Text>
                <Text className="font-semibold text-blue-600 capitalize">{watchedValues.cardType}</Text>
              </View>
            </View>
          </View>

          <View className="w-full space-y-4">
            <TouchableOpacity
              className={`py-4 rounded-2xl shadow-lg ${
                nfcWriting ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'
              }`}
              onPress={handleNfcWrite}
              disabled={nfcWriting}
            >
              <Text className="text-white text-lg font-bold text-center">
                {nfcWriting ? 'Writing to Card...' : 'Start NFC Write'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 border-2 border-gray-300 rounded-2xl bg-white/50"
              onPress={() => setStep(1)}
              disabled={nfcWriting}
            >
              <Text className="text-gray-700 text-lg font-semibold text-center">← Back to Form</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <View className="px-6 pt-12 pb-8">
        <TouchableOpacity 
          className="mb-4 p-2 w-10 h-10 rounded-full bg-white/50 items-center justify-center"
          onPress={() => router.back()}
        >
          <Text className="text-xl text-gray-700">←</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-gray-900 mb-2">New Card Setup</Text>
        <Text className="text-lg text-gray-600">Enter customer details to provision a new NFC card</Text>
      </View>

      <View className="px-6 pb-8">
        <View className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-6">Customer Information</Text>
          
          <OptimizedInput
            control={control}
            name="customerName"
            label="Full Name *"
            placeholder="Enter customer's full name"
            error={errors.customerName}
          />

          <OptimizedInput
            control={control}
            name="email"
            label="Email Address *"
            placeholder="customer@example.com"
            keyboardType="email-address"
            error={errors.email}
          />

          <OptimizedInput
            control={control}
            name="phone"
            label="Phone Number *"
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
            error={errors.phone}
          />
        </View>

        <View className="bg-white/80 backdrop-blur rounded-3xl p-6 shadow-lg border border-white/50 mb-8">
          <Text className="text-xl font-bold text-gray-800 mb-4">Card Type</Text>
          <View className="flex-row gap-4">
            {(['debit', 'credit'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                className={`flex-1 p-4 rounded-2xl border-2 items-center ${
                  watchedValues.cardType === type 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50' 
                    : 'border-gray-200 bg-white/50'
                }`}
                onPress={() => setValue('cardType', type)}
              >
                <Text className="text-2xl mb-2">{type === 'debit' ? '💳' : '💎'}</Text>
                <Text className={`text-lg font-semibold capitalize ${
                  watchedValues.cardType === type ? 'text-emerald-600' : 'text-gray-700'
                }`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          className="py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
          onPress={handleNext}
        >
          <Text className="text-white text-lg font-bold text-center">
            Continue to NFC Writing →
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default ProvisionCard