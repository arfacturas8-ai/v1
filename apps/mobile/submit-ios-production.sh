#!/bin/bash

# iOS App Store Submission Script for CRYB App
# This script submits the built IPA to App Store Connect

set -e

echo "📱 Starting iOS App Store Submission for CRYB App..."
echo "==================================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the mobile app directory."
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ Error: EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Login check
echo "🔐 Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    echo "❌ Not logged in to EAS. Please login:"
    eas login
fi

# Verify submission configuration
echo "🔍 Verifying submission configuration..."
echo ""
echo "Bundle Identifier: app.cryb.ios"
echo "App Name: CRYB"
echo "Company: CRYB Team"
echo ""

# Check if credentials are configured
read -p "❓ Have you configured your Apple ID and App Store Connect credentials in eas.json? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📝 Please update the following in eas.json submit.production.ios section:"
    echo "   - appleId: your-apple-id@email.com"
    echo "   - ascAppId: your-app-store-connect-app-id"
    echo "   - appleTeamId: your-apple-developer-team-id"
    echo ""
    echo "You can find these values in:"
    echo "   - Apple Developer Account: https://developer.apple.com/account/"
    echo "   - App Store Connect: https://appstoreconnect.apple.com/"
    echo ""
    exit 1
fi

# Submit to App Store
echo "🚀 Submitting to App Store Connect..."
echo ""
echo "This will:"
echo "1. Upload the latest production build to App Store Connect"
echo "2. Submit for App Store review"
echo "3. Provide a submission receipt"
echo ""

read -p "❓ Continue with submission? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Submission cancelled."
    exit 1
fi

# Start submission
eas submit --platform ios --profile production

echo ""
echo "✅ iOS App Store submission completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check App Store Connect for submission status"
echo "2. Respond to any review feedback if needed"
echo "3. Monitor for app approval (typically 1-7 days)"
echo ""
echo "🔗 App Store Connect: https://appstoreconnect.apple.com/"
echo "📚 Review Guidelines: https://developer.apple.com/app-store/review/guidelines/"