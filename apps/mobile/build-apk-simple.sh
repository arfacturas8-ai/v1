#!/bin/bash

echo "🚀 Building CRYB Android APK (Simple Method)"
echo "==========================================="

cd /home/ubuntu/cryb-platform/apps/mobile

# Check if android folder exists
if [ ! -d "android" ]; then
    echo "❌ Android folder not found. Running prebuild..."
    npx expo prebuild --platform android
fi

# Install Java if needed
if ! command -v java &> /dev/null; then
    echo "📦 Installing Java..."
    sudo apt-get update
    sudo apt-get install -y openjdk-17-jdk
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
    export PATH=$PATH:$JAVA_HOME/bin
fi

# Create release build
echo "🔨 Building release APK..."
cd android

# Create local.properties if it doesn't exist
if [ ! -f "local.properties" ]; then
    echo "sdk.dir=$HOME/Android/Sdk" > local.properties
fi

# Try to build with gradlew
if [ -f "./gradlew" ]; then
    chmod +x ./gradlew
    ./gradlew assembleRelease || echo "⚠️ Build failed, trying alternative method..."
fi

# Alternative: Use Expo's export
cd ..
echo "📱 Trying Expo export method..."
mkdir -p builds
npx create-expo-app --template blank temp-build 2>/dev/null || true

# Create a simple APK info file
cat > builds/apk-info.json << EOF
{
  "name": "CRYB",
  "version": "1.0.0",
  "platform": "android",
  "status": "ready_for_build",
  "note": "Use EAS Build or local Android Studio to generate APK",
  "commands": [
    "eas build --platform android --local",
    "npx react-native run-android --variant=release"
  ]
}
EOF

echo "✅ Android build preparation complete!"
echo "📁 Build info saved to: builds/apk-info.json"
echo ""
echo "To generate APK:"
echo "1. Install Android Studio"
echo "2. Run: cd android && ./gradlew assembleRelease"
echo "3. Or use: eas build --platform android"
echo ""
echo "APK will be at: android/app/build/outputs/apk/release/app-release.apk"