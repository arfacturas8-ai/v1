import React from 'react';
/**
 * Base Skeleton Component with Shimmer Animation
 * High-performance 60fps loading states
 */

const shimmerVariants = {
  shimmer: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

export function Skeleton({
  width = '100%',
  height = '1rem',
  className = '',
  rounded = 'md',
  variant = 'shimmer',
  as: Component = 'div',
  ...props
}) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
    '2xl': 'rounded-2xl',
  };

  const baseClasses = `
    relative overflow-hidden
    bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
    dark:from-gray-800 dark:via-gray-700 dark:to-gray-800
  `;

  if (variant === 'shimmer') {
    return (
      <div
        className={`${baseClasses} ${roundedClasses[rounded]} ${className}`}
        style={{
          width,
          height,
          backgroundSize: '200% 100%',
        }}
        animate="shimmer"
        role="status"
        aria-label="Loading"
        {...props}
      >
        <span className="sr-only"></span>
      </div>
    );
  }

  // Pulse variant
  return (
    <div
      className={`${baseClasses} ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only"></span>
    </div>
  );
}

export function SkeletonText({
  lines = 1,
  width = '100%',
  className = '',
  spacing = 'sm',
  lastLineWidth = '60%',
}) {
  const spacingClasses = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  };

  if (lines === 1) {
    return <Skeleton width={width} height="1rem" className={className} />;
  }

  return (
    <div className={`${spacingClasses[spacing]} ${className}`}>
      {Array.from({ length: lines }, (_, i) => {
        const lineWidth = i === lines - 1 ? lastLineWidth : '100%';
        return (
          <Skeleton
            key={i}
            width={lineWidth}
            height="1rem"
          />
        );
      })}
    </div>
  );
}

export function SkeletonCircle({ size = 'md', className = '' }) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
    '3xl': 'w-24 h-24',
  };

  return (
    <Skeleton
      width="auto"
      height="auto"
      className={`${sizeClasses[size]} ${className}`}
      rounded="full"
    />
  );
}

export function SkeletonButton({
  size = 'md',
  fullWidth = false,
  className = '',
}) {
  const sizeClasses = {
    xs: 'h-7 px-3 min-w-[60px]',
    sm: 'h-8 px-3 min-w-[80px]',
    md: 'h-10 px-4 min-w-[100px]',
    lg: 'h-12 px-6 min-w-[120px]',
    xl: 'h-14 px-8 min-w-[140px]',
  };

  return (
    <Skeleton
      width={fullWidth ? '100%' : 'auto'}
      height="auto"
      className={`${sizeClasses[size]} ${className}`}
      rounded="lg"
    />
  );
}

export function SkeletonImage({
  aspectRatio = 'video',
  className = '',
  rounded = 'lg',
}) {
  const aspectRatios = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    ultrawide: 'aspect-[21/9]',
  };

  return (
    <Skeleton
      width="100%"
      height="auto"
      className={`${aspectRatios[aspectRatio]} ${className}`}
      rounded={rounded}
    />
  );
}




export default shimmerVariants
