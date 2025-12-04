import React from 'react';
import { TrendingUp, Image as ImageIcon } from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { colors, spacing, typography, radii, shadows } from '../tokens';

interface CollectionCardProps {
  id: string;
  coverUrl?: string;
  avatarUrl?: string;
  name: string;
  creatorName: string;
  creatorAvatar?: string;
  creatorVerified?: boolean;
  itemCount: number;
  floorPrice?: {
    amount: number;
    currency: string;
  };
  volume?: {
    amount: number;
    currency: string;
  };
  change24h?: number;
  isTrending?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  id,
  coverUrl,
  avatarUrl,
  name,
  creatorName,
  creatorAvatar,
  creatorVerified = false,
  itemCount,
  floorPrice,
  volume,
  change24h,
  isTrending = false,
  onClick,
  variant = 'default',
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
            {creatorVerified && <Badge variant="success" size="sm">✓</Badge>}
          </div>
          <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
            {itemCount} items
            {floorPrice && ` • Floor: ${floorPrice.amount} ${floorPrice.currency}`}
          </div>
        </div>
        {isTrending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <TrendingUp size={14} color={colors.semantic.success} />
          </div>
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
        {/* Cover Image */}
        <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={name}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon size={64} color={colors.text.tertiary} />
            </div>
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
          {/* Avatar overlapping cover */}
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

          <div style={{ marginBottom: spacing[4] }}>
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              {name}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
              <Avatar src={creatorAvatar} alt={creatorName} size="xs" fallback={creatorName[0]} />
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>by {creatorName}</span>
              {creatorVerified && <Badge variant="success" size="sm">✓</Badge>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
              <ImageIcon size={14} color={colors.text.tertiary} />
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>{formatNumber(itemCount)} items</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: change24h !== undefined ? '1fr 1fr 1fr' : '1fr 1fr',
              gap: spacing[3],
              padding: spacing[4],
              borderRadius: radii.md,
              backgroundColor: colors.bg.tertiary,
            }}
          >
            {floorPrice && (
              <div>
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                  Floor
                </div>
                <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                  {floorPrice.amount} {floorPrice.currency}
                </div>
              </div>
            )}
            {volume && (
              <div>
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                  Volume
                </div>
                <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                  {formatNumber(volume.amount)} {volume.currency}
                </div>
              </div>
            )}
            {change24h !== undefined && (
              <div>
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                  24h
                </div>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.bold,
                    color: change24h >= 0 ? colors.semantic.success : colors.semantic.error,
                  }}
                >
                  {change24h >= 0 ? '+' : ''}
                  {change24h.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
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
      {/* Cover Image */}
      <div style={{ height: '140px', overflow: 'hidden', position: 'relative' }}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageIcon size={48} color={colors.text.tertiary} />
          </div>
        )}
        {isTrending && (
          <div style={{ position: 'absolute', top: spacing[2], right: spacing[2] }}>
            <TrendingUp size={16} color={colors.semantic.success} />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: spacing[4] }}>
        {/* Avatar overlapping cover */}
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
          <h3
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[2],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
            <Avatar src={creatorAvatar} alt={creatorName} size="xs" fallback={creatorName[0]} />
            <span style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>by {creatorName}</span>
            {creatorVerified && <Badge variant="success" size="sm">✓</Badge>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <ImageIcon size={12} color={colors.text.tertiary} />
            <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>{formatNumber(itemCount)} items</span>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacing[3],
            paddingTop: spacing[3],
            borderTop: `1px solid ${colors.border.default}`,
          }}
        >
          {floorPrice && (
            <div>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                Floor
              </div>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                {floorPrice.amount} {floorPrice.currency}
              </div>
            </div>
          )}
          {volume && (
            <div>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                Volume
              </div>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
                {formatNumber(volume.amount)} {volume.currency}
              </div>
            </div>
          )}
        </div>

        {change24h !== undefined && (
          <div
            style={{
              marginTop: spacing[3],
              padding: spacing[2],
              borderRadius: radii.sm,
              backgroundColor: change24h >= 0 ? `${colors.semantic.success}20` : `${colors.semantic.error}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[1],
            }}
          >
            <TrendingUp
              size={14}
              color={change24h >= 0 ? colors.semantic.success : colors.semantic.error}
              style={{ transform: change24h < 0 ? 'rotate(180deg)' : undefined }}
            />
            <span
              style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: change24h >= 0 ? colors.semantic.success : colors.semantic.error,
              }}
            >
              {change24h >= 0 ? '+' : ''}
              {change24h.toFixed(1)}% (24h)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
