/**
 * Card Molecule Component
 * Generic container component with consistent styling
 */

import React from 'react';
import { colors, radii, spacing, shadows } from '../tokens';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  onClick,
  className,
  style,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const paddingMap = {
    none: '0',
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[6],
    xl: spacing[8],
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: colors['bg-secondary'],
      border: 'none',
      boxShadow: shadows.sm,
    },
    elevated: {
      backgroundColor: colors['bg-elevated'],
      border: 'none',
      boxShadow: shadows.lg,
    },
    outlined: {
      backgroundColor: colors['bg-secondary'],
      border: `1px solid ${colors['border-default']}`,
      boxShadow: 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
    },
  };

  const cardStyles: React.CSSProperties = {
    ...variantStyles[variant],
    padding: paddingMap[padding],
    borderRadius: radii.lg,
    transition: 'all 0.2s ease',
    cursor: clickable || onClick ? 'pointer' : 'default',
    ...(hoverable &&
      isHovered && {
        transform: 'translateY(-2px)',
        boxShadow: shadows.xl,
      }),
    ...style,
  };

  return (
    <div
      className={className}
      style={cardStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
};

export default Card;
