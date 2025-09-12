# CRYB Mobile App Setup & Testing Guide

This guide will help you run and test the CRYB mobile app on iOS and Android devices.

## ✅ Current Status

The CRYB mobile app is **READY FOR TESTING**! All configurations have been validated:

- ✅ API connection configured to port 3002
- ✅ WebSocket connection configured to port 3002  
- ✅ All critical files are present
- ✅ Metro bundler is running successfully
- ✅ Authentication endpoints are accessible

## 🚀 Quick Start

### Prerequisites

1. **API Server**: Make sure the CRYB API is running on port 3002
   ```bash
   cd /home/ubuntu/cryb-platform/apps/api
   npm run dev
   ```

2. **Metro Bundler**: Make sure the mobile development server is running
   ```bash
   cd /home/ubuntu/cryb-platform/apps/mobile
   npm start
   ```

3. **Expo Go App**: Install on your testing device
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 📱 Testing on Physical Devices

### Method 1: QR Code (Recommended)
1. Make sure your mobile device is on the same WiFi network as the development machine
2. Open Expo Go app on your device
3. Scan the QR code displayed in the terminal when you run `npm start`
4. The app will load on your device

### Method 2: Development URL
1. In the terminal, look for the connection URL (usually shows as `exp://192.168.x.x:8081`)
2. Open Expo Go app
3. Manually enter the connection URL
4. The app will load on your device

### Method 3: Tunnel (if on different networks)
1. Run with tunnel: `npx expo start --tunnel`
2. Follow the QR code or URL method above

## 🧪 Testing Authentication

### Test Login Flow
1. Launch the app - you should see the Welcome screen
2. Navigate to Login screen
3. Try to login with invalid credentials - you should see appropriate error messages
4. The API will respond with validation errors as expected

### Test Registration Flow
1. From Welcome screen, navigate to Register
2. Try registering with invalid data - you should see validation errors
3. Try registering with valid data to create a test account

### Expected Behavior
- **Invalid credentials**: Should show "Invalid credentials" error
- **Network issues**: Should show appropriate network error messages
- **Validation errors**: Should show field-specific validation messages
- **Success**: Should navigate to main app with Home screen

## 🏗️ Development Commands

### Start Development Server
```bash
cd /home/ubuntu/cryb-platform/apps/mobile
npm start
```

### Run on Specific Platform
```bash
# For iOS (requires macOS with Xcode)
npm run ios

# For Android (requires Android Studio/SDK)
npm run android

# For web version
npx expo start --web
```

### Other Useful Commands
```bash
# Clear Metro cache
npm run clean

# Check for issues
node validate-mobile-app.js

# Run tests
npm test

# TypeScript checking
npm run type-check

# Linting
npm run lint
```

## 🔧 Troubleshooting

### Metro Bundler Issues
```bash
# Clear cache and restart
npx expo r -c
npm start
```

### Connection Issues
1. Ensure your device and development machine are on the same network
2. Check if port 8081 is accessible
3. Try using tunnel mode: `npx expo start --tunnel`

### API Connection Issues
1. Verify API is running: `curl http://localhost:3002/api/v1/auth/login`
2. Check the `.env.development` file has correct API URL
3. Restart the Metro bundler to pick up environment changes

### Build Issues
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Clear Expo cache
npx expo r -c
```

## 📊 Current Configuration

### Environment Variables (Development)
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3002
EXPO_PUBLIC_WS_URL=ws://localhost:3002
EXPO_PUBLIC_ENVIRONMENT=development
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_MAX_RETRY_ATTEMPTS=3
```

### Network Configuration
- **API Server**: `http://localhost:3002`
- **WebSocket**: `ws://localhost:3002`
- **Metro Bundler**: `http://localhost:8081`
- **Web Version**: `http://localhost:19006` (when using --web)

## 🎯 What's Working

### ✅ Authentication System
- Login screen with validation
- Register screen with validation
- Biometric authentication support (on compatible devices)
- Token management and refresh
- Error handling and user feedback

### ✅ Navigation
- Welcome → Login/Register flow
- Main app with bottom tabs (Home, Chat, Communities, Profile)
- Stack navigation for detailed screens
- Proper screen transitions and back button handling

### ✅ API Integration
- All endpoints correctly configured
- Network error handling
- Retry logic for failed requests
- Proper request/response handling

### ✅ Core Features
- Theme support (light/dark mode)
- Responsive design for different screen sizes
- Safe area handling
- Keyboard management
- Loading states and error boundaries

## 🔄 Development Workflow

1. **Start the backend API** (always first)
   ```bash
   cd /home/ubuntu/cryb-platform/apps/api && npm run dev
   ```

2. **Start the mobile development server**
   ```bash
   cd /home/ubuntu/cryb-platform/apps/mobile && npm start
   ```

3. **Test on device using Expo Go**
   - Scan QR code or enter URL
   - Test authentication flows
   - Verify navigation works
   - Check error handling

4. **Make changes and test**
   - Save files to trigger hot reload
   - Shake device to access Expo development menu
   - Use developer tools for debugging

## 📝 Next Steps for Production

1. **Build Configuration**: Use `eas build` for production builds
2. **Environment Setup**: Configure production API URLs
3. **Store Submission**: Use build guides for App Store and Google Play
4. **Testing**: Implement comprehensive test suite
5. **CI/CD**: Set up automated builds and testing

## 🆘 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Run the validation script: `node validate-mobile-app.js`
3. Check Metro bundler logs in terminal
4. Verify API server is running and accessible
5. Ensure all environment variables are properly set

The mobile app is now fully configured and ready for development and testing!