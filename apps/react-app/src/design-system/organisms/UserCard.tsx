import React from 'react';
import { UserPlus, UserCheck, MessageCircle, MoreHorizontal } from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { colors, spacing, typography, radii, shadows } from '../tokens';

interface UserCardProps {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  isVerified?: boolean;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  mutualFollowers?: number;
  tags?: string[];
  onFollow?: () => void;
  onMessage?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export const UserCard: React.FC<UserCardProps> = ({
  id,
  username,
  displayName,
  avatar,
  bio,
  isVerified = false,
  followerCount,
  followingCount,
  isFollowing = false,
  isFollowedBy = false,
  mutualFollowers,
  tags = [],
  onFollow,
  onMessage,
  onClick,
  variant = 'default',
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollow?.();
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMessage?.();
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[3],
          padding: spacing[3],
          borderRadius: radii.md,
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 150ms ease-out',
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.borderColor = colors.brand.primary;
            e.currentTarget.style.backgroundColor = colors.bg.hover;
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.borderColor = colors.border.default;
            e.currentTarget.style.backgroundColor = colors.bg.secondary;
          }
        }}
      >
        <Avatar src={avatar} alt={displayName} size="md" fallback={displayName[0]} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <span
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>
            {isVerified && <Badge variant="success" size="sm">✓</Badge>}
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>@{username}</div>
        </div>
        {onFollow && (
          <Button
            variant={isFollowing ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleFollow}
            leftIcon={isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        onClick={onClick}
        style={{
          padding: spacing[5],
          borderRadius: radii.lg,
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 150ms ease-out',
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.borderColor = colors.brand.primary;
            e.currentTarget.style.boxShadow = shadows.md;
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.borderColor = colors.border.default;
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        <div style={{ display: 'flex', gap: spacing[4], marginBottom: spacing[4] }}>
          <Avatar src={avatar} alt={displayName} size="xl" fallback={displayName[0]} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
              <h3
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {displayName}
              </h3>
              {isVerified && <Badge variant="success" size="md">✓</Badge>}
            </div>
            <div style={{ fontSize: typography.fontSize.base, color: colors.text.tertiary, marginBottom: spacing[2] }}>
              @{username}
            </div>
            {isFollowedBy && (
              <Badge variant="secondary" size="sm" style={{ marginBottom: spacing[2] }}>
                Follows you
              </Badge>
            )}
          </div>
        </div>

        {bio && (
          <p
            style={{
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing[4],
            }}
          >
            {bio}
          </p>
        )}

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] }}>
            {tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.tertiary,
                  padding: `${spacing[1]} ${spacing[3]}`,
                  borderRadius: radii.full,
                  backgroundColor: colors.bg.tertiary,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(followerCount !== undefined || followingCount !== undefined) && (
          <div style={{ display: 'flex', gap: spacing[4], marginBottom: spacing[4] }}>
            {followerCount !== undefined && (
              <div>
                <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                  {formatNumber(followerCount)}
                </span>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginLeft: spacing[1] }}>
                  Followers
                </span>
              </div>
            )}
            {followingCount !== undefined && (
              <div>
                <span style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                  {formatNumber(followingCount)}
                </span>
                <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginLeft: spacing[1] }}>
                  Following
                </span>
              </div>
            )}
          </div>
        )}

        {mutualFollowers !== undefined && mutualFollowers > 0 && (
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[4] }}>
            Followed by {formatNumber(mutualFollowers)} people you follow
          </div>
        )}

        <div style={{ display: 'flex', gap: spacing[2] }}>
          {onFollow && (
            <Button
              variant={isFollowing ? 'secondary' : 'primary'}
              size="md"
              onClick={handleFollow}
              style={{ flex: 1 }}
              leftIcon={isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
          {onMessage && (
            <Button variant="outline" size="md" onClick={handleMessage} leftIcon={<MessageCircle size={18} />}>
              Message
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      onClick={onClick}
      style={{
        padding: spacing[4],
        borderRadius: radii.lg,
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms ease-out',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = colors.brand.primary;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = shadows.sm;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = colors.border.default;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', gap: spacing[3], marginBottom: spacing[3] }}>
        <Avatar src={avatar} alt={displayName} size="lg" fallback={displayName[0]} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <h3
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </h3>
            {isVerified && <Badge variant="success" size="sm">✓</Badge>}
          </div>
          <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[2] }}>
            @{username}
          </div>
          {isFollowedBy && (
            <Badge variant="secondary" size="sm">
              Follows you
            </Badge>
          )}
        </div>
      </div>

      {bio && (
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            lineHeight: typography.lineHeight.relaxed,
            marginBottom: spacing[3],
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {bio}
        </p>
      )}

      {(followerCount !== undefined || followingCount !== undefined) && (
        <div style={{ display: 'flex', gap: spacing[4], marginBottom: spacing[3] }}>
          {followerCount !== undefined && (
            <div>
              <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                {formatNumber(followerCount)}
              </span>
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginLeft: spacing[1] }}>
                Followers
              </span>
            </div>
          )}
          {followingCount !== undefined && (
            <div>
              <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                {formatNumber(followingCount)}
              </span>
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginLeft: spacing[1] }}>
                Following
              </span>
            </div>
          )}
        </div>
      )}

      {mutualFollowers !== undefined && mutualFollowers > 0 && (
        <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[3] }}>
          Followed by {formatNumber(mutualFollowers)} people you follow
        </div>
      )}

      {onFollow && (
        <Button
          variant={isFollowing ? 'secondary' : 'primary'}
          size="sm"
          onClick={handleFollow}
          style={{ width: '100%' }}
          leftIcon={isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      )}
    </div>
  );
};
