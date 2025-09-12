import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] relative overflow-hidden touch-target",
  {
    variants: {
      variant: {
        // Trust Foundation Variants
        default: "bg-primary-blue text-white hover:bg-navy-deep shadow-md hover:shadow-lg focus-visible:ring-primary-blue",
        trust: "bg-primary-blue text-white hover:bg-navy-deep shadow-md hover:shadow-glow-primary focus-visible:ring-primary-blue",
        "trust-light": "bg-trust-light text-white hover:bg-primary-blue shadow-md hover:shadow-lg focus-visible:ring-trust-light",
        
        // Innovation & Accent Variants
        innovation: "bg-gradient-innovation text-white hover:shadow-glow-purple shadow-lg hover:shadow-xl focus-visible:ring-innovation-purple",
        "electric-cyan": "bg-electric-cyan text-gray-900 hover:bg-cyber-lime shadow-md hover:shadow-glow-cyan focus-visible:ring-electric-cyan font-medium",
        "cyber-lime": "bg-cyber-lime text-gray-900 hover:bg-electric-cyan shadow-md hover:shadow-glow-cyan focus-visible:ring-cyber-lime font-medium",
        
        // Functional Status Variants  
        success: "bg-success-green text-white hover:shadow-glow-success shadow-md hover:shadow-lg focus-visible:ring-success-green",
        warning: "bg-warning-amber text-gray-900 hover:shadow-glow-warning shadow-md hover:shadow-lg focus-visible:ring-warning-amber",
        error: "bg-error-red text-white hover:shadow-glow-error shadow-md hover:shadow-lg focus-visible:ring-error-red",
        info: "bg-info-blue text-white hover:bg-trust-light shadow-md hover:shadow-lg focus-visible:ring-info-blue",
        
        // Trading Specific Variants
        "buy": "bg-buy-green text-gray-900 hover:bg-success-green shadow-md hover:shadow-glow-success font-semibold focus-visible:ring-buy-green",
        "sell": "bg-sell-pink text-white hover:bg-error-red shadow-md hover:shadow-glow-error font-semibold focus-visible:ring-sell-pink",
        "trading-neutral": "bg-trading-neutral text-white hover:bg-gray-600 shadow-md hover:shadow-lg focus-visible:ring-trading-neutral",
        
        // Community & Social Variants
        discord: "bg-discord-online text-white hover:bg-success-green shadow-md hover:shadow-lg focus-visible:ring-discord-online",
        reddit: "bg-reddit-upvote text-white hover:bg-reddit-downvote shadow-md hover:shadow-lg focus-visible:ring-reddit-upvote",
        
        // Emerging Palette Variants
        vapor: "bg-vapor-purple text-white hover:bg-vapor-pink shadow-md hover:shadow-xl focus-visible:ring-vapor-purple",
        solar: "bg-solar-punk-green text-gray-900 hover:bg-achievement-gold shadow-md hover:shadow-lg focus-visible:ring-solar-punk-green",
        legendary: "bg-legendary-purple text-white hover:bg-epic-blue shadow-md hover:shadow-glow-purple focus-visible:ring-legendary-purple",
        
        // Utility & UI Variants
        destructive: "bg-error-red text-white hover:shadow-glow-error shadow-md hover:shadow-lg focus-visible:ring-error-red",
        outline: "border-2 border-primary-blue bg-transparent text-primary-blue hover:bg-primary-blue hover:text-white shadow-sm hover:shadow-md focus-visible:ring-primary-blue",
        secondary: "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-sm hover:shadow-md focus-visible:ring-gray-500",
        ghost: "text-primary-blue hover:bg-primary-blue/10 hover:text-primary-blue focus-visible:ring-primary-blue",
        link: "text-primary-blue underline-offset-4 hover:underline hover:text-navy-deep focus-visible:ring-primary-blue p-0 h-auto",
        glass: "bg-card/80 backdrop-blur-sm border border-white/10 text-foreground hover:bg-card/90 shadow-lg focus-visible:ring-primary-blue",
        muted: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm hover:shadow-md focus-visible:ring-gray-500",
        
        // Legacy Compatibility
        brand: "bg-primary-blue text-white hover:bg-navy-deep shadow-md hover:shadow-lg focus-visible:ring-primary-blue",
        "brand-secondary": "bg-electric-cyan text-gray-900 hover:bg-cyber-lime shadow-md hover:shadow-lg font-medium focus-visible:ring-electric-cyan",
      },
      size: {
        // Standard Sizes
        xs: "h-7 px-2 py-1 text-xs",
        sm: "h-8 px-3 py-1.5 text-xs",
        default: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg",
        "2xl": "h-16 px-10 py-5 text-xl",
        
        // Icon Sizes (Square)
        icon: "h-10 w-10 p-0",
        "icon-xs": "h-7 w-7 p-0",
        "icon-sm": "h-8 w-8 p-0", 
        "icon-lg": "h-12 w-12 p-0",
        "icon-xl": "h-14 w-14 p-0",
        "icon-2xl": "h-16 w-16 p-0",
        
        // Mobile-optimized touch targets (WCAG 2.1 AA - min 44px)
        touch: "min-h-[44px] min-w-[44px] px-4 py-2 text-sm",
        "touch-lg": "min-h-[48px] min-w-[48px] px-6 py-3 text-base",
        "touch-xl": "min-h-[52px] min-w-[52px] px-8 py-4 text-lg",
        
        // Responsive sizes
        responsive: "h-8 px-3 py-1.5 text-xs sm:h-10 sm:px-4 sm:py-2 sm:text-sm md:h-12 md:px-6 md:py-3 md:text-base",
        "responsive-lg": "h-10 px-4 py-2 text-sm sm:h-12 sm:px-6 sm:py-3 sm:text-base md:h-14 md:px-8 md:py-4 md:text-lg",
        
        // Full width options
        "full": "w-full h-10 px-4 py-2 text-sm",
        "full-lg": "w-full h-12 px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  
  // Enhanced accessibility props
  "aria-describedby"?: string;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean | "false" | "true" | "menu" | "listbox" | "tree" | "grid" | "dialog";
  "aria-controls"?: string;
  
  // Icon support
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // Enhanced loading states
  loadingSpinnerClassName?: string;
  
  // Tooltip support
  tooltip?: string;
  
  // Enhanced visual states
  pulse?: boolean;
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false, 
    loadingText,
    leftIcon,
    rightIcon,
    loadingSpinnerClassName,
    tooltip,
    pulse = false,
    glow = false,
    children, 
    disabled, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const spinnerSize = React.useMemo(() => {
      if (size === "xs" || size === "sm" || size === "icon-xs" || size === "icon-sm") return "sm";
      if (size === "lg" || size === "xl" || size === "2xl" || size === "icon-lg" || size === "icon-xl" || size === "icon-2xl" || size === "touch-lg" || size === "touch-xl") return "lg";
      return "default";
    }, [size]);

    const isIconOnly = size?.startsWith("icon");
    const hasIcons = leftIcon || rightIcon;
    
    const buttonClasses = cn(
      buttonVariants({ variant, size }),
      pulse && "animate-pulse-glow",
      glow && "shadow-glow-primary",
      className
    );
    
    return (
      <Comp 
        className={buttonClasses}
        ref={ref} 
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        data-loading={loading}
        role={asChild ? undefined : "button"}
        title={tooltip}
        {...props} 
      >
        {/* Left Icon */}
        {leftIcon && !loading && (
          <span className={cn("flex-shrink-0", children && "mr-2")}>
            {leftIcon}
          </span>
        )}
        
        {/* Loading Spinner */}
        {loading && (
          <LoadingSpinner 
            size={spinnerSize}
            className={cn(
              "animate-spin flex-shrink-0",
              (!isIconOnly && children) || hasIcons ? "mr-2" : "",
              loadingSpinnerClassName
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Button Content */}
        {loading ? (
          <span className={isIconOnly && !hasIcons ? "sr-only" : ""}>
            {loadingText || "Loading..."}
          </span>
        ) : (
          <>
            {children}
          </>
        )}
        
        {/* Right Icon */}
        {rightIcon && !loading && (
          <span className={cn("flex-shrink-0", children && "ml-2")}>
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// Button Group Component for organizing related buttons
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  spacing?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "connected";
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = "horizontal", spacing = "sm", variant = "default", children, ...props }, ref) => {
    const groupClasses = cn(
      "inline-flex",
      orientation === "horizontal" ? "flex-row" : "flex-col",
      variant === "connected" && orientation === "horizontal" && "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
      variant === "connected" && orientation === "vertical" && "[&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      variant === "default" && {
        "gap-1": spacing === "sm",
        "gap-2": spacing === "md", 
        "gap-4": spacing === "lg",
        "gap-0": spacing === "none",
      },
      className
    );

    return (
      <div
        ref={ref}
        className={groupClasses}
        role="group"
        {...props}
      >
        {children}
      </div>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

export { Button, buttonVariants, ButtonGroup };