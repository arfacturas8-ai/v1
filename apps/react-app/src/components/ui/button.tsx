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

// ===== ICON BUTTON COMPONENT =====
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon'> {
  /** Icon to display */
  icon: React.ReactNode;
  /** Accessible label */
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, children, ...props }, ref) => {
    return (
      <Button ref={ref} {...props}>
        <span aria-hidden="true">{icon}</span>
        {children && <span className="sr-only">{children}</span>}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// ===== BUTTON GROUP COMPONENT =====
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Whether buttons are attached */
  attached?: boolean;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      className = '',
      orientation = 'horizontal',
      attached = true,
      children,
      ...props
    },
    ref
  ) => {
    const groupClass = [
      'inline-flex',
      orientation === 'horizontal' ? 'flex-row' : 'flex-col',
      attached ? 'gap-0' : 'gap-2',
      className
    ].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={groupClass} role="group" {...props}>
        {children}
      </div>
    );
  }
);

ButtonGroup.displayName = 'ButtonGroup';

// ===== EXPORTS =====
export { Button, IconButton, ButtonGroup };
export type { ButtonProps, IconButtonProps, ButtonGroupProps };