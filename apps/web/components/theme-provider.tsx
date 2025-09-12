"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { useUIStore } from "@/lib/stores/use-ui-store";

interface ExtendedThemeProviderProps extends ThemeProviderProps {
  children: React.ReactNode;
}

// Enhanced theme context for CRYB design system
interface CrybThemeContextType {
  // Accessibility features
  highContrast: boolean;
  reducedMotion: boolean;
  
  // Color schemes
  colorScheme: "default" | "gaming" | "professional" | "vapor" | "solar";
  
  // Regional preferences
  region: "western" | "asia" | "middle_east";
  
  // User preferences
  trustMode: boolean; // Prioritize trust colors over innovation
  
  // Setters
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setColorScheme: (scheme: "default" | "gaming" | "professional" | "vapor" | "solar") => void;
  setRegion: (region: "western" | "asia" | "middle_east") => void;
  setTrustMode: (enabled: boolean) => void;
  
  // Utilities
  getThemeColors: () => Record<string, string>;
  isSystemDark: boolean;
}

const CrybThemeContext = React.createContext<CrybThemeContextType | undefined>(undefined);

export function useCrybTheme() {
  const context = React.useContext(CrybThemeContext);
  if (context === undefined) {
    throw new Error("useCrybTheme must be used within a CrybThemeProvider");
  }
  return context;
}

// Enhanced theme provider with CRYB design system features
function CrybThemeProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = React.useState(false);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [colorScheme, setColorScheme] = React.useState<"default" | "gaming" | "professional" | "vapor" | "solar">("default");
  const [region, setRegion] = React.useState<"western" | "asia" | "middle_east">("western");
  const [trustMode, setTrustMode] = React.useState(false);
  const [isSystemDark, setIsSystemDark] = React.useState(false);

  // Detect system preferences and initialize theme
  React.useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);

    // Check for dark mode preference
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsSystemDark(darkQuery.matches);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia("(prefers-contrast: high)");
    setHighContrast(contrastQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    const handleDarkChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches);
    };

    motionQuery.addEventListener("change", handleMotionChange);
    darkQuery.addEventListener("change", handleDarkChange);
    contrastQuery.addEventListener("change", handleContrastChange);

    // Load saved preferences
    const savedRegion = localStorage.getItem("cryb-region") as "western" | "asia" | "middle_east";
    const savedColorScheme = localStorage.getItem("cryb-color-scheme") as "default" | "gaming" | "professional" | "vapor" | "solar";
    const savedTrustMode = localStorage.getItem("cryb-trust-mode") === "true";
    const savedHighContrast = localStorage.getItem("cryb-high-contrast") === "true";

    if (savedRegion) setRegion(savedRegion);
    if (savedColorScheme) setColorScheme(savedColorScheme);
    if (savedTrustMode !== null) setTrustMode(savedTrustMode);
    if (savedHighContrast !== null) setHighContrast(savedHighContrast);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      darkQuery.removeEventListener("change", handleDarkChange);
      contrastQuery.removeEventListener("change", handleContrastChange);
    };
  }, []);

  // Apply theme settings and save preferences
  React.useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Reduced motion
    if (reducedMotion) {
      root.style.setProperty("--animation-duration", "0.01ms");
      root.classList.add("reduced-motion");
    } else {
      root.style.removeProperty("--animation-duration");
      root.classList.remove("reduced-motion");
    }

    // Color scheme and region
    root.setAttribute("data-color-scheme", colorScheme);
    root.setAttribute("data-region", region);
    root.setAttribute("data-trust-mode", trustMode.toString());

    // Save preferences
    localStorage.setItem("cryb-region", region);
    localStorage.setItem("cryb-color-scheme", colorScheme);
    localStorage.setItem("cryb-trust-mode", trustMode.toString());
    localStorage.setItem("cryb-high-contrast", highContrast.toString());
  }, [highContrast, reducedMotion, colorScheme, region, trustMode]);

  // Get theme colors based on current settings
  const getThemeColors = React.useCallback(() => {
    const colors: Record<string, string> = {};
    
    // Base colors
    colors.primary = trustMode ? "#0052FF" : "#3B82F6";
    colors.accent = "#00D4FF";
    colors.innovation = "#7434F3";
    
    // Regional adaptations
    if (region === "asia") {
      colors.prosperity = "#DC2626"; // Red for luck
      colors.success = "#DC2626";
    } else if (region === "middle_east") {
      colors.prosperity = "#10B981"; // Green (Islamic significance)
      colors.premium = "#FFD700"; // Gold for luxury
    } else {
      colors.prosperity = "#10B981"; // Green for money/growth
      colors.success = "#10B981";
    }
    
    // Color scheme variations
    if (colorScheme === "gaming") {
      colors.primary = "#9333EA"; // Legendary purple
      colors.accent = "#00FF90"; // Cyber lime
    } else if (colorScheme === "vapor") {
      colors.primary = "#8B5CF6"; // Vapor purple
      colors.accent = "#FF10F0"; // Vapor pink
    } else if (colorScheme === "solar") {
      colors.primary = "#68D391"; // Solar punk green
      colors.accent = "#FFD700"; // Achievement gold
    }
    
    return colors;
  }, [region, colorScheme, trustMode]);

  const value = React.useMemo(
    () => ({
      highContrast,
      reducedMotion,
      colorScheme,
      region,
      trustMode,
      isSystemDark,
      setHighContrast,
      setReducedMotion,
      setColorScheme,
      setRegion,
      setTrustMode,
      getThemeColors,
    }),
    [highContrast, reducedMotion, colorScheme, region, trustMode, isSystemDark, getThemeColors]
  );

  return (
    <CrybThemeContext.Provider value={value}>
      {children}
    </CrybThemeContext.Provider>
  );
}

export function ThemeProvider({ children, ...props }: ExtendedThemeProviderProps) {
  const { theme: storeTheme, setTheme } = useUIStore();
  const [mounted, setMounted] = React.useState(false);

  // Ensure theme is applied correctly on mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    // Sync theme from UI store with next-themes if needed
    if (storeTheme && storeTheme !== props.defaultTheme) {
      // This will be handled by next-themes internally
    }
  }, [storeTheme, props.defaultTheme]);

  if (!mounted) {
    // Prevent hydration mismatch
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="cryb-theme"
      themes={["light", "dark", "system"]}
      {...props}
    >
      <CrybThemeProvider>
        <ThemeScript />
        {children}
      </CrybThemeProvider>
    </NextThemesProvider>
  );
}

// Enhanced theme script to prevent flash of unstyled content
function ThemeScript() {
  const script = `
    try {
      const theme = localStorage.getItem('cryb-theme') || 'dark';
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const resolvedTheme = theme === 'system' ? systemTheme : theme;
      
      // Apply dark/light mode
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Load and apply additional preferences
      const region = localStorage.getItem('cryb-region') || 'western';
      const colorScheme = localStorage.getItem('cryb-color-scheme') || 'default';
      const trustMode = localStorage.getItem('cryb-trust-mode') === 'true';
      const highContrast = localStorage.getItem('cryb-high-contrast') === 'true';
      
      document.documentElement.setAttribute('data-region', region);
      document.documentElement.setAttribute('data-color-scheme', colorScheme);
      document.documentElement.setAttribute('data-trust-mode', trustMode.toString());
      
      if (highContrast) {
        document.documentElement.classList.add('high-contrast');
      }
      
      // Check for system preferences
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('reduced-motion');
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      }
      
      // Set initial CSS custom properties
      if (resolvedTheme === 'dark') {
        document.documentElement.style.setProperty('--color-bg-primary', '#121212');
        document.documentElement.style.setProperty('--color-text-primary', '#FFFFFF');
        document.documentElement.style.setProperty('--color-brand-primary', trustMode ? '#0052FF' : '#3B82F6');
      } else {
        document.documentElement.style.setProperty('--color-bg-primary', '#FFFFFF');
        document.documentElement.style.setProperty('--color-text-primary', '#1F2937');
        document.documentElement.style.setProperty('--color-brand-primary', '#0052FF');
      }
    } catch (e) {
      console.warn('Theme initialization error:', e);
    }
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

// Theme toggle hook with enhanced features
export function useThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { setTheme: setStoreTheme } = useUIStore();
  const { getThemeColors } = useCrybTheme();

  const toggleTheme = React.useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    setStoreTheme(newTheme);
  }, [theme, setTheme, setStoreTheme]);

  const getCurrentColors = React.useCallback(() => {
    return getThemeColors();
  }, [getThemeColors]);

  return { theme, toggleTheme, setTheme, getCurrentColors };
}

// Enhanced theme toggle component
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeToggle();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-9 w-9" />; // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 ${className || ""}`}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}

// CRYB Theme Controls Component
export function CrybThemeControls({ className }: { className?: string }) {
  const {
    colorScheme,
    region,
    trustMode,
    highContrast,
    setColorScheme,
    setRegion,
    setTrustMode,
    setHighContrast,
  } = useCrybTheme();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className || ""}`}>
      <div>
        <label className="text-sm font-medium">Color Scheme</label>
        <select
          value={colorScheme}
          onChange={(e) => setColorScheme(e.target.value as any)}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="default">Default</option>
          <option value="gaming">Gaming</option>
          <option value="professional">Professional</option>
          <option value="vapor">Vaporwave</option>
          <option value="solar">Solar Punk</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Region</label>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as any)}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="western">Western</option>
          <option value="asia">Asia</option>
          <option value="middle_east">Middle East</option>
        </select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="trust-mode"
          type="checkbox"
          checked={trustMode}
          onChange={(e) => setTrustMode(e.target.checked)}
          className="rounded border-input"
        />
        <label htmlFor="trust-mode" className="text-sm font-medium">
          Trust Mode (Security Focus)
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="high-contrast"
          type="checkbox"
          checked={highContrast}
          onChange={(e) => setHighContrast(e.target.checked)}
          className="rounded border-input"
        />
        <label htmlFor="high-contrast" className="text-sm font-medium">
          High Contrast
        </label>
      </div>
    </div>
  );
}