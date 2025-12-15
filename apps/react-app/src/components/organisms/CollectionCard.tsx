/**
 * CRYB Design System - CollectionCard Organism
 * NFT collection with cover, name, floor price, and item count
 */

import React, { useState } from 'react';
import { colors, spacing, typography, radii, animation, shadows } from '../../design-system/tokens';
import { formatNumber } from '../../lib/utils';
import Button from '../atoms/Button';
import { getErrorMessage } from '../../utils/errorUtils'

// Icons
const EthereumIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M8 0.5L7.85 0.98V10.81L8 10.96L12.5 8.24L8 0.5Z"
      fill="currentColor"
      opacity="0.6"
    />
    <path d="M8 0.5L3.5 8.24L8 10.96V0.5Z" fill="currentColor" />
    <path
      d="M8 11.89L7.91 11.99V15.17L8 15.41L12.5 9.18L8 11.89Z"
      fill="currentColor"
      opacity="0.6"
    />
    <path d="M8 15.41V11.89L3.5 9.18L8 15.41Z" fill="currentColor" />
    <path d="M8 10.96L12.5 8.24L8 6.08V10.96Z" fill="currentColor" opacity="0.2" />
    <path d="M3.5 8.24L8 10.96V6.08L3.5 8.24Z" fill="currentColor" opacity="0.6" />
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

const TrendingUpIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M14 5.33333L8.66667 10.6667L5.33333 7.33333L2 10.6667M14 5.33333H10M14 5.33333V9.33333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrendingDownIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M14 10.6667L8.66667 5.33333L5.33333 8.66667L2 5.33333M14 10.6667H10M14 10.6667V6.66667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface CollectionStats {
  itemCount: number;
  owners: number;
  floorPrice: number;
  volumeTraded: number;
  currency: 'ETH' | 'MATIC' | 'SOL';
}

export interface CollectionChange {
  floorPrice?: number;
  volume?: number;
  period?: '24h' | '7d' | '30d';
}

export interface CollectionPreviewItem {
  id: string;
  image: string;
  name: string;
}

export interface CollectionCardProps {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  verified?: boolean;
  stats: CollectionStats;
  change?: CollectionChange;
  previewItems?: CollectionPreviewItem[];
  creator?: {
    name: string;
    avatar?: string;
  };
  loading?: boolean;
  error?: string;
  onClick?: () => void;
  onView?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  showPreview?: boolean;
  showStats?: boolean;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  id,
  name,
  description,
  logo,
  coverImage,
  verified = false,
  stats,
  change,
  previewItems = [],
  creator,
  loading = false,
  error,
  onClick,
  onView,
  variant = 'default',
  showPreview = true,
  showStats = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const getCurrencyIcon = () => <EthereumIcon />;

  const formatChange = (value?: number) => {
    if (value === undefined) return null;
    const isPositive = value >= 0;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[1],
          color: isPositive ? colors.semantic.success : colors.semantic.error,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
        }}
      >
        {isPositive ? <TrendingUpIcon size={14} /> : <TrendingDownIcon size={14} />}
        <span>{isPositive ? '+' : ''}{value.toFixed(2)}%</span>
      </div>
    );
  };

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
        {getErrorMessage(error, "An error occurred")}
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
      {/* Cover Image / Preview Grid */}
      {!isCompact && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: isDetailed ? '200px' : '160px',
            backgroundColor: colors.bg.tertiary,
            overflow: 'hidden',
          }}
        >
          {showPreview && previewItems.length >= 3 ? (
            // Preview Grid
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: spacing[1],
                height: '100%',
              }}
            >
              {previewItems.slice(0, 3).map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    backgroundColor: colors.bg.tertiary,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    loading="lazy"
                  />
                  {index === 2 && previewItems.length > 3 && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'var(--bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.text.primary,
                        fontSize: typography.fontSize.xl,
                        fontWeight: typography.fontWeight.bold,
                      }}
                    >
                      +{previewItems.length - 3}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : coverImage && !coverError ? (
            // Single Cover Image
            <img
              src={coverImage}
              alt={`${name} collection cover`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={() => setCoverError(true)}
              loading="lazy"
            />
          ) : (
            // Gradient Fallback
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
      <div style={{ padding: isCompact ? spacing[3] : spacing[4] }}>
        {/* Logo and Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: spacing[3],
          }}
        >
          {/* Logo */}
          {logo && (
            <div
              style={{
                width: isCompact ? '48px' : '64px',
                height: isCompact ? '48px' : '64px',
                borderRadius: radii.lg,
                overflow: 'hidden',
                backgroundColor: colors.bg.tertiary,
                border: `4px solid ${colors.bg.secondary}`,
                marginTop: !isCompact ? '-32px' : '0',
                flexShrink: 0,
              }}
            >
              {!logoError ? (
                <img
                  src={logo}
                  alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={() => setLogoError(true)}
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
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    background: colors.brand.gradient,
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* Change Badge */}
          {change?.floorPrice !== undefined && (
            <div style={{ marginTop: !isCompact && logo ? '-16px' : '0' }}>
              {formatChange(change.floorPrice)}
            </div>
          )}
        </div>

        {/* Collection Name */}
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
        </div>

        {/* Creator */}
        {creator && !isCompact && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginBottom: spacing[3],
            }}
          >
            {creator.avatar && (
              <img
                src={creator.avatar}
                alt={creator.name}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: radii.full,
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <span
              style={{
                color: colors.text.tertiary,
                fontSize: typography.fontSize.sm,
              }}
            >
              by {creator.name}
            </span>
          </div>
        )}

        {/* Description */}
        {description && isDetailed && (
          <p
            style={{
              color: colors.text.secondary,
              fontSize: typography.fontSize.sm,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing[3],
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </p>
        )}

        {/* Stats Grid */}
        {showStats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isCompact ? '1fr 1fr' : 'repeat(2, 1fr)',
              gap: spacing[3],
              padding: spacing[3],
              backgroundColor: colors.bg.tertiary,
              borderRadius: radii.md,
              marginBottom: spacing[3],
            }}
          >
            {/* Floor Price */}
            <div>
              <div
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                  marginBottom: spacing[1],
                }}
              >
                Floor Price
              </div>
              <div
                style={{
                  color: colors.text.primary,
                  fontSize: isCompact ? typography.fontSize.base : typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1],
                }}
              >
                {getCurrencyIcon()}
                <span>{stats.floorPrice}</span>
              </div>
            </div>

            {/* Volume */}
            <div>
              <div
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                  marginBottom: spacing[1],
                }}
              >
                Total Volume
              </div>
              <div
                style={{
                  color: colors.text.primary,
                  fontSize: isCompact ? typography.fontSize.base : typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1],
                }}
              >
                {getCurrencyIcon()}
                <span>{formatNumber(stats.volumeTraded)}</span>
              </div>
            </div>

            {/* Items */}
            <div>
              <div
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                  marginBottom: spacing[1],
                }}
              >
                Items
              </div>
              <div
                style={{
                  color: colors.text.primary,
                  fontSize: isCompact ? typography.fontSize.base : typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {formatNumber(stats.itemCount)}
              </div>
            </div>

            {/* Owners */}
            <div>
              <div
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                  marginBottom: spacing[1],
                }}
              >
                Owners
              </div>
              <div
                style={{
                  color: colors.text.primary,
                  fontSize: isCompact ? typography.fontSize.base : typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {formatNumber(stats.owners)}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {onView && (
          <Button
            variant="primary"
            size={isCompact ? 'sm' : 'md'}
            fullWidth
            onClick={(e) => {
              e?.stopPropagation();
              onView();
            }}
          >
            View Collection
          </Button>
        )}
      </div>
    </article>
  );
};

export default CollectionCard;
