/**
 * CRYB Design System - Button Component
 * Production-ready button component with comprehensive variants and accessibility
 */

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { usePrefersReducedMotion } from '../../lib/accessibility.tsx';

// ===== BUTTON VARIANTS =====
const buttonVariants = cva(
  [
    // Base styles
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'disabled:pointer-events-none disabled:opacity-50',
    'relative overflow-hidden',
    // Focus styles
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    // Active styles
    'active:scale-[0.98] active:transition-transform active:duration-75',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-gradient-to-r from-cryb-primary to-cryb-primary/90',
          'text-cryb-primary-foreground shadow-md',
          'hover:from-cryb-primary/90 hover:to-cryb-primary/80',
          'hover:shadow-lg hover:shadow-cryb-primary/25',
          'dark:shadow-cryb-primary/20',
        ],
        secondary: [
          'bg-cryb-secondary text-cryb-secondary-foreground',
          'border border-cryb-secondary/20 shadow-sm',
          'hover:bg-cryb-secondary/80',
          'hover:border-cryb-secondary/30',
        ],
        outline: [
          'border border-input bg-background/50 backdrop-blur-sm',
          'text-foreground hover:bg-accent hover:text-accent-foreground',
          'hover:border-ring/50',
        ],
        ghost: [
          'text-foreground hover:bg-accent/80 hover:text-accent-foreground',
          'data-[state=open]:bg-accent/80',
        ],
        link: [
          'text-cryb-primary underline-offset-4',
          'hover:underline hover:text-cryb-primary/80',
          'focus:underline',
        ],
        destructive: [
          'bg-destructive text-destructive-foreground shadow-md',
          'hover:bg-destructive/90 hover:shadow-lg',
          'hover:shadow-destructive/25',
        ],
        success: [
          'bg-cryb-success text-cryb-success-foreground shadow-md',
          'hover:bg-cryb-success/90 hover:shadow-lg',
          'hover:shadow-cryb-success/25',
        ],
        warning: [
          'bg-cryb-warning text-cryb-warning-foreground shadow-md',
          'hover:bg-cryb-warning/90 hover:shadow-lg',
          'hover:shadow-cryb-warning/25',
        ],
        gradient: [
          'bg-gradient-to-r from-cryb-primary via-cryb-secondary to-cryb-primary',
          'text-white shadow-lg bg-[length:200%_100%]',
          'hover:bg-[position:100%_0] hover:shadow-xl',
          'animate-shimmer',
        ],
        glass: [
          'bg-background/80 backdrop-blur-md border border-border/50',
          'text-foreground shadow-lg',
          'hover:bg-background/90 hover:border-border/70',
          'hover:shadow-xl hover:shadow-primary/10',
        ],
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-sm font-medium',
        default: 'h-10 rounded-md px-4 py-2 text-base font-medium',
        lg: 'h-12 rounded-lg px-6 py-3 text-lg font-semibold',
        xl: 'h-14 rounded-lg px-8 py-4 text-xl font-semibold',
        icon: 'h-10 w-10 rounded-md',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      loading: {
        true: 'cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
      loading: false,
    },
  }
);

// ===== LOADING SPINNER COMPONENT =====
const LoadingSpinner = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) => {
  const sizeClass = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];

  return (
    <svg
      className={sizeClass}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// ===== BUTTON COMPONENT INTERFACE =====
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as child element (polymorphic) */
  asChild?: boolean;
  /** Show loading state with spinner */
  loading?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
  /** Loading text to display when loading */
  loadingText?: string;
  /** Tooltip text */
  tooltip?: string;
  /** Animation variant for button interactions */
  animationVariant?: 'press' | 'scale' | 'none';
  /** Success state for animation feedback */
  success?: boolean;
  /** Duration for success state animation */
  successDuration?: number;
}

// ===== BUTTON COMPONENT =====
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      asChild = false,
      children,
      leftIcon,
      rightIcon,
      loadingText,
      disabled,
      tooltip,
      animationVariant = 'press',
      success = false,
      successDuration = 2000,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;
    const prefersReducedMotion = usePrefersReducedMotion();
    const [isHovered, setIsHovered] = React.useState(false);

    const handlers = {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    };
    
    // Success state management
    const [showSuccess, setShowSuccess] = React.useState(false);
    
    React.useEffect(() => {
      if (success) {
        setShowSuccess(true);
        const timer = setTimeout(() => setShowSuccess(false), successDuration);
        return () => clearTimeout(timer);
      }
    }, [success, successDuration]);
    
    // Determine spinner size based on button size
    const spinnerSize = size === 'sm' || size === 'icon-sm' ? 'sm' : 
                       size === 'lg' || size === 'xl' || size === 'icon-lg' ? 'lg' : 
                       'default';

    const MotionIcon = ({ children, animate = false }: { children: React.ReactNode; animate?: boolean }) => {
      if (!animate || prefersReducedMotion) {
        return <span className="shrink-0" aria-hidden="true">{children}</span>;
      }

      return (
        <span
          className="shrink-0"
          aria-hidden="true"
        >
          {children}
        </span>
      );
    };

    const buttonContent = (
      <>
        
          {loading ? (
            <div
              key="loading"
            >
              <LoadingSpinner size={spinnerSize} />
            </div>
          ) : showSuccess ? (
            <div
              key="success"
            >
              <svg
                className={cn('text-current', spinnerSize === 'sm' ? 'h-3 w-3' : spinnerSize === 'lg' ? 'h-5 w-5' : 'h-4 w-4')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            <div
              key="content"
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}
            >
              {leftIcon && <MotionIcon animate>{leftIcon}</MotionIcon>}
              {children && (
                <span>{children}</span>
              )}
              {rightIcon && <MotionIcon animate>{rightIcon}</MotionIcon>}
            </div>
          )}
        
      </>
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, loading, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-describedby={tooltip ? `${props.id}-tooltip` : undefined}
        {...handlers}
        {...props}
      >
        {buttonContent}
        
        {/* Enhanced ripple effect */}
        <span 
          style={{
  position: 'absolute',
  overflow: 'hidden'
}}
          aria-hidden="true"
        >
          <span
            style={{
  position: 'absolute'
}}
          />
        </span>
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// ===== BUTTON GROUP COMPONENT =====
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size for all buttons in group */
  size?: VariantProps<typeof buttonVariants>['size'];
  /** Variant for all buttons in group */
  variant?: VariantProps<typeof buttonVariants>['variant'];
  /** Orientation of button group */
  orientation?: 'horizontal' | 'vertical';
  /** Whether buttons should be attached */
  attached?: boolean;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      className,
      size = 'default',
      variant = 'outline',
      orientation = 'horizontal',
      attached = true,
      children,
      ...props
    },
    ref
  ) => {
    const groupClasses = cn(
      'inline-flex',
      orientation === 'horizontal' ? 'flex-row' : 'flex-col',
      attached && orientation === 'horizontal' && '[&>*:not(:first-child)]:ml-[-1px] [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none',
      attached && orientation === 'vertical' && '[&>*:not(:first-child)]:mt-[-1px] [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none',
      !attached && orientation === 'horizontal' && 'gap-2',
      !attached && orientation === 'vertical' && 'gap-2',
      className
    );

    return (
      <div
        ref={ref}
        className={groupClasses}
        role="group"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === Button) {
            return React.cloneElement(child, {
              size: child.props.size || size,
              variant: child.props.variant || variant,
            });
          }
          return child;
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

// ===== ICON BUTTON COMPONENT =====
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  /** Icon to display */
  icon: React.ReactNode;
  /** Accessible label for screen readers */
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'icon', children, ...props }, ref) => {
    return (
      <Button ref={ref} size={size} {...props}>
        <span aria-hidden="true">{icon}</span>
        {children && <span className="sr-only">{children}</span>}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ===== FLOATING ACTION BUTTON COMPONENT =====
export interface FloatingActionButtonProps extends ButtonProps {
  /** Position of the FAB */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Extended FAB with text */
  extended?: boolean;
}

const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  (
    {
      className,
      position = 'bottom-right',
      extended = false,
      size = extended ? 'default' : 'icon-lg',
      variant = 'primary',
      children,
      ...props
    },
    ref
  ) => {
    const positionClasses = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
    };

    return (
      <Button
        ref={ref}
        className={cn(
          'fixed z-50 shadow-2xl',
          extended ? 'rounded-full' : 'rounded-full',
          positionClasses[position],
          className
        )}
        size={size}
        variant={variant}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';

// ===== EXPORTS =====
export { Button, ButtonGroup, IconButton, FloatingActionButton, buttonVariants };
export type { ButtonProps, ButtonGroupProps, IconButtonProps, FloatingActionButtonProps };