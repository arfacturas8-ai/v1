# iOS Release Checklist for CRYB

## Pre-Build Requirements
- [ ] macOS machine with Xcode 15+ installed
- [ ] Valid Apple Developer account (9/year)
- [ ] App Store Connect app created
- [ ] Certificates and provisioning profiles configured
- [ ] Team ID configured in build settings

## Build Configuration
- [ ] Bundle identifier: `ai.cryb.app`
- [ ] Version: `1.0.0`
- [ ] Build number: `202510022147`
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
1. `cd /path/to/cryb-mobile`
2. `npm install`
3. `npx expo prebuild --platform ios --clear`
4. `./build-ios-release.sh`

## App Store Submission
1. Open Xcode or use Transporter app
2. Upload IPA file: `ios/build/AppStore/CRYB.ipa`
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
- `ios-build-config.json` - Technical build configuration
- `app-store-connect/metadata.json` - App Store Connect metadata
- `build-ios-release.sh` - Automated build script
- `export-options.plist` - Xcode export configuration
- `ios-release-checklist.md` - This checklist

## Support Resources
- Apple Developer Documentation: https://developer.apple.com/documentation/
- App Store Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect Help: https://help.apple.com/app-store-connect/
