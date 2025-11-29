/**
 * CRYB Design System
 * Based on Help Page glassmorphism design
 * Mobile-first responsive design
 */

export const colors = {
  // Backgrounds
  bgPrimary: '#0d1117',
  bgSecondary: 'rgba(22, 27, 34, 0.6)',
  bgTertiary: '#202225',
  bgInput: 'rgba(22, 27, 34, 0.6)',

  // Glass/Card
  cardBg: 'rgba(22, 27, 34, 0.6)',
  cardBorder: 'rgba(255, 255, 255, 0.1)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#c9d1d9',
  textTertiary: '#8b949e',
  textMuted: '#6e7681',

  // Accents
  accentBlue: '#58a6ff',
  accentPurple: '#a371f7',
  accentCyan: '#00D4FF',

  // Status
  success: '#3fb950',
  error: '#f85149',
  warning: '#d29922',
  info: '#58a6ff',

  // Borders
  borderPrimary: 'rgba(255, 255, 255, 0.1)',
  borderSecondary: 'rgba(255, 255, 255, 0.05)',
  borderAccent: 'rgba(88, 166, 255, 0.2)',
}

export const gradients = {
  primary: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
  button: 'linear-gradient(to right, #58a6ff, #a371f7)',
  buttonHover: 'linear-gradient(to right, #1868B7, #6932CC)',
  text: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
}

export const shadows = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.2)',
  md: '0 4px 12px rgba(0, 0, 0, 0.25)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 60px rgba(0, 0, 0, 0.4)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
}

export const borderRadius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
}

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '36px',
    '5xl': '48px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.2',
    normal: '1.5',
    relaxed: '1.8',
  },
}

export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
}

export const effects = {
  backdropBlur: 'blur(12px)',
  transition: 'all 0.2s ease',
  transitionSlow: 'all 0.3s ease',
}

// Common component styles
export const components = {
  card: {
    background: colors.cardBg,
    backdropFilter: effects.backdropBlur,
    border: `1px solid ${colors.cardBorder}`,
    borderRadius: borderRadius.lg,
    padding: spacing['3xl'],
    boxShadow: shadows.lg,
  },

  input: {
    background: colors.bgInput,
    border: `1px solid ${colors.borderPrimary}`,
    borderRadius: borderRadius.lg,
    padding: `${spacing.md} ${spacing.lg}`,
    color: colors.textSecondary,
    fontSize: typography.fontSize.base,
    transition: effects.transition,
    outline: 'none',
    focusBorder: colors.accentBlue,
    focusRing: `0 0 0 2px rgba(88, 166, 255, 0.2)`,
  },

  button: {
    primary: {
      background: gradients.button,
      backgroundHover: gradients.buttonHover,
      color: colors.textPrimary,
      padding: `${spacing.md} ${spacing['2xl']}`,
      borderRadius: borderRadius.lg,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      border: 'none',
      cursor: 'pointer',
      transition: effects.transition,
    },
    secondary: {
      background: 'transparent',
      border: `1px solid ${colors.borderPrimary}`,
      color: colors.textSecondary,
      padding: `${spacing.md} ${spacing['2xl']}`,
      borderRadius: borderRadius.lg,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      cursor: 'pointer',
      transition: effects.transition,
      hoverBorder: colors.accentBlue,
      hoverBackground: 'rgba(88, 166, 255, 0.1)',
    },
  },

  modal: {
    overlay: {
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: effects.backdropBlur,
    },
    content: {
      background: colors.cardBg,
      backdropFilter: effects.backdropBlur,
      border: `1px solid ${colors.borderPrimary}`,
      borderRadius: borderRadius.xl,
      boxShadow: shadows.xl,
      padding: spacing['3xl'],
    },
  },

  sidebar: {
    background: colors.cardBg,
    borderRight: `1px solid ${colors.borderPrimary}`,
    padding: `${spacing['3xl']} ${spacing.lg}`,
  },

  header: {
    background: colors.cardBg,
    backdropFilter: effects.backdropBlur,
    borderBottom: `1px solid ${colors.borderPrimary}`,
    padding: `${spacing.lg} ${spacing['2xl']}`,
  },
}

// Mobile-specific utilities
export const mobile = {
  touchTarget: '44px', // Minimum touch target size
  padding: spacing.lg,
  safeArea: {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
    right: 'env(safe-area-inset-right)',
  },
}

// Animations
export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 },
  },
}

export default {
  colors,
  gradients,
  shadows,
  spacing,
  borderRadius,
  typography,
  breakpoints,
  effects,
  components,
  mobile,
  animations,
}
