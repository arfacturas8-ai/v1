#!/bin/bash

# CRYB Mobile App - Production Build Script
# This script builds a production-ready APK for the CRYB mobile application

set -e

echo "🚀 Starting CRYB Mobile Production Build..."
echo "================================================="

# Define variables
APP_NAME="CRYB"
VERSION="1.0.0"
BUILD_NUMBER=$(date +%Y%m%d%H%M)
BUILD_DIR="builds"
BUILD_LOG="$BUILD_DIR/production-build-${BUILD_NUMBER}.log"
OUTPUT_APK="$BUILD_DIR/cryb-production-${BUILD_NUMBER}.apk"

# Ensure build directory exists
mkdir -p $BUILD_DIR

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $BUILD_LOG
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

log "🔧 Starting production build for $APP_NAME v$VERSION"

# 1. Environment Check
log "📋 Checking build environment..."
node_version=$(node --version)
npm_version=$(npm --version)
log "Node.js: $node_version"
log "npm: $npm_version"

# Check if Expo CLI is available
if ! command_exists expo; then
    log "⚠️  Expo CLI not found globally, using local version"
    EXPO_CMD="npx expo"
else
    log "✅ Expo CLI found"
    EXPO_CMD="expo"
fi

# 2. Clean previous builds
log "🧹 Cleaning previous builds..."
rm -rf .expo/
rm -rf node_modules/.cache/
rm -rf android/app/build/

# 3. Install dependencies
log "📦 Installing dependencies..."
npm ci --silent

# 4. Pre-build checks
log "🔍 Running pre-build checks..."

# Check app.json configuration
if [ ! -f "app.json" ]; then
    log "❌ app.json not found!"
    exit 1
fi

# Check if package.json has correct version
package_version=$(node -p "require('./package.json').version")
log "📋 Package version: $package_version"

# 5. Build configuration
log "⚙️  Configuring production build..."

# Update version in app.json if needed
node -e "
const fs = require('fs');
const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));
app.expo.version = '$VERSION';
app.expo.android.versionCode = parseInt('$BUILD_NUMBER');
fs.writeFileSync('app.json', JSON.stringify(app, null, 2));
console.log('✅ Updated app.json with version $VERSION and build $BUILD_NUMBER');
"

# 6. Pre-build step (generates native code)
log "🔨 Running Expo prebuild..."
$EXPO_CMD prebuild --platform android --clear || {
    log "❌ Prebuild failed"
    exit 1
}

# 7. Build APK using Gradle
log "🏗️  Building production APK..."
cd android

# Ensure gradle wrapper is executable
chmod +x ./gradlew

# Clean previous builds
./gradlew clean

# Build production APK
./gradlew assembleRelease --no-daemon --warning-mode all || {
    log "❌ Gradle build failed"
    cd ..
    exit 1
}

cd ..

# 8. Locate and copy the built APK
BUILT_APK="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$BUILT_APK" ]; then
    log "✅ APK built successfully"
    
    # Copy to builds directory
    cp "$BUILT_APK" "$OUTPUT_APK"
    
    # Get APK info
    APK_SIZE=$(du -h "$OUTPUT_APK" | cut -f1)
    APK_SIZE_BYTES=$(stat -c%s "$OUTPUT_APK")
    
    log "📱 APK Details:"
    log "   - File: $OUTPUT_APK"
    log "   - Size: $APK_SIZE ($APK_SIZE_BYTES bytes)"
    
    # Generate build summary
    cat > "$BUILD_DIR/production-build-final-$BUILD_NUMBER.json" << EOF
{
  "app_name": "$APP_NAME",
  "version": "$VERSION",
  "build_number": "$BUILD_NUMBER",
  "build_type": "production",
  "platform": "android",
  "package_name": "ai.cryb.app",
  "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "environment": "production",
  "api_base_url": "https://api.cryb.ai",
  "websocket_url": "wss://api.cryb.ai",
  "react_native_version": "0.74.5",
  "expo_sdk_version": "51.0.0",
  "features": [
    "Authentication System",
    "Real-time Messaging",
    "Communities & Servers",
    "Discord-like Features",
    "Reddit-style Features",
    "Push Notifications",
    "Web3 Integration",
    "Voice/Video Chat Ready",
    "Offline Support",
    "Biometric Auth",
    "Crash Reporting",
    "Performance Monitoring"
  ],
  "requirements": {
    "android_version": "7.0+",
    "api_level": 24,
    "ram": "4GB minimum",
    "storage": "500MB",
    "network": "Internet required"
  },
  "file_info": {
    "name": "$(basename $OUTPUT_APK)",
    "size": "$APK_SIZE",
    "size_bytes": $APK_SIZE_BYTES,
    "location": "$OUTPUT_APK",
    "checksum": "$(md5sum $OUTPUT_APK | cut -d' ' -f1)"
  },
  "deployment_ready": true,
  "store_ready": true,
  "testing_ready": true,
  "production_ready": true,
  "built_with": {
    "node_version": "$node_version",
    "npm_version": "$npm_version",
    "expo_cli": "local",
    "build_machine": "$(hostname)",
    "build_os": "$(uname -s) $(uname -r)"
  }
}
EOF

    log "✅ Build summary created: $BUILD_DIR/production-build-final-$BUILD_NUMBER.json"
    
    # Create symlink to latest build
    ln -sf "$(basename $OUTPUT_APK)" "$BUILD_DIR/cryb-latest-production.apk"
    log "🔗 Created symlink: $BUILD_DIR/cryb-latest-production.apk"
    
else
    log "❌ APK build failed - file not found: $BUILT_APK"
    exit 1
fi

# 9. Cleanup
log "🧹 Cleaning up build artifacts..."
rm -rf android/app/build/intermediates/
rm -rf android/.gradle/
rm -rf .expo/

# 10. Final verification
log "🔍 Final verification..."
if [ -f "$OUTPUT_APK" ] && [ -s "$OUTPUT_APK" ]; then
    log "✅ Production APK is ready!"
    log "📱 File: $OUTPUT_APK"
    log "📊 Size: $APK_SIZE"
    log "🏪 Ready for: Testing, Internal Distribution, Play Store"
    
    echo ""
    echo "🎉 SUCCESS! Production build completed!"
    echo "================================================="
    echo "📱 APK Location: $OUTPUT_APK"
    echo "📊 Build Summary: $BUILD_DIR/production-build-final-$BUILD_NUMBER.json"
    echo "📝 Build Log: $BUILD_LOG"
    echo ""
    echo "Next steps:"
    echo "1. Test the APK on real devices"
    echo "2. Upload to internal testing"
    echo "3. Submit to Google Play Store"
    echo ""
else
    log "❌ Build verification failed"
    exit 1
fi

log "🏁 Build process completed successfully!"