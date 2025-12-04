import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: React.ReactNode;
  dot?: boolean;
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  dot = false,
  count,
  maxCount = 99,
  showZero = false,
  icon,
  onClose,
  className,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const getVariantStyles = (): React.CSSProperties => {
    const variants: Record<BadgeVariant, React.CSSProperties> = {
      default: {
        backgroundColor: colors.bg.elevated,
        color: colors.text.primary,
        border: `1px solid ${colors.border.default}`,
      },
      success: {
        backgroundColor: `${colors.semantic.success}20`,
        color: colors.semantic.success,
        border: `1px solid ${colors.semantic.success}40`,
      },
      warning: {
        backgroundColor: `${colors.semantic.warning}20`,
        color: colors.semantic.warning,
        border: `1px solid ${colors.semantic.warning}40`,
      },
      error: {
        backgroundColor: `${colors.semantic.error}20`,
        color: colors.semantic.error,
        border: `1px solid ${colors.semantic.error}40`,
      },
      info: {
        backgroundColor: `${colors.semantic.info}20`,
        color: colors.semantic.info,
        border: `1px solid ${colors.semantic.info}40`,
      },
      brand: {
        backgroundColor: `${colors.brand.primary}20`,
        color: colors.brand.primary,
        border: `1px solid ${colors.brand.primary}40`,
      },
    };

    return variants[variant];
  };

  const getSizeStyles = (): React.CSSProperties => {
    const sizes = {
      sm: {
        padding: dot ? 0 : `${spacing[1]} ${spacing[2]}`,
        fontSize: typography.fontSize.xs,
        height: dot ? '6px' : 'auto',
        minWidth: dot ? '6px' : '18px',
      },
      md: {
        padding: dot ? 0 : `${spacing[2]} ${spacing[3]}`,
        fontSize: typography.fontSize.sm,
        height: dot ? '8px' : 'auto',
        minWidth: dot ? '8px' : '22px',
      },
    };

    return sizes[size];
  };

  const displayCount = count !== undefined && count > maxCount ? `${maxCount}+` : count;
  const shouldShow = count !== undefined ? (showZero || count > 0) : true;

  if (!shouldShow && !children) {
    return null;
  }

  // Dot badge - small circular indicator
  if (dot) {
    return (
      <span
        className={className}
        style={{
          ...getVariantStyles(),
          ...getSizeStyles(),
          display: 'inline-flex',
          borderRadius: radii.full,
          flexShrink: 0,
        }}
      />
    );
  }

  // Count badge - displays numbers
  if (count !== undefined) {
    return (
      <span
        className={className}
        style={{
          ...getVariantStyles(),
          ...getSizeStyles(),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radii.full,
          fontFamily: typography.fontFamily.sans,
          fontWeight: typography.fontWeight.semibold,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {displayCount}
      </span>
    );
  }

  // Standard badge with content
  return (
    <span
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        display: 'inline-flex',
        alignItems: 'center',
        gap: spacing[1],
        borderRadius: radii.md,
        fontFamily: typography.fontFamily.sans,
        fontWeight: typography.fontWeight.medium,
        lineHeight: 1,
        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {icon && (
        <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85em' }}>
          {icon}
        </span>
      )}

      {children}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            margin: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'currentColor',
            opacity: isHovered ? 1 : 0.7,
            transition: `opacity ${animation.duration.fast} ${animation.easing.easeOut}`,
            marginLeft: spacing[1],
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M9 3L3 9M3 3l6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
};

export default Badge;
