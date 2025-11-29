import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, defaultTheme, ColorUtils } from '../theme/colors';

export type Theme = 'light' | 'dark' | 'auto';

interface CrybColors {
  // Brand colors - CRYB Trust Foundation
  primary: string;
  primaryDark: string;
  primaryLight: string;
  navy: string;
  secondary: string;
  accent: string;
  
  // Innovation colors
  cyan: string;
  purple: string;
  lime: string;
  orange: string;
  pink: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceSecondary: string;
  surfaceVariant: string;
  card: string;
  modal: string;
  overlay: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  textPlaceholder: string;
  textInverse: string;
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  onPrimary: string;
  
  // Border colors
  border: string;
  borderSecondary: string;
  borderActive: string;
  outline: string;
  outlineVariant: string;
  
  // Status colors
  error: string;
  warning: string;
  success: string;
  info: string;
  onError: string;
  onWarning: string;
  onSuccess: string;
  onInfo: string;
  
  // Trading colors
  buy: string;
  sell: string;
  profit: string;
  loss: string;
  neutral: string;
  
  // Social/Status colors
  online: string;
  away: string;
  busy: string;
  offline: string;
  verified: string;
  premium: string;
  staff: string;
  bot: string;
  
  // Component specific
  notification: string;
  link: string;
  mention: string;
  tag: string;
  codeBlock: string;
  quote: string;
  input: string;
  ring: string;
  shadow: string;
  shadowDark: string;
  
  // Semantic colors
  upvote: string;
  downvote: string;
  voiceConnected: string;
  voiceMuted: string;
  voiceDeafened: string;
  reaction: string;
  typing: string;
  streaming: string;
  unread: string;
}

interface Spacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface Typography {
  fontSizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  fontWeights: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

interface Shadows {
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  lg: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

interface ThemeContextType {
  theme: Theme;
  currentTheme: 'light' | 'dark';
  colors: CrybColors;
  spacing: Spacing;
  typography: Typography;
  shadows: Shadows;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isHighContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

const lightColors: CrybColors = {
  // Brand colors - CRYB Trust Foundation
  primary: Colors.brand.primary,
  primaryDark: Colors.brand.primaryDark,
  primaryLight: Colors.brand.primaryLight,
  navy: Colors.brand.navy,
  secondary: Colors.gray[600],
  accent: Colors.innovation.cyan,
  
  // Innovation colors
  cyan: Colors.innovation.cyan,
  purple: Colors.innovation.purple,
  lime: Colors.innovation.lime,
  orange: Colors.innovation.orange,
  pink: Colors.innovation.pink,
  
  // Background colors
  background: Colors.light.background,
  backgroundSecondary: Colors.light.surface,
  surface: Colors.light.surface,
  surfaceSecondary: Colors.light.surfaceVariant,
  surfaceVariant: Colors.light.surfaceVariant,
  card: Colors.components.card.light,
  modal: ColorUtils.withAlpha(Colors.gray[900], 0.5),
  overlay: ColorUtils.withAlpha(Colors.gray[900], 0.3),
  
  // Text colors
  text: Colors.light.onBackground,
  textSecondary: Colors.light.onSurfaceVariant,
  textTertiary: Colors.gray[400],
  textPlaceholder: Colors.components.input.placeholder,
  textInverse: Colors.light.onPrimary,
  onBackground: Colors.light.onBackground,
  onSurface: Colors.light.onSurface,
  onSurfaceVariant: Colors.light.onSurfaceVariant,
  onPrimary: Colors.light.onPrimary,
  
  // Border colors
  border: Colors.light.border,
  borderSecondary: Colors.light.outline,
  borderActive: Colors.light.primary,
  outline: Colors.light.outline,
  outlineVariant: Colors.light.outlineVariant,
  
  // Status colors
  error: Colors.light.error,
  warning: Colors.light.warning,
  success: Colors.light.success,
  info: Colors.light.info,
  onError: Colors.light.onError,
  onWarning: Colors.light.onWarning,
  onSuccess: Colors.light.onSuccess,
  onInfo: Colors.light.onInfo,
  
  // Trading colors
  buy: Colors.trading.buy,
  sell: Colors.trading.sell,
  profit: Colors.trading.profit,
  loss: Colors.trading.loss,
  neutral: Colors.trading.neutral,
  
  // Social/Status colors
  online: Colors.semantic.online,
  away: Colors.semantic.away,
  busy: Colors.semantic.busy,
  offline: Colors.semantic.offline,
  verified: Colors.semantic.verified,
  premium: Colors.semantic.premium,
  staff: Colors.semantic.staff,
  bot: Colors.semantic.bot,
  
  // Component specific
  notification: Colors.semantic.notification,
  link: Colors.brand.primaryLight,
  mention: Colors.semantic.mention,
  tag: Colors.innovation.purple,
  codeBlock: Colors.light.surfaceVariant,
  quote: Colors.light.outline,
  input: Colors.light.input,
  ring: Colors.light.ring,
  shadow: Colors.light.shadow,
  shadowDark: Colors.light.shadowDark,
  
  // Semantic colors
  upvote: Colors.trading.buy,
  downvote: Colors.trading.sell,
  voiceConnected: Colors.semantic.voiceConnected,
  voiceMuted: Colors.semantic.voiceMuted,
  voiceDeafened: Colors.semantic.voiceDeafened,
  reaction: Colors.semantic.reaction,
  typing: Colors.semantic.typing,
  streaming: Colors.semantic.streaming,
  unread: Colors.semantic.unread,
};

const darkColors: CrybColors = {
  // Brand colors - CRYB Trust Foundation
  primary: Colors.dark.primary,
  primaryDark: Colors.brand.primaryDark,
  primaryLight: Colors.brand.primaryLight,
  navy: Colors.brand.navy,
  secondary: Colors.dark.secondary,
  accent: Colors.innovation.cyan,
  
  // Innovation colors
  cyan: Colors.innovation.cyan,
  purple: Colors.innovation.purple,
  lime: Colors.innovation.lime,
  orange: Colors.innovation.orange,
  pink: Colors.innovation.pink,
  
  // Background colors
  background: Colors.dark.background,
  backgroundSecondary: Colors.dark.surface,
  surface: Colors.dark.surface,
  surfaceSecondary: Colors.dark.surfaceVariant,
  surfaceVariant: Colors.dark.surfaceVariant,
  card: Colors.components.card.dark,
  modal: ColorUtils.withAlpha(Colors.gray[950], 0.8),
  overlay: ColorUtils.withAlpha(Colors.gray[950], 0.6),
  
  // Text colors
  text: Colors.dark.onBackground,
  textSecondary: Colors.dark.onSurfaceVariant,
  textTertiary: Colors.gray[500],
  textPlaceholder: Colors.components.input.placeholder,
  textInverse: Colors.dark.onPrimary,
  onBackground: Colors.dark.onBackground,
  onSurface: Colors.dark.onSurface,
  onSurfaceVariant: Colors.dark.onSurfaceVariant,
  onPrimary: Colors.dark.onPrimary,
  
  // Border colors
  border: Colors.dark.border,
  borderSecondary: Colors.dark.outline,
  borderActive: Colors.dark.primary,
  outline: Colors.dark.outline,
  outlineVariant: Colors.dark.outlineVariant,
  
  // Status colors
  error: Colors.dark.error,
  warning: Colors.dark.warning,
  success: Colors.dark.success,
  info: Colors.dark.info,
  onError: Colors.dark.onError,
  onWarning: Colors.dark.onWarning,
  onSuccess: Colors.dark.onSuccess,
  onInfo: Colors.dark.onInfo,
  
  // Trading colors
  buy: Colors.trading.buy,
  sell: Colors.trading.sell,
  profit: Colors.trading.profit,
  loss: Colors.trading.loss,
  neutral: Colors.trading.neutral,
  
  // Social/Status colors
  online: Colors.semantic.online,
  away: Colors.semantic.away,
  busy: Colors.semantic.busy,
  offline: Colors.semantic.offline,
  verified: Colors.semantic.verified,
  premium: Colors.semantic.premium,
  staff: Colors.semantic.staff,
  bot: Colors.semantic.bot,
  
  // Component specific
  notification: Colors.semantic.notification,
  link: Colors.brand.primaryLight,
  mention: Colors.semantic.mention,
  tag: Colors.innovation.purple,
  codeBlock: Colors.dark.surfaceVariant,
  quote: Colors.dark.outline,
  input: Colors.dark.input,
  ring: Colors.dark.ring,
  shadow: Colors.dark.shadow,
  shadowDark: Colors.dark.shadowDark,
  
  // Semantic colors
  upvote: Colors.trading.buy,
  downvote: Colors.trading.sell,
  voiceConnected: Colors.semantic.voiceConnected,
  voiceMuted: Colors.semantic.voiceMuted,
  voiceDeafened: Colors.semantic.voiceDeafened,
  reaction: Colors.semantic.reaction,
  typing: Colors.semantic.typing,
  streaming: Colors.semantic.streaming,
  unread: Colors.semantic.unread,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@cryb_theme';
const HIGH_CONTRAST_STORAGE_KEY = '@cryb_high_contrast';

const spacing: Spacing = defaultTheme.spacing;
const typography: Typography = {
  fontSizes: {
    xs: defaultTheme.fontSize.xs,
    sm: defaultTheme.fontSize.sm,
    md: defaultTheme.fontSize.base,
    lg: defaultTheme.fontSize.lg,
    xl: defaultTheme.fontSize.xl,
    xxl: defaultTheme.fontSize['2xl'],
    xxxl: defaultTheme.fontSize['3xl'],
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeights: {
    normal: defaultTheme.fontWeight.normal,
    medium: defaultTheme.fontWeight.medium,
    semibold: defaultTheme.fontWeight.semibold,
    bold: defaultTheme.fontWeight.bold,
  },
};

const lightShadows: Shadows = defaultTheme.shadows;
const darkShadows: Shadows = {
  sm: {
    shadowColor: Colors.gray[950],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.gray[950],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.gray[950],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
};

const highContrastColors: CrybColors = {
  // Brand colors - High contrast variants
  primary: Colors.highContrast.primary,
  primaryDark: '#000080',
  primaryLight: '#0000FF',
  navy: '#000080',
  secondary: Colors.highContrast.onSurface,
  accent: Colors.highContrast.primary,
  
  // Innovation colors - High contrast variants
  cyan: '#00FFFF',
  purple: '#8000FF',
  lime: '#00FF00',
  orange: '#FF8000',
  pink: '#FF00FF',
  
  // Background colors
  background: Colors.highContrast.background,
  backgroundSecondary: Colors.highContrast.background,
  surface: Colors.highContrast.surface,
  surfaceSecondary: Colors.highContrast.surface,
  surfaceVariant: Colors.highContrast.surface,
  card: Colors.highContrast.surface,
  modal: 'rgba(0, 0, 0, 0.9)',
  overlay: 'rgba(0, 0, 0, 0.8)',
  
  // Text colors
  text: Colors.highContrast.onBackground,
  textSecondary: Colors.highContrast.onSurface,
  textTertiary: Colors.highContrast.onSurface,
  textPlaceholder: Colors.highContrast.onSurface,
  textInverse: Colors.highContrast.background,
  onBackground: Colors.highContrast.onBackground,
  onSurface: Colors.highContrast.onSurface,
  onSurfaceVariant: Colors.highContrast.onSurface,
  onPrimary: Colors.highContrast.onPrimary,
  
  // Border colors
  border: Colors.highContrast.border,
  borderSecondary: Colors.highContrast.outline,
  borderActive: Colors.highContrast.primary,
  outline: Colors.highContrast.outline,
  outlineVariant: Colors.highContrast.outline,
  
  // Status colors
  error: '#FF0000',
  warning: '#FFFF00',
  success: '#00FF00',
  info: '#0000FF',
  onError: '#FFFFFF',
  onWarning: '#000000',
  onSuccess: '#000000',
  onInfo: '#FFFFFF',
  
  // Trading colors
  buy: '#00FF00',
  sell: '#FF0000',
  profit: '#00FF00',
  loss: '#FF0000',
  neutral: Colors.highContrast.onSurface,
  
  // Social/Status colors
  online: '#00FF00',
  away: '#FFFF00',
  busy: '#FF0000',
  offline: Colors.highContrast.onSurface,
  verified: '#0000FF',
  premium: '#8000FF',
  staff: '#FFFF00',
  bot: '#00FF00',
  
  // Component specific
  notification: '#FF0000',
  link: '#0000FF',
  mention: '#0000FF',
  tag: '#8000FF',
  codeBlock: Colors.highContrast.surface,
  quote: Colors.highContrast.outline,
  input: Colors.highContrast.surface,
  ring: '#0000FF',
  shadow: 'rgba(0, 0, 0, 1)',
  shadowDark: 'rgba(0, 0, 0, 1)',
  
  // Semantic colors
  upvote: '#00FF00',
  downvote: '#FF0000',
  voiceConnected: '#00FF00',
  voiceMuted: '#FF0000',
  voiceDeafened: Colors.highContrast.onSurface,
  reaction: '#FFFF00',
  typing: '#0000FF',
  streaming: '#8000FF',
  unread: '#0000FF',
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('auto');
  const [isHighContrast, setIsHighContrast] = useState(false);

  const currentTheme = theme === 'auto' ? (systemColorScheme || 'light') : theme;
  const isDark = currentTheme === 'dark';
  
  // Use high contrast colors if enabled, otherwise use theme colors
  const colors = isHighContrast 
    ? highContrastColors 
    : (isDark ? darkColors : lightColors);
  
  const shadows = isDark ? darkShadows : lightShadows;

  useEffect(() => {
    // Load saved theme and high contrast setting from storage
    const loadSettings = async () => {
      try {
        const [savedTheme, savedHighContrast] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(HIGH_CONTRAST_STORAGE_KEY)
        ]);
        
        if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
          setThemeState(savedTheme as Theme);
        }
        
        if (savedHighContrast !== null) {
          setIsHighContrast(JSON.parse(savedHighContrast));
        }
      } catch (error) {
        console.error('[ThemeProvider] Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme).catch(console.error);
  };

  const setHighContrast = (enabled: boolean) => {
    setIsHighContrast(enabled);
    AsyncStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, JSON.stringify(enabled)).catch(console.error);
  };

  const value: ThemeContextType = {
    theme,
    currentTheme,
    colors,
    spacing,
    typography,
    shadows,
    setTheme,
    isDark,
    isHighContrast,
    setHighContrast,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}