import React from 'react';
import { colors, radii, spacing, typography } from '../tokens';
import { Avatar } from '../atoms/Avatar';
import { ChevronRight } from 'lucide-react';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  leftAvatar?: {
    src?: string;
    alt: string;
    fallback?: string;
  };
  rightAccessory?: React.ReactNode;
  showChevron?: boolean;
  onClick?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeLeftLabel?: string;
  swipeRightLabel?: string;
  disabled?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  leftAvatar,
  rightAccessory,
  showChevron = false,
  onClick,
  disabled = false,
}) => {
  const isInteractive = !disabled && (onClick !== undefined);

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing[3],
        padding: `${spacing[3]} ${spacing[4]}`,
        cursor: isInteractive ? 'pointer' : 'default',
        transition: 'background-color 150ms ease-out',
        opacity: disabled ? 0.5 : 1,
        borderRadius: radii.md,
      }}
      onMouseEnter={(e) => {
        if (isInteractive) {
          e.currentTarget.style.backgroundColor = colors.bg.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (isInteractive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {leftIcon && (
        <div style={{ color: colors.text.secondary, display: 'flex', alignItems: 'center' }}>
          {leftIcon}
        </div>
      )}
      {leftAvatar && (
        <Avatar
          src={leftAvatar.src}
          alt={leftAvatar.alt}
          size="md"
          fallback={leftAvatar.fallback}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              marginTop: spacing[0.5],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {rightAccessory && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {rightAccessory}
        </div>
      )}
      {showChevron && (
        <div style={{ color: colors.text.tertiary, display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={20} />
        </div>
      )}
    </div>
  );
};
