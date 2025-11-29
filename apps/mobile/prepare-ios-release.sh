#!/bin/bash

# CRYB Mobile App - iOS Release Preparation Script
# This script prepares the iOS app for App Store submission

set -e

echo "🍎 Starting CRYB iOS Release Preparation..."
echo "============================================="

# Define variables
APP_NAME="CRYB"
VERSION="1.0.0"
BUILD_NUMBER=$(date +%Y%m%d%H%M)
BUNDLE_ID="ai.cryb.app"
TEAM_ID="NEEDS_CONFIGURATION"
PROVISIONING_PROFILE="NEEDS_CONFIGURATION"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🔧 Preparing iOS release for $APP_NAME v$VERSION"

# 1. Check iOS development environment
log "🔍 Checking iOS development environment..."

if command -v xcodebuild >/dev/null 2>&1; then
    XCODE_VERSION=$(xcodebuild -version | head -1)
    log "✅ Xcode found: $XCODE_VERSION"
else
    log "⚠️ Xcode not available (required for iOS builds)"
    log "📋 iOS build preparation will create configuration files only"
fi

# 2. Validate iOS configuration
log "📋 Validating iOS configuration..."

# Check Info.plist
if [ -f "ios/CRYB/Info.plist" ]; then
    log "✅ Info.plist found"
    
    # Extract current version
    CURRENT_VERSION=$(/usr/libexec/PlistBuddy -c "Print CFBundleShortVersionString" ios/CRYB/Info.plist 2>/dev/null || echo "1.0.0")
    CURRENT_BUILD=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" ios/CRYB/Info.plist 2>/dev/null || echo "1")
    
    log "📱 Current iOS version: $CURRENT_VERSION ($CURRENT_BUILD)"
else
    log "❌ Info.plist not found"
    exit 1
fi

# 3. Update iOS version and build number
log "📝 Updating iOS version to $VERSION ($BUILD_NUMBER)..."

if command -v /usr/libexec/PlistBuddy >/dev/null 2>&1; then
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" ios/CRYB/Info.plist
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" ios/CRYB/Info.plist
    log "✅ Updated Info.plist with version $VERSION ($BUILD_NUMBER)"
else
    log "⚠️ PlistBuddy not available, manual version update required"
fi

# 4. Generate iOS build configuration
log "⚙️ Generating iOS build configuration..."

cat > ios-build-config.json << EOF
{
  "app_name": "$APP_NAME",
  "bundle_identifier": "$BUNDLE_ID",
  "version": "$VERSION",
  "build_number": "$BUILD_NUMBER",
  "team_id": "$TEAM_ID",
  "provisioning_profile": "$PROVISIONING_PROFILE",
  "deployment_target": "14.0",
  "supported_devices": ["iPhone", "iPad"],
  "required_capabilities": [
    "microphone",
    "camera",
    "push-notifications",
    "background-modes"
  ],
  "background_modes": [
    "audio",
    "voip", 
    "background-processing",
    "background-fetch",
    "fetch"
  ],
  "permissions": {
    "NSCameraUsageDescription": "CRYB needs access to your camera to take photos and videos for sharing in chats and voice calls.",
    "NSMicrophoneUsageDescription": "CRYB needs access to your microphone for voice messages and voice/video calls.",
    "NSPhotoLibraryUsageDescription": "CRYB needs access to your photo library to share images and videos in chats.",
    "NSLocationWhenInUseUsageDescription": "CRYB can optionally use your location to find nearby friends and servers.",
    "NSFaceIDUsageDescription": "CRYB uses Face ID and Touch ID for secure authentication and to protect your account.",
    "NSContactsUsageDescription": "CRYB can optionally access your contacts to help you find friends who are already using the app."
  },
  "app_transport_security": {
    "allows_arbitrary_loads": false,
    "allows_local_networking": true,
    "exception_domains": {
      "api.cryb.ai": {
        "allows_insecure_http_loads": false,
        "minimum_tls_version": "1.2"
      }
    }
  }
}
EOF

log "✅ iOS build configuration saved to ios-build-config.json"

# 5. Generate App Store Connect metadata
log "📱 Generating App Store Connect metadata..."

mkdir -p app-store-connect

cat > app-store-connect/metadata.json << EOF
{
  "app_store_connect": {
    "app_name": "$APP_NAME",
    "bundle_id": "$BUNDLE_ID",
    "sku": "cryb-ios-app",
    "primary_language": "en-US",
    "version": "$VERSION",
    "build": "$BUILD_NUMBER",
    "categories": {
      "primary": "Social Networking",
      "secondary": "Entertainment"
    },
    "age_rating": "12+",
    "description": {
      "short": "The ultimate hybrid platform combining Discord's real-time chat with Reddit's community discussions, enhanced with Web3 features.",
      "full": "CRYB is the next-generation social platform that brings together the best of Discord and Reddit in one revolutionary app.\\n\\n🎮 DISCORD-STYLE FEATURES\\n• Real-time messaging and voice chat\\n• Create and join servers\\n• Voice and video calls with screen sharing\\n• Rich presence and activity status\\n• Slash commands and bots\\n\\n📱 REDDIT-STYLE FEATURES\\n• Community-driven discussions\\n• Upvote/downvote system\\n• Nested comment threads\\n• Awards and karma system\\n• Hot, New, and Top sorting\\n\\n✨ CRYB INNOVATIONS\\n• Web3 wallet integration\\n• NFT profile badges\\n• Crypto tipping system\\n• Token-gated exclusive channels\\n• AI-powered content suggestions\\n• Vibe check community metrics\\n• Cross-platform synchronization\\n\\n🔐 PRIVACY & SECURITY\\n• End-to-end encryption for DMs\\n• Biometric authentication\\n• Secure Web3 wallet connection\\n• Community moderation tools\\n• Content filtering and safety features\\n\\n🚀 WHY CRYB?\\n• No more switching between apps\\n• Unified community experience\\n• Future-proof Web3 features\\n• Clean, intuitive interface\\n• Fast and responsive\\n• Available on all platforms\\n\\nJoin the revolution in online communities. Download CRYB today!"
    },
    "keywords": "discord,reddit,chat,community,social,messaging,voice chat,video call,web3,crypto,nft,forums,discussion,gaming,communication",
    "support_url": "https://cryb.ai/support",
    "marketing_url": "https://cryb.ai",
    "privacy_policy_url": "https://cryb.ai/privacy",
    "screenshot_requirements": {
      "iphone_6_5": {
        "required": 3,
        "maximum": 10,
        "dimensions": "1284x2778 or 2778x1284"
      },
      "iphone_5_5": {
        "required": 3,
        "maximum": 10,
        "dimensions": "1242x2208 or 2208x1242"
      },
      "ipad_12_9": {
        "required": 3,
        "maximum": 10,
        "dimensions": "2048x2732 or 2732x2048"
      }
    },
    "review_information": {
      "first_name": "CRYB",
      "last_name": "Team",
      "phone_number": "+1-555-CRYB-APP",
      "email": "review@cryb.ai",
      "demo_user": {
        "username": "demo@cryb.ai",
        "password": "DemoUser2024!"
      },
      "notes": "Please test the core features: registration, joining communities, messaging, and voice chat. Demo credentials provided for easy testing."
    }
  },
  "technical_requirements": {
    "minimum_ios_version": "14.0",
    "supported_devices": ["iPhone", "iPad", "iPod Touch"],
    "capabilities": [
      "Game Center",
      "In-App Purchase",
      "Push Notifications",
      "Background App Refresh",
      "Camera",
      "Microphone",
      "Location Services"
    ],
    "frameworks": [
      "AVFoundation",
      "CallKit",
      "UserNotifications",
      "LocalAuthentication",
      "CoreLocation",
      "Photos",
      "Contacts"
    ]
  },
  "monetization": {
    "pricing_model": "Free with In-App Purchases",
    "in_app_purchases": [
      {
        "product_id": "cryb_premium_monthly",
        "type": "Auto-Renewable Subscription",
        "name": "CRYB Premium Monthly",
        "price": "$9.99",
        "description": "Unlock all premium features including unlimited servers, HD video calls, and exclusive badges."
      },
      {
        "product_id": "cryb_premium_yearly",
        "type": "Auto-Renewable Subscription", 
        "name": "CRYB Premium Yearly",
        "price": "$99.99",
        "description": "Save 17% with annual billing. All premium features included."
      }
    ]
  }
}
EOF

log "✅ App Store Connect metadata saved to app-store-connect/metadata.json"

# 6. Generate iOS build script
log "🛠️ Generating iOS build script..."

cat > build-ios-release.sh << 'EOF'
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
EOF

chmod +x build-ios-release.sh
log "✅ iOS build script saved to build-ios-release.sh"

# 7. Generate export options plist
log "📄 Generating export options plist..."

cat > export-options.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>destination</key>
    <string>upload</string>
    <key>teamID</key>
    <string>$TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
</dict>
</plist>
EOF

log "✅ Export options plist saved to export-options.plist"

# 8. Generate iOS release checklist
log "📋 Generating iOS release checklist..."

cat > ios-release-checklist.md << EOF
# iOS Release Checklist for CRYB

## Pre-Build Requirements
- [ ] macOS machine with Xcode 15+ installed
- [ ] Valid Apple Developer account ($99/year)
- [ ] App Store Connect app created
- [ ] Certificates and provisioning profiles configured
- [ ] Team ID configured in build settings

## Build Configuration
- [ ] Bundle identifier: \`ai.cryb.app\`
- [ ] Version: \`$VERSION\`
- [ ] Build number: \`$BUILD_NUMBER\`
- [ ] Deployment target: iOS 14.0+
- [ ] Architecture: arm64 (Apple Silicon + older devices)

## Permissions Configured
- [ ] Camera usage description
- [ ] Microphone usage description  
- [ ] Photo library usage description
- [ ] Location usage description
- [ ] Face ID/Touch ID usage description
- [ ] Contacts usage description (optional)

## App Store Assets Required
- [ ] App icon (1024x1024px)
- [ ] Screenshots for iPhone 6.5" (1284x2778px) - minimum 3
- [ ] Screenshots for iPhone 5.5" (1242x2208px) - minimum 3  
- [ ] Screenshots for iPad 12.9" (2048x2732px) - minimum 3
- [ ] App Store description (4000 characters max)
- [ ] Keywords (100 characters max)
- [ ] Support URL
- [ ] Privacy policy URL

## Build Process
1. \`cd /path/to/cryb-mobile\`
2. \`npm install\`
3. \`npx expo prebuild --platform ios --clear\`
4. \`./build-ios-release.sh\`

## App Store Submission
1. Open Xcode or use Transporter app
2. Upload IPA file: \`ios/build/AppStore/CRYB.ipa\`
3. Submit for review via App Store Connect
4. Monitor review status

## Testing Before Submission
- [ ] Test on physical iOS devices
- [ ] Test all core features:
  - [ ] User registration/login
  - [ ] Community browsing
  - [ ] Real-time messaging
  - [ ] Voice/video calls
  - [ ] Push notifications
  - [ ] Biometric authentication
- [ ] Test in-app purchases (if applicable)
- [ ] Test deep linking from notifications

## Post-Submission
- [ ] Monitor App Store Connect for review feedback
- [ ] Prepare for potential rejections and resubmissions
- [ ] Plan marketing and launch strategy
- [ ] Set up analytics and crash reporting monitoring

## Configuration Files Generated
- \`ios-build-config.json\` - Technical build configuration
- \`app-store-connect/metadata.json\` - App Store Connect metadata
- \`build-ios-release.sh\` - Automated build script
- \`export-options.plist\` - Xcode export configuration
- \`ios-release-checklist.md\` - This checklist

## Support Resources
- Apple Developer Documentation: https://developer.apple.com/documentation/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect Help: https://help.apple.com/app-store-connect/
EOF

log "✅ iOS release checklist saved to ios-release-checklist.md"

# 9. Final summary
echo ""
echo "🎉 iOS Release Preparation Complete!"
echo "====================================="
echo ""
echo "📁 Generated Files:"
echo "   • ios-build-config.json - Technical configuration"
echo "   • app-store-connect/metadata.json - App Store metadata"
echo "   • build-ios-release.sh - Build automation script"
echo "   • export-options.plist - Xcode export settings"
echo "   • ios-release-checklist.md - Complete checklist"
echo ""
echo "📱 App Details:"
echo "   • Name: $APP_NAME"
echo "   • Bundle ID: $BUNDLE_ID"
echo "   • Version: $VERSION"
echo "   • Build: $BUILD_NUMBER"
echo ""
echo "⚠️ Next Steps:"
echo "   1. Configure Apple Developer account and certificates"
echo "   2. Update Team ID in ios-build-config.json"
echo "   3. Run build script on macOS with Xcode"
echo "   4. Follow ios-release-checklist.md for submission"
echo ""
echo "🔗 Required Configuration:"
echo "   • Team ID: $TEAM_ID"
echo "   • Provisioning Profile: $PROVISIONING_PROFILE"
echo ""

log "🏁 iOS release preparation completed successfully!"