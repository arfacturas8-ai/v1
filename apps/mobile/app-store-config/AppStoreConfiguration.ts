/**
 * APP STORE CONFIGURATION
 * Complete configuration for iOS App Store and Google Play Store submission
 */

export interface AppStoreMetadata {
  name: string;
  description: string;
  shortDescription: string;
  keywords: string[];
  category: string;
  contentRating: string;
  privacyPolicyUrl: string;
  supportUrl: string;
  marketingUrl: string;
  copyright: string;
  version: string;
  buildNumber: string;
}

export interface StoreScreenshots {
  ios: {
    iPhone55: string[];    // iPhone 6 Plus, 6s Plus, 7 Plus, 8 Plus
    iPhone65: string[];    // iPhone Xs Max, 11 Pro Max, 12 Pro Max, 13 Pro Max
    iPhone58: string[];    // iPhone X, Xs, 11 Pro, 12, 12 Pro, 13, 13 Pro
    iPhone61: string[];    // iPhone 11, 12, 13
    iPad129: string[];     // iPad Pro 12.9-inch
    iPad105: string[];     // iPad Pro 10.5-inch
  };
  android: {
    phone: string[];       // 1080x1920
    tablet7: string[];     // 1200x1920
    tablet10: string[];    // 1600x2560
  };
}

export const APP_STORE_METADATA: AppStoreMetadata = {
  name: 'CRYB',
  description: `CRYB is the next-generation hybrid community platform that seamlessly blends the best features of Discord and Reddit into one powerful mobile experience.

🚀 FEATURES:
• Real-time messaging with voice and video calls
• Community-driven discussions and content sharing
• Advanced moderation tools with AI assistance
• Cross-platform synchronization
• Dark/Light mode with customizable themes
• Offline support for seamless experience
• End-to-end encryption for private conversations
• Web3 integration with cryptocurrency features

💬 CHAT LIKE DISCORD:
• Create servers and channels
• Voice and video calls with crystal-clear quality
• Screen sharing and file uploads
• Custom emojis and reactions
• Role-based permissions
• Bot integrations

📱 DISCOVER LIKE REDDIT:
• Join communities around your interests
• Share posts, images, and videos
• Upvote and downvote content
• Threaded comments and discussions
• Trending topics and discovery
• Karma system and user profiles

🔒 PRIVACY & SECURITY:
• Biometric authentication (Face ID/Touch ID)
• End-to-end encryption
• Privacy-focused design
• GDPR compliant
• Secure data storage

✨ ADVANCED FEATURES:
• AI-powered content moderation
• Smart notifications with deep linking
• Offline mode with sync
• Performance optimized for all devices
• Accessibility features
• Multi-language support

Join millions of users already connected on CRYB - where communities thrive and conversations flow naturally.`,

  shortDescription: 'The ultimate hybrid community platform combining the best of Discord and Reddit with advanced features.',

  keywords: [
    'chat', 'community', 'discord', 'reddit', 'messaging', 'voice chat', 
    'video calls', 'social', 'forums', 'discussions', 'real-time',
    'communities', 'groups', 'servers', 'channels', 'posts', 'comments',
    'upvote', 'karma', 'trending', 'discovery', 'crypto', 'web3',
    'secure', 'privacy', 'encrypted', 'biometric', 'offline'
  ],

  category: 'Social Networking',
  contentRating: 'T', // Teen (13+)
  privacyPolicyUrl: 'https://cryb.app/privacy',
  supportUrl: 'https://support.cryb.app',
  marketingUrl: 'https://cryb.app',
  copyright: '2024 CRYB, Inc.',
  version: '1.0.0',
  buildNumber: '1',
};

export const STORE_SCREENSHOTS: StoreScreenshots = {
  ios: {
    iPhone55: [
      './screenshots/ios/iphone-6.5/01-home-feed.png',
      './screenshots/ios/iphone-6.5/02-chat-channels.png',
      './screenshots/ios/iphone-6.5/03-voice-call.png',
      './screenshots/ios/iphone-6.5/04-community-detail.png',
      './screenshots/ios/iphone-6.5/05-post-detail.png',
    ],
    iPhone65: [
      './screenshots/ios/iphone-6.5/01-home-feed.png',
      './screenshots/ios/iphone-6.5/02-chat-channels.png',
      './screenshots/ios/iphone-6.5/03-voice-call.png',
      './screenshots/ios/iphone-6.5/04-community-detail.png',
      './screenshots/ios/iphone-6.5/05-post-detail.png',
    ],
    iPhone58: [
      './screenshots/ios/iphone-5.8/01-home-feed.png',
      './screenshots/ios/iphone-5.8/02-chat-channels.png',
      './screenshots/ios/iphone-5.8/03-voice-call.png',
      './screenshots/ios/iphone-5.8/04-community-detail.png',
      './screenshots/ios/iphone-5.8/05-post-detail.png',
    ],
    iPhone61: [
      './screenshots/ios/iphone-6.1/01-home-feed.png',
      './screenshots/ios/iphone-6.1/02-chat-channels.png',
      './screenshots/ios/iphone-6.1/03-voice-call.png',
      './screenshots/ios/iphone-6.1/04-community-detail.png',
      './screenshots/ios/iphone-6.1/05-post-detail.png',
    ],
    iPad129: [
      './screenshots/ios/ipad-12.9/01-home-landscape.png',
      './screenshots/ios/ipad-12.9/02-chat-split-view.png',
      './screenshots/ios/ipad-12.9/03-community-grid.png',
      './screenshots/ios/ipad-12.9/04-voice-participants.png',
    ],
    iPad105: [
      './screenshots/ios/ipad-10.5/01-home-landscape.png',
      './screenshots/ios/ipad-10.5/02-chat-split-view.png',
      './screenshots/ios/ipad-10.5/03-community-grid.png',
      './screenshots/ios/ipad-10.5/04-voice-participants.png',
    ],
  },
  android: {
    phone: [
      './screenshots/android/phone/01-home-feed.png',
      './screenshots/android/phone/02-chat-channels.png',
      './screenshots/android/phone/03-voice-call.png',
      './screenshots/android/phone/04-community-detail.png',
      './screenshots/android/phone/05-post-detail.png',
      './screenshots/android/phone/06-settings.png',
      './screenshots/android/phone/07-notifications.png',
      './screenshots/android/phone/08-dark-mode.png',
    ],
    tablet7: [
      './screenshots/android/tablet-7/01-home-landscape.png',
      './screenshots/android/tablet-7/02-chat-split-view.png',
      './screenshots/android/tablet-7/03-community-grid.png',
      './screenshots/android/tablet-7/04-voice-participants.png',
    ],
    tablet10: [
      './screenshots/android/tablet-10/01-home-landscape.png',
      './screenshots/android/tablet-10/02-chat-split-view.png',
      './screenshots/android/tablet-10/03-community-grid.png',
      './screenshots/android/tablet-10/04-voice-participants.png',
    ],
  },
};

export const APP_STORE_REVIEW_INFORMATION = {
  ios: {
    contact: {
      firstName: 'CRYB',
      lastName: 'Review Team',
      phone: '+1-555-0123',
      email: 'appstore@cryb.app',
    },
    demoAccount: {
      username: 'review@cryb.app',
      password: 'AppStoreReview2024!',
      notes: 'This is a demo account for App Store review. All features are available for testing.',
    },
    notes: `Thank you for reviewing CRYB!

WHAT IS CRYB:
CRYB is a hybrid community platform that combines Discord-style real-time chat with Reddit-style community discussions. Users can join servers for real-time communication or communities for longer-form discussions.

KEY FEATURES TO TEST:
1. Authentication - Sign in with the demo account or create a new account
2. Join Communities - Browse and join communities by interest
3. Chat Features - Test real-time messaging in server channels
4. Voice/Video - Test voice and video calling features
5. Content Creation - Create posts and comments
6. Voting System - Upvote/downvote posts and comments
7. Dark/Light Mode - Toggle themes in settings
8. Offline Support - Test app functionality without internet

DEMO ACCOUNT ACCESS:
- Username: review@cryb.app
- Password: AppStoreReview2024!
- This account has access to all features and sample communities

TECHNICAL NOTES:
- All network traffic is encrypted
- Voice/video calls use WebRTC with LiveKit
- Offline functionality preserves user data
- Biometric authentication available on supported devices
- Push notifications require user permission

CONTENT POLICY:
- All user-generated content is moderated by AI and human moderators
- Community guidelines are enforced consistently
- Report functionality is available for inappropriate content

Please contact appstore@cryb.app if you need any assistance during the review process.`,
  },
  android: {
    contact: {
      email: 'playstore@cryb.app',
      phone: '+1-555-0123',
      website: 'https://cryb.app/support',
    },
    demoAccount: {
      username: 'review@cryb.app',
      password: 'PlayStoreReview2024!',
      notes: 'Demo account for Google Play Store review with full feature access.',
    },
    testingInstructions: `CRYB - Community Platform Testing Guide

OVERVIEW:
CRYB combines real-time chat (like Discord) with community discussions (like Reddit) in one unified platform.

TESTING SCENARIOS:

1. ACCOUNT SETUP:
   - Create account or use demo: review@cryb.app / PlayStoreReview2024!
   - Enable biometric authentication (if device supports it)
   - Complete profile setup

2. COMMUNITY FEATURES:
   - Browse trending communities
   - Join a community of interest
   - Create a new post with text/image
   - Comment on existing posts
   - Use upvote/downvote system

3. CHAT FEATURES:
   - Join a server
   - Send messages in channels
   - Share images/files
   - Use emoji reactions
   - Test voice/video calling

4. PERSONALIZATION:
   - Toggle dark/light theme
   - Customize notification settings
   - Set up interests and preferences

5. OFFLINE FUNCTIONALITY:
   - Turn off internet connection
   - Browse cached content
   - Create posts/comments (will sync when online)
   - Reconnect to see sync functionality

6. PERFORMANCE:
   - Test app startup time
   - Navigate between screens
   - Test with poor network conditions
   - Background/foreground transitions

CONTENT GUIDELINES:
- All content follows Google Play policies
- AI + human moderation system
- User reporting functionality
- Community guidelines enforcement

Contact playstore@cryb.app for review support.`,
  },
};

export const PRIVACY_INFORMATION = {
  dataCollection: {
    accountInfo: {
      collected: true,
      purpose: 'App functionality, user identification',
      linkedToUser: true,
      usedForTracking: false,
    },
    contacts: {
      collected: false,
      purpose: 'Not collected',
      linkedToUser: false,
      usedForTracking: false,
    },
    userContent: {
      collected: true,
      purpose: 'App functionality, community features',
      linkedToUser: true,
      usedForTracking: false,
    },
    usageData: {
      collected: true,
      purpose: 'Analytics, app improvement',
      linkedToUser: false,
      usedForTracking: false,
    },
    diagnostics: {
      collected: true,
      purpose: 'App improvement, crash reporting',
      linkedToUser: false,
      usedForTracking: false,
    },
    deviceInfo: {
      collected: true,
      purpose: 'App functionality, optimization',
      linkedToUser: false,
      usedForTracking: false,
    },
  },
  dataProtection: {
    encryption: true,
    biometricAuth: true,
    dataMinimization: true,
    userControl: true,
    retention: '7 years or until account deletion',
    sharing: 'No data sharing with third parties for advertising',
  },
};

export const TECHNICAL_REQUIREMENTS = {
  ios: {
    minimumVersion: '13.0',
    supportedDevices: ['iPhone', 'iPad'],
    requiredCapabilities: [
      'arm64',
      'microphone',
      'camera',
      'network',
    ],
    optionalCapabilities: [
      'face-id',
      'touch-id',
      'background-audio',
      'background-fetch',
    ],
    permissions: [
      'NSCameraUsageDescription',
      'NSMicrophoneUsageDescription',
      'NSPhotoLibraryUsageDescription',
      'NSFaceIDUsageDescription',
    ],
  },
  android: {
    minimumSdkVersion: 21, // Android 5.0
    targetSdkVersion: 34,  // Android 14
    requiredPermissions: [
      'INTERNET',
      'ACCESS_NETWORK_STATE',
      'RECORD_AUDIO',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
    ],
    optionalPermissions: [
      'USE_FINGERPRINT',
      'USE_BIOMETRIC',
      'WAKE_LOCK',
      'VIBRATE',
      'RECEIVE_BOOT_COMPLETED',
    ],
    requiredFeatures: [
      'android.hardware.camera',
      'android.hardware.microphone',
    ],
    optionalFeatures: [
      'android.hardware.fingerprint',
      'android.hardware.camera.front',
    ],
  },
};

export const RELEASE_NOTES = {
  v1_0_0: {
    title: 'Welcome to CRYB 🚀',
    description: `Introducing CRYB - the ultimate hybrid community platform!

🎉 LAUNCH FEATURES:
• Real-time chat with voice and video calls
• Community discussions with voting system
• Advanced AI moderation
• Dark/Light mode support
• Biometric authentication
• Offline support with sync
• Cross-platform compatibility
• End-to-end encryption

💬 DISCORD-STYLE FEATURES:
• Create and join servers
• Real-time messaging in channels
• Voice and video calling
• File sharing and emoji reactions
• Role-based permissions

📱 REDDIT-STYLE FEATURES:
• Browse and join communities
• Create posts with rich media
• Upvote/downvote system
• Threaded comments
• Trending content discovery

🔒 PRIVACY & SECURITY:
• Face ID / Touch ID support
• Encrypted communications
• Privacy-focused design
• No ads or tracking

Join the community at cryb.app and connect with like-minded people around the world!`,
  },
};

export const MARKETING_ASSETS = {
  appIcon: {
    ios: './assets/app-store/ios/app-icon-1024x1024.png',
    android: './assets/app-store/android/app-icon-512x512.png',
  },
  featureGraphic: './assets/app-store/android/feature-graphic-1024x500.png',
  promoGraphic: './assets/app-store/android/promo-graphic-180x120.png',
  tvBanner: './assets/app-store/android/tv-banner-1280x720.png',
  screenshots: STORE_SCREENSHOTS,
  videos: {
    preview: 'https://cryb.app/assets/app-preview.mp4',
    features: 'https://cryb.app/assets/features-overview.mp4',
  },
};

export const COMPLIANCE_CHECKLIST = {
  appStoreGuidelines: {
    safety: true,           // App is safe for users
    performance: true,      // App performs well
    business: true,         // Follows business model guidelines
    design: true,           // Follows design guidelines
    legal: true,            // Complies with legal requirements
  },
  playStorePolicy: {
    restrictedContent: true,    // No restricted content
    intellectualProperty: true, // Respects IP rights
    privacyAndSecurity: true,   // Privacy policy and secure
    monetization: true,         // Follows monetization policies
    deviceAndNetwork: true,     // Proper device/network usage
  },
  privacy: {
    gdprCompliant: true,        // GDPR compliant
    ccpaCompliant: true,        // CCPA compliant
    coppaCompliant: true,       // COPPA compliant (13+ age rating)
    privacyPolicy: true,        // Has privacy policy
    dataCollection: true,       // Transparent data collection
  },
  accessibility: {
    voiceOver: true,           // VoiceOver support
    dynamicType: true,         // Dynamic type support
    colorContrast: true,       // Proper color contrast
    keyboardNavigation: true,  // Keyboard navigation
    screenReader: true,        // Screen reader support
  },
  security: {
    encryption: true,          // Data encryption
    authentication: true,      // Secure authentication
    permissions: true,         // Proper permission handling
    dataProtection: true,      // Data protection measures
    secureStorage: true,       // Secure local storage
  },
};