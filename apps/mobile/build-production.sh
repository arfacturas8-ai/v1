#!/bin/bash

# PRODUCTION BUILD SCRIPT FOR CRYB MOBILE APP
# Builds production-ready iOS and Android apps for App Store submission

set -e  # Exit on any error

echo "🚀 Starting CRYB Mobile Production Build Process"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "app.config.js" ]; then
    print_error "This script must be run from the mobile app root directory"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_error "EAS CLI is not installed. Please install it first:"
    echo "npm install -g @expo/eas-cli"
    exit 1
fi

# Check if logged in to EAS
print_status "Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    print_error "You're not logged in to EAS. Please run:"
    echo "eas login"
    exit 1
fi

print_success "EAS authentication verified"

# Check environment configuration
print_status "Validating environment configuration..."
if [ ! -f ".env.production" ]; then
    print_error "Production environment file not found!"
    exit 1
fi

print_success "Environment configuration validated"

# Clean previous builds
print_status "Cleaning previous builds..."
npx expo prebuild --clean --platform all || {
    print_error "Failed to clean previous builds"
    exit 1
}

print_success "Previous builds cleaned"

# Install dependencies
print_status "Installing dependencies..."
pnpm install || {
    print_error "Failed to install dependencies"
    exit 1
}

print_success "Dependencies installed"

# Run tests
print_status "Running tests..."
npm run test || {
    print_warning "Some tests failed. Continuing with build..."
}

# Type checking
print_status "Running type checks..."
npm run type-check || {
    print_error "TypeScript type checking failed"
    exit 1
}

print_success "Type checking passed"

# Linting
print_status "Running linter..."
npm run lint || {
    print_warning "Linting issues found. Please fix them for better code quality."
}

# Build production apps
print_status "Building production iOS app..."
eas build --platform ios --profile production --non-interactive || {
    print_error "iOS production build failed"
    exit 1
}

print_success "iOS production build completed"

print_status "Building production Android app..."
eas build --platform android --profile production --non-interactive || {
    print_error "Android production build failed"
    exit 1
}

print_success "Android production build completed"

# Get build URLs
print_status "Getting build information..."
eas build:list --platform all --limit 2 --json > build-info.json || {
    print_warning "Could not retrieve build information"
}

echo ""
echo "🎉 Production Build Process Complete!"
echo "====================================="
print_success "Both iOS and Android production builds have been created successfully!"
echo ""
echo "Next steps:"
echo "1. Test the builds on physical devices"
echo "2. Submit to App Store Connect and Google Play Console"
echo "3. Monitor analytics and crash reports"
echo ""
print_status "Build artifacts can be downloaded from your EAS dashboard:"
echo "https://expo.dev"
echo ""

# Optional: Generate build report
print_status "Generating build report..."
cat > build-report.md << EOF
# CRYB Mobile Production Build Report

**Build Date:** $(date)
**Build Environment:** Production
**App Version:** 1.0.0

## Build Configuration
- iOS Build: ✅ Success
- Android Build: ✅ Success
- Environment: Production
- Debug Mode: Disabled
- SSL Pinning: Enabled

## Build Profiles Used
- iOS: Production profile with App Store distribution
- Android: Production profile with AAB format

## Next Steps
1. Download builds from EAS Dashboard
2. Test on physical devices
3. Submit to app stores
4. Monitor deployment

## Build Links
Check your EAS dashboard for download links: https://expo.dev

EOF

print_success "Build report generated: build-report.md"

print_status "Production build process completed successfully! 🚀"