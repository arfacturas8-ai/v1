#!/bin/bash

# ===================================================
# CRYB MOBILE - PRODUCTION BUILD SCRIPT
# ===================================================
# Builds production versions for iOS and Android
# Uses Expo EAS Build for signed production builds
# ===================================================

set -e  # Exit on any error

echo "🚀 Starting CRYB Mobile Production Build..."
echo "=================================================="

# Set build environment
export NODE_ENV=production
export EXPO_PUBLIC_BUILD_TYPE=production
export EXPO_PUBLIC_ENVIRONMENT=production
export EXPO_PUBLIC_API_BASE_URL=https://api.cryb.ai
export EXPO_PUBLIC_WS_URL=wss://api.cryb.ai

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the mobile directory
if [[ ! -f "app.config.js" ]]; then
    print_error "This script must be run from the mobile app directory!"
    exit 1
fi

# Check for EAS CLI
if ! command -v eas &> /dev/null; then
    print_status "Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Login to EAS (if not already logged in)
print_status "Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    print_warning "Please log in to EAS:"
    eas login
fi

# Clear any previous builds
print_status "Cleaning previous builds..."
expo r -c || true
rm -rf dist/ || true
rm -rf .expo/ || true

# Install dependencies
print_status "Installing dependencies..."
npm install --production=false

# Update app version based on git
if command -v git &> /dev/null; then
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    BUILD_NUMBER=$(date +%s)
    print_status "Build: $GIT_COMMIT ($BUILD_NUMBER)"
fi

# Prebuild for native platforms
print_status "Prebuilding native code..."
expo prebuild --clear

# Build functions
build_ios() {
    print_status "🍎 Building iOS production version..."
    
    eas build --platform ios --profile production --non-interactive || {
        print_error "iOS build failed!"
        return 1
    }
    
    print_success "iOS build queued successfully!"
    
    # Check for local simulator build option
    if [[ "$1" == "--simulator" ]]; then
        print_status "🍎 Building iOS simulator version..."
        eas build --platform ios --profile production-simulator --non-interactive
    fi
}

build_android() {
    print_status "🤖 Building Android production version..."
    
    # Build AAB for Play Store
    eas build --platform android --profile production --non-interactive || {
        print_error "Android build failed!"
        return 1
    }
    
    print_success "Android build queued successfully!"
    
    # Also build APK for direct distribution
    print_status "🤖 Building Android APK for direct distribution..."
    eas build --platform android --profile preview --non-interactive || {
        print_warning "APK build failed, but AAB succeeded"
    }
}

# Parse command line arguments
BUILD_IOS=false
BUILD_ANDROID=false
SIMULATOR_BUILD=false

case "${1:-both}" in
    "ios")
        BUILD_IOS=true
        ;;
    "android")
        BUILD_ANDROID=true
        ;;
    "both")
        BUILD_IOS=true
        BUILD_ANDROID=true
        ;;
    *)
        print_error "Usage: $0 [ios|android|both] [--simulator]"
        exit 1
        ;;
esac

# Check for simulator flag
if [[ "$2" == "--simulator" ]] || [[ "$1" == "--simulator" ]]; then
    SIMULATOR_BUILD=true
fi

# Start builds
echo "=================================================="
print_status "Build Configuration:"
print_status "iOS Build: $BUILD_IOS"
print_status "Android Build: $BUILD_ANDROID"
print_status "Simulator Build: $SIMULATOR_BUILD"
echo "=================================================="

BUILD_ERRORS=()

# Execute builds
if [[ "$BUILD_IOS" == true ]]; then
    if build_ios $(if [[ "$SIMULATOR_BUILD" == true ]]; then echo "--simulator"; fi); then
        print_success "iOS build initiated successfully"
    else
        BUILD_ERRORS+=("iOS build failed")
    fi
fi

if [[ "$BUILD_ANDROID" == true ]]; then
    if build_android; then
        print_success "Android build initiated successfully"
    else
        BUILD_ERRORS+=("Android build failed")
    fi
fi

# Final status
echo "=================================================="
if [[ ${#BUILD_ERRORS[@]} -eq 0 ]]; then
    print_success "🎉 All builds queued successfully!"
    print_status "Monitor your builds at: https://expo.dev/builds"
    print_status ""
    print_status "Next steps:"
    print_status "1. Wait for builds to complete on EAS"
    print_status "2. Download builds from Expo dashboard"
    print_status "3. Test on physical devices"
    print_status "4. Submit to App Store/Play Store when ready"
else
    print_error "❌ Some builds failed:"
    for error in "${BUILD_ERRORS[@]}"; do
        print_error "  - $error"
    done
    exit 1
fi

print_status "📱 CRYB Mobile Production Build Complete!"
echo "=================================================="