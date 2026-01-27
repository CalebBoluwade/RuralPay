#!/bin/bash

echo "Cleaning build artifacts..."

rm -rf android/.gradle
rm -rf ~/.gradle/caches
rm -rf ~/.gradle/daemon
rm -rf ~/.gradle/buildOutputCleanup

cd android && ./gradlew clean && cd ..

echo "Clean complete!"
