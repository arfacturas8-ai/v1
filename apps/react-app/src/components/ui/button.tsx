/**
 * CRYB Platform - Button Component v.1
 * Light theme, pill-shaped buttons matching design spec
 * Uses CSS variables from design-system.css
 */

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import './button.css';

// ===== BUTTON COMPONENT INTERFACE =====
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'success';
  /** Button size */
  size?: 'sm' | 'default' | 'lg';
  /** Full width button */
  fullWidth?: boolean;
  /** Render as child element (polymorphic) */
  asChild?: boolean;
  /** Show loading state with spinner */
  loading?: boolean;
  /** Icon to display before text */
  leftIcon?: React.ReactNode;
  /** Icon to display after text */
  rightIcon?: React.ReactNode;
}

// ===== BUTTON COMPONENT =====
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'default',
      fullWidth = false,
      loading = false,
      asChild = false,
      children,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    // Build className
    const btnClass = [
      'btn',
      `btn-${variant}`,
      size !== 'default' && `btn-${size}`,
      fullWidth && 'full-width',
      className
    ].filter(Boolean).join(' ');

    return (
      <Comp
        ref={ref}
        className={btnClass}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {loading && (
          <span className="spinner" aria-hidden="true" />
        )}
        {!loading && leftIcon && (
          <span className="btn-icon" aria-hidden="true">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="btn-icon" aria-hidden="true">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// ===== EXPORTS =====
export { Button };
export type { ButtonProps };