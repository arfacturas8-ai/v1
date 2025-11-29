/**
 * CRYB Platform - OpenSea-Inspired Button Component
 * Modern, accessible button with multiple variants
 * Replaces all existing button implementations
 */

import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Button Variants using CVA (Class Variance Authority)
 * OpenSea-inspired styling with clean, modern aesthetics
 */
const buttonVariants = cva(
  // Base styles applied to all buttons
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-border-focus',
    'select-none',
  ],
  {
    variants: {
      // Variant styles (primary, secondary, etc)
      variant: {
        primary: [
          'bg-primary text-white',
          'hover:bg-primary-hover',
          'active:bg-primary-dark',
          'shadow-md hover:shadow-lg',
        ],
        secondary: [
          'bg-bg-secondary text-text-primary border border-border',
          'hover:bg-bg-tertiary hover:border-border-hover',
          'active:bg-bg-hover',
        ],
        outline: [
          'bg-transparent text-text-primary border-2 border-primary',
          'hover:bg-primary/10 hover:border-primary-hover',
          'active:bg-primary/20',
        ],
        ghost: [
          'bg-transparent text-text-primary',
          'hover:bg-bg-secondary',
          'active:bg-bg-tertiary',
        ],
        danger: [
          'bg-error text-white',
          'hover:bg-error/90',
          'active:bg-error/80',
          'shadow-md hover:shadow-lg',
        ],
        success: [
          'bg-success text-white',
          'hover:bg-success/90',
          'active:bg-success/80',
          'shadow-md hover:shadow-lg',
        ],
        link: [
          'text-text-link underline-offset-4',
          'hover:underline',
          'active:opacity-80',
        ],
        glass: [
          'glass text-text-primary',
          'hover:backdrop-blur-xl',
          'border border-border/30',
        ],
      },
      // Size styles
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-base rounded-md',
        lg: 'h-12 px-6 text-lg rounded-lg',
        xl: 'h-14 px-8 text-xl rounded-lg',
        icon: 'h-10 w-10 rounded-md',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-lg',
      },
      // Full width option
      fullWidth: {
        true: 'w-full',
      },
      // Loading state
      loading: {
        true: 'cursor-wait opacity-80',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
);

/**
 * LoadingSpinner Component
 * Used when button is in loading state
 */
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Button Component
 * OpenSea-inspired button with full accessibility support
 */
export const Button = forwardRef(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled = false,
      children,
      leftIcon,
      rightIcon,
      as: Component = 'button',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <Component
        ref={ref}
        type={Component === 'button' ? type : undefined}
        className={cn(
          buttonVariants({ variant, size, fullWidth, loading }),
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <LoadingSpinner
            size={
              size === 'sm'
                ? 'sm'
                : size === 'lg'
                ? 'lg'
                : size === 'xl'
                ? 'xl'
                : 'md'
            }
          />
        )}
        {!loading && leftIcon && (
          <span style={{
  display: 'inline-flex'
}} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span className="truncate">{children}</span>
        {!loading && rightIcon && (
          <span style={{
  display: 'inline-flex'
}} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Component>
    );
  }
);

Button.displayName = 'Button';

/**
 * ButtonGroup Component
 * For grouping related buttons together
 */
export const ButtonGroup = ({
  children,
  className,
  orientation = 'horizontal',
  ...props
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        orientation === 'horizontal' ? '[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:not(:last-child)]:border-r-0' : '[&>button]:rounded-none [&>button:first-child]:rounded-t-md [&>button:last-child]:rounded-b-md [&>button:not(:last-child)]:border-b-0',
        className
      )}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';

/**
 * IconButton Component
 * Specialized button for icon-only actions
 */
export const IconButton = forwardRef(
  (
    {
      children,
      'aria-label': ariaLabel,
      size = 'md',
      tooltip,
      ...props
    },
    ref
  ) => {
    if (!ariaLabel && !tooltip) {
      console.warn('IconButton: aria-label or tooltip is required for accessibility');
    }

    return (
      <Button
        ref={ref}
        size={size.includes('icon') ? size : `icon-${size}`}
        aria-label={ariaLabel || tooltip}
        title={tooltip}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * Usage Examples:
 *
 * // Basic usage
 * <Button>Click me</Button>
 *
 * // With variants
 * <Button variant="secondary">Secondary</Button>
 * <Button variant="outline">Outline</Button>
 * <Button variant="ghost">Ghost</Button>
 * <Button variant="danger">Delete</Button>
 *
 * // With sizes
 * <Button size="sm">Small</Button>
 * <Button size="lg">Large</Button>
 * <Button size="xl">Extra Large</Button>
 *
 * // With icons
 * <Button leftIcon={<PlusIcon />}>Add Item</Button>
 * <Button rightIcon={<ArrowRightIcon />}>Continue</Button>
 *
 * // Loading state
 * <Button loading>Processing...</Button>
 *
 * // Full width
 * <Button fullWidth>Full Width Button</Button>
 *
 * // Icon button
 * <IconButton aria-label="Close" tooltip="Close dialog">
 *   <XIcon />
 * </IconButton>
 *
 * // Button group
 * <ButtonGroup>
 *   <Button variant="outline">Left</Button>
 *   <Button variant="outline">Middle</Button>
 *   <Button variant="outline">Right</Button>
 * </ButtonGroup>
 *
 * // As link
 * <Button as="a" href="/page">Link Button</Button>
 */




export default buttonVariants
