/**
 * CRYB Design System - Avatar Component
 * Modern OpenSea-inspired avatar with online status and animations
 */

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

// ===== AVATAR VARIANTS =====
const avatarVariants = cva(
  [
    'relative flex shrink-0 overflow-hidden rounded-full',
    'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  ],
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-[10px]',
        sm: 'h-8 w-8 text-xs',
        default: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
        '2xl': 'h-24 w-24 text-2xl',
      },
      variant: {
        default: 'bg-muted',
        gradient: 'bg-gradient-to-br from-primary to-secondary',
        neon: 'bg-gradient-to-br from-cyan-500 to-blue-500',
        glass: 'bg-background/80 backdrop-blur-sm border border-border/50',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
);

// ===== AVATAR STATUS VARIANTS =====
const statusVariants = cva(
  [
    'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
  ],
  {
    variants: {
      size: {
        xs: 'h-1.5 w-1.5',
        sm: 'h-2 w-2',
        default: 'h-2.5 w-2.5',
        lg: 'h-3 w-3',
        xl: 'h-4 w-4',
        '2xl': 'h-5 w-5',
      },
      status: {
        online: 'bg-green-500',
        offline: 'bg-gray-400',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
      },
    },
    defaultVariants: {
      size: 'default',
      status: 'offline',
    },
  }
);

// ===== AVATAR COMPONENT =====
export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  /** Image source */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Fallback initials or content */
  fallback?: string;
  /** Online status indicator */
  status?: 'online' | 'offline' | 'away' | 'busy' | null;
  /** Show status indicator */
  showStatus?: boolean;
  /** Whether to animate avatar entrance */
  animated?: boolean;
  /** Badge content (like notification count) */
  badge?: React.ReactNode;
  /** Whether avatar is clickable */
  clickable?: boolean;
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(
  (
    {
      className,
      size,
      variant,
      src,
      alt,
      fallback,
      status = null,
      showStatus = true,
      animated = false,
      badge,
      clickable = false,
      ...props
    },
    ref
  ) => {
    const Comp = animated ? motion.div : 'div';
    const wrapperProps = animated
      ? {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.2 },
        }
      : {};

    return (
      <Comp style={{
  position: 'relative'
}} {...wrapperProps}>
        <AvatarPrimitive.Root
          ref={ref}
          className={cn(
            avatarVariants({ size, variant }),
            clickable && 'cursor-pointer hover:opacity-90 transition-opacity',
            className
          )}
          {...props}
        >
          {src && (
            <AvatarPrimitive.Image
              src={src}
              alt={alt || ''}
              style={{
  height: '100%',
  width: '100%'
}}
            />
          )}
          <AvatarPrimitive.Fallback
            className={cn(
              'flex h-full w-full items-center justify-center font-medium',
              variant === 'default' && 'bg-muted text-muted-foreground',
              variant === 'gradient' && 'text-white',
              variant === 'neon' && 'text-white',
              variant === 'glass' && 'text-foreground'
            )}
          >
            {fallback ? (
              fallback
            ) : (
              <User className={size === 'xs' || size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
            )}
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>

        {/* Status Indicator */}
        {showStatus && status && (
          <span
            className={cn(statusVariants({ size, status }))}
            aria-label={`Status: ${status}`}
          >
            {status === 'online' && (
              <span style={{
  position: 'absolute',
  borderRadius: '50%'
}} />
            )}
          </span>
        )}

        {/* Badge */}
        {badge && (
          <span style={{
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
            {badge}
          </span>
        )}
      </Comp>
    );
  }
);

Avatar.displayName = 'Avatar';

// ===== AVATAR GROUP =====
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of avatars to show */
  max?: number;
  /** Size of avatars */
  size?: VariantProps<typeof avatarVariants>['size'];
  /** Spacing between avatars */
  spacing?: 'default' | 'tight' | 'loose';
  /** Show count of remaining avatars */
  showCount?: boolean;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      className,
      max = 5,
      size = 'default',
      spacing = 'default',
      showCount = true,
      children,
      ...props
    },
    ref
  ) => {
    const spacingClasses = {
      tight: '-space-x-2',
      default: '-space-x-3',
      loose: '-space-x-1',
    };

    const childArray = React.Children.toArray(children);
    const displayChildren = childArray.slice(0, max);
    const remainingCount = Math.max(0, childArray.length - max);

    return (
      <div
        ref={ref}
        className={cn('flex items-center', spacingClasses[spacing], className)}
        {...props}
      >
        {displayChildren.map((child, index) => (
          <div
            key={index}
            style={{
  position: 'relative',
  borderRadius: '50%'
}}
            style={{ zIndex: displayChildren.length - index }}
          >
            {React.isValidElement(child) &&
              React.cloneElement(child, { size } as any)}
          </div>
        ))}

        {showCount && remainingCount > 0 && (
          <div
            className={cn(
              'relative flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium ring-2 ring-background',
              avatarVariants({ size })
            )}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

// ===== EXPORTS =====
export { Avatar, AvatarGroup, avatarVariants, statusVariants };
export type { AvatarProps, AvatarGroupProps };
