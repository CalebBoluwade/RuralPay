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

# ── Auto-load all found environment files ────────────────────────────────────
load_env_files() {
  local env_files=()
  local loaded_files=()
  
  # Define priority order (higher priority files loaded last to override)
  # Format: "filename:required"
  local file_definitions=(
    ".env:false"           # Base .env file (optional)
    ".env.local:false"     # Local overrides (optional)
    ".env.$APP_ENV:true"   # Environment-specific (required)
    ".env.$APP_ENV.local:false"  # Environment-specific local (optional)
  )
  
  echo "📂 Loading environment files..."
  
  # First pass: collect existing files
  for file_def in "${file_definitions[@]}"; do
    IFS=':' read -r filename required <<< "$file_def"
    if [[ -f "$filename" ]]; then
      env_files+=("$filename")
      loaded_files+=("$filename")
    elif [[ "$required" == "true" ]]; then
      echo "❌ Required environment file not found: $filename"
      exit 1
    fi
  done
  
  # If no files found at all, show error
  if [[ ${#env_files[@]} -eq 0 ]]; then
    echo "❌ No environment files found. Expected at least one of: .env, .env.$APP_ENV"
    exit 1
  fi
  
  # Load files in order (later files override earlier ones)
  for env_file in "${env_files[@]}"; do
    if [[ -f "$env_file" ]]; then
      echo "   ✓ Loading $env_file"
      
      # Parse and export each line
      while IFS= read -r line || [[ -n "$line" ]]; do
        # Skip empty lines
        [[ -z "$line" ]] && continue
        
        # Skip lines that start with # (comments)
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Skip lines that don't contain an equals sign
        [[ "$line" != *"="* ]] && continue
        
        # Remove leading/trailing whitespace
        line="$(echo "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
        
        # Split into key and value
        key="${line%%=*}"
        value="${line#*=}"
        
        # Remove quotes if present (both single and double)
        if [[ "$value" =~ ^\'.*\'$ ]] || [[ "$value" =~ ^\".*\"$ ]]; then
          value="${value:1:-1}"
        fi
        
        # Handle inline comments (only if not within quotes)
        # This is complex, so we'll skip for simplicity - most .env files don't have inline comments
        
        # Export the variable
        export "$key=$value"
        
      done < "$env_file"
    fi
  done
  
  # Show summary
  echo "✅ Loaded ${#loaded_files[@]} environment file(s): ${loaded_files[*]}"
}

# Call the auto-load function
load_env_files

# Optional: Display loaded environment variables (for debugging, filter sensitive data)
if [[ "${DEBUG_ENV_LOAD:-false}" == "true" ]]; then
  echo ""
  echo "📋 Loaded environment variables (EXPO_PUBLIC_* and APP_*):"
  env | grep -E "^(EXPO_PUBLIC_|APP_)" | sort || true
  echo ""
fi

# ── Build ─────────────────────────────────────────────────────────────────────
echo "🚀 Building for '$APP_ENV' on '$APP_PLATFORM'..."

if [[ "$APP_PLATFORM" == "android" ]]; then
  bunx expo prebuild --clean --platform android
  # bunx expo run:android --no-build-cache --variant Debug
  bunx expo run:android --no-build-cache --variant Release

  # Clean up build artifacts to save space
  echo "🧹 Cleaning up Android build artifacts..."
  rm -rf android/.gradle
  rm -rf ~/.gradle/caches
  rm -rf ~/.gradle/daemon
  rm -rf ~/.gradle/buildOutputCleanup
  rm -rf android/build
  rm -rf android/app/build
  rm -rf .expo

elif [[ "$APP_PLATFORM" == "ios" ]]; then
  # Wait for physical device to be ready
  echo "⏳ Waiting for iOS device to be available..."
  for i in {1..12}; do
    DEVICE_STATE=$(xcrun xctrace list devices 2>/dev/null | grep -v "Simulator" | grep -v "^==" | grep -v "^$" | head -5)
    if [[ -n "$DEVICE_STATE" ]]; then
      echo "📱 Device detected, proceeding..."
      break
    fi
    echo "   Attempt $i/12 — device not ready, waiting 5s..."
    sleep 5
  done

  # bunx expo prebuild --clean --platform ios
  bunx expo run:ios --device --no-build-cache
fi

echo "✅ Build complete."