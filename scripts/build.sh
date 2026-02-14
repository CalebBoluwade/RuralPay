#!/bin/bash

ENV=${1:-development}
PLATFORM=${2:-android}

echo "Building for $ENV environment on $PLATFORM..."

cp .env."$ENV" .env

set -a
source .env
set +a

if [ "$PLATFORM" = "android" ]; then
  bunx expo prebuild --clean --platform android
  bunx expo run:android --device --no-build-cache --variant debug
elif [ "$PLATFORM" = "ios" ]; then
  bunx expo prebuild --clean --platform ios
  if [ "$ENV" = "development" ]; then
    bunx expo run:ios
  else
    bunx expo run:ios --device
  fi
else
  echo "Invalid platform. Use 'android' or 'ios'"
  exit 1
fi
