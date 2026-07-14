#!/bin/bash

# Fix expo ExpoReactNativeFactory.swift - missing bundleConfiguration param (Xcode 26 / RN 0.85)
# EXPO_FACTORY="node_modules/expo/ios/AppDelegates/ExpoReactNativeFactory.swift"
# if [ -f "$EXPO_FACTORY" ]; then
#     chmod u+w "$EXPO_FACTORY" 2>/dev/null || sudo chmod u+w "$EXPO_FACTORY"
#     sed -i.bak \
#         's/launchOptions: launchOptions ?? \[:\],$/launchOptions: launchOptions ?? [:],\n        bundleConfiguration: nil,/' \
#         "$EXPO_FACTORY"
#     sed -i.bak \
#         's/launchOptions: launchOptions,$/launchOptions: launchOptions,\n        bundleConfiguration: nil,/' \
#         "$EXPO_FACTORY"
#     sed -i.bak \
#         's/devMenuConfiguration: self\.devMenuConfiguration$/devMenuConfiguration: self.devMenuConfiguration!/' \
#         "$EXPO_FACTORY"
#     rm -f "$EXPO_FACTORY.bak"
#     echo "✅ expo ExpoReactNativeFactory.swift patch applied"
# fi

# # Fix react-native-svg ImageResponseObserver API (RN 0.85 / new arch)
# SVG_IMAGE_MM="node_modules/react-native-svg/apple/Elements/RNSVGImage.mm"
# if [ -f "$SVG_IMAGE_MM" ]; then
#     sed -i.bak 's/observerCoordinator\.removeObserver(\*_imageResponseObserverProxy)/observerCoordinator.removeObserver(_imageResponseObserverProxy)/' "$SVG_IMAGE_MM"
#     sed -i.bak 's/observerCoordinator\.addObserver(\*_imageResponseObserverProxy)/observerCoordinator.addObserver(_imageResponseObserverProxy)/' "$SVG_IMAGE_MM"
#     rm -f "$SVG_IMAGE_MM.bak"
#     echo "✅ react-native-svg iOS patch applied"
# fi

# Apply patch-package patches
echo "Applying patch-package patches..."
bunx patch-package
echo "✅ patch-package patches applied"

# Apply react-native-ble-advertiser patch
echo "Applying react-native-ble-advertiser patch..."

BUILD_GRADLE_PATH="node_modules/react-native-ble-advertiser/android/build.gradle"

if [ -f "$BUILD_GRADLE_PATH" ]; then
    # Replace hardcoded SDK versions with project variables
    sed -i.bak 's/compileSdkVersion 28/compileSdkVersion rootProject.ext.compileSdkVersion ?: 35/' "$BUILD_GRADLE_PATH"
    sed -i.bak 's/buildToolsVersion "28.0.3"/buildToolsVersion rootProject.ext.buildToolsVersion ?: "35.0.0"/' "$BUILD_GRADLE_PATH"
    sed -i.bak 's/minSdkVersion 21/minSdkVersion rootProject.ext.minSdkVersion ?: 21/' "$BUILD_GRADLE_PATH"
    sed -i.bak 's/targetSdkVersion 28/targetSdkVersion rootProject.ext.targetSdkVersion ?: 35/' "$BUILD_GRADLE_PATH"
    
    # Remove backup file
    rm -f "$BUILD_GRADLE_PATH.bak"
    
    echo "✅ react-native-ble-advertiser patch applied successfully"
else
    echo "❌ react-native-ble-advertiser build.gradle not found"
fi

# Fix react-native-hce jcenter() removal
# echo "Applying react-native-hce patch..."

# HCE_GRADLE_PATH="node_modules/react-native-hce/android/build.gradle"

# if [ -f "$HCE_GRADLE_PATH" ]; then
#     sed -i.bak '/^[[:space:]]*jcenter()/d' "$HCE_GRADLE_PATH"
#     rm -f "$HCE_GRADLE_PATH.bak"
#     echo "✅ react-native-hce patch applied successfully"
# else
#     echo "❌ react-native-hce build.gradle not found"
# fi

# # Fix react-native-rsa-native jcenter() removal (incompatible with Gradle 9+)
# echo "Applying react-native-rsa-native patch..."

# RSA_GRADLE_PATH="node_modules/react-native-rsa-native/android/build.gradle"

# if [ -f "$RSA_GRADLE_PATH" ]; then
#     sed -i.bak '/^[[:space:]]*jcenter()/d' "$RSA_GRADLE_PATH"
#     rm -f "$RSA_GRADLE_PATH.bak"
#     echo "✅ react-native-rsa-native patch applied successfully"
# else
#     echo "❌ react-native-rsa-native build.gradle not found"
# fi