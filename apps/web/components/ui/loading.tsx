"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const loadingVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        primary: "text-brand-primary",
        success: "text-success",
        warning: "text-warning",
        error: "text-error",
      },
      size: {
        sm: "text-sm gap-2",
        default: "text-base gap-2",
        lg: "text-lg gap-3",
        xl: "text-xl gap-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        default: "h-5 w-5",
        lg: "h-6 w-6",
        xl: "h-8 w-8",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string;
  icon?: "spinner" | "refresh" | "zap";
  fullScreen?: boolean;
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ 
    className, 
    variant, 
    size, 
    text = "Loading...", 
    icon = "spinner",
    fullScreen = false,
    ...props 
  }, ref) => {
    const IconComponent = {
      spinner: Loader2,
      refresh: RefreshCw,
      zap: Zap,
    }[icon];

    const loadingContent = (
      <div
        ref={ref}
        className={cn(loadingVariants({ variant, size, className }))}
        {...props}
      >
        <IconComponent className={cn(spinnerVariants({ size }))} />
        {text && <span>{text}</span>}
      </div>
    );

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          {loadingContent}
        </div>
      );
    }

    return loadingContent;
  }
);
Loading.displayName = "Loading";

// Inline loading component for buttons and small spaces
const LoadingSpinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof spinnerVariants>
>(({ className, size, ...props }, ref) => (
  <Loader2
    ref={ref}
    className={cn(spinnerVariants({ size }), "animate-spin", className)}
    {...props}
  />
));
LoadingSpinner.displayName = "LoadingSpinner";

// Loading overlay for wrapping content
interface LoadingOverlayProps extends LoadingProps {
  isLoading?: boolean;
  children?: React.ReactNode;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  ({ isLoading = false, children, className, ...loadingProps }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)}>
        {children}
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-inherit">
            <Loading {...loadingProps} />
          </div>
        )}
      </div>
    );
  }
);
LoadingOverlay.displayName = "LoadingOverlay";

// Dots loading animation
const LoadingDots = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "default" | "lg" }
>(({ className, size = "default", ...props }, ref) => {
  const dotSize = {
    sm: "w-1 h-1",
    default: "w-2 h-2",
    lg: "w-3 h-3",
  }[size];

  const gap = {
    sm: "gap-1",
    default: "gap-1.5",
    lg: "gap-2",
  }[size];

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center", gap, className)}
      {...props}
    >
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className={cn(
            dotSize,
            "rounded-full bg-current opacity-75 animate-pulse"
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
});
LoadingDots.displayName = "LoadingDots";

// Progress bar loading
interface LoadingProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indeterminate?: boolean;
}

const LoadingProgress = React.forwardRef<HTMLDivElement, LoadingProgressProps>(
  ({ className, value = 0, max = 100, indeterminate = false, ...props }, ref) => {
    const percentage = indeterminate ? 100 : Math.min((value / max) * 100, 100);

    return (
      <div
        ref={ref}
        className={cn(
          "w-full bg-muted rounded-full h-2 overflow-hidden",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full bg-gradient-to-r from-brand-primary to-innovation-cyan transition-all duration-300 ease-out",
            indeterminate && "animate-shimmer"
          )}
          style={{
            width: indeterminate ? "100%" : `${percentage}%`,
            backgroundSize: indeterminate ? "200% 100%" : "100% 100%",
          }}
        />
      </div>
    );
  }
);
LoadingProgress.displayName = "LoadingProgress";

export { 
  Loading, 
  LoadingSpinner, 
  LoadingOverlay, 
  LoadingDots, 
  LoadingProgress 
};