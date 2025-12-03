/**
 * CRYB Design System - Shared Theme Configuration
 * Following Master Build Prompt Specifications
 * All pages should import from here for consistent styling
 */

// Color Palette - Master Prompt Specification
export const colors = {
  // Brand colors
  primary: '#58a6ff',
  secondary: '#a371f7',

  // Backgrounds (Darkest to Lightest)
  bgPrimary: '#0D0D0D',      // Deepest - Page background
  bgSecondary: '#141414',    // Cards & surfaces
  bgTertiary: '#1A1A1A',     // Elevated cards
  bgElevated: '#242424',     // Modals & dropdowns
  bgHover: '#2A2A2A',        // Hover states
  bgCard: '#141414',         // Card background

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#666666',
  textMuted: '#666666',
  textInverse: '#000000',

  // Borders
  borderSubtle: '#2A2A2A',
  border: '#333333',
  borderStrong: '#444444',
  borderHover: '#444444',
  borderFocus: '#58a6ff',

  // Semantic - Success
  success: '#00D26A',
  successBg: 'rgba(0, 210, 106, 0.1)',
  successBorder: 'rgba(0, 210, 106, 0.3)',

  // Semantic - Warning
  warning: '#FFB800',
  warningBg: 'rgba(255, 184, 0, 0.1)',
  warningBorder: 'rgba(255, 184, 0, 0.3)',

  // Semantic - Error
  error: '#FF3B3B',
  errorBg: 'rgba(255, 59, 59, 0.1)',
  errorBorder: 'rgba(255, 59, 59, 0.3)',

  // Semantic - Info
  info: '#0095FF',
  infoBg: 'rgba(0, 149, 255, 0.1)',
  infoBorder: 'rgba(0, 149, 255, 0.3)',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
  gradientSecondary: 'linear-gradient(135deg, #a371f7 0%, #58a6ff 100%)',
  gradientBg: 'linear-gradient(135deg, rgba(88, 166, 255, 0.08) 0%, rgba(163, 113, 247, 0.08) 100%)',
  gradientBgHover: 'linear-gradient(135deg, rgba(88, 166, 255, 0.15) 0%, rgba(163, 113, 247, 0.15) 100%)'
}

// Spacing - 4px Base System (Master Prompt)
export const spacing = {
  0: '0',
  1: '4px',     // 0.25rem
  2: '8px',     // 0.5rem
  3: '12px',    // 0.75rem
  4: '16px',    // 1rem
  5: '20px',    // 1.25rem
  6: '24px',    // 1.5rem
  8: '32px',    // 2rem
  10: '40px',   // 2.5rem
  12: '48px',   // 3rem
  16: '64px',   // 4rem
  20: '80px',   // 5rem
  24: '96px',   // 6rem
  // Legacy aliases
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px'
}

// Border Radius - Master Prompt Specification
export const radius = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px'
}

// Shadows - Master Prompt Specification
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
  base: '0 2px 4px 0 rgba(0, 0, 0, 0.5)',
  md: '0 4px 8px -2px rgba(0, 0, 0, 0.6)',
  lg: '0 12px 24px -4px rgba(0, 0, 0, 0.7)',
  xl: '0 20px 40px -8px rgba(0, 0, 0, 0.8)',
  '2xl': '0 32px 64px -12px rgba(0, 0, 0, 0.9)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  glowPrimary: '0 0 20px rgba(88, 166, 255, 0.4)',
  glowSuccess: '0 0 20px rgba(0, 210, 106, 0.4)',
  glowError: '0 0 20px rgba(255, 59, 59, 0.4)'
}

// Typography - Master Prompt Specification
export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Roboto Mono', 'Monaco', 'Consolas', monospace",
  fontSize: {
    xs: '11px',      // 0.6875rem
    sm: '13px',      // 0.8125rem
    base: '15px',    // 0.9375rem
    lg: '17px',      // 1.0625rem
    xl: '20px',      // 1.25rem
    '2xl': '24px',   // 1.5rem
    '3xl': '30px',   // 1.875rem
    '4xl': '36px',   // 2.25rem
    '5xl': '48px',   // 3rem
    // Legacy aliases
    md: '15px',
    xxl: '24px',
    xxxl: '30px',
    display: '48px'
  },
  fontWeight: {
    regular: 400,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.2,
    normal: 1.5,
    relaxed: 1.6
  }
}

// Transitions - Master Prompt Specification
export const transitions = {
  fast: '150ms ease-out',
  normal: '250ms ease-out',
  slow: '350ms ease-out'
}

// Z-Index Layers
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080
}

// Layout Constants
export const layout = {
  containerSm: '640px',
  containerMd: '768px',
  containerLg: '1024px',
  containerXl: '1280px',
  container2xl: '1536px',
  navHeight: '64px',
  navHeightMobile: '56px',
  sidebarWidth: '256px',
  bottomNavHeight: '64px'
}

// Common Styles Factory
export const createStyles = (isMobile = false, isTablet = false) => ({
  // Page container
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: colors.bgPrimary,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily
  },

  // Content wrapper
  contentWrapper: {
    maxWidth: layout.containerXl,
    margin: '0 auto',
    padding: isMobile ? spacing.lg : spacing.xxl
  },

  // Card - Master Prompt Style
  card: {
    background: colors.bgSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: spacing.xl,
    transition: `all ${transitions.normal}`
  },

  cardHover: {
    borderColor: colors.borderStrong,
    boxShadow: shadows.lg
  },

  cardInteractive: {
    borderColor: colors.primary,
    boxShadow: shadows.glowPrimary
  },

  // Page title with gradient
  pageTitle: {
    fontSize: isMobile ? typography.fontSize['2xl'] : typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    background: colors.gradientPrimary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: spacing.sm
  },

  // Subtitle
  subtitle: {
    color: colors.textTertiary,
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.xxl
  },

  // Primary button
  buttonPrimary: {
    background: colors.gradientPrimary,
    border: 'none',
    borderRadius: radius.lg,
    color: colors.textPrimary,
    padding: `${spacing.md} ${spacing.xl}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.sm
  },

  // Secondary button
  buttonSecondary: {
    background: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    color: colors.textSecondary,
    padding: `${spacing.md} ${spacing.xl}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.sm
  },

  // Input
  input: {
    width: '100%',
    padding: `${spacing.md} ${spacing.lg}`,
    background: colors.bgTertiary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    outline: 'none',
    transition: `all ${transitions.normal}`
  },

  inputFocus: {
    borderColor: colors.borderFocus,
    boxShadow: shadows.glowPrimary
  },

  // Select
  select: {
    padding: `${spacing.md} ${spacing.xxl} ${spacing.md} ${spacing.lg}`,
    background: colors.bgTertiary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    appearance: 'none',
    cursor: 'pointer',
    minWidth: isMobile ? '100%' : '160px'
  },

  // Search input wrapper
  searchWrapper: {
    position: 'relative'
  },

  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.textTertiary
  },

  searchInput: {
    width: '100%',
    padding: `${spacing.md} ${spacing.lg} ${spacing.md} 44px`,
    background: colors.bgTertiary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    outline: 'none'
  },

  // Tabs
  tabContainer: {
    display: 'flex',
    gap: spacing.sm,
    overflowX: 'auto',
    paddingBottom: spacing.sm
  },

  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md} ${spacing.xl}`,
    borderRadius: radius.md,
    border: 'none',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: `all ${transitions.normal}`
  },

  tabActive: {
    background: colors.gradientPrimary,
    color: colors.textPrimary
  },

  tabInactive: {
    background: colors.bgSecondary,
    border: `1px solid ${colors.border}`,
    color: colors.textTertiary
  },

  // Grid layouts
  gridCols2: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: spacing.xl
  },

  gridCols3: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    gap: spacing.xl
  },

  gridCols4: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
    gap: spacing.xl
  },

  // Flex utilities
  flexCenter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  flexBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  flexColumn: {
    display: 'flex',
    flexDirection: 'column'
  },

  // Avatar
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: radius.full,
    background: colors.gradientPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold
  },

  avatarLg: {
    width: '64px',
    height: '64px',
    borderRadius: radius.full,
    background: colors.gradientPrimary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize['2xl']
  },

  // Badge
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: radius.sm,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold
  },

  badgeSuccess: {
    background: colors.successBg,
    color: colors.success
  },

  badgeWarning: {
    background: colors.warningBg,
    color: colors.warning
  },

  badgeError: {
    background: colors.errorBg,
    color: colors.error
  },

  badgePrimary: {
    background: 'rgba(88, 166, 255, 0.2)',
    color: colors.primary
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: `${spacing.xxxl} ${spacing.xl}`,
    background: colors.bgSecondary,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`
  },

  emptyIcon: {
    marginBottom: spacing.lg,
    opacity: 0.5,
    color: colors.textTertiary
  },

  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm
  },

  emptyText: {
    color: colors.textTertiary,
    marginBottom: spacing.xl
  },

  // Loading
  loader: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl
  },

  // Error alert
  errorAlert: {
    background: colors.errorBg,
    border: `1px solid ${colors.errorBorder}`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    color: colors.error,
    textAlign: 'center'
  },

  // Success alert
  successAlert: {
    background: colors.successBg,
    border: `1px solid ${colors.successBorder}`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    color: colors.success,
    textAlign: 'center'
  },

  // Warning alert
  warningAlert: {
    background: colors.warningBg,
    border: `1px solid ${colors.warningBorder}`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    color: colors.warning,
    textAlign: 'center'
  },

  // Info alert
  infoAlert: {
    background: colors.infoBg,
    border: `1px solid ${colors.infoBorder}`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    color: colors.info,
    textAlign: 'center'
  },

  // Divider
  divider: {
    height: '1px',
    background: colors.border,
    margin: `${spacing.xl} 0`
  },

  // Link
  link: {
    color: colors.primary,
    textDecoration: 'none',
    transition: `opacity ${transitions.normal}`
  },

  // Section header
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg
  },

  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary
  },

  // Table styles
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },

  tableHeader: {
    textAlign: 'left',
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `1px solid ${colors.border}`,
    color: colors.textTertiary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium
  },

  tableCell: {
    padding: spacing.lg,
    borderBottom: `1px solid ${colors.border}`,
    color: colors.textSecondary
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndex.modal,
    padding: spacing.xl
  },

  modalContent: {
    background: colors.bgElevated,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: shadows.xl
  },

  modalHeader: {
    padding: spacing.xl,
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  modalBody: {
    padding: spacing.xl
  },

  modalFooter: {
    padding: spacing.xl,
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    gap: spacing.md,
    justifyContent: 'flex-end'
  }
})

// CSS Keyframes for animations
export const keyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
  }
`

export default { colors, spacing, radius, shadows, typography, transitions, zIndex, layout, createStyles, keyframes }
