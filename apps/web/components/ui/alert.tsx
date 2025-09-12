import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle, 
  X,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Star,
  Crown,
  Gamepad2,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm transition-all duration-200 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        // Trust Foundation Variants
        default: "bg-card text-card-foreground border-border",
        trust: "bg-primary-blue/10 text-primary-blue border-primary-blue/20 dark:bg-primary-blue/20 [&>svg]:text-primary-blue",
        "trust-light": "bg-trust-light/10 text-trust-light border-trust-light/20 dark:bg-trust-light/20 [&>svg]:text-trust-light",
        
        // Innovation & Accent Variants
        innovation: "bg-innovation-purple/10 text-innovation-purple border-innovation-purple/20 dark:bg-innovation-purple/20 [&>svg]:text-innovation-purple",
        "electric-cyan": "bg-electric-cyan/10 text-electric-cyan border-electric-cyan/20 dark:bg-electric-cyan/20 [&>svg]:text-electric-cyan",
        "cyber-lime": "bg-cyber-lime/10 text-cyber-lime border-cyber-lime/20 dark:bg-cyber-lime/20 [&>svg]:text-cyber-lime",
        
        // Functional Status Variants
        success: "colorblind-safe-success [&>svg]:text-success-green",
        warning: "colorblind-safe-warning [&>svg]:text-warning-amber", 
        error: "colorblind-safe-error [&>svg]:text-error-red",
        info: "colorblind-safe-info [&>svg]:text-info-blue",
        
        // Trading Specific Variants
        buy: "bg-buy-green/10 text-buy-green border-buy-green/20 dark:bg-buy-green/20 [&>svg]:text-buy-green",
        sell: "bg-sell-pink/10 text-sell-pink border-sell-pink/20 dark:bg-sell-pink/20 [&>svg]:text-sell-pink",
        "trading-neutral": "bg-trading-neutral/10 text-trading-neutral border-trading-neutral/20 dark:bg-trading-neutral/20 [&>svg]:text-trading-neutral",
        
        // Community & Social Variants
        discord: "bg-discord-online/10 text-discord-online border-discord-online/20 dark:bg-discord-online/20 [&>svg]:text-discord-online",
        reddit: "bg-reddit-upvote/10 text-reddit-upvote border-reddit-upvote/20 dark:bg-reddit-upvote/20 [&>svg]:text-reddit-upvote",
        
        // Emerging Palette Variants
        vapor: "bg-vapor-purple/10 text-vapor-purple border-vapor-purple/20 dark:bg-vapor-purple/20 [&>svg]:text-vapor-purple",
        solar: "bg-solar-punk-green/10 text-solar-punk-green border-solar-punk-green/20 dark:bg-solar-punk-green/20 [&>svg]:text-solar-punk-green",
        legendary: "bg-legendary-purple/10 text-legendary-purple border-legendary-purple/20 dark:bg-legendary-purple/20 [&>svg]:text-legendary-purple shadow-glow-purple/20",
        
        // Legacy Compatibility
        destructive: "colorblind-safe-error [&>svg]:text-error-red",
      },
      size: {
        xs: "text-xs px-3 py-2 [&>svg]:h-3 [&>svg]:w-3 [&>svg~*]:pl-6",
        sm: "text-xs px-3 py-2 [&>svg]:h-4 [&>svg]:w-4",
        default: "text-sm px-4 py-3 [&>svg]:h-4 [&>svg]:w-4",
        lg: "text-base px-6 py-4 [&>svg]:h-5 [&>svg]:w-5 [&>svg~*]:pl-8",
        xl: "text-lg px-8 py-6 [&>svg]:h-6 [&>svg]:w-6 [&>svg~*]:pl-10",
      },
      style: {
        filled: "",
        outlined: "bg-transparent",
        soft: "",
        minimal: "border-transparent bg-transparent px-0",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default", 
      style: "soft",
    },
  }
);

const alertIconMap = {
  // Trust Foundation
  default: Info,
  trust: Shield,
  "trust-light": Shield,
  
  // Innovation & Accent
  innovation: Zap,
  "electric-cyan": Zap,
  "cyber-lime": Zap,
  
  // Functional Status
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  
  // Trading Specific
  buy: TrendingUp,
  sell: TrendingDown,
  "trading-neutral": Info,
  
  // Community & Social
  discord: Info,
  reddit: Info,
  
  // Emerging Palette
  vapor: Star,
  solar: Leaf,
  legendary: Crown,
  
  // Legacy Compatibility
  destructive: XCircle,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  customIcon?: React.ReactNode;
  actions?: React.ReactNode;
  pulse?: boolean;
  glow?: boolean;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ 
    className, 
    variant = "default", 
    size,
    style,
    showIcon = true,
    dismissible = false,
    onDismiss,
    customIcon,
    actions,
    pulse = false,
    glow = false,
    children, 
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const IconComponent = customIcon ? null : alertIconMap[variant as keyof typeof alertIconMap];
    
    const handleDismiss = React.useCallback(() => {
      setIsVisible(false);
      onDismiss?.();
    }, [onDismiss]);

    if (!isVisible) return null;
    
    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          alertVariants({ variant, size, style }),
          pulse && "animate-pulse",
          glow && "shadow-glow-primary",
          dismissible && "pr-10",
          className
        )}
        {...props}
      >
        {showIcon && (customIcon || IconComponent) && (
          <div className="flex-shrink-0">
            {customIcon || (IconComponent && <IconComponent className="h-4 w-4" />)}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {children}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-2 mt-2 ml-7">
            {actions}
          </div>
        )}
        
        {dismissible && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
            onClick={handleDismiss}
            aria-label="Dismiss alert"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

// Alert Banner Component for full-width alerts
export interface AlertBannerProps extends Omit<AlertProps, "size"> {
  position?: "top" | "bottom";
  sticky?: boolean;
}

const AlertBanner = React.forwardRef<HTMLDivElement, AlertBannerProps>(
  ({ className, position = "top", sticky = false, ...props }, ref) => (
    <Alert
      ref={ref}
      className={cn(
        "rounded-none border-x-0 w-screen relative left-1/2 right-1/2 -mx-[50vw]",
        position === "top" ? "border-t-0" : "border-b-0",
        sticky && (position === "top" ? "sticky top-0" : "sticky bottom-0"),
        "z-50",
        className
      )}
      {...props}
    />
  )
);
AlertBanner.displayName = "AlertBanner";

// Toast-style Alert Component
export interface AlertToastProps extends Omit<AlertProps, "style"> {
  duration?: number;
  autoHide?: boolean;
}

const AlertToast = React.forwardRef<HTMLDivElement, AlertToastProps>(
  ({ duration = 5000, autoHide = true, onDismiss, ...props }, ref) => {
    React.useEffect(() => {
      if (autoHide && duration > 0) {
        const timer = setTimeout(() => {
          onDismiss?.();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }, [autoHide, duration, onDismiss]);

    return (
      <Alert
        ref={ref}
        dismissible
        onDismiss={onDismiss}
        className="shadow-lg border-2"
        style="filled"
        {...props}
      />
    );
  }
);
AlertToast.displayName = "AlertToast";

// Specialized Alert Components
const TradingAlert = React.forwardRef<HTMLDivElement, Omit<AlertProps, "variant">>(
  ({ children, ...props }, ref) => (
    <Alert ref={ref} variant="trading-neutral" {...props}>
      {children}
    </Alert>
  )
);
TradingAlert.displayName = "TradingAlert";

const TrustAlert = React.forwardRef<HTMLDivElement, Omit<AlertProps, "variant">>(
  ({ children, ...props }, ref) => (
    <Alert ref={ref} variant="trust" {...props}>
      {children}
    </Alert>
  )
);
TrustAlert.displayName = "TrustAlert";

const InnovationAlert = React.forwardRef<HTMLDivElement, Omit<AlertProps, "variant">>(
  ({ children, glow = true, ...props }, ref) => (
    <Alert ref={ref} variant="innovation" glow={glow} {...props}>
      {children}
    </Alert>
  )
);
InnovationAlert.displayName = "InnovationAlert";

export { 
  Alert, 
  AlertTitle, 
  AlertDescription, 
  AlertBanner,
  AlertToast,
  TradingAlert,
  TrustAlert,
  InnovationAlert,
  alertVariants
};