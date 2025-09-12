"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Breakpoints matching Tailwind's default breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

type Breakpoint = keyof typeof breakpoints;

// Hook to get current breakpoint
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>("sm");

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= breakpoints["2xl"]) {
        setBreakpoint("2xl");
      } else if (width >= breakpoints.xl) {
        setBreakpoint("xl");
      } else if (width >= breakpoints.lg) {
        setBreakpoint("lg");
      } else if (width >= breakpoints.md) {
        setBreakpoint("md");
      } else {
        setBreakpoint("sm");
      }
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return breakpoint;
}

// Hook to check if screen is mobile
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.md);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
}

// Hook to get media query match
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

// Responsive container component
interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg";
}

export const ResponsiveContainer = React.forwardRef<
  HTMLDivElement,
  ResponsiveContainerProps
>(({ className, maxWidth = "lg", padding = "md", children, ...props }, ref) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-4xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-none",
  };

  const paddingClasses = {
    none: "",
    sm: "px-4 md:px-6",
    md: "px-4 md:px-6 lg:px-8",
    lg: "px-4 md:px-8 lg:px-12",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "mx-auto w-full",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
ResponsiveContainer.displayName = "ResponsiveContainer";

// Responsive grid component
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  gap?: "none" | "sm" | "md" | "lg" | "xl";
}

export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ className, cols = { default: 1 }, gap = "md", children, ...props }, ref) => {
    const gapClasses = {
      none: "gap-0",
      sm: "gap-2 md:gap-3",
      md: "gap-4 md:gap-6",
      lg: "gap-6 md:gap-8",
      xl: "gap-8 md:gap-12",
    };

    const getGridCols = () => {
      const classes = [];
      if (cols.default) classes.push(`grid-cols-${cols.default}`);
      if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
      if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
      if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
      if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
      if (cols["2xl"]) classes.push(`2xl:grid-cols-${cols["2xl"]}`);
      return classes.join(" ");
    };

    return (
      <div
        ref={ref}
        className={cn("grid", getGridCols(), gapClasses[gap], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ResponsiveGrid.displayName = "ResponsiveGrid";

// Show/Hide components based on breakpoints
interface ShowProps {
  above?: Breakpoint;
  below?: Breakpoint;
  only?: Breakpoint;
  children: React.ReactNode;
}

export function Show({ above, below, only, children }: ShowProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const checkVisibility = () => {
      const width = window.innerWidth;

      if (only) {
        const currentBp = breakpoints[only];
        const nextBpKey = Object.keys(breakpoints).find(
          (bp) => breakpoints[bp as Breakpoint] > currentBp
        ) as Breakpoint | undefined;
        
        const isInRange = width >= currentBp && 
          (!nextBpKey || width < breakpoints[nextBpKey]);
        
        setIsVisible(isInRange);
        return;
      }

      let visible = true;
      if (above) {
        visible = visible && width >= breakpoints[above];
      }
      if (below) {
        visible = visible && width < breakpoints[below];
      }

      setIsVisible(visible);
    };

    checkVisibility();
    window.addEventListener("resize", checkVisibility);
    return () => window.removeEventListener("resize", checkVisibility);
  }, [above, below, only]);

  return isVisible ? <>{children}</> : null;
}

// Mobile navigation component
interface MobileNavProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav = React.forwardRef<HTMLDivElement, MobileNavProps>(
  ({ className, isOpen, onClose, children, ...props }, ref) => {
    // Close on escape key
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }

      return () => {
        document.body.style.overflow = "";
      };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
        
        {/* Navigation */}
        <div
          ref={ref}
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-card border-r border-border p-6 shadow-lg md:hidden",
            "transform transition-transform duration-200 ease-out",
            isOpen ? "translate-x-0" : "-translate-x-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);
MobileNav.displayName = "MobileNav";

// Responsive text component
interface ResponsiveTextProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: {
    default?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
  };
}

export const ResponsiveText = React.forwardRef<HTMLDivElement, ResponsiveTextProps>(
  ({ className, size = { default: "base" }, children, ...props }, ref) => {
    const getSizeClasses = () => {
      const classes = [];
      if (size.default) classes.push(`text-${size.default}`);
      if (size.sm) classes.push(`sm:text-${size.sm}`);
      if (size.md) classes.push(`md:text-${size.md}`);
      if (size.lg) classes.push(`lg:text-${size.lg}`);
      if (size.xl) classes.push(`xl:text-${size.xl}`);
      if (size["2xl"]) classes.push(`2xl:text-${size["2xl"]}`);
      return classes.join(" ");
    };

    return (
      <div
        ref={ref}
        className={cn(getSizeClasses(), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ResponsiveText.displayName = "ResponsiveText";

// Aspect ratio component for responsive media
interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number;
  children: React.ReactNode;
}

export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ className, ratio = 16 / 9, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative w-full", className)}
        style={{ paddingBottom: `${100 / ratio}%` }}
        {...props}
      >
        <div className="absolute inset-0">
          {children}
        </div>
      </div>
    );
  }
);
AspectRatio.displayName = "AspectRatio";