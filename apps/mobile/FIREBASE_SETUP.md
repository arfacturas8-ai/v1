# Firebase Configuration Guide for CRYB Mobile App

This guide explains how to set up Firebase for push notifications in the CRYB mobile app.

## Prerequisites

1. Google account
2. Firebase project created at https://console.firebase.google.com
3. iOS and Android apps registered in Firebase project

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Create a project"
3. Enter project name: `cryb-mobile`
4. Enable Google Analytics (recommended)
5. Choose Analytics account
6. Click "Create project"

## Step 2: Add iOS App

1. In Firebase console, click "Add app" → iOS
2. Enter iOS Bundle ID: `app.cryb.ios`
3. Enter App nickname: `CRYB iOS`
4. Enter App Store ID: (leave blank for now)
5. Click "Register app"
6. Download `GoogleService-Info.plist`
7. Place the file in `ios/` directory

### iOS Configuration

Add the following to `ios/cryb/Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
    <string>background-fetch</string>
</array>
```

## Step 3: Add Android App

1. In Firebase console, click "Add app" → Android
2. Enter Android package name: `app.cryb.android`
3. Enter App nickname: `CRYB Android`
4. Enter SHA-1 certificate (for development, you can skip)
5. Click "Register app"
6. Download `google-services.json`
7. Place the file in `android/app/` directory

### Android Configuration

The app.config.js is already configured to use the Google Services file.

## Step 4: Enable Firebase Cloud Messaging (FCM)

1. In Firebase console, go to "Cloud Messaging"
2. Note down the Server key (for backend integration)
3. Configure messaging settings as needed

## Step 5: Configure Environment Variables

Update your environment files with Firebase configuration:

### Development (.env.development)
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-development-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=cryb-dev.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=cryb-dev
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=cryb-dev.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-dev-app-id
```

### Production (.env.production)
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-production-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=cryb.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=cryb
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=cryb.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-prod-app-id
```

## Step 6: Backend Integration

Add the Firebase Server Key to your backend environment:

```bash
FIREBASE_SERVER_KEY=your-firebase-server-key
```

Use this key to send push notifications from the backend to mobile clients.

## Step 7: Test Push Notifications

### Testing from Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send your first message"
3. Enter notification title and text
4. Select target app
5. Send test message

### Testing from Backend

The mobile app includes a comprehensive push notification service that handles:

- Token registration
- Foreground/background notifications
- Deep linking from notifications
- Notification permissions
- Badge counts

## Security Best Practices

1. **Never commit Firebase config files to public repositories**
2. **Use different Firebase projects for dev/staging/production**
3. **Implement proper token refresh logic**
4. **Handle notification permissions gracefully**
5. **Validate notification payloads on backend**

## Push Notification Features

The CRYB mobile app supports:

### Notification Types
- New messages
- Friend requests
- Server invites
- System announcements
- Voice/video call notifications

### Notification Actions
- Reply to messages directly from notification
- Accept/decline friend requests
- Join voice channels
- Quick actions without opening app

### Deep Linking
- Navigate to specific screens from notifications
- Open specific chats or servers
- Handle complex navigation flows

## Troubleshooting

### Common Issues

1. **Notifications not received on iOS**
   - Check if push notifications are enabled in device settings
   - Verify APNs certificate is properly configured
   - Ensure app has notification permissions

2. **Notifications not received on Android**
   - Check if google-services.json is in correct location
   - Verify Firebase project configuration
   - Check if battery optimization is disabled

3. **Token registration fails**
   - Check internet connectivity
   - Verify Firebase configuration
   - Check if Firebase project is active

### Debug Steps

1. Enable debug logging in development
2. Check device logs for Firebase errors
3. Verify token registration in Firebase console
4. Test with Firebase console first
5. Check backend integration

## Production Deployment

Before deploying to production:

1. **Update Firebase project settings**
2. **Configure production certificates**
3. **Set up proper analytics**
4. **Test on real devices**
5. **Monitor push notification delivery rates**

## Monitoring

Set up monitoring for:
- Push notification delivery rates
- Token registration success rates
- Notification engagement metrics
- Error rates and failed deliveries

## Support

For Firebase-related issues:
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
- Expo Push Notifications: https://docs.expo.dev/push-notifications/

---

This configuration ensures reliable push notifications across iOS and Android platforms with proper error handling and monitoring capabilities.