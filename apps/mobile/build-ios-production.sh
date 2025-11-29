#!/bin/bash

# iOS Production Build Script for CRYB App
# This script builds the iOS app for App Store submission

set -e

echo "🍎 Starting iOS Production Build for CRYB App..."
echo "================================================"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the mobile app directory."
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ Error: EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Login check
echo "🔐 Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to EAS. Please login:"
    eas login
fi

# Clean build artifacts
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf .expo/

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type check
echo "🔍 Running type check..."
npm run type-check

# Lint check
echo "🔍 Running linter..."
npm run lint

# Set production environment variables
export NODE_ENV=production
export EXPO_PUBLIC_ENVIRONMENT=production
export EXPO_PUBLIC_API_BASE_URL=http://api.cryb.ai:4000
export EXPO_PUBLIC_WS_URL=ws://api.cryb.ai:4000
export EXPO_PUBLIC_BUILD_TYPE=production

echo "🔨 Building iOS app for production..."
echo "Bundle Identifier: app.cryb.ios"
echo "API URL: $EXPO_PUBLIC_API_BASE_URL"
echo "WebSocket URL: $EXPO_PUBLIC_WS_URL"

# Start the build
eas build --platform ios --profile production --clear-cache

echo ""
echo "✅ iOS production build started successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Monitor the build progress in the EAS dashboard"
echo "2. Once complete, download the IPA file"
echo "3. Upload to App Store Connect using:"
echo "   eas submit --platform ios --profile production"
echo ""
echo "🔗 Build dashboard: https://expo.dev/accounts/[your-account]/projects/cryb/builds"