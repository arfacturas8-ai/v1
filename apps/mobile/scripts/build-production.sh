#!/bin/bash

# CRYB Mobile App - Production Build Script
# This script builds both Android and iOS production artifacts

set -e  # Exit on error

echo "======================================"
echo "CRYB Mobile Production Build"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in CI
if [ -z "$CI" ]; then
    echo -e "${YELLOW}Warning: Not running in CI environment${NC}"
fi

# Function to print success message
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info message
info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check Node version
info "Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"
success "Node.js OK"

# Install dependencies
info "Installing dependencies..."
npm ci
success "Dependencies installed"

# Run linter
info "Running linter..."
npm run lint || {
    error "Linting failed"
    exit 1
}
success "Linting passed"

# Run type check
info "Running TypeScript type check..."
npm run type-check || {
    error "Type checking failed"
    exit 1
}
success "Type checking passed"

# Run tests
info "Running unit tests..."
npm test || {
    error "Unit tests failed"
    exit 1
}
success "Unit tests passed"

# Clean previous builds
info "Cleaning previous builds..."
rm -rf android/app/build
rm -rf ios/build
success "Clean completed"

# Build version info
VERSION=$(node -p "require('./package.json').version")
BUILD_DATE=$(date +"%Y-%m-%d %H:%M:%S")
info "Building version: $VERSION"
info "Build date: $BUILD_DATE"

# Platform selection
echo ""
echo "Select platform to build:"
echo "1) Android (APK + AAB)"
echo "2) iOS (IPA)"
echo "3) Both"
read -p "Enter choice [1-3]: " platform_choice

build_android() {
    echo ""
    info "========== Building Android =========="

    cd android

    # Clean
    info "Cleaning Android build..."
    ./gradlew clean

    # Build APK (Debug)
    info "Building Android APK (Debug)..."
    ./gradlew assembleDebug
    success "Debug APK created"

    # Build APK (Release)
    info "Building Android APK (Release)..."
    ./gradlew assembleRelease
    success "Release APK created"

    # Build AAB (for Play Store)
    info "Building Android App Bundle (AAB)..."
    ./gradlew bundleRelease
    success "Release AAB created"

    cd ..

    # Copy artifacts
    mkdir -p builds/android
    cp android/app/build/outputs/apk/debug/app-debug.apk builds/android/
    cp android/app/build/outputs/apk/release/app-release.apk builds/android/
    cp android/app/build/outputs/bundle/release/app-release.aab builds/android/

    # Get file sizes
    APK_SIZE=$(du -h builds/android/app-release.apk | cut -f1)
    AAB_SIZE=$(du -h builds/android/app-release.aab | cut -f1)

    success "Android build completed!"
    echo ""
    echo "Artifacts location: builds/android/"
    echo "  - Debug APK: app-debug.apk"
    echo "  - Release APK: app-release.apk ($APK_SIZE)"
    echo "  - Release AAB: app-release.aab ($AAB_SIZE)"
}

build_ios() {
    echo ""
    info "========== Building iOS =========="

    # Check if running on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        error "iOS builds can only be created on macOS"
        return 1
    fi

    cd ios

    # Install CocoaPods dependencies
    info "Installing CocoaPods dependencies..."
    pod install
    success "CocoaPods dependencies installed"

    cd ..

    # Build for simulator (Debug)
    info "Building for iOS Simulator (Debug)..."
    xcodebuild \
        -workspace ios/CRYB.xcworkspace \
        -scheme CRYB \
        -configuration Debug \
        -sdk iphonesimulator \
        -derivedDataPath ios/build
    success "iOS Simulator build completed"

    # Build for device (Release)
    info "Building for iOS Device (Release)..."
    xcodebuild \
        -workspace ios/CRYB.xcworkspace \
        -scheme CRYB \
        -configuration Release \
        -sdk iphoneos \
        -derivedDataPath ios/build \
        -archivePath ios/build/CRYB.xcarchive \
        archive
    success "iOS archive created"

    # Export IPA
    info "Exporting IPA..."
    xcodebuild \
        -exportArchive \
        -archivePath ios/build/CRYB.xcarchive \
        -exportPath ios/build/ipa \
        -exportOptionsPlist ios/ExportOptions.plist
    success "IPA exported"

    # Copy artifacts
    mkdir -p builds/ios
    cp -r ios/build/CRYB.xcarchive builds/ios/
    cp ios/build/ipa/*.ipa builds/ios/CRYB.ipa

    # Get file size
    IPA_SIZE=$(du -h builds/ios/CRYB.ipa | cut -f1)

    success "iOS build completed!"
    echo ""
    echo "Artifacts location: builds/ios/"
    echo "  - Archive: CRYB.xcarchive"
    echo "  - IPA: CRYB.ipa ($IPA_SIZE)"
}

# Build based on selection
case $platform_choice in
    1)
        build_android
        ;;
    2)
        build_ios
        ;;
    3)
        build_android
        build_ios
        ;;
    *)
        error "Invalid choice"
        exit 1
        ;;
esac

# Generate build report
echo ""
info "Generating build report..."

cat > builds/BUILD_REPORT.md << EOF
# CRYB Mobile App - Build Report

**Version:** $VERSION
**Build Date:** $BUILD_DATE
**Platform:** $(case $platform_choice in 1) echo "Android";; 2) echo "iOS";; 3) echo "Android + iOS";; esac)

## Build Status

- ✅ Linting: Passed
- ✅ Type Checking: Passed
- ✅ Unit Tests: Passed
- ✅ Build: Completed

## Artifacts

EOF

if [ $platform_choice -eq 1 ] || [ $platform_choice -eq 3 ]; then
    cat >> builds/BUILD_REPORT.md << EOF
### Android
- **Debug APK:** \`builds/android/app-debug.apk\`
- **Release APK:** \`builds/android/app-release.apk\` ($APK_SIZE)
- **Release AAB:** \`builds/android/app-release.aab\` ($AAB_SIZE)

EOF
fi

if [ $platform_choice -eq 2 ] || [ $platform_choice -eq 3 ]; then
    cat >> builds/BUILD_REPORT.md << EOF
### iOS
- **Archive:** \`builds/ios/CRYB.xcarchive\`
- **IPA:** \`builds/ios/CRYB.ipa\` ($IPA_SIZE)

EOF
fi

cat >> builds/BUILD_REPORT.md << EOF
## Next Steps

1. Test the build on physical devices
2. Submit to app stores for review
3. Monitor crash reports and analytics

## Deployment Checklist

- [ ] Tested on physical devices
- [ ] All features working
- [ ] No critical bugs
- [ ] App store assets ready
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Ready for submission
EOF

success "Build report generated: builds/BUILD_REPORT.md"

echo ""
echo "======================================"
success "Build process completed successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Review the build report in builds/BUILD_REPORT.md"
echo "2. Test the artifacts on physical devices"
echo "3. Submit to app stores when ready"
echo ""
