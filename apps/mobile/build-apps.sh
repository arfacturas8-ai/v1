#!/bin/bash

echo "================================================="
echo "   CRYB MOBILE APP BUILDER - Android & iOS"
echo "================================================="
echo ""

# Check if logged in
if ! eas whoami > /dev/null 2>&1; then
    echo "⚠️  You need to login to Expo first!"
    echo ""
    echo "1. Go to https://expo.dev and create a free account"
    echo "2. Run: eas login"
    echo "3. Enter your credentials"
    echo ""
    echo "Then run this script again!"
    exit 1
fi

echo "✅ Logged in as: $(eas whoami)"
echo ""

# Menu
echo "What would you like to build?"
echo ""
echo "1) Android APK only (fastest - 10-15 min)"
echo "2) iOS Simulator only (no Apple account needed)"
echo "3) Both Android & iOS"
echo "4) Production builds (requires certificates)"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo "Building Android APK..."
        eas build --platform android --profile preview
        ;;
    2)
        echo "Building iOS Simulator app..."
        eas build --platform ios --profile development
        ;;
    3)
        echo "Building both Android & iOS..."
        eas build --platform all --profile preview
        ;;
    4)
        echo "Building production versions..."
        eas build --platform all --profile production
        ;;
    *)
        echo "Invalid choice. Please run again and select 1-4"
        exit 1
        ;;
esac

echo ""
echo "================================================="
echo "Build initiated! Check status at:"
echo "https://expo.dev/accounts/[YOUR-USERNAME]/projects/cryb-mobile/builds"
echo "================================================="