# CRYB Mobile App - Build Instructions

This document provides comprehensive instructions for building the CRYB mobile application for both iOS and Android platforms, ready for App Store submission.

## Prerequisites

### System Requirements

- **macOS**: Required for iOS builds (Xcode)
- **Node.js**: Version 18+ with npm/yarn/pnpm
- **Expo CLI**: Latest version
- **EAS CLI**: For production builds
- **Xcode**: Latest version (for iOS builds)
- **Android Studio**: Latest version (for Android builds)

### Development Tools

```bash
# Install required global tools
npm install -g @expo/cli eas-cli

# Install dependencies
pnpm install
```

## Environment Configuration

### 1. Environment Variables

Create environment files for different stages:

```bash
# .env.development
EXPO_PUBLIC_API_BASE_URL=http://localhost:3002
EXPO_PUBLIC_WS_URL=ws://localhost:3002
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-id

# .env.production
EXPO_PUBLIC_API_BASE_URL=https://api.cryb.app
EXPO_PUBLIC_WS_URL=wss://api.cryb.app
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-id
```

### 2. Firebase Configuration

Set up Firebase for push notifications:

1. Create Firebase project at https://console.firebase.google.com
2. Add iOS and Android apps to the project
3. Download configuration files:
   - `google-services.json` (Android) → place in `android/app/`
   - `GoogleService-Info.plist` (iOS) → place in `ios/`

## Asset Preparation

### App Icons

Create the following icons with CRYB branding:
- `assets/icon.png` (1024×1024) - Main app icon
- `assets/adaptive-icon.png` (1024×1024) - Android adaptive icon
- `assets/splash.png` (1284×2778) - Splash screen

### Store Assets

Prepare for App Store submission:
- App screenshots (various device sizes)
- App Store description and metadata
- Privacy policy and terms of service
- App preview videos (optional but recommended)

## Development Build

### Start Development Server

```bash
# Start the development server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Run on web
pnpm web
```

### Testing

```bash
# Run tests
pnpm test

# Run linting
pnpm lint

# Type checking
pnpm type-check
```

## Production Builds

### Configure EAS Build

1. Initialize EAS in your project:

```bash
eas build:configure
```

2. Configure `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### iOS Production Build

#### 1. Apple Developer Setup

- Apple Developer Program membership ($99/year)
- App Store Connect account
- iOS Distribution Certificate
- App Store Provisioning Profile
- Create App ID in Apple Developer Portal

#### 2. Configure app.config.js

```javascript
export default {
  expo: {
    ios: {
      bundleIdentifier: "app.cryb.ios",
      buildNumber: "1",
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "CRYB needs camera access for video calls and photo sharing",
        NSMicrophoneUsageDescription: "CRYB needs microphone access for voice calls",
        NSPhotoLibraryUsageDescription: "CRYB needs photo library access to share images"
      }
    }
  }
};
```

#### 3. Build for iOS

```bash
# Build production iOS app
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

### Android Production Build

#### 1. Google Play Console Setup

- Google Play Console Developer account ($25 one-time fee)
- Create app listing in Google Play Console
- Configure app signing key
- Generate upload certificate

#### 2. Configure app.config.js

```javascript
export default {
  expo: {
    android: {
      package: "app.cryb.android",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      },
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    }
  }
};
```

#### 3. Build for Android

```bash
# Build production Android app
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --profile production
```

## App Store Submission

### iOS App Store

1. **Prepare in App Store Connect:**
   - App information and metadata
   - Screenshots for all required device sizes
   - App description and keywords
   - Privacy policy URL
   - Support URL
   - Age rating questionnaire

2. **Submit for Review:**
   - Upload build using EAS Submit or manually
   - Complete app information
   - Submit for Apple review (typically 24-48 hours)

3. **Release:**
   - Once approved, choose release timing
   - Monitor crash reports and user feedback

### Google Play Store

1. **Prepare in Play Console:**
   - Store listing with descriptions
   - Screenshots and graphics
   - Content rating questionnaire  
   - Pricing and distribution settings
   - Privacy policy and permissions

2. **Submit for Review:**
   - Upload AAB file using EAS Submit
   - Complete store listing
   - Submit for Google review (typically 2-3 days)

3. **Release:**
   - Choose release rollout percentage
   - Monitor Play Console for crashes and ANRs

## Performance Optimization

### Before Production Build

1. **Code Optimization:**
   ```bash
   # Bundle analysis
   npx expo export --dump-sourcemap
   npx expo export --dump-assetmap
   ```

2. **Image Optimization:**
   - Compress images using tools like ImageOptim
   - Use WebP format where supported
   - Implement lazy loading for large images

3. **Bundle Size Optimization:**
   - Remove unused dependencies
   - Use dynamic imports for large features
   - Enable Hermes on Android for better performance

### Performance Testing

```bash
# Test on real devices
# iOS: Use Xcode Instruments
# Android: Use Android Studio Profiler

# Monitor key metrics:
# - App startup time
# - Memory usage
# - CPU usage
# - Network requests
# - Crash-free sessions
```

## Monitoring & Analytics

### Crash Reporting

The app includes Sentry integration for crash reporting:
- Monitor crashes in production
- Track performance metrics
- Set up alerts for critical issues

### Analytics

Implement analytics to track:
- User engagement
- Feature usage
- Retention metrics
- Performance metrics

## Troubleshooting

### Common Build Issues

1. **iOS Code Signing:**
   ```bash
   # Clear certificates
   eas credentials --platform ios --clear
   # Reconfigure
   eas build:configure
   ```

2. **Android Gradle Issues:**
   ```bash
   # Clean Android build
   cd android && ./gradlew clean
   cd .. && eas build --platform android --clear-cache
   ```

3. **Metro Bundle Issues:**
   ```bash
   # Clear Metro cache
   npx expo start --clear
   ```

### Support Resources

- Expo Documentation: https://docs.expo.dev/
- EAS Build Documentation: https://docs.expo.dev/build/introduction/
- React Native Documentation: https://reactnative.dev/docs/getting-started
- Apple Developer: https://developer.apple.com/
- Google Play Console: https://developer.android.com/distribute

## Post-Launch

### Maintenance

1. **Regular Updates:**
   - Monitor for crashes and fix promptly
   - Update dependencies regularly
   - Respond to App Store/Play Store policy changes

2. **Performance Monitoring:**
   - Track key performance metrics
   - Monitor user reviews and feedback
   - A/B test new features

3. **Security:**
   - Regular security audits
   - Keep dependencies updated
   - Monitor for vulnerabilities

---

This document should be updated as the build process evolves. For questions or issues, consult the development team or create an issue in the project repository.