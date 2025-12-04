/**
 * CRYB Design System - UserCard Organism
 * User preview with avatar, name, username, bio excerpt, and follow button
 */

import React, { useState } from 'react';
import { colors, spacing, typography, radii, animation, shadows } from '../../design-system/tokens';
import { formatNumber, truncate } from '../../lib/utils';
import Button from '../atoms/Button';

// Icons
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

const MoreIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="4" cy="10" r="1.5" fill="currentColor" />
    <circle cx="16" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

const MessageIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path
      d="M15.75 8.625C15.75 12.1627 12.7275 14.925 9 14.925C7.92 14.925 6.9113 14.6887 6 14.2612L2.25 15.75L3.7387 12C3.3113 11.0887 3.075 10.08 3.075 9C3.075 5.50875 6.0975 2.7 9.75 2.7C13.2488 2.7 15.75 5.13375 15.75 8.625Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface UserStats {
  followers: number;
  following: number;
  posts?: number;
  nfts?: number;
}

export interface UserBadge {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface UserCardProps {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  verified?: boolean;
  stats?: UserStats;
  badges?: UserBadge[];
  isFollowing?: boolean;
  isFollowingYou?: boolean;
  isSelf?: boolean;
  loading?: boolean;
  error?: string;
  onFollow?: () => void;
  onUnfollow?: () => void;
  onMessage?: () => void;
  onClick?: () => void;
  onMore?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  showCover?: boolean;
  showBio?: boolean;
  showStats?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  id,
  name,
  username,
  avatar,
  coverImage,
  bio,
  verified = false,
  stats,
  badges = [],
  isFollowing = false,
  isFollowingYou = false,
  isSelf = false,
  loading = false,
  error,
  onFollow,
  onUnfollow,
  onMessage,
  onClick,
  onMore,
  variant = 'default',
  showCover = true,
  showBio = true,
  showStats = true,
}) => {
  const [following, setFollowing] = useState(isFollowing);
  const [followerCount, setFollowerCount] = useState(stats?.followers || 0);
  const [isHovered, setIsHovered] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newFollowingState = !following;
    setFollowing(newFollowingState);
    setFollowerCount(prev => newFollowingState ? prev + 1 : prev - 1);

    if (newFollowingState) {
      onFollow?.();
    } else {
      onUnfollow?.();
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radii.xl,
          overflow: 'hidden',
        }}
      >
        {showCover && variant !== 'compact' && (
          <div
            style={{
              width: '100%',
              height: '120px',
              backgroundColor: colors.bg.tertiary,
            }}
          />
        )}
        <div style={{ padding: spacing[4] }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: radii.full,
              backgroundColor: colors.bg.tertiary,
              marginTop: showCover && variant !== 'compact' ? '-40px' : '0',
              marginBottom: spacing[3],
            }}
          />
          <div
            style={{
              width: '60%',
              height: '20px',
              borderRadius: radii.sm,
              backgroundColor: colors.bg.tertiary,
              marginBottom: spacing[2],
            }}
          />
          <div
            style={{
              width: '40%',
              height: '16px',
              borderRadius: radii.sm,
              backgroundColor: colors.bg.tertiary,
            }}
          />
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

  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  return (
    <article
      style={{
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radii.xl,
        overflow: 'hidden',
        transition: `all ${animation.duration.normal} ${animation.easing.easeOut}`,
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: isHovered ? shadows.md : 'none',
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
      {/* Cover Image */}
      {showCover && !isCompact && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: isDetailed ? '160px' : '120px',
            backgroundColor: colors.bg.tertiary,
            overflow: 'hidden',
          }}
        >
          {coverImage && !coverError ? (
            <img
              src={coverImage}
              alt={`${name}'s cover`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={() => setCoverError(true)}
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
        </div>
      )}

      {/* Content */}
      <div
        style={{
          padding: isCompact ? spacing[3] : spacing[4],
          position: 'relative',
        }}
      >
        {/* Header with Avatar and Actions */}
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
              width: isCompact ? '48px' : isDetailed ? '96px' : '80px',
              height: isCompact ? '48px' : isDetailed ? '96px' : '80px',
              borderRadius: radii.full,
              overflow: 'hidden',
              backgroundColor: colors.bg.tertiary,
              border: `4px solid ${colors.bg.secondary}`,
              marginTop: showCover && !isCompact ? (isDetailed ? '-48px' : '-40px') : '0',
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
                  fontSize: isCompact ? typography.fontSize.xl : typography.fontSize['3xl'],
                  fontWeight: typography.fontWeight.semibold,
                  background: colors.brand.gradient,
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!isSelf && (
            <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[2] }}>
              {onMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={<MessageIcon size={18} />}
                  onClick={(e) => {
                    e?.stopPropagation();
                    onMessage();
                  }}
                  aria-label="Send message"
                />
              )}
              {onMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  icon={<MoreIcon size={18} />}
                  onClick={(e) => {
                    e?.stopPropagation();
                    onMore();
                  }}
                  aria-label="More options"
                />
              )}
            </div>
          )}
        </div>

        {/* User Info */}
        <div style={{ marginBottom: spacing[3] }}>
          {/* Name and Verification */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <h3
              style={{
                color: colors.text.primary,
                fontSize: isCompact ? typography.fontSize.base : typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </h3>
            {verified && <VerifiedIcon size={isCompact ? 14 : 16} />}
            {isFollowingYou && (
              <span
                style={{
                  backgroundColor: colors.bg.tertiary,
                  color: colors.text.secondary,
                  fontSize: typography.fontSize.xs,
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: radii.full,
                }}
              >
                Follows you
              </span>
            )}
          </div>

          {/* Username */}
          <div
            style={{
              color: colors.text.tertiary,
              fontSize: isCompact ? typography.fontSize.sm : typography.fontSize.base,
              marginBottom: badges.length > 0 ? spacing[2] : 0,
            }}
          >
            @{username}
          </div>

          {/* Badges */}
          {badges.length > 0 && isDetailed && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginTop: spacing[2] }}>
              {badges.slice(0, 3).map((badge) => (
                <div
                  key={badge.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    backgroundColor: badge.color || colors.bg.tertiary,
                    color: colors.text.primary,
                    fontSize: typography.fontSize.xs,
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: radii.full,
                  }}
                >
                  {badge.icon && <span>{badge.icon}</span>}
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bio */}
        {showBio && bio && !isCompact && (
          <p
            style={{
              color: colors.text.secondary,
              fontSize: typography.fontSize.sm,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing[3],
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {isDetailed ? bio : truncate(bio, 120)}
          </p>
        )}

        {/* Stats */}
        {showStats && stats && (
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
            <div>
              <div
                style={{
                  color: colors.text.primary,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {formatNumber(followerCount)}
              </div>
              <div
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                }}
              >
                Followers
              </div>
            </div>
            <div>
              <div
                style={{
                  color: colors.text.primary,
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {formatNumber(stats.following)}
              </div>
              <div
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                }}
              >
                Following
              </div>
            </div>
            {stats.posts !== undefined && (
              <div>
                <div
                  style={{
                    color: colors.text.primary,
                    fontSize: typography.fontSize.lg,
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
            {stats.nfts !== undefined && (
              <div>
                <div
                  style={{
                    color: colors.text.primary,
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                  }}
                >
                  {formatNumber(stats.nfts)}
                </div>
                <div
                  style={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  NFTs
                </div>
              </div>
            )}
          </div>
        )}

        {/* Follow Button */}
        {!isSelf && (onFollow || onUnfollow) && (
          <Button
            variant={following ? 'secondary' : 'primary'}
            size={isCompact ? 'sm' : 'md'}
            fullWidth
            onClick={handleFollowToggle}
            aria-label={following ? 'Unfollow' : 'Follow'}
          >
            {following ? 'Following' : 'Follow'}
          </Button>
        )}

        {/* Self Profile Button */}
        {isSelf && (
          <Button
            variant="outline"
            size={isCompact ? 'sm' : 'md'}
            fullWidth
            onClick={(e) => {
              e?.stopPropagation();
              onClick?.();
            }}
          >
            View Profile
          </Button>
        )}
      </div>
    </article>
  );
};

export default UserCard;
