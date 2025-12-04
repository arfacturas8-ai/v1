/**
 * CRYB Design System - NotificationItem Organism
 * Notification with icon, content, timestamp, and unread indicator
 */

import React, { useState } from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';
import { formatRelativeTime } from '../../lib/utils';

// Icons
const HeartIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 17.5L8.825 16.4375C5.1 13.1042 2.5 10.7292 2.5 7.91667C2.5 5.54167 4.375 3.66667 6.75 3.66667C8.1 3.66667 9.4 4.25 10 5.23333C10.6 4.25 11.9 3.66667 13.25 3.66667C15.625 3.66667 17.5 5.54167 17.5 7.91667C17.5 10.7292 14.9 13.1042 11.175 16.4458L10 17.5Z"
      fill="currentColor"
    />
  </svg>
);

const CommentIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M17.5 9.58333C17.5 13.4625 14.1417 16.5833 10 16.5833C8.8 16.5833 7.67917 16.3208 6.66667 15.8458L2.5 17.5L4.15417 13.3333C3.67917 12.3208 3.41667 11.2 3.41667 10C3.41667 6.12083 6.775 3 10.8333 3C14.7208 3 17.5 5.70417 17.5 9.58333Z"
      fill="currentColor"
    />
  </svg>
);

const UserIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 10C12.0711 10 13.75 8.32107 13.75 6.25C13.75 4.17893 12.0711 2.5 10 2.5C7.92893 2.5 6.25 4.17893 6.25 6.25C6.25 8.32107 7.92893 10 10 10Z"
      fill="currentColor"
    />
    <path
      d="M10 11.875C6.54822 11.875 3.75 14.6732 3.75 18.125H16.25C16.25 14.6732 13.4518 11.875 10 11.875Z"
      fill="currentColor"
    />
  </svg>
);

const BellIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M15 6.66667C15 5.34058 14.4732 4.06881 13.5355 3.13113C12.5979 2.19345 11.3261 1.66667 10 1.66667C8.67392 1.66667 7.40215 2.19345 6.46447 3.13113C5.52678 4.06881 5 5.34058 5 6.66667C5 12.5 2.5 14.1667 2.5 14.1667H17.5C17.5 14.1667 15 12.5 15 6.66667Z"
      fill="currentColor"
    />
    <path
      d="M11.4417 17.5C11.2952 17.7526 11.0849 17.9622 10.8319 18.1079C10.5789 18.2537 10.2922 18.3304 10 18.3304C9.70781 18.3304 9.42112 18.2537 9.16814 18.1079C8.91515 17.9622 8.70486 17.7526 8.55835 17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TagIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M17.0711 10.9289L10.9289 17.0711C10.5384 17.4616 10.0233 17.6833 9.5 17.6833C8.97674 17.6833 8.46164 17.4616 8.07107 17.0711L2.5 11.5V2.5H11.5L17.0711 8.07107C17.4616 8.46164 17.6833 8.97674 17.6833 9.5C17.6833 10.0233 17.4616 10.5384 17.0711 10.9289Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="6.66667" cy="6.66667" r="1.25" fill="currentColor" />
  </svg>
);

const ShareIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M15 6.66667C16.3807 6.66667 17.5 5.54738 17.5 4.16667C17.5 2.78595 16.3807 1.66667 15 1.66667C13.6193 1.66667 12.5 2.78595 12.5 4.16667C12.5 5.54738 13.6193 6.66667 15 6.66667Z"
      fill="currentColor"
    />
    <path
      d="M5 12.5C6.38071 12.5 7.5 11.3807 7.5 10C7.5 8.61929 6.38071 7.5 5 7.5C3.61929 7.5 2.5 8.61929 2.5 10C2.5 11.3807 3.61929 12.5 5 12.5Z"
      fill="currentColor"
    />
    <path
      d="M15 18.3333C16.3807 18.3333 17.5 17.214 17.5 15.8333C17.5 14.4526 16.3807 13.3333 15 13.3333C13.6193 13.3333 12.5 14.4526 12.5 15.8333C12.5 17.214 13.6193 18.3333 15 18.3333Z"
      fill="currentColor"
    />
    <path
      d="M7.15833 11.175L12.85 14.6583M12.8417 5.34167L7.15833 8.825"
      stroke={colors.bg.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M12 4L4 12M4 4l8 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'share'
  | 'system'
  | 'custom';

export interface NotificationActor {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface NotificationItemProps {
  id: string;
  type: NotificationType;
  actors: NotificationActor[];
  content: string;
  timestamp: Date;
  isRead?: boolean;
  actionText?: string;
  thumbnail?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  iconBackground?: string;
  loading?: boolean;
  error?: string;
  onClick?: () => void;
  onAction?: () => void;
  onDismiss?: () => void;
  onMarkAsRead?: () => void;
  showActions?: boolean;
  variant?: 'default' | 'compact';
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  type,
  actors,
  content,
  timestamp,
  isRead = false,
  actionText,
  thumbnail,
  icon,
  iconColor,
  iconBackground,
  loading = false,
  error,
  onClick,
  onAction,
  onDismiss,
  onMarkAsRead,
  showActions = true,
  variant = 'default',
}) => {
  const [read, setRead] = useState(isRead);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (!read) {
      setRead(true);
      onMarkAsRead?.();
    }
    onClick?.();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.();
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'like':
        return <HeartIcon size={variant === 'compact' ? 16 : 20} />;
      case 'comment':
        return <CommentIcon size={variant === 'compact' ? 16 : 20} />;
      case 'follow':
        return <UserIcon size={variant === 'compact' ? 16 : 20} />;
      case 'mention':
        return <TagIcon size={variant === 'compact' ? 16 : 20} />;
      case 'share':
        return <ShareIcon size={variant === 'compact' ? 16 : 20} />;
      case 'system':
        return <BellIcon size={variant === 'compact' ? 16 : 20} />;
      default:
        return <BellIcon size={variant === 'compact' ? 16 : 20} />;
    }
  };

  const getDefaultIconColor = () => {
    switch (type) {
      case 'like':
        return colors.semantic.error;
      case 'comment':
        return colors.brand.primary;
      case 'follow':
        return colors.semantic.success;
      case 'mention':
        return colors.semantic.warning;
      case 'share':
        return colors.brand.secondary;
      case 'system':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const displayIcon = icon || getDefaultIcon();
  const displayIconColor = iconColor || getDefaultIconColor();
  const displayIconBg = iconBackground || `${displayIconColor}20`;

  const isCompact = variant === 'compact';

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radii.lg,
          padding: isCompact ? spacing[3] : spacing[4],
          opacity: 0.5,
        }}
      >
        <div style={{ display: 'flex', gap: spacing[3] }}>
          <div
            style={{
              width: isCompact ? '32px' : '40px',
              height: isCompact ? '32px' : '40px',
              borderRadius: radii.full,
              backgroundColor: colors.bg.tertiary,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: '70%',
                height: '16px',
                borderRadius: radii.sm,
                backgroundColor: colors.bg.tertiary,
                marginBottom: spacing[2],
              }}
            />
            <div
              style={{
                width: '40%',
                height: '14px',
                borderRadius: radii.sm,
                backgroundColor: colors.bg.tertiary,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.semantic.error}`,
          borderRadius: radii.lg,
          padding: spacing[3],
          color: colors.semantic.error,
          fontSize: typography.fontSize.sm,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <article
      style={{
        position: 'relative',
        backgroundColor: read ? colors.bg.secondary : colors.bg.tertiary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radii.lg,
        padding: isCompact ? spacing[3] : spacing[4],
        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Unread Indicator */}
      {!read && (
        <div
          style={{
            position: 'absolute',
            left: spacing[2],
            top: '50%',
            transform: 'translateY(-50%)',
            width: '8px',
            height: '8px',
            borderRadius: radii.full,
            backgroundColor: colors.brand.primary,
          }}
          aria-label="Unread notification"
        />
      )}

      <div
        style={{
          display: 'flex',
          gap: spacing[3],
          paddingLeft: !read ? spacing[3] : 0,
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: isCompact ? '36px' : '44px',
            height: isCompact ? '36px' : '44px',
            borderRadius: radii.full,
            backgroundColor: displayIconBg,
            color: displayIconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {displayIcon}

          {/* Actor Avatar Overlay */}
          {actors.length > 0 && actors[0].avatar && (
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: isCompact ? '18px' : '22px',
                height: isCompact ? '18px' : '22px',
                borderRadius: radii.full,
                overflow: 'hidden',
                border: `2px solid ${colors.bg.secondary}`,
              }}
            >
              <img
                src={actors[0].avatar}
                alt={actors[0].name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Notification Text */}
          <div
            style={{
              color: colors.text.primary,
              fontSize: isCompact ? typography.fontSize.sm : typography.fontSize.base,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing[1],
            }}
          >
            {/* Actor Names */}
            {actors.length > 0 && (
              <span style={{ fontWeight: typography.fontWeight.semibold }}>
                {actors.length === 1
                  ? actors[0].name
                  : actors.length === 2
                  ? `${actors[0].name} and ${actors[1].name}`
                  : `${actors[0].name} and ${actors.length - 1} others`}
              </span>
            )}{' '}
            {/* Content */}
            <span>{content}</span>
          </div>

          {/* Timestamp */}
          <div
            style={{
              color: colors.text.tertiary,
              fontSize: typography.fontSize.xs,
              marginBottom: actionText && showActions ? spacing[2] : 0,
            }}
          >
            {formatRelativeTime(timestamp)}
          </div>

          {/* Action Button */}
          {actionText && showActions && onAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              style={{
                backgroundColor: colors.brand.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: radii.md,
                padding: `${spacing[2]} ${spacing[3]}`,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.brand.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.brand.primary;
              }}
            >
              {actionText}
            </button>
          )}
        </div>

        {/* Thumbnail */}
        {thumbnail && (
          <div
            style={{
              width: isCompact ? '48px' : '60px',
              height: isCompact ? '48px' : '60px',
              borderRadius: radii.md,
              overflow: 'hidden',
              backgroundColor: colors.bg.tertiary,
              flexShrink: 0,
            }}
          >
            {!imageError ? (
              <img
                src={thumbnail}
                alt="Notification thumbnail"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text.tertiary,
                }}
              >
                !
              </div>
            )}
          </div>
        )}

        {/* Dismiss Button */}
        {onDismiss && isHovered && (
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: spacing[2],
              right: spacing[2],
              background: colors.bg.elevated,
              border: 'none',
              borderRadius: radii.full,
              padding: spacing[1],
              color: colors.text.tertiary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isHovered ? 1 : 0,
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.text.primary;
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.text.tertiary;
              e.currentTarget.style.backgroundColor = colors.bg.elevated;
            }}
            aria-label="Dismiss notification"
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>
    </article>
  );
};

export default NotificationItem;
