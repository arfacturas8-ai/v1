# CRYB Mobile App Assets

This directory contains the assets required for the CRYB mobile application.

## Required Assets

### App Icons

Create the following icon files with the CRYB branding:

- `icon.png` (1024x1024) - Main app icon for both platforms
- `adaptive-icon.png` (1024x1024) - Android adaptive icon foreground
- `favicon.png` (48x48) - Web favicon

### Splash Screens

- `splash.png` (1284x2778) - Launch screen image
- Use the CRYB logo centered on a black background

### Icon Specifications

- **Style**: Modern, clean design with the CRYB logo
- **Colors**: Primary brand color (#6366f1) with black/white accents
- **Background**: For main icon use solid black (#000000)
- **Logo**: Should be clearly visible and recognizable at small sizes

## Branding Guidelines

- Primary Color: #6366f1 (indigo-500)
- Secondary Color: #4f46e5 (indigo-600) 
- Background: #000000 (black)
- Text: #ffffff (white)

## File Structure

```
assets/
├── README.md          # This file
├── icon.png          # Main app icon (1024x1024)
├── adaptive-icon.png  # Android adaptive icon (1024x1024)
├── splash.png        # Splash screen (1284x2778)
└── favicon.png       # Web favicon (48x48)
```

## Usage

These assets are automatically used by Expo/React Native during the build process:

- `icon.png` is used for iOS app icon and Android launcher icon
- `adaptive-icon.png` is used for Android adaptive icon foreground
- `splash.png` is displayed during app startup
- `favicon.png` is used when running on web

## Build Process

During the build process, Expo will automatically:

1. Generate all required iOS icon sizes from `icon.png`
2. Generate all required Android icon sizes and shapes
3. Create launch screens for different device sizes
4. Optimize assets for distribution

## Design Notes

The CRYB logo should convey:
- Modern technology and innovation
- Community and connection
- Reliability and trust
- Gaming/tech aesthetic

Recommended to work with a designer to create professional assets that represent the CRYB brand effectively.