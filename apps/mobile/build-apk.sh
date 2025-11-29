#!/bin/bash

echo "🔨 Building Cryb Mobile APK..."

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf android/app/build
rm -rf android/build

# Create assets directory if it doesn't exist
mkdir -p android/app/src/main/assets

# Bundle JavaScript
echo "Bundling JavaScript..."
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/

# Navigate to Android directory
cd android

# Build APK
echo "Building APK..."
./gradlew assembleDebug --no-daemon

# Check if APK was created
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo "✅ APK built successfully!"
  echo "Location: $(pwd)/$APK_PATH"
  
  # Copy to builds directory
  mkdir -p ../builds
  cp "$APK_PATH" "../builds/cryb-app-$(date +%Y%m%d-%H%M%S).apk"
  echo "✅ APK copied to builds directory"
else
  echo "❌ APK build failed"
  exit 1
fi