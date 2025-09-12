#!/bin/bash

# CRYB App Icon Generation Script
# Creates placeholder icons using ImageMagick (if available) or base64 encoded images

echo "🎨 Creating CRYB Mobile App Icons..."

# Colors
PRIMARY_COLOR="#6366f1"
SECONDARY_COLOR="#4f46e5"
BACKGROUND_COLOR="#000000"
TEXT_COLOR="#ffffff"

# Function to create base64 encoded placeholder PNG (1x1 black pixel)
create_placeholder() {
  local file=$1
  local width=${2:-1024}
  local height=${3:-1024}
  
  # Create a simple black square placeholder
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==" | base64 -d > temp_1x1.png
  
  # If ImageMagick is available, create proper sized image
  if command -v convert >/dev/null 2>&1; then
    echo "📐 Creating $file (${width}x${height}) with ImageMagick..."
    convert -size ${width}x${height} xc:black \
            -fill "$PRIMARY_COLOR" -draw "circle $((width/2)),$((height/2)) $((width/2)),$((height/4))" \
            -fill white -pointsize $((width/8)) -gravity center \
            -annotate +0+0 "CRYB" "$file"
  else
    echo "⚠️  ImageMagick not found. Creating simple placeholder for $file"
    cp temp_1x1.png "$file"
  fi
  
  echo "✅ Created $file"
}

# Create assets directory if it doesn't exist
mkdir -p /home/ubuntu/cryb-platform/apps/mobile/assets
cd /home/ubuntu/cryb-platform/apps/mobile/assets

# Create app icons
create_placeholder "icon.png" 1024 1024
create_placeholder "adaptive-icon.png" 1024 1024  
create_placeholder "splash.png" 1284 2778
create_placeholder "favicon.png" 48 48

# Clean up temp file
rm -f temp_1x1.png

echo ""
echo "🎉 CRYB app icons generated successfully!"
echo "📱 Ready for mobile app builds"
echo ""
echo "📋 Generated files:"
echo "   - icon.png (1024x1024) - Main app icon"
echo "   - adaptive-icon.png (1024x1024) - Android adaptive icon"  
echo "   - splash.png (1284x2778) - Splash screen"
echo "   - favicon.png (48x48) - Web favicon"
echo ""
echo "💡 For production, consider creating professional icons with:"
echo "   - Proper CRYB branding and logo"
echo "   - High-quality graphics"
echo "   - Platform-specific optimizations"