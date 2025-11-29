#!/bin/bash

# iOS Build Configuration Verification Script
# This script verifies all iOS production build configurations are correct

set -e

echo "🔍 Verifying iOS Production Build Configuration..."
echo "================================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the mobile app directory."
    exit 1
fi

echo "✅ Directory structure verified"

# Check EAS configuration
echo ""
echo "📋 Checking EAS Configuration..."
if [ -f "eas.json" ]; then
    echo "✅ eas.json exists"
    
    # Check iOS production profile
    if grep -q '"production"' eas.json && grep -q '"ios"' eas.json; then
        echo "✅ iOS production profile found"
    else
        echo "❌ iOS production profile missing in eas.json"
        exit 1
    fi
    
    # Check bundle identifier
    if grep -q 'app.cryb.ios' eas.json; then
        echo "✅ Bundle identifier configured: app.cryb.ios"
    else
        echo "❌ Bundle identifier not found in eas.json"
        exit 1
    fi
    
    # Check API endpoints
    if grep -q 'api.cryb.ai:4000' eas.json; then
        echo "✅ Production API endpoint configured: api.cryb.ai:4000"
    else
        echo "❌ Production API endpoint not configured"
        exit 1
    fi
else
    echo "❌ eas.json not found"
    exit 1
fi

# Check app.config.js
echo ""
echo "⚙️ Checking App Configuration..."
if [ -f "app.config.js" ]; then
    echo "✅ app.config.js exists"
    
    # Check iOS bundle identifier
    if grep -q 'app.cryb.ios' app.config.js; then
        echo "✅ iOS bundle identifier configured in app.config.js"
    else
        echo "❌ iOS bundle identifier missing in app.config.js"
        exit 1
    fi
    
    # Check API URL fallbacks
    if grep -q 'api.cryb.ai:4000' app.config.js; then
        echo "✅ API URL fallbacks configured in app.config.js"
    else
        echo "❌ API URL fallbacks not configured"
        exit 1
    fi
else
    echo "❌ app.config.js not found"
    exit 1
fi

# Check iOS entitlements
echo ""
echo "🔐 Checking iOS Entitlements..."
if [ -f "ios/CRYB/CRYB.entitlements" ]; then
    echo "✅ iOS entitlements file exists"
    
    # Check production APS environment
    if grep -q '<string>production</string>' ios/CRYB/CRYB.entitlements; then
        echo "✅ APS environment set to production"
    else
        echo "❌ APS environment not set to production"
        exit 1
    fi
    
    # Check associated domains
    if grep -q 'cryb.app' ios/CRYB/CRYB.entitlements; then
        echo "✅ Associated domains configured"
    else
        echo "❌ Associated domains not configured"
        exit 1
    fi
else
    echo "❌ iOS entitlements file not found"
    exit 1
fi

# Check iOS app icons
echo ""
echo "🎨 Checking iOS App Icons..."
if [ -d "ios/CRYB/Images.xcassets/AppIcon.appiconset" ]; then
    echo "✅ App icon set directory exists"
    
    # Check for key icon sizes
    REQUIRED_ICONS=("App-Icon-1024x1024@1x.png" "App-Icon-60x60@3x.png" "App-Icon-60x60@2x.png")
    for icon in "${REQUIRED_ICONS[@]}"; do
        if [ -f "ios/CRYB/Images.xcassets/AppIcon.appiconset/$icon" ]; then
            echo "✅ $icon exists"
        else
            echo "❌ Missing required icon: $icon"
            exit 1
        fi
    done
    
    # Check Contents.json
    if [ -f "ios/CRYB/Images.xcassets/AppIcon.appiconset/Contents.json" ]; then
        echo "✅ Icon Contents.json exists"
        if grep -q 'ios-marketing' ios/CRYB/Images.xcassets/AppIcon.appiconset/Contents.json; then
            echo "✅ App Store marketing icon configured"
        else
            echo "❌ App Store marketing icon not configured"
            exit 1
        fi
    else
        echo "❌ Icon Contents.json missing"
        exit 1
    fi
else
    echo "❌ App icon set directory not found"
    exit 1
fi

# Check API service configuration
echo ""
echo "🌐 Checking API Service Configuration..."
if [ -f "src/services/RealApiService.ts" ]; then
    echo "✅ RealApiService.ts exists"
    
    # Check API endpoint
    if grep -q 'api.cryb.ai:4000' src/services/RealApiService.ts; then
        echo "✅ API service pointing to production endpoint"
    else
        echo "❌ API service not pointing to production endpoint"
        exit 1
    fi
else
    echo "❌ RealApiService.ts not found"
    exit 1
fi

# Check build scripts
echo ""
echo "🛠️ Checking Build Scripts..."
if [ -f "build-ios-production.sh" ] && [ -x "build-ios-production.sh" ]; then
    echo "✅ iOS production build script exists and is executable"
else
    echo "❌ iOS production build script missing or not executable"
    exit 1
fi

if [ -f "submit-ios-production.sh" ] && [ -x "submit-ios-production.sh" ]; then
    echo "✅ iOS submission script exists and is executable"
else
    echo "❌ iOS submission script missing or not executable"
    exit 1
fi

# Check package.json scripts
echo ""
echo "📜 Checking Package.json Scripts..."
if grep -q 'build:ios' package.json; then
    echo "✅ iOS build script defined in package.json"
else
    echo "❌ iOS build script missing in package.json"
    exit 1
fi

if grep -q 'submit:ios' package.json; then
    echo "✅ iOS submit script defined in package.json"
else
    echo "❌ iOS submit script missing in package.json"
    exit 1
fi

# Test API connectivity (optional)
echo ""
echo "🌍 Testing API Connectivity..."
if curl -s -f "http://api.cryb.ai:4000/health" > /dev/null; then
    echo "✅ Production API is reachable"
else
    echo "⚠️ Warning: Production API might not be reachable (this is optional)"
fi

echo ""
echo "🎉 iOS Production Build Configuration Verification Complete!"
echo "=========================================================="
echo ""
echo "✅ All critical configurations verified:"
echo "   - EAS configuration ready for production build"
echo "   - iOS bundle identifier: app.cryb.ios"
echo "   - API endpoint: http://api.cryb.ai:4000"
echo "   - Entitlements configured for production"
echo "   - App icons present and configured"
echo "   - Build scripts ready"
echo ""
echo "🚀 Ready to build! Run: ./build-ios-production.sh"
echo ""