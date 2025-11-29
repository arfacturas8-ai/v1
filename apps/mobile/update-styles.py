#!/usr/bin/env python3
"""
Script to update React Native StyleSheet definitions to use responsive utilities
"""

import re
import os
import glob

# Mappings for responsive conversions
SPACING_MAP = {
    '4': 'spacing.xs',
    '8': 'spacing.sm',
    '12': 'spacing.md',
    '16': 'spacing.lg',
    '20': 'spacing.xl',
    '24': 'spacing.xxl',
    '32': 'spacing.xxxl',
    '40': 'spacing.xxxl',
}

FONT_SIZE_MAP = {
    '12': 'typography.caption',
    '13': 'typography.body2',
    '14': 'typography.body2',
    '15': 'typography.body1',
    '16': 'typography.body1',
    '17': 'typography.subtitle1',
    '18': 'typography.h6',
    '20': 'typography.h5',
    '22': 'typography.h5',
    '24': 'typography.h4',
    '26': 'typography.h4',
    '28': 'typography.h3',
    '30': 'typography.h3',
    '32': 'typography.h2',
    '34': 'typography.h2',
    '36': 'typography.h1',
}

def update_spacing_property(value):
    """Update spacing values to use responsive utilities"""
    match = re.match(r'^(\d+)$', value)
    if match:
        num = match.group(1)
        if num in SPACING_MAP:
            return SPACING_MAP[num]
    return value

def update_font_size(value):
    """Update fontSize values to use typography"""
    match = re.match(r'^(\d+)$', value)
    if match:
        num = match.group(1)
        if num in FONT_SIZE_MAP:
            return FONT_SIZE_MAP[num]
    return value

def add_tablet_specific_styles(content):
    """Add tablet-specific responsive styles"""

    # Pattern to find padding/margin properties
    def replace_spacing(match):
        prop = match.group(1)
        value = match.group(2)
        new_value = update_spacing_property(value)
        return f"{prop}: {new_value},"

    # Pattern to find fontSize properties
    def replace_font_size(match):
        value = match.group(1)
        new_value = update_font_size(value)
        return f"fontSize: {new_value},"

    # Update padding/margin values
    content = re.sub(r'(padding|margin|paddingHorizontal|paddingVertical|marginHorizontal|marginVertical|paddingTop|paddingBottom|paddingLeft|paddingRight|marginTop|marginBottom|marginLeft|marginRight): (\d+),', replace_spacing, content)

    # Update fontSize values
    content = re.sub(r'fontSize: (\d+),', replace_font_size, content)

    # Update gap values
    content = re.sub(r'gap: (\d+),', replace_spacing, content)

    # Add tablet-specific borderRadius where appropriate
    content = re.sub(r'borderRadius: 12,', 'borderRadius: deviceInfo.isTablet ? 14 : 12,', content)

    # Add tablet-specific icon sizes where we see size 24
    content = re.sub(r'size={24}', 'size={deviceInfo.isTablet ? scale(26) : scale(24)}', content)
    content = re.sub(r'size={20}', 'size={deviceInfo.isTablet ? scale(22) : scale(20)}', content)

    return content

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has StyleSheet
        if 'StyleSheet.create' not in content:
            return False

        # Check if file already uses responsive utilities (skip if heavily optimized)
        if content.count('deviceInfo.isTablet') > 5:
            print(f"  Skipping {filepath} (already optimized)")
            return False

        # Update the content
        original_content = content
        content = add_tablet_specific_styles(content)

        # Only write if content changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False

    except Exception as e:
        print(f"  Error processing {filepath}: {e}")
        return False

def main():
    """Main function to process all files"""
    screens_dir = '/home/ubuntu/cryb-platform/apps/mobile/src/screens'
    components_dir = '/home/ubuntu/cryb-platform/apps/mobile/src/components'

    count = 0

    print("Processing screens...")
    for filepath in glob.glob(f'{screens_dir}/**/*.tsx', recursive=True):
        if process_file(filepath):
            print(f"  ✓ Updated {os.path.basename(filepath)}")
            count += 1

    print("\nProcessing components...")
    for filepath in glob.glob(f'{components_dir}/**/*.tsx', recursive=True):
        if filepath.endswith('ResponsiveLayout.tsx'):
            continue  # Skip the responsive layout component itself
        if process_file(filepath):
            print(f"  ✓ Updated {os.path.basename(filepath)}")
            count += 1

    print(f"\n===== SUMMARY =====")
    print(f"Updated {count} files with responsive styles")
    print("Done!")

if __name__ == '__main__':
    main()
