/**
 * CRYB Platform - Card Component v.1
 * Light theme cards matching design spec
 * White backgrounds, 16px rounded corners, subtle shadows
 */

import React, { forwardRef } from 'react';

/**
 * Card Component
 * Base card container with v.1 design
 */
export const Card = forwardRef(
  (
    {
      className = '',
      variant = 'default',
      padding = 'default',
      interactive = false,
      as: Component = 'div',
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    // Build className
    const cardClass = [
      'card',
      variant === 'elevated' && 'card-elevated',
      (interactive || onClick) && 'card-interactive',
      padding === 'compact' && 'card-compact',
      padding === 'spacious' && 'card-spacious',
      className
    ].filter(Boolean).join(' ');

    return (
      <Component
        ref={ref}
        className={cardClass}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick(e);
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader Component
 */
export const CardHeader = forwardRef(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col gap-1.5 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * CardTitle Component
 */
export const CardTitle = forwardRef(
  ({ className = '', as: Component = 'h3', children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`text-lg font-semibold text-[var(--text-primary)] leading-tight ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

/**
 * CardDescription Component
 */
export const CardDescription = forwardRef(
  ({ className = '', children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`text-sm text-[var(--text-secondary)] ${className}`}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

/**
 * CardContent Component
 */
export const CardContent = forwardRef(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

/**
 * CardFooter Component
 */
export const CardFooter = forwardRef(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-2 ${className}`}
        style={{ marginTop: 'var(--space-4)' }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

/**
 * CardImage Component
 */
export const CardImage = forwardRef(
  (
    {
      className = '',
      src,
      alt,
      aspectRatio = '1/1',
      objectFit = 'cover',
      fallback,
      loading = 'lazy',
      ...props
    },
    ref
  ) => {
    const [error, setError] = React.useState(false);

    return (
      <div
        className={`relative overflow-hidden bg-[var(--bg-tertiary)] ${className}`}
        style={{ aspectRatio }}
      >
        {!error && src ? (
          <img
            ref={ref}
            src={src}
            alt={alt}
            loading={loading}
            className={`h-full w-full transition-transform duration-300 ${
              objectFit === 'cover' ? 'object-cover' : 'object-contain'
            } group-hover:scale-105`}
            onError={() => setError(true)}
            {...props}
          />
        ) : fallback ? (
          <div className="flex h-full w-full items-center justify-center">
            {fallback}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

CardImage.displayName = 'CardImage';

/**
 * CardBadge Component
 */
export const CardBadge = forwardRef(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const badgeClass = [
      'badge',
      variant !== 'default' && `badge-${variant}`,
      'absolute top-2 right-2 z-10',
      className
    ].filter(Boolean).join(' ');

    return (
      <span ref={ref} className={badgeClass} {...props}>
        {children}
      </span>
    );
  }
);

CardBadge.displayName = 'CardBadge';

export default Card;
