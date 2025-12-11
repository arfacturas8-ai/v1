/**
 * CRYB Design System - TypeScript Utilities
 * Type-safe design tokens and utilities for consistent styling
 */

// ===== COLOR UTILITIES =====
export const colors = {
  primary: {
    50: 'rgb(240 249 255)',   // #f0f9ff
    100: 'rgb(224 242 254)',  // #e0f2fe
    200: 'rgb(186 230 253)',  // #bae6fd
    300: 'rgb(125 211 252)',  // #7dd3fc
    400: 'rgb(56 189 248)',   // #38bdf8
    500: 'rgb(14 165 233)',   // #0ea5e9
    600: 'rgb(2 132 199)',    // #0284c7
    700: 'rgb(3 105 161)',    // #0369a1
    800: 'rgb(7 89 133)',     // #075985
    900: 'rgb(12 74 110)',    // #0c4a6e
    950: 'rgb(8 47 73)',      // #082f49
  },
  secondary: {
    50: 'rgb(255 247 237)',   // #fff7ed
    100: 'rgb(255 237 213)',  // #ffedd5
    200: 'rgb(254 215 170)',  // #fed7aa
    300: 'rgb(253 186 116)',  // #fdba74
    400: 'rgb(251 146 60)',   // #fb923c
    500: 'rgb(249 115 22)',   // #f97316
    600: 'rgb(234 88 12)',    // #ea580c
    700: 'rgb(194 65 12)',    // #c2410c
    800: 'rgb(154 52 18)',    // #9a3412
    900: 'rgb(124 45 18)',    // #7c2d12
    950: 'rgb(67 20 7)',      // #431407
  },
  neutral: {
    50: 'rgb(250 250 250)',   // #fafafa
    100: 'rgb(245 245 245)',  // #f5f5f5
    200: 'rgb(229 229 229)',  // #e5e5e5
    300: 'rgb(212 212 212)',  // #d4d4d4
    400: 'rgb(163 163 163)',  // #a3a3a3
    500: 'rgb(115 115 115)',  // #737373
    600: 'rgb(82 82 82)',     // #525252
    700: 'rgb(64 64 64)',     // #404040
    800: 'rgb(38 38 38)',     // #262626
    900: 'rgb(23 23 23)',     // #171717
    950: 'rgb(10 10 10)',     // #0a0a0a
  },
  success: {
    50: 'rgb(240 253 244)',   // #f0fdf4
    100: 'rgb(220 252 231)',  // #dcfce7
    200: 'rgb(187 247 208)',  // #bbf7d0
    300: 'rgb(134 239 172)',  // #86efac
    400: 'rgb(74 222 128)',   // #4ade80
    500: 'rgb(34 197 94)',    // #22c55e
    600: 'rgb(22 163 74)',    // #16a34a
    700: 'rgb(21 128 61)',    // #15803d
    800: 'rgb(22 101 52)',    // #166534
    900: 'rgb(20 83 45)',     // #14532d
  },
  warning: {
    50: 'rgb(255 251 235)',   // #fffbeb
    100: 'rgb(254 243 199)',  // #fef3c7
    200: 'rgb(253 230 138)',  // #fde68a
    300: 'rgb(252 211 77)',   // #fcd34d
    400: 'rgb(251 191 36)',   // #fbbf24
    500: 'rgb(245 158 11)',   // #f59e0b
    600: 'rgb(217 119 6)',    // #d97706
    700: 'rgb(180 83 9)',     // #b45309
    800: 'rgb(146 64 14)',    // #92400e
    900: 'rgb(120 53 15)',    // #78350f
  },
  error: {
    50: 'rgb(254 242 242)',   // #fef2f2
    100: 'rgb(254 226 226)',  // #fee2e2
    200: 'rgb(254 202 202)',  // #fecaca
    300: 'rgb(252 165 165)',  // #fca5a5
    400: 'rgb(248 113 113)',  // #f87171
    500: 'rgb(239 68 68)',    // #ef4444
    600: 'rgb(220 38 38)',    // #dc2626
    700: 'rgb(185 28 28)',    // #b91c1c
    800: 'rgb(153 27 27)',    // #991b1b
    900: 'rgb(127 29 29)',    // #7f1d1d
  },
} as const;

// ===== SPACING UTILITIES =====
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem',    // 256px
} as const;

// ===== TYPOGRAPHY UTILITIES =====
export const typography = {
  fontFamily: {
    sans: 'var(--font-family-sans)',
    mono: 'var(--font-family-mono)',
    display: 'var(--font-family-display)',
  },
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
    '8xl': '6rem',      // 96px
    '9xl': '8rem',      // 128px
  },
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// ===== RADIUS UTILITIES =====
export const radius = {
  none: '0',
  sm: '0.125rem',    // 2px
  base: '0.25rem',   // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const;

// ===== SHADOW UTILITIES =====
export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: {
    sm: '0 0 10px rgb(var(--color-primary-500) / 0.2)',
    base: '0 0 20px rgb(var(--color-primary-500) / 0.3)',
    lg: '0 0 40px rgb(var(--color-primary-500) / 0.4)',
  },
} as const;

// ===== Z-INDEX UTILITIES =====
export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
  toast: '1080',
} as const;

// ===== TRANSITION UTILITIES =====
export const transitions = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    expoIn: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
    expoOut: 'cubic-bezier(0.19, 1, 0.22, 1)',
  },
} as const;

// ===== BREAKPOINTS =====
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ===== COMPONENT TOKENS =====
export const componentTokens = {
  button: {
    height: {
      sm: '2rem',      // 32px
      base: '2.5rem',  // 40px
      lg: '3rem',      // 48px
    },
    padding: {
      x: {
        sm: '0.75rem',   // 12px
        base: '1rem',    // 16px
        lg: '1.5rem',    // 24px
      },
      y: '0.5rem',       // 8px
    },
    borderRadius: radius.md,
    fontSize: {
      sm: typography.fontSize.sm,
      base: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
  },
  input: {
    height: {
      sm: '2rem',      // 32px
      base: '2.5rem',  // 40px
      lg: '3rem',      // 48px
    },
    padding: {
      x: '0.75rem',    // 12px
      y: '0.5rem',     // 8px
    },
    borderRadius: radius.md,
    fontSize: typography.fontSize.base,
  },
  card: {
    padding: '1.5rem',           // 24px
    borderRadius: radius.lg,
    borderWidth: '1px',
    shadow: shadows.sm,
  },
  avatar: {
    size: {
      xs: '1.5rem',    // 24px
      sm: '2rem',      // 32px
      base: '2.5rem',  // 40px
      lg: '3rem',      // 48px
      xl: '4rem',      // 64px
      '2xl': '5rem',   // 80px
    },
  },
  navigation: {
    height: '4rem',              // 64px
    padding: {
      x: '1rem',                 // 16px
    },
    sidebar: {
      width: '16rem',            // 256px
      widthCollapsed: '4rem',    // 64px
    },
  },
  content: {
    maxWidth: '1200px',
    padding: '1rem',             // 16px
    post: {
      maxWidth: '600px',
    },
    comment: {
      indent: '1.5rem',          // 24px
    },
  },
} as const;

// ===== UTILITY FUNCTIONS =====

/**
 * Creates a CSS custom property reference
 */
export function cssVar(name: string): string {
  return `var(--${name})`;
}

/**
 * Creates a Tailwind arbitrary value with CSS custom property
 */
export function tw(value: string): string {
  return `[${value}]`;
}

/**
 * Creates HSL color string from RGB values
 */
export function hsl(r: number, g: number, b: number): string {
  return `hsl(${r} ${g} ${b})`;
}

/**
 * Creates RGB color string
 */
export function rgb(r: number, g: number, b: number): string {
  return `rgb(${r} ${g} ${b})`;
}

/**
 * Creates RGBA color string with opacity
 */
export function rgba(r: number, g: number, b: number, alpha: number): string {
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/**
 * Creates a focus ring utility class
 */
export function focusRing(color?: string): string {
  const ringColor = color || 'var(--focus-ring-color)';
  return `focus:outline-none focus:ring-2 focus:ring-[${ringColor}] focus:ring-opacity-50 focus:ring-offset-2`;
}

/**
 * Creates responsive utility classes
 */
export function responsive(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([breakpoint, value]) => 
      breakpoint === 'base' ? value : `${breakpoint}:${value}`
    )
    .join(' ');
}

/**
 * Creates hover and focus states
 */
export function interactiveStates(
  base: string,
  hover?: string,
  focus?: string,
  active?: string
): string {
  const states = [base];
  if (hover) states.push(`hover:${hover}`);
  if (focus) states.push(`focus:${focus}`);
  if (active) states.push(`active:${active}`);
  return states.join(' ');
}

/**
 * Creates dark mode variant classes
 */
export function darkMode(lightClass: string, darkClass: string): string {
  return `${lightClass} dark:${darkClass}`;
}

/**
 * Type-safe component variant creator
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  variants: T
): T {
  return variants;
}

// ===== ANIMATION PRESETS =====
export const animations = {
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  slideInFromTop: 'animate-slide-in-from-top',
  slideInFromBottom: 'animate-slide-in-from-bottom',
  slideInFromLeft: 'animate-slide-in-from-left',
  slideInFromRight: 'animate-slide-in-from-right',
  zoomIn: 'animate-zoom-in',
  zoomOut: 'animate-zoom-out',
  shimmer: 'animate-shimmer',
  pulseRing: '-ring',
  bounceIn: 'animate-bounce-in',
  slideUpFade: 'animate-slide-up-fade',
  slideDownFade: 'animate-slide-down-fade',
} as const;

// ===== SEMANTIC COLOR ALIASES =====
export const semanticColors = {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  card: 'hsl(var(--card))',
  cardForeground: 'hsl(var(--card-foreground))',
  popover: 'hsl(var(--popover))',
  popoverForeground: 'hsl(var(--popover-foreground))',
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',
  secondary: 'hsl(var(--secondary))',
  secondaryForeground: 'hsl(var(--secondary-foreground))',
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  accent: 'hsl(var(--accent))',
  accentForeground: 'hsl(var(--accent-foreground))',
  destructive: 'hsl(var(--destructive))',
  destructiveForeground: 'hsl(var(--destructive-foreground))',
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
} as const;

// ===== TYPE EXPORTS =====
export type ColorScale = typeof colors.primary;
export type SpacingScale = typeof spacing;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type BorderRadius = keyof typeof radius;
export type Shadow = keyof typeof shadows;
export type ZIndex = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;
export type ComponentSize = 'sm' | 'base' | 'lg';
export type SemanticColor = keyof typeof semanticColors;