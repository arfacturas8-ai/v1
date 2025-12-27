/**
 * CRYB Platform - iOS-Inspired Button Component
 * Modern, accessible button with multiple variants
 * Replaces all existing button implementations
 */

import React, { forwardRef, useState } from 'react';

/**
 * LoadingSpinner Component
 * Used when button is in loading state
 */
const LoadingSpinner = ({ size = 'md', color = 'currentColor' }) => {
  const sizeMap = {
    sm: { width: '12px', height: '12px' },
    md: { width: '16px', height: '16px' },
    lg: { width: '20px', height: '20px' },
    xl: { width: '24px', height: '24px' },
  };

  return (
    <svg
      style={{
        ...sizeMap[size],
        animation: 'spin 1s linear infinite'
      }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        style={{ opacity: 0.25 }}
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        style={{ opacity: 0.75 }}
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Button Component
 * iOS-inspired button with full accessibility support
 */
export const Button = forwardRef(
  (
    {
      className = '',
      style,
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
    const [isHovered, setIsHovered] = useState(false);
    const isDisabled = disabled || loading;

    // Size configurations
    const sizeStyles = {
      sm: { height: '32px', padding: '0 12px', fontSize: '13px', borderRadius: '8px' },
      md: { height: '44px', padding: '0 16px', fontSize: '15px', borderRadius: '12px' },
      lg: { height: '48px', padding: '0 24px', fontSize: '16px', borderRadius: '12px' },
      xl: { height: '56px', padding: '0 32px', fontSize: '18px', borderRadius: '12px' },
      icon: { height: '44px', width: '44px', padding: '0', fontSize: '15px', borderRadius: '12px' },
      'icon-sm': { height: '32px', width: '32px', padding: '0', fontSize: '13px', borderRadius: '8px' },
      'icon-lg': { height: '48px', width: '48px', padding: '0', fontSize: '16px', borderRadius: '12px' },
    };

    // Variant configurations
    const variantStyles = {
      primary: {
        base: {
          background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          color: '#FFFFFF',
          border: '1px solid rgba(88, 166, 255, 0.3)',
          boxShadow: '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        },
        hover: {
          background: 'linear-gradient(135deg, rgba(88, 166, 255, 1) 0%, rgba(163, 113, 247, 1) 100%)',
          boxShadow: '0 6px 24px rgba(88, 166, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        }
      },
      secondary: {
        base: {
          background: '#F8F9FA',
          color: '#1A1A1A',
          border: '1px solid #E8EAED',
          boxShadow: 'none',
        },
        hover: {
          background: '#F0F2F5',
          borderColor: '#CCCCCC',
        }
      },
      outline: {
        base: {
          background: 'transparent',
          color: '#58a6ff',
          border: '2px solid #58a6ff',
          boxShadow: 'none',
        },
        hover: {
          background: 'rgba(88, 166, 255, 0.1)',
          borderColor: '#a371f7',
        }
      },
      ghost: {
        base: {
          background: 'transparent',
          color: '#1A1A1A',
          border: 'none',
          boxShadow: 'none',
        },
        hover: {
          background: '#F8F9FA',
        }
      },
      danger: {
        base: {
          background: 'linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
        },
        hover: {
          opacity: 0.9,
          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
        }
      },
      success: {
        base: {
          background: '#10B981',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
        },
        hover: {
          opacity: 0.9,
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
        }
      },
      link: {
        base: {
          background: 'transparent',
          color: '#58a6ff',
          border: 'none',
          boxShadow: 'none',
          textDecoration: 'none',
        },
        hover: {
          textDecoration: 'underline',
          textUnderlineOffset: '4px',
        }
      },
      glass: {
        base: {
          background: 'rgba(255, 255, 255, 0.7)',
          color: '#1A1A1A',
          border: '1px solid rgba(232, 234, 237, 0.3)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: 'none',
        },
        hover: {
          background: 'rgba(255, 255, 255, 0.8)',
        }
      },
    };

    const currentVariant = variantStyles[variant] || variantStyles.primary;
    const currentSize = sizeStyles[size] || sizeStyles.md;

    // Build button styles
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: '600',
      transition: 'all 0.2s',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      pointerEvents: isDisabled ? 'none' : 'auto',
      userSelect: 'none',
      outline: 'none',
      width: fullWidth ? '100%' : 'auto',
      ...currentSize,
      ...currentVariant.base,
      ...style
    };

    const hoverStyle = isHovered && !isDisabled ? currentVariant.hover : {};

    const handleFocus = (e) => {
      e.target.style.boxShadow = variant === 'primary' || variant === 'danger' || variant === 'success'
        ? currentVariant.base.boxShadow
        : '0 0 0 3px rgba(88, 166, 255, 0.1)';
    };

    const handleBlur = (e) => {
      e.target.style.boxShadow = currentVariant.base.boxShadow || 'none';
    };

    return (
      <Component
        ref={ref}
        type={Component === 'button' ? type : undefined}
        className={className}
        style={{ ...baseStyle, ...hoverStyle }}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {loading && (
          <LoadingSpinner
            size={size === 'sm' || size === 'icon-sm' ? 'sm' : size === 'lg' || size === 'icon-lg' ? 'lg' : size === 'xl' ? 'xl' : 'md'}
            color={variant === 'outline' || variant === 'ghost' || variant === 'link' ? '#58a6ff' : '#FFFFFF'}
          />
        )}
        {!loading && leftIcon && (
          <span style={{ display: 'inline-flex' }} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {children}
        </span>
        {!loading && rightIcon && (
          <span style={{ display: 'inline-flex' }} aria-hidden="true">
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
  className = '',
  style,
  orientation = 'horizontal',
  ...props
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: orientation === 'horizontal' ? 'row' : 'column',
        ...style
      }}
      role="group"
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const isFirst = index === 0;
        const isLast = index === React.Children.count(children) - 1;

        // Apply border radius overrides for grouped buttons
        const groupStyle = {
          borderRadius: 0,
          ...(orientation === 'horizontal' && {
            ...(isFirst && { borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }),
            ...(isLast && { borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }),
            ...(!isLast && { borderRight: 'none' })
          }),
          ...(orientation === 'vertical' && {
            ...(isFirst && { borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }),
            ...(isLast && { borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }),
            ...(!isLast && { borderBottom: 'none' })
          })
        };

        return React.cloneElement(child, {
          style: { ...child.props.style, ...groupStyle }
        });
      })}
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

export default Button;

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
