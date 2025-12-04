import React from 'react';
import { colors, radii, spacing, shadows, animation } from '../tokens';

export type IconButtonVariant = 'ghost' | 'filled';
export type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  icon: React.ReactNode;
}

const getIconButtonStyles = (
  variant: IconButtonVariant,
  size: IconButtonSize,
  disabled: boolean,
  loading: boolean
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    border: 'none',
    borderRadius: radii.full,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  // Size styles
  const sizeStyles: Record<IconButtonSize, React.CSSProperties> = {
    sm: {
      width: '32px',
      height: '32px',
      fontSize: '16px',
    },
    md: {
      width: '40px',
      height: '40px',
      fontSize: '20px',
    },
    lg: {
      width: '48px',
      height: '48px',
      fontSize: '24px',
    },
  };

  // Variant styles
  const variantStyles: Record<IconButtonVariant, React.CSSProperties> = {
    ghost: {
      backgroundColor: 'transparent',
      color: colors['text-secondary'],
    },
    filled: {
      backgroundColor: colors['bg-elevated'],
      color: colors['text-primary'],
      boxShadow: shadows.sm,
    },
  };

  return {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const buttonStyle = getIconButtonStyles(variant, size, disabled, loading);

  // Hover effects
  const hoverStyle: React.CSSProperties = isHovered && !disabled && !loading
    ? {
        ...(variant === 'ghost' && {
          backgroundColor: colors['bg-tertiary'],
        }),
        ...(variant === 'filled' && {
          backgroundColor: colors['bg-hover'],
          transform: 'translateY(-1px)',
          boxShadow: shadows.md,
        }),
      }
    : {};

  return (
    <button
      className={className}
      style={{ ...buttonStyle, ...hoverStyle, ...style }}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: size === 'sm' ? '14px' : size === 'md' ? '16px' : '18px',
            height: size === 'sm' ? '14px' : size === 'md' ? '16px' : '18px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: radii.full,
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
      )}
    </button>
  );
};

export default IconButton;
