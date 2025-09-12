#!/usr/bin/env python3
"""
Simple CRYB Mobile App Icon Generator
Creates basic app icons without text for compatibility
"""

from PIL import Image, ImageDraw
import os

# CRYB Brand Colors
COLORS = {
    'primary': (99, 102, 241),    # #6366f1 indigo-500
    'secondary': (79, 70, 229),   # #4f46e5 indigo-600  
    'background': (0, 0, 0),      # #000000 black
    'text': (255, 255, 255)       # #ffffff white
}

def create_main_icon():
    """Create main app icon (1024x1024)"""
    size = (1024, 1024)
    image = Image.new('RGB', size, COLORS['background'])
    draw = ImageDraw.Draw(image)
    
    # Draw gradient circle effect with multiple circles
    center = (512, 512)
    
    # Outer circle
    radius = 400
    circle_bbox = [center[0] - radius, center[1] - radius, 
                   center[0] + radius, center[1] + radius]
    draw.ellipse(circle_bbox, fill=COLORS['primary'])
    
    # Inner circle for depth
    inner_radius = 320
    inner_bbox = [center[0] - inner_radius, center[1] - inner_radius,
                  center[0] + inner_radius, center[1] + inner_radius]
    draw.ellipse(inner_bbox, fill=COLORS['secondary'])
    
    # Core circle
    core_radius = 200
    core_bbox = [center[0] - core_radius, center[1] - core_radius,
                 center[0] + core_radius, center[1] + core_radius]
    draw.ellipse(core_bbox, fill=COLORS['primary'])
    
    return image

def create_adaptive_icon():
    """Create Android adaptive icon (1024x1024)"""
    size = (1024, 1024)
    image = Image.new('RGBA', size, (0, 0, 0, 0))  # Transparent background
    draw = ImageDraw.Draw(image)
    
    # Draw circle pattern
    center = (512, 512)
    radius = 450
    circle_bbox = [center[0] - radius, center[1] - radius, 
                   center[0] + radius, center[1] + radius]
    draw.ellipse(circle_bbox, fill=COLORS['primary'])
    
    # Inner circle
    inner_radius = 350
    inner_bbox = [center[0] - inner_radius, center[1] - inner_radius,
                  center[0] + inner_radius, center[1] + inner_radius]
    draw.ellipse(inner_bbox, fill=COLORS['secondary'])
    
    # Center dot
    dot_radius = 150
    dot_bbox = [center[0] - dot_radius, center[1] - dot_radius,
                center[0] + dot_radius, center[1] + dot_radius]
    draw.ellipse(dot_bbox, fill=COLORS['text'])
    
    return image

def create_splash_screen():
    """Create splash screen (1284x2778)"""
    size = (1284, 2778)
    image = Image.new('RGB', size, COLORS['background'])
    draw = ImageDraw.Draw(image)
    
    # Draw circle in center
    center_x, center_y = size[0] // 2, size[1] // 2
    radius = 300
    circle_bbox = [center_x - radius, center_y - radius, 
                   center_x + radius, center_y + radius]
    draw.ellipse(circle_bbox, fill=COLORS['primary'])
    
    # Inner circle
    inner_radius = 220
    inner_bbox = [center_x - inner_radius, center_y - inner_radius,
                  center_x + inner_radius, center_y + inner_radius]
    draw.ellipse(inner_bbox, fill=COLORS['secondary'])
    
    # Center dot
    dot_radius = 100
    dot_bbox = [center_x - dot_radius, center_y - dot_radius,
                center_x + dot_radius, center_y + dot_radius]
    draw.ellipse(dot_bbox, fill=COLORS['text'])
    
    return image

def create_favicon():
    """Create favicon (48x48)"""
    size = (48, 48)
    image = Image.new('RGB', size, COLORS['background'])
    draw = ImageDraw.Draw(image)
    
    # Draw circle
    center = (24, 24)
    radius = 20
    circle_bbox = [center[0] - radius, center[1] - radius, 
                   center[0] + radius, center[1] + radius]
    draw.ellipse(circle_bbox, fill=COLORS['primary'])
    
    # Inner circle
    inner_radius = 12
    inner_bbox = [center[0] - inner_radius, center[1] - inner_radius,
                  center[0] + inner_radius, center[1] + inner_radius]
    draw.ellipse(inner_bbox, fill=COLORS['text'])
    
    return image

def main():
    print("🎨 Creating Simple CRYB Mobile App Icons...")
    
    try:
        # Create all icons
        icons = {
            'icon.png': (create_main_icon(), "1024x1024"),
            'adaptive-icon.png': (create_adaptive_icon(), "1024x1024"),
            'splash.png': (create_splash_screen(), "1284x2778"),
            'favicon.png': (create_favicon(), "48x48")
        }
        
        # Save all icons
        for filename, (image, dimensions) in icons.items():
            image.save(filename, 'PNG')
            print(f"✅ Created {filename} ({dimensions})")
        
        print("\n🎉 All CRYB app icons generated successfully!")
        print("📱 Icons are ready for mobile app builds")
        print("\n📋 Generated files:")
        print("   - icon.png (1024x1024) - Main app icon")
        print("   - adaptive-icon.png (1024x1024) - Android adaptive icon")
        print("   - splash.png (1284x2778) - Splash screen")
        print("   - favicon.png (48x48) - Web favicon")
        print("\n🎨 Icons feature the CRYB brand colors:")
        print("   - Primary: #6366f1 (Indigo)")
        print("   - Secondary: #4f46e5 (Dark Indigo)")
        print("   - Background: #000000 (Black)")
        
    except ImportError:
        print("❌ PIL (Pillow) library not found")
        print("💡 Install with: pip install Pillow")
        return False
    except Exception as e:
        print(f"❌ Error creating icons: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()