#!/bin/bash

ENV=${1:-development}
PLATFORM=${2:-android}

echo "Building for $ENV environment on $PLATFORM..."

cp .env.$ENV .env

export $(grep -v '^#' .env | xargs)

if [ "$PLATFORM" = "android" ]; then
  bunx expo prebuild --clean --platform android
  bunx expo run:android --device --variant debug
elif [ "$PLATFORM" = "ios" ]; then
  bunx expo prebuild --clean --platform ios
  bunx expo run:ios --device
else
  echo "Invalid platform. Use 'android' or 'ios'"
  exit 1
fi
