#!/bin/bash

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
echo "Applying react-native-hce patch..."

HCE_GRADLE_PATH="node_modules/react-native-hce/android/build.gradle"

if [ -f "$HCE_GRADLE_PATH" ]; then
    sed -i.bak '/^[[:space:]]*jcenter()/d' "$HCE_GRADLE_PATH"
    rm -f "$HCE_GRADLE_PATH.bak"
    echo "✅ react-native-hce patch applied successfully"
else
    echo "❌ react-native-hce build.gradle not found"
fi