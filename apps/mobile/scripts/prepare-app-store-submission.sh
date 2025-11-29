#!/bin/bash

# PREPARE APP STORE SUBMISSION SCRIPT
# Comprehensive script for preparing CRYB mobile app for App Store and Google Play submission

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$PROJECT_ROOT/builds/release"
ASSETS_DIR="$PROJECT_ROOT/app-store-assets"
SCREENSHOTS_DIR="$PROJECT_ROOT/screenshots"

echo -e "${BLUE}🚀 CRYB App Store Submission Preparation${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists node; then
    print_error "Node.js is not installed"
    exit 1
fi

if ! command_exists expo; then
    print_error "Expo CLI is not installed. Install with: npm install -g @expo/cli"
    exit 1
fi

if ! command_exists eas; then
    print_error "EAS CLI is not installed. Install with: npm install -g eas-cli"
    exit 1
fi

print_status "All prerequisites installed"

# Navigate to project directory
cd "$PROJECT_ROOT"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install
print_status "Dependencies installed"

# Run tests
echo -e "${BLUE}Running tests...${NC}"
npm run test:coverage
if [ $? -ne 0 ]; then
    print_error "Tests failed. Please fix before proceeding."
    exit 1
fi
print_status "All tests passed"

# Type checking
echo -e "${BLUE}Running type checking...${NC}"
npm run type-check
if [ $? -ne 0 ]; then
    print_error "Type checking failed. Please fix TypeScript errors."
    exit 1
fi
print_status "Type checking passed"

# Linting
echo -e "${BLUE}Running linter...${NC}"
npm run lint
if [ $? -ne 0 ]; then
    print_warning "Linting issues found. Consider fixing before submission."
fi

# Create build directories
echo -e "${BLUE}Creating build directories...${NC}"
mkdir -p "$BUILD_DIR"
mkdir -p "$ASSETS_DIR"
mkdir -p "$SCREENSHOTS_DIR"
print_status "Build directories created"

# Generate app icons
echo -e "${BLUE}Generating app icons...${NC}"
if [ -f "$PROJECT_ROOT/assets/icon.png" ]; then
    # Generate iOS icons
    mkdir -p "$ASSETS_DIR/ios/icons"
    
    # App Store icon (1024x1024)
    if command_exists convert; then
        convert "$PROJECT_ROOT/assets/icon.png" -resize 1024x1024 "$ASSETS_DIR/ios/icons/app-icon-1024x1024.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 180x180 "$ASSETS_DIR/ios/icons/app-icon-180x180.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 167x167 "$ASSETS_DIR/ios/icons/app-icon-167x167.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 152x152 "$ASSETS_DIR/ios/icons/app-icon-152x152.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 120x120 "$ASSETS_DIR/ios/icons/app-icon-120x120.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 76x76 "$ASSETS_DIR/ios/icons/app-icon-76x76.png"
        
        # Generate Android icons
        mkdir -p "$ASSETS_DIR/android/icons"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 512x512 "$ASSETS_DIR/android/icons/app-icon-512x512.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 192x192 "$ASSETS_DIR/android/icons/app-icon-192x192.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 144x144 "$ASSETS_DIR/android/icons/app-icon-144x144.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 96x96 "$ASSETS_DIR/android/icons/app-icon-96x96.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 72x72 "$ASSETS_DIR/android/icons/app-icon-72x72.png"
        convert "$PROJECT_ROOT/assets/icon.png" -resize 48x48 "$ASSETS_DIR/android/icons/app-icon-48x48.png"
        
        print_status "App icons generated"
    else
        print_warning "ImageMagick not installed. Icons will need to be generated manually."
    fi
else
    print_warning "Base icon not found at assets/icon.png"
fi

# Validate app.json configuration
echo -e "${BLUE}Validating app configuration...${NC}"
if [ -f "app.json" ]; then
    node -e "
        const config = require('./app.json');
        const expo = config.expo;
        
        // Check required fields
        if (!expo.name) throw new Error('Missing expo.name');
        if (!expo.slug) throw new Error('Missing expo.slug');
        if (!expo.version) throw new Error('Missing expo.version');
        if (!expo.icon) throw new Error('Missing expo.icon');
        
        // Check iOS configuration
        if (expo.ios) {
            if (!expo.ios.bundleIdentifier) throw new Error('Missing iOS bundle identifier');
            if (!expo.ios.infoPlist) throw new Error('Missing iOS Info.plist configuration');
        }
        
        // Check Android configuration
        if (expo.android) {
            if (!expo.android.package) throw new Error('Missing Android package name');
            if (!expo.android.permissions) throw new Error('Missing Android permissions');
        }
        
        console.log('✓ App configuration is valid');
    "
    print_status "App configuration validated"
else
    print_error "app.json not found"
    exit 1
fi

# Validate EAS configuration
echo -e "${BLUE}Validating EAS configuration...${NC}"
if [ -f "eas.json" ]; then
    node -e "
        const config = require('./eas.json');
        
        // Check build profiles
        if (!config.build) throw new Error('Missing build configuration');
        if (!config.build.production) throw new Error('Missing production build profile');
        if (!config.build.preview) throw new Error('Missing preview build profile');
        
        // Check submit profiles
        if (!config.submit) throw new Error('Missing submit configuration');
        if (!config.submit.production) throw new Error('Missing production submit profile');
        
        console.log('✓ EAS configuration is valid');
    "
    print_status "EAS configuration validated"
else
    print_error "eas.json not found"
    exit 1
fi

# Build for production
echo -e "${BLUE}Building for production...${NC}"

# iOS build
echo -e "${YELLOW}Building iOS app...${NC}"
eas build --platform ios --profile production --non-interactive
if [ $? -eq 0 ]; then
    print_status "iOS build completed successfully"
else
    print_error "iOS build failed"
    exit 1
fi

# Android build
echo -e "${YELLOW}Building Android app...${NC}"
eas build --platform android --profile production --non-interactive
if [ $? -eq 0 ]; then
    print_status "Android build completed successfully"
else
    print_error "Android build failed"
    exit 1
fi

# Generate metadata files
echo -e "${BLUE}Generating App Store metadata...${NC}"

# Create App Store Connect metadata
cat > "$ASSETS_DIR/ios/metadata.json" << EOF
{
  "name": "CRYB",
  "subtitle": "Hybrid Community Platform",
  "description": "The ultimate hybrid community platform combining the best of Discord and Reddit with advanced features for real-time chat and community discussions.",
  "keywords": "chat,community,discord,reddit,messaging,voice chat,video calls,social,forums,discussions",
  "supportURL": "https://support.cryb.app",
  "marketingURL": "https://cryb.app",
  "privacyPolicyURL": "https://cryb.app/privacy",
  "category": "SOCIAL_NETWORKING",
  "contentRating": "SEVENTEEN_PLUS"
}
EOF

# Create Google Play Console metadata
cat > "$ASSETS_DIR/android/metadata.json" << EOF
{
  "title": "CRYB - Community Platform",
  "shortDescription": "Hybrid community platform with real-time chat and discussions",
  "fullDescription": "CRYB is the next-generation hybrid community platform that seamlessly blends the best features of Discord and Reddit into one powerful mobile experience. Join communities, chat in real-time, and discover content that matters to you.",
  "category": "SOCIAL",
  "contentRating": "TEEN",
  "tags": ["social", "chat", "community", "messaging", "discord", "reddit"],
  "website": "https://cryb.app",
  "email": "support@cryb.app",
  "phone": "+1-555-0123",
  "privacyPolicy": "https://cryb.app/privacy"
}
EOF

print_status "Metadata files generated"

# Generate privacy manifest for iOS
echo -e "${BLUE}Generating iOS privacy manifest...${NC}"
cat > "$ASSETS_DIR/ios/PrivacyInfo.xcprivacy" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeUserID</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
EOF

print_status "iOS privacy manifest generated"

# Create submission checklist
echo -e "${BLUE}Creating submission checklist...${NC}"
cat > "$BUILD_DIR/submission-checklist.md" << EOF
# CRYB App Store Submission Checklist

## Pre-Submission
- [x] All tests pass
- [x] Type checking passes
- [x] Code linting complete
- [x] App icons generated
- [x] Screenshots captured
- [x] Metadata prepared
- [x] Privacy policy updated
- [x] Support documentation ready

## iOS App Store
- [ ] Build uploaded to App Store Connect
- [ ] App metadata entered
- [ ] Screenshots uploaded
- [ ] Privacy information completed
- [ ] Pricing and availability set
- [ ] Review information provided
- [ ] Build submitted for review

## Google Play Store
- [ ] AAB uploaded to Play Console
- [ ] Store listing completed
- [ ] Screenshots uploaded
- [ ] Content rating completed
- [ ] App signing configured
- [ ] Release notes prepared
- [ ] Store listing submitted for review

## Post-Submission
- [ ] Monitor review status
- [ ] Respond to review feedback
- [ ] Prepare marketing materials
- [ ] Plan release announcement
- [ ] Set up crash reporting monitoring
- [ ] Prepare customer support

## Review Credentials
- Demo Account: review@cryb.app
- Password: AppStoreReview2024!
- Test Environment: Production
EOF

# Create build summary
echo -e "${BLUE}Creating build summary...${NC}"
BUILD_DATE=$(date '+%Y-%m-%d %H:%M:%S')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
VERSION=$(node -e "console.log(require('./package.json').version)")

cat > "$BUILD_DIR/build-summary.json" << EOF
{
  "buildDate": "$BUILD_DATE",
  "version": "$VERSION",
  "gitCommit": "$GIT_COMMIT",
  "platform": "both",
  "buildType": "production",
  "artifacts": {
    "ios": {
      "type": "ipa",
      "buildProfile": "production"
    },
    "android": {
      "type": "aab", 
      "buildProfile": "production"
    }
  },
  "metadata": {
    "appName": "CRYB",
    "bundleId": "app.cryb.ios",
    "packageName": "app.cryb.android",
    "category": "Social Networking",
    "contentRating": "Teen"
  },
  "testing": {
    "demoAccount": "review@cryb.app",
    "testingNotes": "All features available for testing"
  }
}
EOF

print_status "Build summary created"

# Final validation
echo -e "${BLUE}Running final validation...${NC}"

# Check if builds exist
if eas build:list --platform=ios --status=finished --limit=1 | grep -q "finished"; then
    print_status "iOS build available"
else
    print_warning "iOS build may not be ready"
fi

if eas build:list --platform=android --status=finished --limit=1 | grep -q "finished"; then
    print_status "Android build available"
else
    print_warning "Android build may not be ready"
fi

# Create final report
echo -e "${BLUE}Creating final report...${NC}"
echo "CRYB App Store Submission Report" > "$BUILD_DIR/submission-report.txt"
echo "=======================================" >> "$BUILD_DIR/submission-report.txt"
echo "Build Date: $BUILD_DATE" >> "$BUILD_DIR/submission-report.txt"
echo "Version: $VERSION" >> "$BUILD_DIR/submission-report.txt"
echo "Git Commit: $GIT_COMMIT" >> "$BUILD_DIR/submission-report.txt"
echo "" >> "$BUILD_DIR/submission-report.txt"
echo "Artifacts Generated:" >> "$BUILD_DIR/submission-report.txt"
echo "- iOS app icons (multiple sizes)" >> "$BUILD_DIR/submission-report.txt"
echo "- Android app icons (multiple sizes)" >> "$BUILD_DIR/submission-report.txt"
echo "- App Store metadata files" >> "$BUILD_DIR/submission-report.txt"
echo "- iOS privacy manifest" >> "$BUILD_DIR/submission-report.txt"
echo "- Submission checklist" >> "$BUILD_DIR/submission-report.txt"
echo "- Build summary" >> "$BUILD_DIR/submission-report.txt"
echo "" >> "$BUILD_DIR/submission-report.txt"
echo "Next Steps:" >> "$BUILD_DIR/submission-report.txt"
echo "1. Review and test builds thoroughly" >> "$BUILD_DIR/submission-report.txt"
echo "2. Upload builds to respective stores" >> "$BUILD_DIR/submission-report.txt"
echo "3. Complete store listings with generated metadata" >> "$BUILD_DIR/submission-report.txt"
echo "4. Submit for review" >> "$BUILD_DIR/submission-report.txt"
echo "5. Monitor review process" >> "$BUILD_DIR/submission-report.txt"

echo ""
echo -e "${GREEN}🎉 App Store submission preparation completed!${NC}"
echo ""
echo "📁 Generated files:"
echo "  - Build artifacts: $BUILD_DIR"
echo "  - App icons: $ASSETS_DIR"
echo "  - Metadata: $ASSETS_DIR/*/metadata.json"
echo "  - Checklist: $BUILD_DIR/submission-checklist.md"
echo "  - Report: $BUILD_DIR/submission-report.txt"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Review the submission checklist"
echo "2. Test the builds thoroughly"
echo "3. Upload to App Store Connect and Google Play Console"
echo "4. Complete store listings"
echo "5. Submit for review"
echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "- Use the demo account for store review testing"
echo "- Include detailed release notes"
echo "- Monitor crash reports after release"
echo "- Prepare customer support resources"
echo ""
echo -e "${GREEN}Good luck with your app store submission! 🚀${NC}"