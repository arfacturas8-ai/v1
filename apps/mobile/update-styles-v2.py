#!/usr/bin/env python3
"""
Script to update React Native StyleSheet definitions to use responsive utilities - Version 2
Handles all edge cases more carefully
"""

import re
import os
import glob

# Mappings for responsive conversions
SPACING_MAP = {
    4: 'spacing.xs',
    8: 'spacing.sm',
    12: 'spacing.md',
    16: 'spacing.lg',
    20: 'spacing.xl',
    24: 'spacing.xxl',
    32: 'spacing.xxxl',
    40: 'spacing.xxxl',
}

FONT_SIZE_MAP = {
    12: 'typography.caption',
    13: 'typography.body2',
    14: 'typography.body2',
    16: 'typography.body1',
    18: 'typography.h6',
    20: 'typography.h5',
    24: 'typography.h4',
    28: 'typography.h3',
    32: 'typography.h2',
    36: 'typography.h1',
}

def update_styles_in_stylesheet(content):
    """Update styling within StyleSheet.create blocks"""

    # Find all StyleSheet.create blocks
    pattern = r'const styles = StyleSheet\.create\({([^}]+(?:{[^}]+}[^}]+)*)\}\);'

    def process_stylesheet(match):
        styles_content = match.group(1)
        original = styles_content

        # Replace common spacing values with responsive utilities
        for px, responsive in SPACING_MAP.items():
            # Update padding and margin properties
            styles_content = re.sub(
                rf'\b(padding|margin|paddingHorizontal|paddingVertical|marginHorizontal|marginVertical|paddingTop|paddingBottom|paddingLeft|paddingRight|marginTop|marginBottom|marginLeft|marginRight|gap):\s*{px}\b',
                rf'\1: {responsive}',
                styles_content
            )

        # Replace font sizes
        for px, responsive in FONT_SIZE_MAP.items():
            styles_content = re.sub(
                rf'\bfontSize:\s*{px}\b',
                f'fontSize: {responsive}',
                styles_content
            )

        # Add tablet-specific borderRadius for common cases
        styles_content = re.sub(
            r'\bborderRadius:\s*12\b',
            'borderRadius: deviceInfo.isTablet ? 14 : 12',
            styles_content
        )

        styles_content = re.sub(
            r'\bborderRadius:\s*10\b',
            'borderRadius: deviceInfo.isTablet ? 12 : 10',
            styles_content
        )

        return f'const styles = StyleSheet.create({{{styles_content}}});'

    try:
        content = re.sub(pattern, process_stylesheet, content, flags=re.DOTALL)
    except Exception as e:
        print(f"    Error in regex replacement: {e}")

    return content

def update_icon_sizes(content):
    """Update Ionicons size props to be responsive"""
    content = re.sub(
        r'<Ionicons\s+([^>]*)size={24}([^>]*)/>',
        r'<Ionicons \1size={deviceInfo.isTablet ? scale(26) : scale(24)}\2/>',
        content
    )
    content = re.sub(
        r'<Ionicons\s+([^>]*)size={20}([^>]*)/>',
        r'<Ionicons \1size={deviceInfo.isTablet ? scale(22) : scale(20)}\2/>',
        content
    )
    return content

def process_file(filepath):
    """Process a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has StyleSheet
        if 'StyleSheet.create' not in content:
            return False

        # Check if file already uses responsive utilities extensively
        if content.count('deviceInfo.isTablet') > 10:
            return False

        # Update the content
        original_content = content
        content = update_styles_in_stylesheet(content)
        content = update_icon_sizes(content)

        # Only write if content changed
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True

        return False

    except Exception as e:
        print(f"    Error processing {filepath}: {e}")
        return False

def main():
    """Main function to process all files"""
    screens_dir = '/home/ubuntu/cryb-platform/apps/mobile/src/screens'
    components_dir = '/home/ubuntu/cryb-platform/apps/mobile/src/components'

    count = 0

    all_files = []
    all_files.extend(glob.glob(f'{screens_dir}/**/*.tsx', recursive=True))
    all_files.extend(glob.glob(f'{components_dir}/**/*.tsx', recursive=True))

    print(f"Processing {len(all_files)} files...")
    print()

    for filepath in all_files:
        if 'ResponsiveLayout.tsx' in filepath or 'responsive.ts' in filepath:
            continue

        if process_file(filepath):
            print(f"✓ Updated {os.path.basename(filepath)}")
            count += 1

    print(f"\n===== SUMMARY =====")
    print(f"Updated {count} files with responsive styles")
    print("Done!")

if __name__ == '__main__':
    main()
