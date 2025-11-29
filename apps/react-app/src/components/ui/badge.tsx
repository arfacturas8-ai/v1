/**
 * CRYB Design System - Badge Component
 * Modern OpenSea-inspired badges with gradient, glass, and animated variants
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

// ===== BADGE VARIANTS =====
const badgeVariants = cva([
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5',
  'text-xs font-medium transition-all duration-200',
  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
], {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      success: 'bg-cryb-success text-cryb-success-foreground hover:bg-cryb-success/90',
      warning: 'bg-cryb-warning text-cryb-warning-foreground hover:bg-cryb-warning/90',
      outline: 'text-foreground border border-border hover:bg-accent',
      muted: 'bg-muted text-muted-foreground hover:bg-muted/80',
      gradient: [
        'bg-gradient-to-r from-primary to-secondary text-white',
        'hover:shadow-lg hover:shadow-primary/20',
      ],
      'gradient-cyan': [
        'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
        'hover:shadow-lg hover:shadow-cyan-500/30',
      ],
      'gradient-purple': [
        'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        'hover:shadow-lg hover:shadow-purple-500/30',
      ],
      'gradient-green': [
        'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
        'hover:shadow-lg hover:shadow-green-500/30',
      ],
      'gradient-orange': [
        'bg-gradient-to-r from-orange-500 to-red-500 text-white',
        'hover:shadow-lg hover:shadow-orange-500/30',
      ],
      glass: [
        'bg-background/80 backdrop-blur-sm border border-border/50',
        'hover:bg-background/90 hover:border-border/70',
      ],
      neon: [
        'bg-background border-2 border-accent-cyan text-accent-cyan',
        'shadow-lg shadow-accent-cyan/20',
        'hover:bg-accent-cyan/10 hover:shadow-accent-cyan/30',
      ],
      shimmer: [
        'bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%]',
        'text-white animate-shimmer',
      ],
    },
    size: {
      sm: 'px-2 py-0.5 text-xs',
      default: 'px-2.5 py-0.5 text-xs',
      lg: 'px-3 py-1 text-sm',
      xl: 'px-4 py-1.5 text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

// ===== BADGE COMPONENT =====
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Badge content */
  children: React.ReactNode;
  /** Remove button callback */
  onRemove?: () => void;
  /** Whether badge is removable */
  removable?: boolean;
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Whether to animate badge entrance */
  animated?: boolean;
  /** Dot indicator for status badges */
  dot?: boolean;
  /** Dot color (defaults to variant color) */
  dotColor?: string;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      children,
      onRemove,
      removable,
      leftIcon,
      rightIcon,
      animated = false,
      dot = false,
      dotColor,
      ...props
    },
    ref
  ) => {
    const Comp = animated ? motion.div : 'div';

    const content = (
      <>
        {dot && (
          <span
            style={{
  height: '8px',
  width: '8px',
  borderRadius: '50%'
}}
            style={{
              backgroundColor: dotColor || 'currentColor',
            }}
            aria-hidden="true"
          />
        )}
        {leftIcon && (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
        {(removable || onRemove) && (
          <button
            onClick={onRemove}
            style={{
  borderRadius: '50%'
}}
            aria-label="Remove badge"
            type="button"
          >
            <X style={{
  height: '12px',
  width: '12px'
}} />
          </button>
        )}
      </>
    );

    if (animated) {
      return (

          <Comp
            ref={ref}
            className={cn(badgeVariants({ variant, size }), className)}
            {...props}
          >
            {content}
          </Comp>
        
      );
    }

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {content}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

// ===== BADGE GROUP =====
export interface BadgeGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of badges to show before +N indicator */
  max?: number;
  /** Spacing between badges */
  spacing?: 'sm' | 'default' | 'lg';
}

const BadgeGroup = React.forwardRef<HTMLDivElement, BadgeGroupProps>(
  ({ className, max, spacing = 'default', children, ...props }, ref) => {
    const spacingClasses = {
      sm: 'gap-1',
      default: 'gap-2',
      lg: 'gap-3',
    };

    const childArray = React.Children.toArray(children);
    const displayChildren = max ? childArray.slice(0, max) : childArray;
    const remainingCount = max ? Math.max(0, childArray.length - max) : 0;

    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap items-center', spacingClasses[spacing], className)}
        {...props}
      >
        {displayChildren}
        {remainingCount > 0 && (
          <Badge variant="muted" size="sm">
            +{remainingCount}
          </Badge>
        )}
      </div>
    );
  }
);

BadgeGroup.displayName = 'BadgeGroup';

// ===== NOTIFICATION BADGE =====
export interface NotificationBadgeProps extends Omit<BadgeProps, 'children'> {
  /** Count to display */
  count: number;
  /** Maximum count before showing +N */
  max?: number;
  /** Show dot when count is 0 */
  showZero?: boolean;
}

const NotificationBadge = React.forwardRef<HTMLDivElement, NotificationBadgeProps>(
  ({ count, max = 99, showZero = false, variant = 'destructive', size = 'sm', ...props }, ref) => {
    if (count === 0 && !showZero) {
      return null;
    }

    const displayCount = count > max ? `${max}+` : count;

    return (
      <Badge ref={ref} variant={variant} size={size} {...props}>
        {displayCount}
      </Badge>
    );
  }
);

NotificationBadge.displayName = 'NotificationBadge';

// ===== EXPORTS =====
export { Badge, BadgeGroup, NotificationBadge, badgeVariants };
export type { BadgeProps, BadgeGroupProps, NotificationBadgeProps };