/**
 * EXPO APP CONFIGURATION
 * Production-ready configuration for App Store and Play Store deployment
 */

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_STAGING = process.env.APP_VARIANT === 'staging';

export default {
  expo: {
    name: IS_DEV ? 'CRYB (Dev)' : IS_STAGING ? 'CRYB (Staging)' : 'CRYB',
    slug: 'cryb',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    
    assetBundlePatterns: [
      '**/*',
    ],
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV 
        ? 'app.cryb.ios.dev' 
        : IS_STAGING 
        ? 'app.cryb.ios.staging' 
        : 'app.cryb.ios',
      buildNumber: '1',
      requireFullScreen: false,
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        // Camera permissions
        NSCameraUsageDescription: 'CRYB needs access to your camera to take photos and videos for sharing in chats and voice calls.',
        
        // Microphone permissions
        NSMicrophoneUsageDescription: 'CRYB needs access to your microphone for voice messages and voice/video calls.',
        
        // Photo library permissions
        NSPhotoLibraryUsageDescription: 'CRYB needs access to your photo library to share images and videos in chats.',
        NSPhotoLibraryAddUsageDescription: 'CRYB needs permission to save photos and videos you receive.',
        
        // Location permissions
        NSLocationWhenInUseUsageDescription: 'CRYB can optionally use your location to find nearby friends and servers.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'CRYB can optionally use your location to find nearby friends and servers.',
        
        // Contacts permissions
        NSContactsUsageDescription: 'CRYB can optionally access your contacts to help you find friends who are already using the app.',
        
        // Face ID / Touch ID
        NSFaceIDUsageDescription: 'CRYB uses Face ID and Touch ID for secure authentication and to protect your account.',
        
        // Background modes
        UIBackgroundModes: [
          'audio',
          'voip',
          'background-processing',
          'background-fetch',
        ],
        
        // Deep linking support
        CFBundleURLTypes: [
          {
            CFBundleURLName: 'cryb',
            CFBundleURLSchemes: ['cryb'],
          },
        ],
        
        // Security configurations
        NSAllowsArbitraryLoads: false,
        NSExceptionDomains: {
          'localhost': {
            NSExceptionAllowsInsecureHTTPLoads: IS_DEV,
          },
        },
        
        // Privacy configurations
        ITSAppUsesNonExemptEncryption: false,
        
        // Performance optimizations
        UILaunchStoryboardName: 'SplashScreen',
        UIRequiresFullScreen: false,
        UISupportedInterfaceOrientations: [
          'UIInterfaceOrientationPortrait',
          'UIInterfaceOrientationPortraitUpsideDown',
        ],
      },
      
      associatedDomains: [
        'applinks:cryb.app',
        'applinks:*.cryb.app',
      ],
      
      entitlements: {
        'com.apple.developer.associated-domains': [
          'applinks:cryb.app',
          'applinks:*.cryb.app',
        ],
        'aps-environment': IS_DEV ? 'development' : 'production',
      },
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      package: IS_DEV 
        ? 'app.cryb.android.dev' 
        : IS_STAGING 
        ? 'app.cryb.android.staging' 
        : 'app.cryb.android',
      versionCode: 1,
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      minSdkVersion: 21,
      
      permissions: [
        // Core permissions
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'ACCESS_WIFI_STATE',
        
        // Media permissions
        'CAMERA',
        'RECORD_AUDIO',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
        'READ_MEDIA_VIDEO',
        'READ_MEDIA_AUDIO',
        
        // Location permissions (optional)
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        
        // Contacts permission (optional)
        'READ_CONTACTS',
        
        // Biometric authentication
        'USE_FINGERPRINT',
        'USE_BIOMETRIC',
        
        // Background processing
        'WAKE_LOCK',
        'FOREGROUND_SERVICE',
        'BACKGROUND_SERVICE',
        
        // Notifications
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
        
        // System overlay (for call overlay)
        'SYSTEM_ALERT_WINDOW',
        
        // Phone state (for handling calls)
        'READ_PHONE_STATE',
        
        // Modify audio settings
        'MODIFY_AUDIO_SETTINGS',
      ],
      
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'cryb.app',
            },
            {
              scheme: 'https',
              host: '*.cryb.app',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
        {
          action: 'VIEW',
          data: {
            scheme: 'cryb',
          },
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      
      config: {
        // Firebase configuration
        googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
        
        // Network security config
        networkSecurityConfig: './android/app/src/main/res/xml/network_security_config.xml',
        
        // Proguard configuration
        proguardFiles: ['./android/app/proguard-rules.pro'],
      },
    },
    
    web: {
      favicon: './assets/favicon.png',
    },
    
    plugins: [
      'expo-camera',
      'expo-image-picker',
      'expo-notifications',
      'expo-localization',
      'expo-av',
      'expo-location',
      'expo-local-authentication',
      
      // Sentry plugin - commented out for now
      // [
      //   '@sentry/react-native/expo',
      //   {
      //     url: 'https://sentry.io/',
      //     project: process.env.SENTRY_PROJECT,
      //     organization: process.env.SENTRY_ORG,
      //   },
      // ],
      
      // Build plugins - commented out for now  
      // [
      //   'expo-build-properties',
      //   {
      //     android: {
      //       enableProguardInReleaseBuilds: true,
      //       enableShrinkResourcesInReleaseBuilds: true,
      //       compileSdkVersion: 34,
      //       targetSdkVersion: 34,
      //       minSdkVersion: 21,
      //       buildToolsVersion: '34.0.0',
      //       
      //       // Performance optimizations
      //       packagingOptions: {
      //         pickFirst: [
      //           '**/libc++_shared.so',
      //           '**/libjsc.so',
      //         ],
      //       },
      //     },
      //     ios: {
      //       deploymentTarget: '13.0',
      //       // iOS build optimizations
      //       bitcodeEnabled: false,
      //     },
      //   },
      // ],
    ],
    
    extra: {
      // Environment variables
      environment: process.env.EXPO_PUBLIC_ENVIRONMENT || (IS_DEV ? 'development' : IS_STAGING ? 'staging' : 'production'),
      apiUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://api.cryb.ai',
      wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'ws://api.cryb.ai',
      
      // App configuration
      appName: process.env.EXPO_PUBLIC_APP_NAME || 'CRYB',
      appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      debug: process.env.EXPO_PUBLIC_DEBUG === 'true',
      
      // Feature flags
      enableBiometrics: process.env.EXPO_PUBLIC_ENABLE_BIOMETRICS === 'true',
      enableVoiceChat: process.env.EXPO_PUBLIC_ENABLE_VOICE_CHAT === 'true',
      enableVideoChat: process.env.EXPO_PUBLIC_ENABLE_VIDEO_CHAT === 'true',
      enableScreenShare: process.env.EXPO_PUBLIC_ENABLE_SCREEN_SHARE === 'true',
      enableFileUpload: process.env.EXPO_PUBLIC_ENABLE_FILE_UPLOAD === 'true',
      enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
      enableWeb3: process.env.EXPO_PUBLIC_ENABLE_WEB3 === 'true',
      enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
      
      // Build configuration
      buildType: process.env.EXPO_PUBLIC_BUILD_TYPE || 'development',
      logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL || 'debug',
      
      // URLs
      webUrl: process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000',
      adminUrl: process.env.EXPO_PUBLIC_ADMIN_URL || 'http://localhost:3002',
      
      // Third-party services
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      walletConnectProjectId: process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID,
      
      // Firebase configuration
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },
      
      // Security configuration
      enableSslPinning: process.env.EXPO_PUBLIC_ENABLE_SSL_PINNING === 'true',
      apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000'),
      maxRetryAttempts: parseInt(process.env.EXPO_PUBLIC_MAX_RETRY_ATTEMPTS || '3'),
      
      // EAS configuration
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
    
    updates: {
      url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
      fallbackToCacheTimeout: 5000,
      checkAutomatically: 'ON_LOAD',
      enabled: !IS_DEV,
    },
    
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    
    // Experimental features
    experiments: {
      turboModules: true,
      newArchEnabled: false, // Enable when ready for new architecture
    },
    
    // Development configuration
    ...(IS_DEV && {
      developer: {
        tool: 'expo-cli',
        projectRoot: '../',
      },
      
      packagerOpts: {
        config: 'metro.config.js',
      },
    }),
    
    // Hooks for build process - commented out for now
    // hooks: {
    //   postPublish: [
    //     {
    //       file: 'sentry-expo/upload-sourcemaps',
    //       config: {
    //         organization: process.env.SENTRY_ORG,
    //         project: process.env.SENTRY_PROJECT,
    //         authToken: process.env.SENTRY_AUTH_TOKEN,
    //       },
    //     },
    //   ],
    // },
    
    // Privacy policy and terms
    privacy: 'public',
    
    // App metadata
    description: 'CRYB is a next-generation hybrid community platform that combines the best of Discord-like real-time communication with Web3 integration and blockchain technology.',
    
    githubUrl: 'https://github.com/your-org/cryb-platform',
    
    keywords: [
      'community',
      'chat',
      'voice',
      'video',
      'web3',
      'blockchain',
      'discord',
      'social',
    ],
    
    category: 'social',
    
    // Store configuration
    primaryColor: '#4a9eff',
    
    // Ownership
    owner: 'cryb-team',
  },
};