#!/bin/bash

# CRYB App Icon Generator
# Generates all required app icons for iOS and Android

echo "🎨 Generating CRYB app icons..."

# Create directories
mkdir -p assets/app-store/ios
mkdir -p assets/app-store/android

# CRYB brand colors
GRADIENT="gradient:radial-#6B46C1-#3B82F6"
BACKGROUND="#1F2937"
TEXT_COLOR="#FFFFFF"

# Base icon design (1024x1024)
echo "Creating base icon..."
convert -size 1024x1024 \
  -background "$BACKGROUND" \
  -fill "$GRADIENT" \
  -gravity center \
  xc:"$BACKGROUND" \
  -draw "roundrectangle 100,100 924,924 50,50" \
  -fill "$TEXT_COLOR" \
  -font "Arial-Bold" \
  -pointsize 400 \
  -annotate +0+50 "C" \
  assets/app-store/icon-base.png

# iOS Icons
echo "Generating iOS icons..."
convert assets/app-store/icon-base.png -resize 1024x1024 assets/app-store/ios/icon-1024.png
convert assets/app-store/icon-base.png -resize 180x180 assets/app-store/ios/icon-180.png
convert assets/app-store/icon-base.png -resize 120x120 assets/app-store/ios/icon-120.png
convert assets/app-store/icon-base.png -resize 152x152 assets/app-store/ios/icon-152.png
convert assets/app-store/icon-base.png -resize 167x167 assets/app-store/ios/icon-167.png
convert assets/app-store/icon-base.png -resize 76x76 assets/app-store/ios/icon-76.png
convert assets/app-store/icon-base.png -resize 60x60 assets/app-store/ios/icon-60.png
convert assets/app-store/icon-base.png -resize 40x40 assets/app-store/ios/icon-40.png
convert assets/app-store/icon-base.png -resize 29x29 assets/app-store/ios/icon-29.png
convert assets/app-store/icon-base.png -resize 20x20 assets/app-store/ios/icon-20.png

# Android Icons
echo "Generating Android icons..."
convert assets/app-store/icon-base.png -resize 512x512 assets/app-store/android/icon-512.png
convert assets/app-store/icon-base.png -resize 192x192 assets/app-store/android/icon-192.png
convert assets/app-store/icon-base.png -resize 144x144 assets/app-store/android/icon-144.png
convert assets/app-store/icon-base.png -resize 96x96 assets/app-store/android/icon-96.png
convert assets/app-store/icon-base.png -resize 72x72 assets/app-store/android/icon-72.png
convert assets/app-store/icon-base.png -resize 48x48 assets/app-store/android/icon-48.png
convert assets/app-store/icon-base.png -resize 36x36 assets/app-store/android/icon-36.png

# Adaptive icon for Android (foreground and background)
echo "Creating Android adaptive icons..."
convert -size 512x512 xc:"$BACKGROUND" assets/app-store/android/icon-background.png
convert assets/app-store/icon-base.png -resize 512x512 assets/app-store/android/icon-foreground.png

echo "✅ App icons generated successfully!"
echo "📁 Icons saved in: assets/app-store/"

# Copy to Expo assets
echo "Copying to Expo assets..."
cp assets/app-store/icon-base.png assets/icon.png
cp assets/app-store/android/icon-512.png assets/adaptive-icon.png

echo "🎉 All app icons ready for submission!"