#!/bin/bash

cd /home/ubuntu/cryb-platform/apps/react-app

# Create a simple colored square as placeholder icon using ImageMagick
for size in 16 32 72 96 128 144 152 192 384 512; do
    convert -size ${size}x${size} xc:'#3b82f6' \
            -fill white \
            -gravity center \
            -pointsize $((size/4)) \
            -annotate +0+0 'C' \
            public/icons/icon-${size}x${size}.png
done

echo "Icons created successfully"

# Copy to dist folder as well
cp -r public/icons/* dist/icons/ 2>/dev/null || true