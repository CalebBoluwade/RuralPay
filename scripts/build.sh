#!/bin/bash
set -euo pipefail

# ── Arguments with fallback to environment variables ─────────────────────────
APP_ENV="${1:-${APP_ENV:-development}}"
APP_PLATFORM="${2:-${APP_PLATFORM:-android}}"

# ── Validate inputs ───────────────────────────────────────────────────────────
VALID_ENVS=("development" "preview" "production")
VALID_PLATFORMS=("android" "ios")

contains() {
  local value="$1"; shift
  for item in "$@"; do [[ "$item" == "$value" ]] && return 0; done
  return 1
}

if ! contains "$APP_ENV" "${VALID_ENVS[@]}"; then
  echo "❌ Invalid Environment: '$APP_ENV'. Must be one of: ${VALID_ENVS[*]}"
  exit 1
fi

if ! contains "$APP_PLATFORM" "${VALID_PLATFORMS[@]}"; then
  echo "❌ Invalid Platform: '$APP_PLATFORM'. Must be one of: ${VALID_PLATFORMS[*]}"
  exit 1
fi

# ── Export to environment ─────────────────────────────────────────────────────
export APP_ENV="$APP_ENV"
export EXPO_PUBLIC_ENVIRONMENT="$APP_ENV"
export APP_PLATFORM="$APP_PLATFORM"

echo "🔧 APP_ENV=$APP_ENV"
echo "🔧 EXPO_PUBLIC_ENVIRONMENT=$EXPO_PUBLIC_ENVIRONMENT"
echo "📱 APP_PLATFORM=$APP_PLATFORM"

# ── Load .env file ────────────────────────────────────────────────────────────
ENV_FILE=".env.$APP_ENV"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Environment file not found: $ENV_FILE"
  exit 1
fi

echo "📂 Loading $ENV_FILE..."
set -a
source "$ENV_FILE"
set +a

# ── Build ─────────────────────────────────────────────────────────────────────
echo "🚀 Building for '$APP_ENV' on '$APP_PLATFORM'..."

if [[ "$APP_PLATFORM" == "android" ]]; then
  # bunx expo prebuild --clean --platform android
  bunx expo run:android --no-build-cache --variant debug

elif [[ "$APP_PLATFORM" == "ios" ]]; then
  bunx expo prebuild --clean --platform ios
  if [[ "$APP_ENV" == "development" ]]; then
    bunx expo run:ios --no-build-cache
  else
    bunx expo run:ios --device --no-build-cache
  fi
fi

echo "✅ Build complete."