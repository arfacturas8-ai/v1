# iOS App Store Submission Guide for CRYB Mobile App

## Overview

This guide provides step-by-step instructions for submitting the CRYB mobile app to the iOS App Store using Expo Application Services (EAS).

## Prerequisites

Before starting the submission process, ensure you have:

1. ✅ **Apple Developer Account** ($99/year)
2. ✅ **Expo Account** with EAS access
3. ✅ **App Store Connect Account** 
4. ✅ **Bundle Identifier** registered: `app.cryb.ios`
5. ✅ **App Icons** (1024x1024 and all required sizes)
6. ✅ **Privacy Policy URL**
7. ✅ **Terms of Service URL**

## Step 1: Apple Developer Account Setup

### 1.1 Create App Identifier
1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (Add new)
4. Select **App IDs** → **App**
5. Enter details:
   - **Description**: CRYB Mobile App
   - **Bundle ID**: `app.cryb.ios`
   - **Capabilities**: Enable required capabilities (see section 1.2)

### 1.2 Required Capabilities
Enable these capabilities for the CRYB app:
- ✅ **Push Notifications** - For real-time messaging
- ✅ **Background Modes** - For voice chat and notifications
- ✅ **Camera** - For photo/video sharing
- ✅ **Microphone** - For voice messages and calls
- ✅ **Photo Library** - For media sharing
- ✅ **Associated Domains** - For deep linking
- ✅ **App Groups** (if needed for extensions)

### 1.3 Provisioning Profile
1. Go to **Profiles** → **+** (Add new)
2. Select **iOS App Development** (for testing) or **App Store** (for submission)
3. Choose your App ID: `app.cryb.ios`
4. Select your certificate
5. Choose devices (for development profile)
6. Name it: `CRYB iOS App Store Profile`
7. Download and install the profile

## Step 2: App Store Connect Setup

### 2.1 Create App Record
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Click **My Apps** → **+** → **New App**
3. Fill in details:
   - **Name**: CRYB
   - **Primary Language**: English (US)
   - **Bundle ID**: `app.cryb.ios`
   - **SKU**: `cryb-ios-app`
   - **User Access**: Full Access

### 2.2 App Information
Complete these sections in App Store Connect:

#### General Information
- **App Name**: CRYB
- **Subtitle**: Next-Generation Community Platform
- **Category**: Social Networking
- **Secondary Category**: Entertainment
- **Content Rights**: Check if you own all rights

#### Pricing and Availability
- **Price**: Free
- **Availability**: All territories (or select specific countries)
- **App Store Availability**: Make this app available on the App Store

#### App Privacy
- **Privacy Policy URL**: https://cryb.app/privacy
- **User Privacy Choices URL**: https://cryb.app/privacy-choices (if applicable)

### 2.3 Version Information

#### General
- **Version**: 1.0.0
- **Copyright**: 2025 CRYB Team
- **Age Rating**: Complete questionnaire (likely 17+ due to user-generated content)

#### App Description
```
CRYB is the next-generation hybrid community platform that brings together the best of Discord-like real-time communication with Web3 integration and blockchain technology.

KEY FEATURES:
• Real-time messaging and voice/video chat
• Community servers with customizable channels
• Web3 wallet integration and crypto features
• NFT profile pictures and token-gated communities
• Advanced moderation tools with AI assistance
• Cross-platform compatibility
• End-to-end encryption for secure communication

Whether you're building a gaming community, managing a DAO, or connecting with friends, CRYB provides all the tools you need in one powerful platform.

PERFECT FOR:
- Gaming communities and esports teams
- Crypto and DeFi communities
- Content creators and their audiences
- Professional teams and organizations
- Educational groups and study communities
- Social clubs and interest groups

ADVANCED FEATURES:
- Custom server themes and branding
- Advanced permission systems
- Integration with popular blockchain networks
- Real-time collaboration tools
- Rich media sharing and streaming
- Mobile-optimized experience

Join thousands of communities already using CRYB to connect, collaborate, and build the future together.
```

#### Keywords
```
discord, chat, community, web3, crypto, nft, dao, gaming, voice chat, messaging
```

#### Support URL
- https://cryb.app/support

#### Marketing URL  
- https://cryb.app

#### Screenshots (Required)
Upload screenshots for all required device sizes:
- **iPhone 6.7"** (iPhone 13 Pro Max, 14 Plus, 15 Plus, 15 Pro Max)
- **iPhone 6.5"** (iPhone XS Max, 11 Pro Max, 12 Pro Max)
- **iPhone 5.5"** (iPhone 6s Plus, 7 Plus, 8 Plus)
- **iPad Pro 12.9"** (3rd, 4th, 5th generation)
- **iPad Pro 11"** (1st, 2nd, 3rd generation)

## Step 3: EAS Build Configuration

### 3.1 Update EAS Credentials
Update the `eas.json` submit section with your actual values:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### 3.2 Find Your Apple Team ID
1. Go to [Apple Developer Console](https://developer.apple.com/account/)
2. Click on **Membership**
3. Find your **Team ID** (format: ABCD123456)

### 3.3 Find Your App Store Connect App ID
1. Go to [App Store Connect](https://appstoreconnect.apple.com/)
2. Select your app
3. Go to **App Store** tab
4. Look for **Apple ID** in the General Information section

## Step 4: Build and Submit Process

### 4.1 Login to EAS
```bash
cd /home/ubuntu/cryb-platform/apps/mobile
npx eas login
```

### 4.2 Configure Build
```bash
npx eas build:configure
```

### 4.3 Build for Production
```bash
npx eas build --platform ios --profile production
```

This will:
- Build the iOS app with release configuration
- Sign the app with your distribution certificate
- Upload to EAS servers
- Provide a build URL when complete

### 4.4 Submit to App Store
```bash
npx eas submit --platform ios --profile production
```

This will:
- Download the build from EAS
- Upload to App Store Connect
- Submit for review automatically

## Step 5: App Store Review Preparation

### 5.1 Review Information
In App Store Connect, provide:
- **Contact Information**: Your email and phone
- **Demo Account** (if login required):
  - Username: demo@cryb.app
  - Password: DemoPass123!
  - Additional info about demo features
- **Notes**: Any special instructions for reviewers

### 5.2 Common Rejection Reasons to Avoid
- ✅ **App completeness**: Ensure all features work properly
- ✅ **Crashes**: Test thoroughly on different devices
- ✅ **Login issues**: Provide working demo credentials
- ✅ **In-app purchases**: Ensure they work correctly
- ✅ **Privacy policy**: Must be accessible and complete
- ✅ **Age rating**: Must match app content
- ✅ **Metadata accuracy**: Screenshots and description must match app

### 5.3 Testing Checklist
Before submission, verify:
- [ ] App launches successfully
- [ ] No crashes during normal usage
- [ ] All navigation flows work
- [ ] Authentication system works
- [ ] Push notifications work
- [ ] Voice/video chat functions properly
- [ ] Web3 features work (if applicable)
- [ ] Privacy policy is accessible
- [ ] App permissions are requested properly
- [ ] All text is properly localized
- [ ] App works on different device sizes

## Step 6: Post-Submission Process

### 6.1 Review Timeline
- **Typical Review Time**: 1-7 days
- **Status Updates**: Check App Store Connect regularly
- **Expedited Review**: Available for critical issues (limit: 2 per year)

### 6.2 Possible Outcomes
1. **Approved**: App goes live automatically or on your chosen date
2. **Rejected**: Address issues and resubmit
3. **Metadata Rejected**: Fix metadata issues without new build
4. **Developer Rejected**: You can make changes and resubmit

### 6.3 If Rejected
1. Read the rejection email carefully
2. Address all mentioned issues
3. Test the fixes thoroughly
4. Update build if code changes needed
5. Resubmit with resolution details

## Step 7: Release Management

### 7.1 Phased Release (Recommended)
- Enable **Phased Release for Automatic Updates**
- Start with 1% of users, gradually increase to 100%
- Monitor crash reports and user feedback
- Can pause or halt release if issues arise

### 7.2 Post-Launch Monitoring
- **App Analytics**: Monitor downloads, crashes, ratings
- **Crash Reports**: Fix critical issues immediately
- **User Reviews**: Respond to user feedback
- **Performance**: Monitor app performance metrics

## Step 8: Update Process

### 8.1 Regular Updates
For subsequent updates:
1. Update version number in `app.config.js`
2. Build new version: `npx eas build --platform ios --profile production`
3. Submit update: `npx eas submit --platform ios --profile production`
4. Provide **What's New** text describing changes

### 8.2 Emergency Updates
For critical fixes:
1. Fix the issue in code
2. Build immediately with incremented build number
3. Submit with expedited review request if necessary
4. Monitor rollout carefully

## Troubleshooting

### Common Issues

#### Build Failures
- **Certificate Issues**: Ensure certificates are valid and match bundle ID
- **Provisioning Profile**: Check profile includes correct devices and certificates
- **Code Signing**: Verify signing identity in build settings

#### Submission Issues
- **Invalid Binary**: Usually due to missing icons or Info.plist issues
- **Missing Compliance**: Complete export compliance questions
- **Invalid Screenshots**: Ensure screenshots match required dimensions

#### Review Rejections
- **Guideline Violations**: Carefully read App Store Review Guidelines
- **Missing Features**: Ensure all features mentioned in description work
- **Privacy Issues**: Update privacy policy and app privacy settings

### Support Resources
- **Apple Developer Forums**: https://developer.apple.com/forums/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Expo Documentation**: https://docs.expo.dev/submit/ios/
- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/

## Security Considerations

### Code Signing
- Keep certificates and private keys secure
- Use separate certificates for development and distribution
- Regularly rotate certificates before expiration

### API Keys and Secrets
- Never include production API keys in the app bundle
- Use environment variables for sensitive configuration
- Implement certificate pinning for API communications

### Privacy Compliance
- Implement proper privacy controls
- Request permissions with clear explanations
- Provide users with data deletion options
- Comply with GDPR, CCPA, and other privacy regulations

---

## Checklist for Submission

### Pre-Submission
- [ ] Apple Developer Account active ($99/year)
- [ ] Bundle ID registered: `app.cryb.ios`
- [ ] App Store Connect app created
- [ ] All required screenshots uploaded
- [ ] App description and metadata complete
- [ ] Privacy policy accessible at provided URL
- [ ] Age rating completed
- [ ] Pricing and availability set

### Build Configuration
- [ ] EAS configuration updated with correct IDs
- [ ] App icons generated (1024x1024 and all sizes)
- [ ] Splash screens configured
- [ ] Environment variables configured for production
- [ ] Push notification certificates configured
- [ ] Deep linking properly configured

### Testing
- [ ] App builds successfully with EAS
- [ ] No crashes on iOS devices
- [ ] All features work as described
- [ ] Demo account created and tested
- [ ] Privacy settings functional
- [ ] Push notifications working
- [ ] Web3 features tested (if applicable)

### Submission
- [ ] Production build created with EAS
- [ ] Build submitted to App Store Connect
- [ ] Review information completed
- [ ] Demo account provided to reviewers
- [ ] Waiting for review status

This comprehensive guide ensures a smooth iOS App Store submission process for the CRYB mobile app.