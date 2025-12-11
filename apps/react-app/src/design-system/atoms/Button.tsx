/**
 * Button Atom Component
 * Primary interactive element with variants and states
 */

import React from 'react';
import { colors, spacing, radii, typography, animation, shadows } from '../tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  className,
  style,
  ...props
}) => {
  // Size styles
  const sizeStyles: Record<string, React.CSSProperties> = {
    xs: {
      height: '28px',
      padding: `0 ${spacing[3]}`,
      fontSize: typography.fontSize.xs,
      gap: spacing[1],
    },
    sm: {
      height: '32px',
      padding: `0 ${spacing[4]}`,
      fontSize: typography.fontSize.sm,
      gap: spacing[2],
    },
    md: {
      height: '40px',
      padding: `0 ${spacing[5]}`,
      fontSize: typography.fontSize.base,
      gap: spacing[2],
    },
    lg: {
      height: '48px',
      padding: `0 ${spacing[6]}`,
      fontSize: typography.fontSize.lg,
      gap: spacing[3],
    },
    xl: {
      height: '56px',
      padding: `0 ${spacing[8]}`,
      fontSize: typography.fontSize.xl,
      gap: spacing[3],
    },
  };

  // Variant styles
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: colors['brand-gradient'],
      color: colors['text-primary'],
      border: 'none',
      boxShadow: shadows.md,
    },
    secondary: {
      background: colors['bg-elevated'],
      color: colors['text-primary'],
      border: `1px solid ${colors['border-default']}`,
      boxShadow: shadows.sm,
    },
    outline: {
      background: 'transparent',
      color: colors['brand-primary'],
      border: `2px solid ${colors['brand-primary']}`,
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: colors['text-secondary'],
      border: 'none',
      boxShadow: 'none',
    },
    danger: {
      background: colors['error'],
      color: colors['text-primary'],
      border: 'none',
      boxShadow: shadows.md,
    },
    success: {
      background: colors['success'],
      color: colors['text-primary'],
      border: 'none',
      boxShadow: shadows.md,
    },
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.semibold,
    borderRadius: radii.md,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: animation.transitions.fast,
    outline: 'none',
    userSelect: 'none',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.5 : 1,
    position: 'relative',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      className={className}
      style={baseStyles}
      disabled={disabled || loading}
      {...props}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sizeStyles[size].gap,
        }}
      >
        {leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>}
        {children}
        {rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>}
      </div>
    </button>
  );
};

export default Button;
