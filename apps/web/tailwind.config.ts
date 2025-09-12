import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Original shadcn/ui colors for compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // CRYB Trust Foundation Colors (Primary Palette)
        "primary-blue": "#0052FF",      // Core Trust (Coinbase-inspired)
        "navy-deep": "#1E3A8A",         // Alternative deep trust
        "trust-light": "#3B82F6",       // Muted blue for dark mode

        // Innovation Accents (Differentiation Palette)
        "electric-cyan": "#00D4FF",     // Primary innovation signal
        "innovation-purple": "#7434F3", // Alternative differentiation
        "cyber-lime": "#00FF90",        // Emerging Gen-Z preference

        // CRYB Brand Colors (Legacy Compatibility)
        brand: {
          primary: "#0052FF",            // Primary blue
          "primary-dark": "#0041CC",     // Darker variant for hover states
          "primary-light": "#3B82F6",    // Muted blue for dark mode
          secondary: "#00D4FF",          // Electric cyan
          "secondary-dark": "#00A8CC",   // Darker cyan variant
          "secondary-light": "#33E0FF",  // Lighter cyan variant
          dark: "#121212",               // Deep charcoal background
          navy: "#1E3A8A",               // Alternative deep trust
          accent: "#FF6B35",             // Vibrant orange (light mode)
          innovation: "#7434F3",         // Innovation purple
        },
        
        // Functional Status Colors (Semantic Palette)
        "success-green": "#10B981",     // Growth and positive actions
        "warning-amber": "#F59E0B",     // Cautions and alerts
        "error-red": "#EF4444",         // Critical errors only
        "info-blue": "#3B82F6",         // Informational states
        
        // Functional Colors (Legacy Compatibility)
        success: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
        },
        error: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
        },
        info: {
          DEFAULT: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
        },
        
        // Trading Specific Colors (Financial Palette)
        "buy-green": "#4CFB9C",         // Buy orders
        "sell-pink": "#F92463",         // Sell orders
        "trading-neutral": "#6B7280",   // Neutral trading states
        
        // Trading Colors (Legacy Compatibility)
        trading: {
          buy: "#4CFB9C",              // Buy green
          sell: "#F92463",             // Sell pink
          neutral: "#6B7280",          // Neutral states
        },
        
        // Community Colors (Social Platform Integration)
        discord: {
          online: "#10B981",
          idle: "#F59E0B",
          dnd: "#EF4444",
          offline: "#6B7280",
        },
        reddit: {
          upvote: "#FF6B35",
          downvote: "#7434F3",
          award: "#F59E0B",
        },
        
        // 2025-2026 Emerging Palette (Future-Forward Colors)
        "digital-lavender": "#B794F4",  // Soft tech aesthetic
        "solar-punk-green": "#68D391",  // Sustainable tech
        "vapor-pink": "#FF10F0",
        "vapor-purple": "#8B5CF6",
        "vapor-cyan": "#00FFFF",
        "achievement-gold": "#FFD700",
        "legendary-purple": "#9333EA",
        "epic-blue": "#3B82F6",
        
        // Extended Gray Scale (CRYB Foundation)
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
          900: "#121212",  // Deep charcoal (not pure black)
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(-10px)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scale-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.95)" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 82, 255, 0.7)" },
          "50%": { boxShadow: "0 0 0 8px rgba(0, 82, 255, 0)" },
        },
        "pulse-glow-cyan": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0, 212, 255, 0.7)" },
          "50%": { boxShadow: "0 0 0 8px rgba(0, 212, 255, 0)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "glow-breathe": {
          "0%, 100%": { filter: "brightness(1) saturate(1)" },
          "50%": { filter: "brightness(1.1) saturate(1.2)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.2s ease-in",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.2s ease-in",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.15s ease-in",
        "shimmer": "shimmer 2s infinite",
        "pulse-glow": "pulse-glow 2s infinite",
        "pulse-glow-cyan": "pulse-glow-cyan 2s infinite",
        "bounce-subtle": "bounce-subtle 2s infinite",
        "glow-breathe": "glow-breathe 3s ease-in-out infinite",
      },
      boxShadow: {
        "soft": "0 2px 8px rgba(0, 0, 0, 0.06)",
        "medium": "0 4px 16px rgba(0, 0, 0, 0.12)",
        "large": "0 8px 32px rgba(0, 0, 0, 0.16)",
        "glow-primary": "0 0 20px rgba(0, 82, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1)",
        "glow-cyan": "0 0 20px rgba(0, 212, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1)",
        "glow-purple": "0 0 20px rgba(116, 52, 243, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1)",
        "glow-success": "0 0 16px rgba(16, 185, 129, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)",
        "glow-warning": "0 0 16px rgba(245, 158, 11, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)",
        "glow-error": "0 0 16px rgba(239, 68, 68, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;