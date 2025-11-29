#!/bin/bash

# iOS Release Build Script
# Run this script on a macOS machine with Xcode installed

set -e

echo "🍎 Building CRYB for iOS Release..."

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script must run on macOS with Xcode installed"
    exit 1
fi

# Check Xcode installation
if ! command -v xcodebuild >/dev/null 2>&1; then
    echo "❌ Xcode not found. Please install Xcode from the App Store"
    exit 1
fi

# Build for iOS device
echo "📱 Building for iOS device..."
cd ios

# Clean previous builds
xcodebuild clean -workspace CRYB.xcworkspace -scheme CRYB

# Build archive
xcodebuild archive \
    -workspace CRYB.xcworkspace \
    -scheme CRYB \
    -configuration Release \
    -destination generic/platform=iOS \
    -archivePath ./build/CRYB.xcarchive

# Export IPA for App Store
xcodebuild -exportArchive \
    -archivePath ./build/CRYB.xcarchive \
    -exportPath ./build/AppStore \
    -exportOptionsPlist ../export-options.plist

echo "✅ iOS build completed!"
echo "📱 IPA file: ios/build/AppStore/CRYB.ipa"
echo "🏪 Ready for App Store upload via Xcode or Transporter"

cd ..
