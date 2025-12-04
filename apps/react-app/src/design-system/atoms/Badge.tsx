import React from 'react';
import { colors, radii, spacing, typography } from '../tokens';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: colors['brand-primary'],
    color: colors['text-primary'],
  },
  secondary: {
    backgroundColor: colors['bg-elevated'],
    color: colors['text-secondary'],
  },
  success: {
    backgroundColor: colors['success-bg'],
    color: colors['success'],
  },
  warning: {
    backgroundColor: colors['warning-bg'],
    color: colors['warning'],
  },
  error: {
    backgroundColor: colors['error-bg'],
    color: colors['error'],
  },
  info: {
    backgroundColor: colors['info-bg'],
    color: colors['info'],
  },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: {
    fontSize: typography.fontSize.xs,
    padding: `${spacing[0]} ${spacing[1]}`,
    height: '16px',
  },
  md: {
    fontSize: typography.fontSize.xs,
    padding: `${spacing[1]} ${spacing[2]}`,
    height: '20px',
  },
  lg: {
    fontSize: typography.fontSize.sm,
    padding: `${spacing[1]} ${spacing[3]}`,
    height: '24px',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  dot = false,
  children,
  className = '',
  style,
}) => {
  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    borderRadius: radii.full,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.sans,
    lineHeight: '1',
    whiteSpace: 'nowrap',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: radii.full,
    backgroundColor: 'currentColor',
  };

  return (
    <span className={className} style={badgeStyle}>
      {dot && <span style={dotStyle} />}
      {children}
    </span>
  );
};

// NotificationBadge component for unread counts
interface NotificationBadgeProps {
  count: number;
  max?: number;
  showZero?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  showZero = false,
  className = '',
  style,
}) => {
  if (count === 0 && !showZero) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    padding: `0 ${spacing[1]}`,
    borderRadius: radii.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.sans,
    backgroundColor: colors['error'],
    color: colors['text-primary'],
    lineHeight: '1',
    ...style,
  };

  return (
    <span className={className} style={badgeStyle}>
      {displayCount}
    </span>
  );
};

export default Badge;
