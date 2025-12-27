/**
 * CRYB.AI Design System Tokens
 * Complete foundation for all styling across the platform
 * OpenSea-inspired dark, sleek, modern aesthetic
 */

export const colors = {
  // Backgrounds (iOS Light Theme)
  'bg-primary': '#FAFAFA',
  'bg-secondary': '#FFFFFF',
  'bg-tertiary': '#F8F9FA',
  'bg-elevated': '#FFFFFF',
  'bg-hover': '#F0F2F5',
  'bg-overlay': 'rgba(0, 0, 0, 0.5)',

  // Brand
  'brand-primary': '#58a6ff',
  'brand-secondary': '#a371f7',
  'brand-tertiary': '#8B5CF6',
  'brand-gradient': 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
  'brand-gradient-hover': 'linear-gradient(135deg, #4A90E2 0%, #8B5CF6 100%)',

  // Text
  'text-primary': '#1A1A1A',
  'text-secondary': '#666666',
  'text-tertiary': '#999999',
  'text-inverse': '#FFFFFF',
  'text-link': '#58a6ff',
  'text-link-hover': '#4A90E2',
  'text-placeholder': '#CCCCCC',
  'text-disabled': '#E8EAED',

  // Semantic
  'success': '#10B981',
  'success-bg': 'rgba(16, 185, 129, 0.1)',
  'success-border': 'rgba(16, 185, 129, 0.3)',
  'warning': '#F59E0B',
  'warning-bg': 'rgba(245, 158, 11, 0.1)',
  'warning-border': 'rgba(245, 158, 11, 0.3)',
  'error': '#EF4444',
  'error-bg': 'rgba(239, 68, 68, 0.1)',
  'error-border': 'rgba(239, 68, 68, 0.3)',
  'info': '#58a6ff',
  'info-bg': 'rgba(88, 166, 255, 0.1)',
  'info-border': 'rgba(88, 166, 255, 0.3)',

  // Interactive
  'interactive-default': '#F8F9FA',
  'interactive-hover': '#F0F2F5',
  'interactive-active': '#E8EAED',
  'interactive-disabled': '#F8F9FA',

  // Borders
  'border-subtle': '#E8EAED',
  'border-default': '#CCCCCC',
  'border-strong': '#999999',
  'border-focus': '#58a6ff',

  // Overlays
  'overlay-backdrop': 'rgba(0, 0, 0, 0.5)',
  'overlay-shadow': 'rgba(0, 0, 0, 0.15)',

  // Social semantic
  'like-color': '#EF4444',
  'repost-color': '#10B981',
  'bookmark-color': '#F59E0B',
  'verified-badge': '#58a6ff',

  // Legacy support (keep for backward compatibility)
  bg: {
    primary: '#FAFAFA',
    secondary: '#FFFFFF',
    tertiary: '#F8F9FA',
    elevated: '#FFFFFF',
    hover: '#F0F2F5',
  },
  brand: {
    primary: '#58a6ff',
    secondary: '#a371f7',
    hover: '#4A90E2',
    gradient: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#FFFFFF',
  },
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#58a6ff',
  },
  link: '#58a6ff',
  linkHover: '#4A90E2',
  border: {
    subtle: '#E8EAED',
    default: '#CCCCCC',
    strong: '#999999',
  },
};

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  18: '72px',
  20: '80px',
  22: '88px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
};

export const radii = {
  none: '0',
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  '4xl': '32px',
  full: '9999px',
  circle: '50%',
};

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", "Roboto Mono", "JetBrains Mono", Consolas, monospace',
    display: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  fontSize: {
    '2xs': '10px',
    xs: '11px',
    sm: '13px',
    base: '15px',
    lg: '17px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
    '7xl': '72px',
    '8xl': '96px',
    '9xl': '128px',
  },

  lineHeight: {
    none: 1,
    tight: 1.1,
    snug: 1.2,
    normal: 1.3,
    base: 1.4,
    relaxed: 1.5,
    loose: 1.8,
    double: 2,
  },

  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.12)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',

  // Glow effects for brand elements
  'glow-brand': '0 0 20px rgba(99, 102, 241, 0.4)',
  'glow-success': '0 0 20px rgba(0, 210, 106, 0.4)',
  'glow-error': '0 0 20px rgba(255, 59, 59, 0.4)',
  'glow-warning': '0 0 20px rgba(255, 184, 0, 0.4)',
};

export const animation = {
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
    slowest: '750ms',
  },

  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Common animation combinations
  transitions: {
    fast: 'all 150ms cubic-bezier(0, 0, 0.2, 1)',
    normal: 'all 250ms cubic-bezier(0, 0, 0.2, 1)',
    slow: 'all 350ms cubic-bezier(0, 0, 0.2, 1)',
    spring: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
    bounce: 'all 350ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export const breakpoints = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,

  // Semantic breakpoints
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1920,
};

export const zIndex = {
  auto: 'auto',
  base: 0,
  below: -1,
  raised: 10,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modalBackdrop: 1400,
  modal: 1500,
  popover: 1600,
  tooltip: 1700,
  toast: 1800,
  notification: 1900,
  max: 9999,
};

/**
 * Opacity scale
 */
export const opacity = {
  0: '0',
  5: '0.05',
  10: '0.1',
  20: '0.2',
  25: '0.25',
  30: '0.3',
  40: '0.4',
  50: '0.5',
  60: '0.6',
  70: '0.7',
  75: '0.75',
  80: '0.8',
  90: '0.9',
  95: '0.95',
  100: '1',
};

/**
 * Blur scale
 */
export const blur = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  '2xl': '40px',
  '3xl': '64px',
};

/**
 * Border widths
 */
export const borderWidth = {
  0: '0',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
};

/**
 * Sizes (for fixed dimensions)
 */
export const sizes = {
  0: '0px',
  px: '1px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',

  // Semantic sizes
  full: '100%',
  screen: '100vh',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content',
};

/**
 * Container max widths
 */
export const containers = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
  full: '100%',
};
