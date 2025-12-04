import React from 'react';
import { Users, TrendingUp, Lock } from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { colors, spacing, typography, radii, shadows } from '../tokens';

interface CommunityCardProps {
  id: string;
  bannerUrl?: string;
  avatarUrl?: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate?: boolean;
  isVerified?: boolean;
  isJoined?: boolean;
  isTrending?: boolean;
  tags?: string[];
  onJoin?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  id,
  bannerUrl,
  avatarUrl,
  name,
  description,
  memberCount,
  isPrivate = false,
  isVerified = false,
  isJoined = false,
  isTrending = false,
  tags = [],
  onJoin,
  onClick,
  variant = 'default',
}) => {
  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.();
  };

  const formatMemberCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
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
          borderRadius: radii.lg,
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
        <Avatar src={avatarUrl} alt={name} size="md" fallback={name[0]} />
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
              {name}
            </span>
            {isVerified && <Badge variant="success" size="sm">✓</Badge>}
            {isPrivate && <Lock size={14} color={colors.text.tertiary} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Users size={12} color={colors.text.tertiary} />
              <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                {formatMemberCount(memberCount)} members
              </span>
            </div>
            {isTrending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <TrendingUp size={12} color={colors.semantic.success} />
                <span style={{ fontSize: typography.fontSize.xs, color: colors.semantic.success }}>Trending</span>
              </div>
            )}
          </div>
        </div>
        {onJoin && (
          <Button variant={isJoined ? 'secondary' : 'primary'} size="sm" onClick={handleJoin}>
            {isJoined ? 'Joined' : 'Join'}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={onClick}
        style={{
          borderRadius: radii.xl,
          overflow: 'hidden',
          backgroundColor: colors.bg.secondary,
          border: `2px solid ${colors.brand.primary}`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all 150ms ease-out',
          boxShadow: shadows.lg,
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = shadows.xl;
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = shadows.lg;
          }
        }}
      >
        {/* Banner */}
        <div style={{ height: '120px', position: 'relative', overflow: 'hidden' }}>
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={`${name} banner`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary || colors.brand.primary})`,
              }}
            />
          )}
          {isTrending && (
            <div style={{ position: 'absolute', top: spacing[3], right: spacing[3] }}>
              <Badge variant="primary" size="md">
                🔥 Trending
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: spacing[5], position: 'relative' }}>
          {/* Avatar overlapping banner */}
          <div
            style={{
              marginTop: '-40px',
              marginBottom: spacing[3],
            }}
          >
            <Avatar
              src={avatarUrl}
              alt={name}
              size="xl"
              fallback={name[0]}
              style={{
                border: `4px solid ${colors.bg.secondary}`,
              }}
            />
          </div>

          <div style={{ marginBottom: spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
              <h3
                style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                }}
              >
                {name}
              </h3>
              {isVerified && <Badge variant="success" size="md">✓</Badge>}
              {isPrivate && <Lock size={18} color={colors.text.tertiary} />}
            </div>

            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.secondary,
                lineHeight: typography.lineHeight.relaxed,
                marginBottom: spacing[3],
              }}
            >
              {description}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
              <Users size={16} color={colors.text.tertiary} />
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                {formatMemberCount(memberCount)} members
              </span>
            </div>

            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] }}>
                {tags.slice(0, 4).map((tag, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.tertiary,
                      padding: `${spacing[1]} ${spacing[2]}`,
                      borderRadius: radii.sm,
                      backgroundColor: colors.bg.tertiary,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {onJoin && (
            <Button
              variant={isJoined ? 'secondary' : 'primary'}
              size="lg"
              onClick={handleJoin}
              style={{ width: '100%' }}
              leftIcon={isJoined ? undefined : <Users size={18} />}
            >
              {isJoined ? 'Joined' : 'Join Community'}
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
        borderRadius: radii.lg,
        overflow: 'hidden',
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms ease-out',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = colors.brand.primary;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = shadows.md;
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
      {/* Banner */}
      {bannerUrl ? (
        <div style={{ height: '100px', overflow: 'hidden' }}>
          <img
            src={bannerUrl}
            alt={`${name} banner`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            height: '100px',
            background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary || colors.brand.primary})`,
          }}
        />
      )}

      {/* Content */}
      <div style={{ padding: spacing[4] }}>
        {/* Avatar overlapping banner */}
        <div
          style={{
            marginTop: '-32px',
            marginBottom: spacing[3],
          }}
        >
          <Avatar
            src={avatarUrl}
            alt={name}
            size="lg"
            fallback={name[0]}
            style={{
              border: `3px solid ${colors.bg.secondary}`,
            }}
          />
        </div>

        <div style={{ marginBottom: spacing[3] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <h3
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              {name}
            </h3>
            {isVerified && <Badge variant="success" size="sm">✓</Badge>}
            {isPrivate && <Lock size={14} color={colors.text.tertiary} />}
          </div>

          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing[2],
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <Users size={14} color={colors.text.tertiary} />
              <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                {formatMemberCount(memberCount)} members
              </span>
            </div>
            {isTrending && (
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <TrendingUp size={14} color={colors.semantic.success} />
                <span style={{ fontSize: typography.fontSize.xs, color: colors.semantic.success }}>Trending</span>
              </div>
            )}
          </div>
        </div>

        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[3] }}>
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.tertiary,
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: radii.sm,
                  backgroundColor: colors.bg.tertiary,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {onJoin && (
          <Button
            variant={isJoined ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleJoin}
            style={{ width: '100%' }}
            leftIcon={isJoined ? undefined : <Users size={16} />}
          >
            {isJoined ? 'Joined' : 'Join'}
          </Button>
        )}
      </div>
    </div>
  );
};
