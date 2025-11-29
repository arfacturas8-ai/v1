/**
 * CRYB Mobile Color System
 * Matches the CRYB web design system from /apps/web/app/globals.css
 */

export const Colors = {
  // CRYB Brand Colors - Exact Requirements
  brand: {
    primary: "#3b82f6",           // Primary Blue as specified
    primaryDark: "#2563eb",       // Darker shade
    primaryLight: "#60a5fa",      // Lighter shade
    background: "#0A0A0B",        // Main background (#0A0A0B)
    surface: "#2d2d2d",           // Surface color (#2d2d2d)  
    card: "#262626",              // Card background (#262626)
    accent: "#3b82f6",            // Accent color (same as primary)
    blue500: "#3B82F6",
    blue600: "#2563EB",
    blue700: "#1D4ED8",
    blue800: "#1E40AF",
    blue900: "#1E3A8A",
  },

  // Innovation Accents
  innovation: {
    cyan: "#00D4FF",              // Electric cyan - 24% CTR boost
    purple: "#7434F3",            // Innovation purple
    lime: "#00FF90",              // Cyber lime - Gen-Z preference
    orange: "#FF6B35",            // Energy orange
    pink: "#FF3B82",              // Dynamic pink
  },

  // Functional Status Colors
  functional: {
    success: "#10B981",           // Success green
    warning: "#F59E0B",           // Warning amber
    error: "#EF4444",             // Error red
    info: "#3B82F6",              // Info blue
    muted: "#6B7280",             // Muted gray
  },

  // Trading Colors
  trading: {
    buy: "#4CFB9C",               // Buy orders (green)
    sell: "#F92463",              // Sell orders (red)
    neutral: "#6B7280",           // Neutral
    profit: "#10B981",            // Profit green
    loss: "#EF4444",              // Loss red
  },

  // Extended Gray Scale
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6", 
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
    950: "#030712",
  },

  // Theme Colors
  light: {
    background: "#FFFFFF",
    surface: "#F9FAFB",
    surfaceVariant: "#F3F4F6",
    outline: "#E5E7EB",
    outlineVariant: "#D1D5DB",
    onBackground: "#111827",
    onSurface: "#1F2937",
    onSurfaceVariant: "#374151",
    primary: "#0052FF",
    onPrimary: "#FFFFFF",
    secondary: "#6B7280",
    onSecondary: "#FFFFFF",
    tertiary: "#7434F3",
    onTertiary: "#FFFFFF",
    error: "#EF4444",
    onError: "#FFFFFF",
    warning: "#F59E0B",
    onWarning: "#FFFFFF",
    success: "#10B981",
    onSuccess: "#FFFFFF",
    info: "#3B82F6",
    onInfo: "#FFFFFF",
    border: "#E5E7EB",
    input: "#F9FAFB",
    ring: "#3B82F6",
    shadow: "rgba(0, 0, 0, 0.1)",
    shadowDark: "rgba(0, 0, 0, 0.2)",
  },

  dark: {
    background: "#0A0A0B",          // Exact background requirement
    surface: "#2d2d2d",             // Exact surface requirement
    surfaceVariant: "#262626",      // Exact card requirement
    outline: "#374151",
    outlineVariant: "#4B5563",
    onBackground: "#F9FAFB",
    onSurface: "#F3F4F6",
    onSurfaceVariant: "#D1D5DB",
    primary: "#3b82f6",             // Exact primary requirement
    onPrimary: "#FFFFFF",
    secondary: "#9CA3AF",
    onSecondary: "#111827",
    tertiary: "#7434F3",
    onTertiary: "#FFFFFF",
    error: "#F87171",
    onError: "#FFFFFF",
    warning: "#FBBF24",
    onWarning: "#111827",
    success: "#34D399",
    onSuccess: "#111827",
    info: "#60A5FA",
    onInfo: "#111827",
    border: "#374151",
    input: "#262626",               // Use card color for inputs
    ring: "#3b82f6",                // Exact primary requirement
    shadow: "rgba(0, 0, 0, 0.3)",
    shadowDark: "rgba(0, 0, 0, 0.5)",
  },

  // High Contrast Mode
  highContrast: {
    background: "#000000",
    surface: "#FFFFFF",
    onBackground: "#FFFFFF",
    onSurface: "#000000",
    primary: "#0000FF",
    onPrimary: "#FFFFFF",
    border: "#FFFFFF",
    outline: "#FFFFFF",
  },

  // Component-specific colors
  components: {
    card: {
      light: "#FFFFFF",
      dark: "#262626",              // Exact card requirement
      border: {
        light: "#E5E7EB",
        dark: "#374151",
      },
    },
    button: {
      primary: {
        background: "#3b82f6",      // Exact primary requirement
        foreground: "#FFFFFF",
        hover: "#2563eb",
        pressed: "#1d4ed8",
      },
      secondary: {
        background: "#F3F4F6",
        foreground: "#374151",
        hover: "#E5E7EB",
        pressed: "#D1D5DB",
      },
      ghost: {
        background: "transparent",
        foreground: "#374151",
        hover: "#F3F4F6",
        pressed: "#E5E7EB",
      },
      destructive: {
        background: "#EF4444",
        foreground: "#FFFFFF",
        hover: "#DC2626",
        pressed: "#B91C1C",
      },
    },
    input: {
      background: {
        light: "#F9FAFB",
        dark: "#262626",            // Exact card requirement for inputs
      },
      border: {
        light: "#D1D5DB",
        dark: "#4B5563",
      },
      focus: "#3b82f6",             // Exact primary requirement
      placeholder: "#9CA3AF",
    },
    tab: {
      active: {
        background: "#3b82f6",      // Exact primary requirement
        foreground: "#FFFFFF",
      },
      inactive: {
        background: "transparent",
        foreground: "#6B7280",
      },
    },
    avatar: {
      background: "#F3F4F6",
      fallback: "#9CA3AF",
    },
    badge: {
      primary: {
        background: "#0052FF",
        foreground: "#FFFFFF",
      },
      secondary: {
        background: "#F3F4F6",
        foreground: "#374151",
      },
      success: {
        background: "#10B981",
        foreground: "#FFFFFF",
      },
      warning: {
        background: "#F59E0B",
        foreground: "#FFFFFF",
      },
      error: {
        background: "#EF4444",
        foreground: "#FFFFFF",
      },
    },
    skeleton: {
      background: {
        light: "#F3F4F6",
        dark: "#374151",
      },
      shimmer: {
        light: "#E5E7EB",
        dark: "#4B5563",
      },
    },
  },

  // Semantic color mappings for different contexts
  semantic: {
    online: "#10B981",
    offline: "#6B7280",
    away: "#F59E0B",
    busy: "#EF4444",
    invisible: "#6B7280",
    
    verified: "#3B82F6",
    premium: "#7434F3",
    staff: "#F59E0B",
    bot: "#10B981",
    
    notification: "#EF4444",
    mention: "#F59E0B",
    unread: "#3B82F6",
    
    voiceConnected: "#10B981",
    voiceMuted: "#EF4444",
    voiceDeafened: "#6B7280",
    
    reaction: "#F59E0B",
    typing: "#3B82F6",
    streaming: "#7434F3",
  },

  // Platform-specific adjustments
  platform: {
    ios: {
      systemBlue: "#007AFF",
      systemGreen: "#34C759",
      systemRed: "#FF3B30",
      systemOrange: "#FF9500",
      systemYellow: "#FFCC00",
      systemPurple: "#AF52DE",
      systemPink: "#FF2D92",
      systemTeal: "#5AC8FA",
      systemIndigo: "#5856D6",
      systemGray: "#8E8E93",
    },
    android: {
      primaryColor: "#0052FF",
      accentColor: "#00D4FF",
      backgroundColor: "#FAFAFA",
      surfaceColor: "#FFFFFF",
      errorColor: "#B00020",
    },
  },
} as const;

// Helper functions for color manipulation
export const ColorUtils = {
  /**
   * Add alpha transparency to a hex color
   */
  withAlpha: (color: string, alpha: number): string => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Get color based on theme
   */
  getThemeColor: (
    lightColor: string,
    darkColor: string,
    isDark: boolean
  ): string => {
    return isDark ? darkColor : lightColor;
  },

  /**
   * Get contrasting text color
   */
  getContrastColor: (backgroundColor: string): string => {
    // Simple contrast calculation - in production use a more sophisticated algorithm
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? Colors.gray[900] : Colors.gray[50];
  },

  /**
   * Generate gradient string for React Native
   */
  createGradient: (colors: string[], direction = 'vertical'): string => {
    return `linear-gradient(${direction === 'vertical' ? 'to bottom' : 'to right'}, ${colors.join(', ')})`;
  },
};

// Export default theme
export const defaultTheme = {
  colors: Colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  shadows: {
    sm: {
      shadowColor: Colors.gray[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: Colors.gray[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: Colors.gray[900],
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 8,
    },
  },
} as const;

export type Theme = typeof defaultTheme;
export type ColorKeys = keyof typeof Colors;