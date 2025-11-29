/**
 * CRYB Design System - Shared Theme Configuration
 * All pages should import from here for consistent styling
 */

// Color Palette
export const colors = {
  // Primary gradient colors
  primary: '#58a6ff',
  secondary: '#a371f7',

  // Backgrounds
  bgPrimary: '#0d1117',
  bgSecondary: 'rgba(22, 27, 34, 0.6)',
  bgTertiary: 'rgba(13, 17, 23, 0.8)',
  bgCard: 'rgba(22, 27, 34, 0.6)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#c9d1d9',
  textTertiary: '#8b949e',
  textMuted: '#6b7280',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderHover: 'rgba(255, 255, 255, 0.2)',
  borderFocus: 'rgba(88, 166, 255, 0.5)',

  // Status
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#3b82f6',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
  gradientBg: 'linear-gradient(135deg, rgba(88, 166, 255, 0.08) 0%, rgba(163, 113, 247, 0.08) 100%)',
  gradientBgHover: 'linear-gradient(135deg, rgba(88, 166, 255, 0.15) 0%, rgba(163, 113, 247, 0.15) 100%)'
}

// Spacing
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px'
}

// Border Radius
export const radius = {
  sm: '6px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  full: '9999px'
}

// Shadows
export const shadows = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.2)',
  md: '0 4px 16px rgba(0, 0, 0, 0.25)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.3)',
  xl: '0 12px 48px rgba(0, 0, 0, 0.4)',
  glow: '0 4px 20px rgba(88, 166, 255, 0.4)'
}

// Typography
export const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
  fontSize: {
    xs: '11px',
    sm: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '24px',
    xxxl: '32px',
    display: '48px'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  }
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: isMobile ? spacing.lg : spacing.xxl
  },

  // Glass card
  card: {
    background: colors.bgCard,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    padding: spacing.xl,
    boxShadow: shadows.lg
  },

  // Page title with gradient
  pageTitle: {
    fontSize: isMobile ? typography.fontSize.xxl : typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    background: colors.gradientPrimary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
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
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
    borderRadius: radius.lg,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    outline: 'none',
    transition: 'all 0.2s ease'
  },

  // Select
  select: {
    padding: `${spacing.md} ${spacing.xxl} ${spacing.md} ${spacing.lg}`,
    background: colors.bgTertiary,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
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
    borderRadius: radius.lg,
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
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
    borderRadius: radius.lg,
    border: 'none',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },

  tabActive: {
    background: colors.gradientPrimary,
    color: colors.textPrimary
  },

  tabInactive: {
    background: colors.bgCard,
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
    fontSize: typography.fontSize.xxl
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
    background: 'rgba(34, 197, 94, 0.2)',
    color: colors.success
  },

  badgeWarning: {
    background: 'rgba(234, 179, 8, 0.2)',
    color: colors.warning
  },

  badgeError: {
    background: 'rgba(239, 68, 68, 0.2)',
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
    background: colors.bgCard,
    borderRadius: radius.xl,
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
    background: 'rgba(239, 68, 68, 0.1)',
    border: `1px solid rgba(239, 68, 68, 0.3)`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    color: colors.error,
    textAlign: 'center'
  },

  // Success alert
  successAlert: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: `1px solid rgba(34, 197, 94, 0.3)`,
    borderRadius: radius.lg,
    padding: spacing.lg,
    color: colors.success,
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
    transition: 'opacity 0.2s ease'
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
    padding: `${spacing.lg}`,
    borderBottom: `1px solid ${colors.border}`,
    color: colors.textSecondary
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing.xl
  },

  modalContent: {
    background: 'rgba(22, 27, 34, 0.95)',
    backdropFilter: 'blur(16px)',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: shadows.xl
  },

  modalHeader: {
    padding: `${spacing.xl}`,
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
`

export default { colors, spacing, radius, shadows, typography, createStyles, keyframes }
