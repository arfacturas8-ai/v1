#!/bin/bash

echo "🏗️ BUILDING CRYB MOBILE APP APK"
echo "================================"
echo

# Set environment variables
export ANDROID_HOME=/usr/lib/android-sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Check if React Native dependencies are installed
echo "📦 Installing dependencies..."
npm install --silent

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean 2>/dev/null || echo "No previous build to clean"

# Build debug APK
echo "🔨 Building debug APK..."
./gradlew assembleDebug

# Check if build succeeded
if [ -f app/build/outputs/apk/debug/app-debug.apk ]; then
    echo "✅ APK built successfully!"
    echo "📍 Location: $(pwd)/app/build/outputs/apk/debug/app-debug.apk"
    ls -lh app/build/outputs/apk/debug/app-debug.apk
else
    echo "❌ Build failed"
    exit 1
fi

echo
echo "🎉 BUILD COMPLETE!"
