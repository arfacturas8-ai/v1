/**
 * RESPONSIVE DESIGN UTILITIES
 * Provides utilities for responsive design across different device sizes
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device size categories
export const DEVICE_SIZES = {
  SMALL_PHONE: 375,    // iPhone SE, smaller Android phones
  PHONE: 414,          // Standard phones (iPhone 11, Pixel)
  LARGE_PHONE: 428,    // Large phones (iPhone 13 Pro Max)
  SMALL_TABLET: 768,   // iPad Mini, small tablets
  TABLET: 1024,        // Standard tablets
  LARGE_TABLET: 1366,  // Large tablets, iPad Pro
} as const;

// Current device info
export const deviceInfo = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  aspectRatio: SCREEN_HEIGHT / SCREEN_WIDTH,
  isSmallDevice: SCREEN_WIDTH < DEVICE_SIZES.PHONE,
  isPhone: SCREEN_WIDTH < DEVICE_SIZES.SMALL_TABLET,
  isTablet: SCREEN_WIDTH >= DEVICE_SIZES.SMALL_TABLET,
  isLargeTablet: SCREEN_WIDTH >= DEVICE_SIZES.TABLET,
  isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
  platform: Platform.OS,
  pixelRatio: PixelRatio.get(),
};

// Responsive scaling functions
export const scale = (size: number): number => {
  const baseWidth = DEVICE_SIZES.PHONE; // Base design width
  return (SCREEN_WIDTH / baseWidth) * size;
};

export const scaleFont = (size: number): number => {
  const baseWidth = DEVICE_SIZES.PHONE;
  const scaledSize = (SCREEN_WIDTH / baseWidth) * size;
  
  // Limit font scaling to prevent too large or too small fonts
  const minScale = 0.8;
  const maxScale = 1.3;
  const scale = Math.max(minScale, Math.min(maxScale, SCREEN_WIDTH / baseWidth));
  
  return size * scale;
};

export const scaleHeight = (size: number): number => {
  const baseHeight = 896; // Base design height (iPhone 11)
  return (SCREEN_HEIGHT / baseHeight) * size;
};

// Responsive spacing
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  lg: scale(16),
  xl: scale(20),
  xxl: scale(24),
  xxxl: scale(32),
};

// Responsive font sizes
export const typography = {
  caption: scaleFont(12),
  body2: scaleFont(14),
  body1: scaleFont(16),
  subtitle2: scaleFont(14),
  subtitle1: scaleFont(16),
  h6: scaleFont(18),
  h5: scaleFont(20),
  h4: scaleFont(24),
  h3: scaleFont(28),
  h2: scaleFont(32),
  h1: scaleFont(36),
};

// Responsive breakpoints
export const breakpoints = {
  isSmallPhone: SCREEN_WIDTH < DEVICE_SIZES.SMALL_PHONE,
  isPhone: SCREEN_WIDTH >= DEVICE_SIZES.SMALL_PHONE && SCREEN_WIDTH < DEVICE_SIZES.SMALL_TABLET,
  isTablet: SCREEN_WIDTH >= DEVICE_SIZES.SMALL_TABLET && SCREEN_WIDTH < DEVICE_SIZES.TABLET,
  isLargeTablet: SCREEN_WIDTH >= DEVICE_SIZES.TABLET,
};

// Device-specific styles
export const getDeviceSpecificStyle = <T>(styles: {
  smallPhone?: T;
  phone?: T;
  tablet?: T;
  largeTablet?: T;
}): T | undefined => {
  if (breakpoints.isLargeTablet && styles.largeTablet) return styles.largeTablet;
  if (breakpoints.isTablet && styles.tablet) return styles.tablet;
  if (breakpoints.isPhone && styles.phone) return styles.phone;
  if (breakpoints.isSmallPhone && styles.smallPhone) return styles.smallPhone;
  
  // Fallback to phone styles if available
  return styles.phone || styles.tablet;
};

// Responsive padding/margin helpers
export const responsivePadding = {
  horizontal: deviceInfo.isTablet ? spacing.xxl : spacing.lg,
  vertical: deviceInfo.isTablet ? spacing.xl : spacing.md,
  container: deviceInfo.isTablet ? spacing.xxxl : spacing.lg,
};

// Layout helpers
export const layout = {
  // Number of columns for grid layouts
  gridColumns: deviceInfo.isTablet ? 3 : 2,
  largeGridColumns: deviceInfo.isLargeTablet ? 4 : deviceInfo.isTablet ? 3 : 2,
  
  // Content widths
  maxContentWidth: deviceInfo.isTablet ? 800 : SCREEN_WIDTH,
  sidebarWidth: deviceInfo.isTablet ? 280 : 0,
  
  // List item heights
  listItemHeight: deviceInfo.isTablet ? scale(64) : scale(56),
  cardMinHeight: deviceInfo.isTablet ? scale(200) : scale(160),
  
  // Header heights
  headerHeight: deviceInfo.isTablet ? scale(64) : scale(56),
  tabBarHeight: deviceInfo.isTablet ? scale(60) : scale(50),
};

// Tablet-specific helpers
export const tablet = {
  // Two-column layout for tablets
  useTwoColumns: deviceInfo.isTablet,
  masterDetailLayout: deviceInfo.isLargeTablet,
  
  // Modal sizes
  modalWidth: Math.min(600, SCREEN_WIDTH * 0.9),
  modalMaxHeight: SCREEN_HEIGHT * 0.8,
  
  // Popover positioning
  popoverWidth: 320,
  popoverMaxHeight: 400,
};

// Safe area helpers (for devices with notches)
export const getSafeAreaPadding = () => {
  const hasNotch = deviceInfo.height >= 812; // iPhone X and newer
  
  return {
    top: hasNotch ? 44 : 20,
    bottom: hasNotch ? 34 : 0,
  };
};

// Responsive image dimensions
export const getImageDimensions = (aspectRatio = 16/9) => {
  const maxWidth = deviceInfo.isTablet ? 600 : SCREEN_WIDTH - (spacing.lg * 2);
  const height = maxWidth / aspectRatio;
  
  return {
    width: maxWidth,
    height: Math.min(height, SCREEN_HEIGHT * 0.4),
  };
};

// Animation durations (slightly longer on tablets)
export const animations = {
  fast: deviceInfo.isTablet ? 200 : 150,
  normal: deviceInfo.isTablet ? 300 : 250,
  slow: deviceInfo.isTablet ? 500 : 400,
};

// Responsive hit slop for touchables
export const hitSlop = {
  small: scale(8),
  medium: scale(12),
  large: scale(16),
};

// Debug helper to log device info
export const logDeviceInfo = () => {
  console.log('🔍 Device Info:', {
    dimensions: `${SCREEN_WIDTH}x${SCREEN_HEIGHT}`,
    type: deviceInfo.isTablet ? 'tablet' : 'phone',
    platform: deviceInfo.platform,
    pixelRatio: deviceInfo.pixelRatio,
    breakpoint: breakpoints.isLargeTablet 
      ? 'largeTablet' 
      : breakpoints.isTablet 
        ? 'tablet' 
        : breakpoints.isSmallPhone 
          ? 'smallPhone' 
          : 'phone'
  });
};

// Hook for responsive values (for use with React components)
export const useResponsiveValue = <T>(values: {
  smallPhone?: T;
  phone?: T;
  tablet?: T;
  largeTablet?: T;
}): T => {
  const responsive = getDeviceSpecificStyle(values);
  return responsive || values.phone || values.tablet || values.smallPhone!;
};