#!/usr/bin/env python3
"""
Simple CRYB Mobile App Icon Generator
Creates placeholder app icons with proper CRYB branding
"""

from PIL import Image, ImageDraw, ImageFont
import os

# CRYB Brand Colors
COLORS = {
    'primary': '#6366f1',    # indigo-500
    'secondary': '#4f46e5',  # indigo-600  
    'background': '#000000', # black
    'text': '#ffffff'        # white
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_main_icon():
    """Create main app icon (1024x1024)"""
    size = (1024, 1024)
    image = Image.new('RGBA', size, hex_to_rgb(COLORS['background']))
    draw = ImageDraw.Draw(image)
    
    # Draw gradient circle (simplified as solid circle)
    center = (512, 512)
    radius = 350
    
    # Draw circle with primary color
    circle_bbox = [center[0] - radius, center[1] - radius, 
                   center[0] + radius, center[1] + radius]
    draw.ellipse(circle_bbox, fill=hex_to_rgb(COLORS['primary']))
    
    # Add inner circle with secondary color for depth
    inner_radius = 300
    inner_bbox = [center[0] - inner_radius, center[1] - inner_radius,
                  center[0] + inner_radius, center[1] + inner_radius]
    draw.ellipse(inner_bbox, fill=hex_to_rgb(COLORS['secondary']))
    
    # Draw CRYB text - center manually since we can't calculate text size
    font = ImageFont.load_default()
    text = "CRYB"
    # Manually center the text (approximate)
    text_x = 460
    text_y = 500
    
    draw.text((text_x, text_y), text, fill=hex_to_rgb(COLORS['text']), font=font)
    
    return image

def create_adaptive_icon():
    """Create Android adaptive icon (1024x1024)"""
    size = (1024, 1024)
    image = Image.new('RGBA', size, (0, 0, 0, 0))  # Transparent background
    draw = ImageDraw.Draw(image)
    
    # Draw circle with primary color
    center = (512, 512)
    radius = 400
    circle_bbox = [center[0] - radius, center[1] - radius, 
                   center[0] + radius, center[1] + radius]
    draw.ellipse(circle_bbox, fill=hex_to_rgb(COLORS['primary']))
    
    # Add inner circle
    inner_radius = 350
    inner_bbox = [center[0] - inner_radius, center[1] - inner_radius,
                  center[0] + inner_radius, center[1] + inner_radius]
    draw.ellipse(inner_bbox, fill=hex_to_rgb(COLORS['secondary']))
    
    # Add text
    font = ImageFont.load_default()
    text = "CRYB"
    # Manually center the text (approximate)
    text_x = 460
    text_y = 500
    
    draw.text((text_x, text_y), text, fill=hex_to_rgb(COLORS['text']), font=font)
    
    return image

def create_splash_screen():
    """Create splash screen (1284x2778)"""
    size = (1284, 2778)
    image = Image.new('RGBA', size, hex_to_rgb(COLORS['background']))
    draw = ImageDraw.Draw(image)
    
    # Draw circle in center
    center_x, center_y = size[0] // 2, size[1] // 2
    radius = 250
    circle_bbox = [center_x - radius, center_y - radius, 
                   center_x + radius, center_y + radius]
    draw.ellipse(circle_bbox, fill=hex_to_rgb(COLORS['primary']))
    
    # Inner circle
    inner_radius = 200
    inner_bbox = [center_x - inner_radius, center_y - inner_radius,
                  center_x + inner_radius, center_y + inner_radius]
    draw.ellipse(inner_bbox, fill=hex_to_rgb(COLORS['secondary']))
    
    # Main CRYB text
    font = ImageFont.load_default()
    
    # Draw main text - centered manually
    text = "CRYB"
    text_x = center_x - 20  # Approximate center
    text_y = center_y - 10
    
    draw.text((text_x, text_y), text, fill=hex_to_rgb(COLORS['text']), font=font)
    
    # Draw tagline
    tagline = "Community Platform"
    tag_x = center_x - 60  # Approximate center
    tag_y = center_y + 30
    
    draw.text((tag_x, tag_y), tagline, fill=hex_to_rgb(COLORS['text']), font=font)
    
    return image

def create_favicon():
    """Create favicon (48x48)"""
    size = (48, 48)
    image = Image.new('RGBA', size, hex_to_rgb(COLORS['background']))
    draw = ImageDraw.Draw(image)
    
    # Draw circle
    center = (24, 24)
    radius = 18
    circle_bbox = [center[0] - radius, center[1] - radius, 
                   center[0] + radius, center[1] + radius]
    draw.ellipse(circle_bbox, fill=hex_to_rgb(COLORS['primary']))
    
    # Draw C letter
    font = ImageFont.load_default()
    text = "C"
    # Manually center
    text_x = 20
    text_y = 19
    
    draw.text((text_x, text_y), text, fill=hex_to_rgb(COLORS['text']), font=font)
    
    return image

def main():
    print("🎨 Creating CRYB Mobile App Icons...")
    
    try:
        # Create all icons
        icons = {
            'icon.png': create_main_icon(),
            'adaptive-icon.png': create_adaptive_icon(),
            'splash.png': create_splash_screen(),
            'favicon.png': create_favicon()
        }
        
        # Save all icons
        for filename, image in icons.items():
            image.save(filename, 'PNG')
            print(f"✅ Created {filename} ({image.size[0]}x{image.size[1]})")
        
        print("\n🎉 All CRYB app icons generated successfully!")
        print("📱 Icons are ready for mobile app builds")
        
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