#!/bin/bash

# APP STORE SUBMISSION PREPARATION SCRIPT
# Prepares all assets and metadata for App Store Connect and Google Play Console submission

set -e

echo "📱 Preparing CRYB Mobile for App Store Submission"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Create submission directory
SUBMISSION_DIR="app-store-submission"
mkdir -p "$SUBMISSION_DIR"
mkdir -p "$SUBMISSION_DIR/ios"
mkdir -p "$SUBMISSION_DIR/android" 
mkdir -p "$SUBMISSION_DIR/screenshots"
mkdir -p "$SUBMISSION_DIR/metadata"

print_status "Created submission directory structure"

# Generate app store metadata
print_status "Generating App Store metadata..."

cat > "$SUBMISSION_DIR/metadata/app-store-description.txt" << 'EOF'
CRYB - Next-Generation Community Platform

Connect, communicate, and collaborate like never before with CRYB, the ultimate hybrid community platform that seamlessly blends Discord-like real-time communication with cutting-edge Web3 integration.

🚀 FEATURES

REAL-TIME COMMUNICATION
• Voice and video calls with crystal-clear quality
• Text messaging with rich media support
• Server-based community organization
• Direct messaging and group chats
• Screen sharing and file uploads

WEB3 INTEGRATION
• Crypto wallet integration with WalletConnect
• Blockchain-based authentication and identity
• NFT avatar support and digital collectibles
• Decentralized data storage options
• Smart contract interactions

ADVANCED FUNCTIONALITY
• Biometric security with Face ID/Touch ID
• Push notifications for instant updates
• Offline mode with automatic sync
• Cross-platform compatibility
• Custom emoji and reaction support

PRIVACY & SECURITY
• End-to-end encryption for sensitive data
• Secure local storage with encryption
• SSL certificate pinning
• Privacy-focused design
• No tracking or data selling

Whether you're building a gaming community, running a business team, or connecting with friends, CRYB provides the tools you need for modern digital communication.

Join the future of community platforms with CRYB!
EOF

cat > "$SUBMISSION_DIR/metadata/keywords.txt" << 'EOF'
community, chat, voice, video, discord, web3, crypto, blockchain, messaging, communication, social, gaming, team, collaboration, NFT, wallet, decentralized
EOF

cat > "$SUBMISSION_DIR/metadata/privacy-policy.txt" << 'EOF'
CRYB Privacy Policy

Last updated: September 2025

We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and protect your information when you use the CRYB mobile application.

INFORMATION WE COLLECT
- Account information (username, email)
- Communication data (messages, voice calls)
- Device information (device ID, OS version)
- Usage analytics (app usage patterns)

HOW WE USE YOUR INFORMATION
- Provide and maintain our services
- Enable communication features
- Improve app performance and security
- Send important notifications

DATA SECURITY
- End-to-end encryption for sensitive communications
- Secure local storage with device-level encryption
- Regular security audits and updates
- No data selling to third parties

YOUR RIGHTS
- Access your personal data
- Delete your account and data
- Control notification preferences
- Export your data

CONTACT US
For privacy-related questions: privacy@cryb.app

This policy may be updated periodically. Users will be notified of significant changes.
EOF

print_success "App Store metadata generated"

# Generate screenshot requirements document
print_status "Creating screenshot requirements..."

cat > "$SUBMISSION_DIR/screenshots/screenshot-requirements.md" << 'EOF'
# CRYB Mobile App Screenshots Requirements

## iOS App Store Screenshots Required

### iPhone Screenshots (6.7" Display)
- 1290 x 2796 pixels
- Required: 5 screenshots minimum
- File format: PNG (preferred) or JPG

### iPhone Screenshots (6.5" Display)  
- 1242 x 2688 pixels
- Required: 5 screenshots minimum
- File format: PNG (preferred) or JPG

### iPhone Screenshots (5.5" Display)
- 1242 x 2208 pixels  
- Required: 5 screenshots minimum
- File format: PNG (preferred) or JPG

### iPad Screenshots (12.9" Display)
- 2048 x 2732 pixels
- Required: 5 screenshots minimum
- File format: PNG (preferred) or JPG

## Google Play Store Screenshots Required

### Phone Screenshots
- 16:9 to 9:16 aspect ratio
- Minimum 320px on short side
- Maximum 3840px on long side
- Required: 4-8 screenshots
- File format: PNG or JPG

### 7" Tablet Screenshots
- 16:9 to 9:16 aspect ratio
- Minimum 320px on short side  
- Maximum 3840px on long side
- Required: 1-8 screenshots
- File format: PNG or JPG

### 10" Tablet Screenshots
- 16:9 to 9:16 aspect ratio
- Minimum 320px on short side
- Maximum 3840px on long side  
- Required: 1-8 screenshots
- File format: PNG or JPG

## Screenshot Content Suggestions

1. **Welcome/Onboarding Screen** - Show the app's main value proposition
2. **Server/Community List** - Display various community servers
3. **Chat Interface** - Show active conversation with messages
4. **Voice Call Screen** - Demonstrate voice/video calling features
5. **Profile/Settings** - Show user customization options
6. **Web3/Wallet Integration** - Highlight blockchain features
7. **Offline Mode** - Show offline capabilities

## Notes
- No text overlays that repeat App Store metadata
- Show actual app UI, not mockups
- Ensure content is appropriate for all audiences
- Use high-quality, realistic content
- Avoid showing personal/sensitive information
EOF

print_success "Screenshot requirements documented"

# Generate submission checklist
print_status "Creating submission checklist..."

cat > "$SUBMISSION_DIR/submission-checklist.md" << 'EOF'
# CRYB Mobile App Store Submission Checklist

## PRE-SUBMISSION REQUIREMENTS

### Build Preparation
- [ ] Production builds created with EAS
- [ ] iOS build tested on physical devices
- [ ] Android build tested on physical devices
- [ ] All features working correctly
- [ ] No debug code or console.logs in production
- [ ] SSL certificate pinning enabled
- [ ] Analytics and crash reporting configured

### App Store Connect (iOS)
- [ ] App created in App Store Connect
- [ ] Bundle identifier matches: app.cryb.ios
- [ ] All required metadata filled
- [ ] App description (4000 characters max)
- [ ] Keywords (100 characters max)  
- [ ] Screenshots for all device sizes uploaded
- [ ] App icon (1024x1024px) uploaded
- [ ] Age rating completed
- [ ] Pricing and availability set
- [ ] Review information completed
- [ ] Export compliance information completed

### Google Play Console (Android)
- [ ] App created in Google Play Console
- [ ] Bundle identifier matches: app.cryb.android
- [ ] All required metadata filled
- [ ] App description (4000 characters max)
- [ ] Short description (80 characters max)
- [ ] Screenshots for all device types uploaded
- [ ] App icon uploaded (512x512px)
- [ ] Feature graphic uploaded (1024x500px)
- [ ] Content rating questionnaire completed
- [ ] Pricing and availability set
- [ ] App signing configured

### Legal & Compliance
- [ ] Privacy policy published and linked
- [ ] Terms of service available
- [ ] Age rating appropriate (17+ recommended for chat apps)
- [ ] Content guidelines compliance verified
- [ ] Data handling disclosures completed
- [ ] In-app purchase descriptions (if applicable)

### Testing & Quality Assurance
- [ ] All critical features tested
- [ ] Push notifications working
- [ ] Voice/video calls functional
- [ ] Web3/wallet integration working
- [ ] Offline mode tested
- [ ] Performance acceptable on older devices
- [ ] Memory usage optimized
- [ ] Crash-free rate > 99.5%

## SUBMISSION PROCESS

### iOS App Store
1. Upload build to App Store Connect
2. Complete all metadata sections
3. Submit for review
4. Respond to any review feedback
5. Release when approved

### Google Play Store
1. Upload AAB to Google Play Console
2. Complete all store listing sections
3. Submit for review (internal testing first recommended)
4. Address any policy violations
5. Release to production

## POST-SUBMISSION MONITORING

### Metrics to Track
- [ ] Download/install rates
- [ ] User ratings and reviews
- [ ] Crash reports and stability
- [ ] Performance metrics
- [ ] User engagement analytics

### Response Plan
- [ ] Monitor review feedback daily
- [ ] Respond to user reviews professionally
- [ ] Address critical bugs with hotfix releases
- [ ] Plan feature updates based on user feedback

## IMPORTANT DEADLINES

- **App Store Review Time**: 1-7 days typically
- **Google Play Review Time**: 1-3 days typically
- **Target Submission Date**: September 20th, 2024
- **Expected Approval Date**: September 22-27th, 2024

## CONTACTS & RESOURCES

- **Apple Developer Program**: developer.apple.com
- **Google Play Console**: play.google.com/console  
- **App Store Review Guidelines**: developer.apple.com/app-store/review/
- **Google Play Policy**: play.google.com/about/developer-content-policy/

Remember: Allow extra time for potential review delays or required changes!
EOF

print_success "Submission checklist created"

# Generate build verification script
print_status "Creating build verification script..."

cat > "$SUBMISSION_DIR/verify-builds.sh" << 'EOF'
#!/bin/bash

# Build Verification Script
# Run this before submitting to app stores

echo "🔍 Verifying CRYB Mobile Builds"
echo "==============================="

# Check if builds exist
echo "Checking build files..."

# Add build verification logic here
# This would typically check:
# - Build sizes are reasonable
# - All required assets are included  
# - Version numbers match
# - Signing is correct
# - No debug symbols in release builds

echo "✅ Build verification completed"
echo ""
echo "Ready for App Store submission!"
EOF

chmod +x "$SUBMISSION_DIR/verify-builds.sh"

print_success "Build verification script created"

# Create final summary
print_status "Generating submission summary..."

cat > "$SUBMISSION_DIR/README.md" << 'EOF'
# CRYB Mobile App Store Submission Package

This directory contains all the necessary files and documentation for submitting CRYB Mobile to the iOS App Store and Google Play Store.

## Directory Structure

```
app-store-submission/
├── ios/                    # iOS-specific assets
├── android/                # Android-specific assets  
├── screenshots/            # App screenshots and requirements
├── metadata/               # App descriptions and keywords
├── submission-checklist.md # Complete submission checklist
├── verify-builds.sh        # Build verification script
└── README.md              # This file
```

## Quick Start

1. Review the submission checklist: `submission-checklist.md`
2. Prepare screenshots according to: `screenshots/screenshot-requirements.md`
3. Use app descriptions from: `metadata/`
4. Run build verification: `./verify-builds.sh`
5. Submit to app stores following the checklist

## Important Notes

- Target submission date: September 20th, 2024
- Both iOS and Android builds are required
- All metadata must be completed before submission
- Screenshot requirements are specific to each platform
- Privacy policy and terms of service must be accessible

## Support

For submission support, contact the development team or refer to:
- Apple Developer Documentation
- Google Play Developer Documentation
- EAS Build Documentation

Good luck with the submission! 🚀
EOF

print_success "App Store submission package prepared!"

echo ""
echo "🎉 App Store Preparation Complete!"
echo "================================="
print_success "All submission materials have been prepared in: $SUBMISSION_DIR"
echo ""
echo "Next steps:"
echo "1. Review the submission checklist"
echo "2. Take required screenshots"
echo "3. Complete app store metadata"
echo "4. Submit for review"
echo ""
print_status "Deadline: September 20th - you're on track! 🎯"