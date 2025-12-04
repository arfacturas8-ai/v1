import React from 'react';
import { Heart, ShoppingCart, Eye, TrendingUp } from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { colors, spacing, typography, radii, shadows } from '../tokens';

interface NFTCardProps {
  id: string;
  imageUrl: string;
  name: string;
  collectionName: string;
  creatorAvatar?: string;
  creatorName: string;
  creatorVerified?: boolean;
  price?: {
    amount: number;
    currency: string;
  };
  lastSale?: {
    amount: number;
    currency: string;
  };
  likes?: number;
  views?: number;
  isLiked?: boolean;
  onLike?: () => void;
  onBuy?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

export const NFTCard: React.FC<NFTCardProps> = ({
  id,
  imageUrl,
  name,
  collectionName,
  creatorAvatar,
  creatorName,
  creatorVerified = false,
  price,
  lastSale,
  likes = 0,
  views = 0,
  isLiked = false,
  onLike,
  onBuy,
  onClick,
  variant = 'default',
}) => {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBuy?.();
  };

  if (variant === 'compact') {
    return (
      <div
        onClick={onClick}
        style={{
          borderRadius: radii.md,
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
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.borderColor = colors.border.default;
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
          <img
            src={imageUrl}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
        <div style={{ padding: spacing[3] }}>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.tertiary,
              marginBottom: spacing[1],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {collectionName}
          </p>
          <p
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
          </p>
          {price && (
            <p
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.brand.primary,
                fontWeight: typography.fontWeight.medium,
                marginTop: spacing[2],
              }}
            >
              {price.amount} {price.currency}
            </p>
          )}
        </div>
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
        <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
          <img
            src={imageUrl}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: spacing[3],
              right: spacing[3],
              display: 'flex',
              gap: spacing[2],
            }}
          >
            <Badge variant="primary" size="md">
              Featured
            </Badge>
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              padding: spacing[4],
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            <Eye size={16} color="white" />
            <span style={{ color: 'white', fontSize: typography.fontSize.sm }}>{views.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ padding: spacing[5] }}>
          <div style={{ marginBottom: spacing[4] }}>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[1] }}>
              {collectionName}
            </p>
            <h3
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[3],
              }}
            >
              {name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <Avatar src={creatorAvatar} alt={creatorName} size="sm" fallback={creatorName[0]} />
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>{creatorName}</span>
              {creatorVerified && <Badge variant="success" size="sm">✓</Badge>}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing[3],
              borderRadius: radii.md,
              backgroundColor: colors.bg.tertiary,
              marginBottom: spacing[4],
            }}
          >
            <div>
              <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                Current Price
              </p>
              <p style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                {price?.amount} {price?.currency}
              </p>
            </div>
            {lastSale && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                  Last Sale
                </p>
                <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  {lastSale.amount} {lastSale.currency}
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: spacing[2] }}>
            <Button onClick={handleBuy} size="lg" style={{ flex: 1 }} leftIcon={<ShoppingCart size={18} />}>
              Buy Now
            </Button>
            <Button
              variant={isLiked ? 'primary' : 'outline'}
              onClick={handleLike}
              size="lg"
              leftIcon={<Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />}
            >
              {likes > 0 ? likes : ''}
            </Button>
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
      <div style={{ aspectRatio: '1', overflow: 'hidden', position: 'relative' }}>
        <img
          src={imageUrl}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <button
          onClick={handleLike}
          style={{
            position: 'absolute',
            top: spacing[3],
            right: spacing[3],
            width: '36px',
            height: '36px',
            borderRadius: radii.full,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <Heart size={18} color="white" fill={isLiked ? 'white' : 'none'} />
        </button>
        <div
          style={{
            position: 'absolute',
            bottom: spacing[3],
            left: spacing[3],
            right: spacing[3],
            display: 'flex',
            gap: spacing[3],
            fontSize: typography.fontSize.sm,
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <Eye size={14} />
            <span>{views}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
            <Heart size={14} />
            <span>{likes}</span>
          </div>
        </div>
      </div>
      <div style={{ padding: spacing[4] }}>
        <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
          {collectionName}
        </p>
        <h3
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: spacing[3],
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] }}>
          <Avatar src={creatorAvatar} alt={creatorName} size="xs" fallback={creatorName[0]} />
          <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>{creatorName}</span>
          {creatorVerified && <Badge variant="success" size="sm">✓</Badge>}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: spacing[3],
            borderTop: `1px solid ${colors.border.default}`,
          }}
        >
          <div>
            <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
              Price
            </p>
            {price ? (
              <p style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.text.primary }}>
                {price.amount} {price.currency}
              </p>
            ) : (
              <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>Not for sale</p>
            )}
          </div>
          {lastSale && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
              <TrendingUp size={14} color={colors.semantic.success} />
              <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                Last: {lastSale.amount} {lastSale.currency}
              </span>
            </div>
          )}
        </div>

        {price && onBuy && (
          <Button onClick={handleBuy} size="sm" style={{ width: '100%', marginTop: spacing[3] }} leftIcon={<ShoppingCart size={16} />}>
            Buy Now
          </Button>
        )}
      </div>
    </div>
  );
};
