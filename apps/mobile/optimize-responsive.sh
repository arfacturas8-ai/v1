#!/bin/bash

# Script to add responsive imports to all React Native screens and components
# This adds the responsive utilities import to files that don't have it

SCREENS_DIR="/home/ubuntu/cryb-platform/apps/mobile/src/screens"
COMPONENTS_DIR="/home/ubuntu/cryb-platform/apps/mobile/src/components"

# Counter for files modified
COUNT=0

# Function to add responsive import to a file
add_responsive_import() {
    local file="$1"

    # Check if file already has the responsive import
    if grep -q "from.*utils/responsive" "$file" || grep -q "from.*\.\.\/utils\/responsive" "$file" || grep -q "from.*\.\.\/\.\.\/utils\/responsive" "$file"; then
        echo "Skipping $file (already has responsive import)"
        return
    fi

    # Check if file has React Native imports
    if ! grep -q "from 'react-native'" "$file"; then
        echo "Skipping $file (not a React Native component)"
        return
    fi

    # Determine the correct relative path based on file location
    local relative_path
    if [[ "$file" == *"/src/screens/"* ]]; then
        if [[ "$file" == *"/src/screens/"*"/"* ]]; then
            # File is in a subdirectory of screens
            relative_path="../../utils/responsive"
        else
            # File is directly in screens
            relative_path="../utils/responsive"
        fi
    elif [[ "$file" == *"/src/components/"* ]]; then
        if [[ "$file" == *"/src/components/"*"/"* ]]; then
            # File is in a subdirectory of components
            relative_path="../../utils/responsive"
        else
            # File is directly in components
            relative_path="../utils/responsive"
        fi
    else
        echo "Skipping $file (unknown location)"
        return
    fi

    # Find the last import statement
    local last_import_line=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)

    if [ -n "$last_import_line" ]; then
        # Add the responsive import after the last import
        sed -i "${last_import_line}a\\import { deviceInfo, spacing, typography, scale } from '${relative_path}';" "$file"
        echo "Added responsive import to $file"
        ((COUNT++))
    else
        echo "Skipping $file (no imports found)"
    fi
}

# Process all TypeScript/TSX files in screens directory
echo "Processing screens..."
find "$SCREENS_DIR" -type f \( -name "*.tsx" -o -name "*.ts" \) | while read -r file; do
    add_responsive_import "$file"
done

# Process all TypeScript/TSX files in components directory
echo "Processing components..."
find "$COMPONENTS_DIR" -type f \( -name "*.tsx" -o -name "*.ts" \) | while read -r file; do
    add_responsive_import "$file"
done

echo ""
echo "===== SUMMARY ====="
echo "Modified $COUNT files"
echo "Responsive imports added successfully!"
