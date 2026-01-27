#!/bin/bash

# Script to fix Gradle build issues

echo "Stopping Gradle daemon..."
cd android && ./gradlew --stop

echo "Cleaning Gradle caches..."
rm -rf ~/.gradle/caches
rm -rf ~/.gradle/daemon
rm -rf android/.gradle
rm -rf android/build
rm -rf android/app/build

echo "Cleaning node modules..."
cd ..
rm -rf node_modules
rm -rf .expo

echo "Reinstalling dependencies..."
bun install

echo "Running prebuild..."
bunx expo prebuild --clean

echo "Done! Now try: bunx expo run:android"
