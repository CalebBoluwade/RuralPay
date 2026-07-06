#!/bin/bash

# Script to fix Gradle build issues

FILE="node_modules/expo/ios/AppDelegates/ExpoReactNativeFactory.swift"

sed -i.bak 's/launchOptions: launchOptions ?? \[:\],$/launchOptions: launchOptions ?? [:],\n        bundleConfiguration: nil,/' "$FILE"
sed -i.bak 's/launchOptions: launchOptions,$/launchOptions: launchOptions,\n        bundleConfiguration: nil,/' "$FILE"
sed -i.bak 's/devMenuConfiguration: self\.devMenuConfiguration$/devMenuConfiguration: self.devMenuConfiguration!/' "$FILE"
rm -f "$FILE.bak"
