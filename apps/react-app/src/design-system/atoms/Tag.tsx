import React from 'react';
import { colors, radii, spacing, typography } from '../tokens';

export type TagSize = 'sm' | 'md';

export interface TagProps {
  children: React.ReactNode;
  size?: TagSize;
  selected?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({
  children,
  size = 'md',
  selected = false,
  removable = false,
  onRemove,
  onClick,
  icon,
}) => {
  const sizeStyles = {
    sm: {
      fontSize: typography.fontSize.xs,
      padding: `${spacing[0.5]} ${spacing[2]}`,
      height: '24px',
    },
    md: {
      fontSize: typography.fontSize.sm,
      padding: `${spacing[1]} ${spacing[3]}`,
      height: '32px',
    },
  };

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing[1],
    borderRadius: radii.full,
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.medium,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'all 150ms ease-out',
    border: `1px solid ${selected ? colors.brand.primary : colors.border.default}`,
    backgroundColor: selected ? `${colors.brand.primary}20` : colors.bg.secondary,
    color: selected ? colors.brand.primary : colors.text.primary,
    ...sizeStyles[size],
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  return (
    <span
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = selected
            ? `${colors.brand.primary}30`
            : colors.bg.tertiary;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = selected
            ? `${colors.brand.primary}20`
            : colors.bg.secondary;
        }
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
      {removable && (
        <button
          onClick={handleRemove}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: 'inherit',
            marginLeft: spacing[0.5],
          }}
          aria-label="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
};
