/**
 * CRYB Design System - Skeleton Component
 * Modern OpenSea-inspired loading skeleton screens with animations
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// ===== SKELETON VARIANTS =====
const skeletonVariants = cva(
  [
    'bg-muted rounded-md',
  ],
  {
    variants: {
      animation: {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]',
        none: '',
      },
      variant: {
        default: 'bg-muted',
        glass: 'bg-muted/50 backdrop-blur-sm',
        gradient: 'bg-gradient-to-r from-muted to-muted/70',
      },
    },
    defaultVariants: {
      animation: 'pulse',
      variant: 'default',
    },
  }
);

// ===== SKELETON COMPONENT =====
export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
  /** Whether skeleton is circular */
  circle?: boolean;
  /** Number of lines for text skeleton */
  lines?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      animation,
      variant,
      width,
      height,
      circle = false,
      lines = 1,
      style,
      ...props
    },
    ref
  ) => {
    const skeletonStyle = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      ...style,
    };

    // Multi-line text skeleton
    if (lines > 1) {
      return (
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                skeletonVariants({ animation, variant }),
                'h-4',
                i === lines - 1 && 'w-3/4'
              )}
              style={{ width: i === lines - 1 ? '75%' : '100%' }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          skeletonVariants({ animation, variant }),
          circle && 'rounded-full',
          !height && 'h-4',
          className
        )}
        style={skeletonStyle}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Skeleton.displayName = 'Skeleton';

// ===== SKELETON CARD =====
export interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show image skeleton */
  showImage?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Show action buttons */
  showActions?: boolean;
  /** Animation type */
  animation?: VariantProps<typeof skeletonVariants>['animation'];
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  (
    {
      className,
      showImage = true,
      lines = 3,
      showActions = true,
      animation = 'pulse',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg border border-border p-6 space-y-4', className)}
        {...props}
      >
        {showImage && (
          <Skeleton animation={animation} style={{
  width: '100%',
  height: '192px'
}} />
        )}
        <div className="space-y-3">
          <Skeleton animation={animation} style={{
  height: '24px'
}} />
          <Skeleton animation={animation} lines={lines} />
        </div>
        {showActions && (
          <div style={{
  display: 'flex',
  gap: '8px'
}}>
            <Skeleton animation={animation} style={{
  height: '40px',
  width: '96px'
}} />
            <Skeleton animation={animation} style={{
  height: '40px',
  width: '80px'
}} />
          </div>
        )}
      </div>
    );
  }
);

SkeletonCard.displayName = 'SkeletonCard';

// ===== SKELETON AVATAR =====
export interface SkeletonAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Avatar size */
  size?: 'sm' | 'default' | 'lg' | 'xl';
  /** Animation type */
  animation?: VariantProps<typeof skeletonVariants>['animation'];
}

const SkeletonAvatar = React.forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ className, size = 'default', animation = 'pulse', ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      default: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    };

    return (
      <Skeleton
        ref={ref}
        animation={animation}
        circle
        className={cn(sizeClasses[size], className)}
        {...props}
      />
    );
  }
);

SkeletonAvatar.displayName = 'SkeletonAvatar';

// ===== SKELETON LIST =====
export interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of list items */
  items?: number;
  /** Show avatar in list items */
  showAvatar?: boolean;
  /** Animation type */
  animation?: VariantProps<typeof skeletonVariants>['animation'];
}

const SkeletonList = React.forwardRef<HTMLDivElement, SkeletonListProps>(
  (
    {
      className,
      items = 5,
      showAvatar = true,
      animation = 'pulse',
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-3', className)} {...props}>
        {Array.from({ length: items }, (_, i) => (
          <div key={i} style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
            {showAvatar && <SkeletonAvatar animation={animation} size="sm" />}
            <div style={{
  flex: '1'
}}>
              <Skeleton animation={animation} style={{
  height: '16px'
}} />
              <Skeleton animation={animation} style={{
  height: '12px'
}} />
            </div>
          </div>
        ))}
      </div>
    );
  }
);

SkeletonList.displayName = 'SkeletonList';

// ===== SKELETON POST =====
export interface SkeletonPostProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Show post image */
  showImage?: boolean;
  /** Animation type */
  animation?: VariantProps<typeof skeletonVariants>['animation'];
}

const SkeletonPost = React.forwardRef<HTMLDivElement, SkeletonPostProps>(
  ({ className, showImage = true, animation = 'pulse', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg border border-border p-6 space-y-4', className)}
        {...props}
      >
        {/* Header */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
          <SkeletonAvatar animation={animation} size="default" />
          <div style={{
  flex: '1'
}}>
            <Skeleton animation={animation} style={{
  height: '16px',
  width: '128px'
}} />
            <Skeleton animation={animation} style={{
  height: '12px',
  width: '96px'
}} />
          </div>
        </div>

        {/* Content */}
        <Skeleton animation={animation} lines={3} />

        {/* Image */}
        {showImage && (
          <Skeleton animation={animation} style={{
  width: '100%',
  height: '256px'
}} />
        )}

        {/* Actions */}
        <div style={{
  display: 'flex',
  gap: '16px'
}}>
          <Skeleton animation={animation} style={{
  height: '32px',
  width: '64px'
}} />
          <Skeleton animation={animation} style={{
  height: '32px',
  width: '80px'
}} />
          <Skeleton animation={animation} style={{
  height: '32px',
  width: '64px'
}} />
        </div>
      </div>
    );
  }
);

SkeletonPost.displayName = 'SkeletonPost';

// ===== SKELETON TABLE =====
export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  columns?: number;
  /** Animation type */
  animation?: VariantProps<typeof skeletonVariants>['animation'];
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  (
    {
      className,
      rows = 5,
      columns = 4,
      animation = 'pulse',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn('w-full border border-border rounded-lg overflow-hidden', className)}
        {...props}
      >
        {/* Header */}
        <div style={{
  display: 'grid',
  gap: '16px',
  padding: '16px'
}} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton key={i} animation={animation} style={{
  height: '16px'
}} />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div
            key={rowIndex}
            style={{
  display: 'grid',
  gap: '16px',
  padding: '16px'
}}
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton key={colIndex} animation={animation} style={{
  height: '16px'
}} />
            ))}
          </div>
        ))}
      </div>
    );
  }
);

SkeletonTable.displayName = 'SkeletonTable';

// ===== EXPORTS =====
export {
  Skeleton,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonList,
  SkeletonPost,
  SkeletonTable,
  skeletonVariants,
};

export type {
  SkeletonProps,
  SkeletonCardProps,
  SkeletonAvatarProps,
  SkeletonListProps,
  SkeletonPostProps,
  SkeletonTableProps,
};
