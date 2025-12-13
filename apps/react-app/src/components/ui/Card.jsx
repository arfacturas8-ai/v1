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

export default Card;
