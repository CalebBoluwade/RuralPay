#!/bin/bash
set -euo pipefail

# ── Arguments with fallback to environment variables ─────────────────────────
APP_ENV="${1:-${APP_ENV:-development}}"
APP_PLATFORM="${2:-${APP_PLATFORM:-android}}"

# ── Validate inputs ───────────────────────────────────────────────────────────
VALID_ENVS=("development" "preview" "production")
VALID_PLATFORMS=("android" "ios" "all")

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


NODE_ENV=production eas build --profile "$APP_ENV" --platform "$APP_PLATFORM" --non-interactive --message "Automated build for $APP_ENV - $APP_PLATFORM"