/**
 * CRYB Design System - CommunityCard Organism
 * Community preview with banner, avatar, name, member count, and join button
 */

import React, { useState } from 'react';
import { colors, spacing, typography, radii, animation, shadows } from '../../design-system/tokens';
import { formatNumber } from '../../lib/utils';
import Button from '../atoms/Button';

// Icons
const UsersIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M11.3333 14V12.6667C11.3333 11.9594 11.0524 11.2811 10.5523 10.781C10.0522 10.281 9.37391 10 8.66667 10H3.33333C2.62609 10 1.94781 10.281 1.44772 10.781C0.947625 11.2811 0.666667 11.9594 0.666667 12.6667V14M14 14V12.6667C13.9997 12.0758 13.8043 11.5019 13.4447 11.0349C13.0851 10.5679 12.5813 10.2344 12.0133 10.0867M10.3467 2.75333C10.9161 2.90029 11.4214 3.23383 11.782 3.70185C12.1425 4.16986 12.3385 4.74533 12.3385 5.33733C12.3385 5.92934 12.1425 6.5048 11.782 6.97282C11.4214 7.44083 10.9161 7.77437 10.3467 7.92133M8.66667 5.33333C8.66667 6.8061 7.47276 8 6 8C4.52724 8 3.33333 6.8061 3.33333 5.33333C3.33333 3.86057 4.52724 2.66667 6 2.66667C7.47276 2.66667 8.66667 3.86057 8.66667 5.33333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MessageIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M14 7.66667C14 11.17 11.1267 14 7.58333 14C6.64 14 5.75333 13.7733 4.96667 13.3733L2 14.6667L3.29333 11.7C2.89333 10.9133 2.66667 10.0267 2.66667 9.08333C2.66667 5.52667 5.54 2.66667 9.06667 2.66667C12.4667 2.66667 14 5.14 14 7.66667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const VerifiedIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M5.6 8L7.2 9.6L10.4 6.4M14.4 8C14.4 11.5346 11.5346 14.4 8 14.4C4.46538 14.4 1.6 11.5346 1.6 8C1.6 4.46538 4.46538 1.6 8 1.6C11.5346 1.6 14.4 4.46538 14.4 8Z"
      stroke={colors.brand.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={colors.brand.primary}
    />
  </svg>
);

const LockIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path
      d="M11.0833 6.41667H2.91667C2.18029 6.41667 1.58333 7.01362 1.58333 7.75V11.0833C1.58333 11.8197 2.18029 12.4167 2.91667 12.4167H11.0833C11.8197 12.4167 12.4167 11.8197 12.4167 11.0833V7.75C12.4167 7.01362 11.8197 6.41667 11.0833 6.41667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.08333 6.41667V4.08333C4.08333 3.41703 4.34792 2.77791 4.81676 2.30907C5.2856 1.84024 5.92472 1.57567 6.59101 1.57567H7.40833C8.07463 1.57567 8.71375 1.84024 9.18259 2.30907C9.65142 2.77791 9.91601 3.41703 9.91601 4.08333V6.41667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrendingIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path
      d="M12.25 4.66667L7.58333 9.33333L4.66667 6.41667L1.75 9.33333M12.25 4.66667H8.75M12.25 4.66667V8.16667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface CommunityStats {
  members: number;
  online?: number;
  posts?: number;
  growth?: number;
}

export interface CommunityCategory {
  id: string;
  name: string;
  color?: string;
}

export interface CommunityCardProps {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  banner?: string;
  verified?: boolean;
  stats: CommunityStats;
  categories?: CommunityCategory[];
  isPrivate?: boolean;
  isMember?: boolean;
  isTrending?: boolean;
  loading?: boolean;
  error?: string;
  onJoin?: () => void;
  onLeave?: () => void;
  onMessage?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  showBanner?: boolean;
  showStats?: boolean;
}

const CommunityCard: React.FC<CommunityCardProps> = ({
  id,
  name,
  description,
  avatar,
  banner,
  verified = false,
  stats,
  categories = [],
  isPrivate = false,
  isMember = false,
  isTrending = false,
  loading = false,
  error,
  onJoin,
  onLeave,
  onMessage,
  onClick,
  variant = 'default',
  showBanner = true,
  showStats = true,
}) => {
  const [member, setMember] = useState(isMember);
  const [memberCount, setMemberCount] = useState(stats.members);
  const [isHovered, setIsHovered] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleJoinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMemberState = !member;
    setMember(newMemberState);
    setMemberCount(prev => newMemberState ? prev + 1 : prev - 1);

    if (newMemberState) {
      onJoin?.();
    } else {
      onLeave?.();
    }
  };

  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.semantic.error}`,
          borderRadius: radii.xl,
          padding: spacing[4],
          color: colors.semantic.error,
          textAlign: 'center',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <article
      style={{
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radii.xl,
        overflow: 'hidden',
        transition: `all ${animation.duration.normal} ${animation.easing.easeOut}`,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: isHovered ? shadows.lg : shadows.sm,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Banner */}
      {showBanner && !isCompact && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: isDetailed ? '140px' : '100px',
            backgroundColor: colors.bg.tertiary,
            overflow: 'hidden',
          }}
        >
          {banner && !bannerError ? (
            <img
              src={banner}
              alt={`${name} banner`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={() => setBannerError(true)}
              loading="lazy"
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: colors.brand.gradient,
              }}
            />
          )}

          {/* Trending Badge */}
          {isTrending && (
            <div
              style={{
                position: 'absolute',
                top: spacing[3],
                right: spacing[3],
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: radii.full,
                padding: `${spacing[2]} ${spacing[3]}`,
                display: 'flex',
                alignItems: 'center',
                gap: spacing[1],
                color: colors.semantic.warning,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              <TrendingIcon size={12} />
              <span>Trending</span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: isCompact ? spacing[3] : spacing[4] }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing[3],
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: isCompact ? '48px' : isDetailed ? '72px' : '64px',
              height: isCompact ? '48px' : isDetailed ? '72px' : '64px',
              borderRadius: radii.lg,
              overflow: 'hidden',
              backgroundColor: colors.bg.tertiary,
              border: `4px solid ${colors.bg.secondary}`,
              marginTop: showBanner && !isCompact ? (isDetailed ? '-36px' : '-32px') : '0',
              flexShrink: 0,
            }}
          >
            {avatar && !avatarError ? (
              <img
                src={avatar}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setAvatarError(true)}
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
                  color: colors.text.secondary,
                  fontSize: isCompact ? typography.fontSize.lg : typography.fontSize['2xl'],
                  fontWeight: typography.fontWeight.semibold,
                  background: colors.brand.gradient,
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Message Button */}
          {member && onMessage && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              icon={<MessageIcon size={16} />}
              onClick={(e) => {
                e?.stopPropagation();
                onMessage();
              }}
              aria-label="Message community"
            />
          )}
        </div>

        {/* Community Info */}
        <div style={{ marginBottom: spacing[3] }}>
          {/* Name and Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1], flexWrap: 'wrap' }}>
            <h3
              style={{
                color: colors.text.primary,
                fontSize: isCompact ? typography.fontSize.base : typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              {name}
            </h3>
            {verified && <VerifiedIcon size={isCompact ? 14 : 16} />}
            {isPrivate && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1],
                  backgroundColor: colors.bg.tertiary,
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: radii.full,
                }}
              >
                <LockIcon size={10} />
                <span>Private</span>
              </div>
            )}
          </div>

          {/* Categories */}
          {categories.length > 0 && !isCompact && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[1], marginBottom: spacing[2] }}>
              {categories.slice(0, isDetailed ? 5 : 3).map((category) => (
                <span
                  key={category.id}
                  style={{
                    backgroundColor: category.color ? `${category.color}20` : colors.bg.tertiary,
                    color: category.color || colors.text.secondary,
                    fontSize: typography.fontSize.xs,
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: radii.full,
                  }}
                >
                  {category.name}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {description && !isCompact && (
            <p
              style={{
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm,
                lineHeight: typography.lineHeight.relaxed,
                display: '-webkit-box',
                WebkitLineClamp: isDetailed ? 3 : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Stats */}
        {showStats && (
          <div
            style={{
              display: 'flex',
              gap: spacing[4],
              paddingTop: spacing[3],
              paddingBottom: spacing[3],
              borderTop: `1px solid ${colors.border.subtle}`,
              borderBottom: `1px solid ${colors.border.subtle}`,
              marginBottom: spacing[3],
            }}
          >
            {/* Members */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <UsersIcon size={14} />
              <div>
                <div
                  style={{
                    color: colors.text.primary,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                  }}
                >
                  {formatNumber(memberCount)}
                </div>
                <div
                  style={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  Members
                </div>
              </div>
            </div>

            {/* Online */}
            {stats.online !== undefined && (
              <div>
                <div
                  style={{
                    color: colors.semantic.success,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: radii.full,
                      backgroundColor: colors.semantic.success,
                    }}
                  />
                  <span>{formatNumber(stats.online)}</span>
                </div>
                <div
                  style={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  Online
                </div>
              </div>
            )}

            {/* Posts */}
            {stats.posts !== undefined && isDetailed && (
              <div>
                <div
                  style={{
                    color: colors.text.primary,
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                  }}
                >
                  {formatNumber(stats.posts)}
                </div>
                <div
                  style={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  Posts
                </div>
              </div>
            )}
          </div>
        )}

        {/* Join/Leave Button */}
        {(onJoin || onLeave) && (
          <Button
            variant={member ? 'secondary' : 'primary'}
            size={isCompact ? 'sm' : 'md'}
            fullWidth
            onClick={handleJoinToggle}
            aria-label={member ? 'Leave community' : 'Join community'}
          >
            {member ? 'Joined' : isPrivate ? 'Request to Join' : 'Join Community'}
          </Button>
        )}
      </div>
    </article>
  );
};

export default CommunityCard;
