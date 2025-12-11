import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconOnly = false,
  children,
  onClick,
  type = 'button',
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const getVariantStyles = (): React.CSSProperties => {
    if (disabled || loading) {
      return {
        backgroundColor: colors.bg.tertiary,
        color: colors.text.tertiary,
        cursor: 'not-allowed',
        border: 'none',
      };
    }

    const baseStyles: Record<ButtonVariant, React.CSSProperties> = {
      primary: {
        backgroundColor: isPressed ? '#5558D9' : isHovered ? colors.brand.hover : colors.brand.primary,
        color: '#FFFFFF',
        border: 'none',
      },
      secondary: {
        backgroundColor: isPressed ? colors.bg.tertiary : isHovered ? colors.bg.hover : colors.bg.secondary,
        color: colors.text.primary,
        border: `1px solid ${colors.border.default}`,
      },
      outline: {
        backgroundColor: isPressed ? colors.bg.tertiary : isHovered ? colors.bg.hover : 'transparent',
        color: colors.brand.primary,
        border: `1px solid ${colors.brand.primary}`,
      },
      ghost: {
        backgroundColor: isHovered ? colors.bg.hover : 'transparent',
        color: colors.text.primary,
        border: 'none',
      },
      danger: {
        backgroundColor: isPressed ? '#CC2F2F' : isHovered ? '#E63535' : colors.semantic.error,
        color: '#FFFFFF',
        border: 'none',
      },
      success: {
        backgroundColor: isPressed ? '#00B85C' : isHovered ? '#00C964' : colors.semantic.success,
        color: '#FFFFFF',
        border: 'none',
      },
    };

    return baseStyles[variant];
  };

  const getSizeStyles = (): React.CSSProperties => {
    const sizes: Record<ButtonSize, React.CSSProperties> = {
      sm: {
        padding: iconOnly ? spacing[2] : `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.fontSize.sm,
        height: iconOnly ? '32px' : 'auto',
        minWidth: iconOnly ? '32px' : 'auto',
      },
      md: {
        padding: iconOnly ? spacing[3] : `${spacing[3]} ${spacing[4]}`,
        fontSize: typography.fontSize.base,
        height: iconOnly ? '40px' : 'auto',
        minWidth: iconOnly ? '40px' : 'auto',
      },
      lg: {
        padding: iconOnly ? spacing[4] : `${spacing[4]} ${spacing[6]}`,
        fontSize: typography.fontSize.lg,
        height: iconOnly ? '48px' : 'auto',
        minWidth: iconOnly ? '48px' : 'auto',
      },
    };

    return sizes[size];
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        width: fullWidth ? '100%' : 'auto',
        borderRadius: iconOnly ? radii.full : radii.md,
        fontFamily: typography.fontFamily.sans,
        fontWeight: typography.fontWeight.semibold,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
        outline: 'none',
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {!iconOnly && children}
    </button>
  );
};

export default Button;
