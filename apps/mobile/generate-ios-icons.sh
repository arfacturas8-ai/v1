#!/bin/bash

# GENERATE iOS APP ICONS
# This script generates all required iOS app icon sizes from the main icon

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required but not installed. Installing..."
    sudo apt-get update && sudo apt-get install -y imagemagick
fi

# Set paths
SOURCE_ICON="./assets/icon.png"
iOS_ICON_DIR="./ios/CRYB/Images.xcassets/AppIcon.appiconset"

echo "Generating iOS app icons from $SOURCE_ICON..."

# Create iOS icons directory if it doesn't exist
mkdir -p "$iOS_ICON_DIR"

# Generate all required sizes
convert "$SOURCE_ICON" -resize 20x20 "$iOS_ICON_DIR/App-Icon-20x20@1x.png"
convert "$SOURCE_ICON" -resize 40x40 "$iOS_ICON_DIR/App-Icon-20x20@2x.png"  
convert "$SOURCE_ICON" -resize 60x60 "$iOS_ICON_DIR/App-Icon-20x20@3x.png"

convert "$SOURCE_ICON" -resize 29x29 "$iOS_ICON_DIR/App-Icon-29x29@1x.png"
convert "$SOURCE_ICON" -resize 58x58 "$iOS_ICON_DIR/App-Icon-29x29@2x.png"
convert "$SOURCE_ICON" -resize 87x87 "$iOS_ICON_DIR/App-Icon-29x29@3x.png"

convert "$SOURCE_ICON" -resize 40x40 "$iOS_ICON_DIR/App-Icon-40x40@1x.png"
convert "$SOURCE_ICON" -resize 80x80 "$iOS_ICON_DIR/App-Icon-40x40@2x.png"
convert "$SOURCE_ICON" -resize 120x120 "$iOS_ICON_DIR/App-Icon-40x40@3x.png"

convert "$SOURCE_ICON" -resize 120x120 "$iOS_ICON_DIR/App-Icon-60x60@2x.png"
convert "$SOURCE_ICON" -resize 180x180 "$iOS_ICON_DIR/App-Icon-60x60@3x.png"

convert "$SOURCE_ICON" -resize 76x76 "$iOS_ICON_DIR/App-Icon-76x76@1x.png"
convert "$SOURCE_ICON" -resize 152x152 "$iOS_ICON_DIR/App-Icon-76x76@2x.png"

convert "$SOURCE_ICON" -resize 167x167 "$iOS_ICON_DIR/App-Icon-83.5x83.5@2x.png"

# Keep the existing 1024x1024 icon if it exists, otherwise create it
if [ ! -f "$iOS_ICON_DIR/App-Icon-1024x1024@1x.png" ]; then
    convert "$SOURCE_ICON" -resize 1024x1024 "$iOS_ICON_DIR/App-Icon-1024x1024@1x.png"
fi

echo "✅ iOS app icons generated successfully!"
echo "📱 Generated icons:"
ls -la "$iOS_ICON_DIR"/*.png

# Validate icon sizes
echo ""
echo "🔍 Validating icon sizes:"
for icon in "$iOS_ICON_DIR"/*.png; do
    if [ -f "$icon" ]; then
        size=$(identify -format "%wx%h" "$icon")
        echo "$(basename "$icon"): $size"
    fi
done