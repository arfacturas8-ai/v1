import React from 'react';
import { colors, spacing, radii, animation, shadows } from '../../design-system/tokens';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'interactive';

interface CardProps {
  variant?: CardVariant;
  pressable?: boolean;
  disabled?: boolean;
  padding?: keyof typeof spacing;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  pressable = false,
  disabled = false,
  padding = 4,
  fullWidth = false,
  children,
  onClick,
  onLongPress,
  className,
  style,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const longPressTimer = React.useRef<NodeJS.Timeout>();

  const getVariantStyles = (): React.CSSProperties => {
    const baseStyles: Record<CardVariant, React.CSSProperties> = {
      default: {
        backgroundColor: colors.bg.secondary,
        border: 'none',
        boxShadow: 'none',
      },
      elevated: {
        backgroundColor: colors.bg.elevated,
        border: 'none',
        boxShadow: shadows.lg,
      },
      outlined: {
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        boxShadow: 'none',
      },
      interactive: {
        backgroundColor: isPressed ? colors.bg.tertiary : isHovered ? colors.bg.hover : colors.bg.secondary,
        border: `1px solid ${isHovered || isFocused ? colors.border.strong : colors.border.default}`,
        boxShadow: isPressed ? shadows.sm : isHovered ? shadows.md : 'none',
      },
    };

    return baseStyles[variant];
  };

  const handleMouseDown = () => {
    if ((pressable || onClick) && !disabled) {
      setIsPressed(true);
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          onLongPress();
        }, 500);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && (pressable || onClick) && !disabled) {
      e.preventDefault();
      setIsPressed(true);
      if (onClick) onClick();
    }
  };

  const handleKeyUp = () => {
    setIsPressed(false);
  };

  const isInteractive = pressable || onClick;

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive && !disabled ? 0 : undefined}
      className={className}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
      }}
      onFocus={() => !disabled && setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        setIsPressed(false);
      }}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={{
        ...getVariantStyles(),
        padding: spacing[padding],
        borderRadius: radii.lg,
        width: fullWidth ? '100%' : 'auto',
        cursor: isInteractive && !disabled ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
        outline: isFocused ? `2px solid ${colors.brand.primary}` : 'none',
        outlineOffset: '2px',
        userSelect: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
