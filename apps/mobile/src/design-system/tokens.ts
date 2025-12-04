/**
 * CRYB Mobile Design System - Tokens
 * Matches web design system for consistency across platforms
 */

export const colors = {
  // Backgrounds (darkest to lightest)
  'bg-primary': '#0D0D0D',
  'bg-secondary': '#141414',
  'bg-tertiary': '#1A1A1A',
  'bg-elevated': '#242424',
  'bg-hover': '#2A2A2A',

  // Brand
  'brand-primary': '#6366F1',
  'brand-secondary': '#818CF8',
  'brand-gradient-start': '#6366F1',
  'brand-gradient-end': '#818CF8',

  // Text
  'text-primary': '#FFFFFF',
  'text-secondary': '#A0A0A0',
  'text-tertiary': '#666666',
  'text-inverse': '#000000',
  'text-link': '#6366F1',

  // Semantic
  'success': '#00D26A',
  'warning': '#FFB800',
  'error': '#FF3B3B',
  'info': '#0095FF',

  // Interactive
  'link': '#6366F1',
  'link-hover': '#818CF8',

  // Borders
  'border-subtle': '#2A2A2A',
  'border-default': '#333333',
  'border-strong': '#444444',

  // Social-specific
  'social-like': '#FF3B3B',
  'social-repost': '#00D26A',
  'social-bookmark': '#FFB800',
  'social-comment': '#0095FF',

  // Crypto-specific
  'crypto-profit': '#00D26A',
  'crypto-loss': '#FF3B3B',
  'crypto-neutral': '#A0A0A0',
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  full: 9999,
  circle: '50%',
};

export const typography = {
  fontFamily: {
    sans: 'System',
    mono: 'Courier',
    display: 'System',
  },
  fontSize: {
    '2xs': 10,
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
    '9xl': 128,
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
    wider: 0.8,
    widest: 1.6,
  },
};

export const shadows = {
  none: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  '2xl': {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
  },
  // Glow effects
  'glow-brand': {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
  'glow-success': {
    shadowColor: '#00D26A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
  'glow-error': {
    shadowColor: '#FF3B3B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 0,
  },
};

export const animation = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 1000,
  },
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export const opacity = {
  0: 0,
  5: 0.05,
  10: 0.1,
  20: 0.2,
  30: 0.3,
  40: 0.4,
  50: 0.5,
  60: 0.6,
  70: 0.7,
  80: 0.8,
  90: 0.9,
  95: 0.95,
  100: 1,
};

export const blur = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  '2xl': 40,
  '3xl': 64,
};

export const borderWidth = {
  0: 0,
  1: 1,
  2: 2,
  4: 4,
  8: 8,
};

export const zIndex = {
  base: 0,
  below: -1,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1600,
  tooltip: 1700,
  notification: 1800,
  max: 9999,
};

// Export all tokens as a single object
export const tokens = {
  colors,
  spacing,
  radii,
  typography,
  shadows,
  animation,
  opacity,
  blur,
  borderWidth,
  zIndex,
};

export default tokens;
