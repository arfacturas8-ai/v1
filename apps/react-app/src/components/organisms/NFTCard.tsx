/**
 * CRYB Design System - NFTCard Organism
 * NFT display with image, collection, name, price, owner, and buy/bid button
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

const HeartIcon: React.FC<{ filled?: boolean; size?: number }> = ({ filled = false, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path
      d="M9 15.75L7.9425 14.7937C4.59 11.7937 2.25 9.67125 2.25 7.125C2.25 4.99875 3.9375 3.3 6.0525 3.3C7.245 3.3 8.39 3.8325 9 4.71C9.61 3.8325 10.755 3.3 11.9475 3.3C14.0625 3.3 15.75 4.99875 15.75 7.125C15.75 9.67125 13.41 11.7937 10.0575 14.8012L9 15.75Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
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

const ClockIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 4V8L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export interface NFTOwner {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
}

export interface NFTCollection {
  id: string;
  name: string;
  verified?: boolean;
  logo?: string;
}

export interface NFTPrice {
  amount: number;
  currency: 'ETH' | 'MATIC' | 'SOL' | 'USD';
  usdValue?: number;
}

export interface NFTCardProps {
  id: string;
  name: string;
  image: string;
  collection: NFTCollection;
  owner: NFTOwner;
  price?: NFTPrice;
  lastSalePrice?: NFTPrice;
  likes?: number;
  isLiked?: boolean;
  isAuction?: boolean;
  auctionEndsAt?: Date;
  tokenId?: string;
  loading?: boolean;
  error?: string;
  onLike?: () => void;
  onBuy?: () => void;
  onBid?: () => void;
  onClick?: () => void;
  showOwner?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const NFTCard: React.FC<NFTCardProps> = ({
  id,
  name,
  image,
  collection,
  owner,
  price,
  lastSalePrice,
  likes = 0,
  isLiked = false,
  isAuction = false,
  auctionEndsAt,
  tokenId,
  loading = false,
  error,
  onLike,
  onBuy,
  onBid,
  onClick,
  showOwner = true,
  size = 'md',
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike?.();
  };

  const getCurrencyIcon = (currency: string) => {
    if (currency === 'ETH') return <EthereumIcon />;
    return <span style={{ fontSize: typography.fontSize.sm }}>{currency}</span>;
  };

  const cardPadding = {
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[5],
  }[size];

  const imageHeight = {
    sm: '200px',
    md: '280px',
    lg: '360px',
  }[size];

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
          padding: cardPadding,
          color: colors.semantic.error,
          textAlign: 'center',
        }}
      >
        {getErrorMessage(error, "An error occurred")}
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
      {/* NFT Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: imageHeight,
          backgroundColor: colors.bg.tertiary,
          overflow: 'hidden',
        }}
      >
        {!imageError ? (
          <>
            {!imageLoaded && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.text.tertiary,
                }}
              >
              </div>
            )}
            <img
              src={image}
              alt={name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: `opacity ${animation.duration.normal} ${animation.easing.easeOut}`,
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.text.tertiary,
              fontSize: typography.fontSize.sm,
            }}
          >
            Failed to load image
          </div>
        )}

        {/* Like Button Overlay */}
        <button
          onClick={handleLike}
          style={{
            position: 'absolute',
            top: spacing[3],
            right: spacing[3],
            background: 'var(--bg-tertiary)',
            backdropFilter: 'blur(8px)',
            border: 'none',
            borderRadius: radii.full,
            padding: spacing[2],
            color: liked ? colors.semantic.error : colors.text.primary,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
          }}
          aria-label={`${liked ? 'Unlike' : 'Like'} NFT`}
          aria-pressed={liked}
        >
          <HeartIcon filled={liked} size={16} />
          {likeCount > 0 && <span>{formatNumber(likeCount)}</span>}
        </button>

        {/* Auction Timer Overlay */}
        {isAuction && auctionEndsAt && (
          <div
            style={{
              position: 'absolute',
              bottom: spacing[3],
              left: spacing[3],
              background: 'var(--bg-tertiary)',
              backdropFilter: 'blur(8px)',
              borderRadius: radii.md,
              padding: `${spacing[2]} ${spacing[3]}`,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              fontSize: typography.fontSize.sm,
              color: colors.text.primary,
            }}
          >
            <ClockIcon size={14} />
            <span>Auction ends soon</span>
          </div>
        )}
      </div>

      {/* NFT Info */}
      <div style={{ padding: cardPadding }}>
        {/* Collection */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            marginBottom: spacing[2],
          }}
        >
          {collection.logo && (
            <img
              src={collection.logo}
              alt={collection.name}
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
              color: colors.text.secondary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
            }}
          >
            {collection.name}
          </span>
          {collection.verified && <VerifiedIcon size={14} />}
        </div>

        {/* NFT Name */}
        <h3
          style={{
            color: colors.text.primary,
            fontSize: size === 'lg' ? typography.fontSize.xl : typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[1],
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </h3>

        {/* Token ID */}
        {tokenId && (
          <div
            style={{
              color: colors.text.tertiary,
              fontSize: typography.fontSize.xs,
              marginBottom: spacing[3],
            }}
          >
            #{tokenId}
          </div>
        )}

        {/* Owner */}
        {showOwner && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              marginBottom: spacing[4],
              paddingBottom: spacing[3],
              borderBottom: `1px solid ${colors.border.subtle}`,
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: radii.full,
                overflow: 'hidden',
                backgroundColor: colors.bg.tertiary,
                flexShrink: 0,
              }}
            >
              {owner.avatar ? (
                <img
                  src={owner.avatar}
                  alt={owner.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
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
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  {owner.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                  marginBottom: spacing[1],
                }}
              >
                Owned by
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <span
                  style={{
                    color: colors.text.primary,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {owner.name}
                </span>
                {owner.verified && <VerifiedIcon size={12} />}
              </div>
            </div>
          </div>
        )}

        {/* Price & Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            {price && (
              <>
                <div
                  style={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                    marginBottom: spacing[1],
                  }}
                >
                  {isAuction ? 'Current bid' : 'Price'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[2],
                  }}
                >
                  <div
                    style={{
                      color: colors.text.primary,
                      fontSize: size === 'lg' ? typography.fontSize.xl : typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing[1],
                    }}
                  >
                    {getCurrencyIcon(price.currency)}
                    <span>{price.amount}</span>
                  </div>
                </div>
                {price.usdValue && (
                  <div
                    style={{
                      color: colors.text.tertiary,
                      fontSize: typography.fontSize.xs,
                      marginTop: spacing[1],
                    }}
                  >
                    ${formatNumber(price.usdValue)}
                  </div>
                )}
              </>
            )}
            {lastSalePrice && !price && (
              <>
                <div
                  style={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                    marginBottom: spacing[1],
                  }}
                >
                  Last sale
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    color: colors.text.secondary,
                    fontSize: typography.fontSize.sm,
                  }}
                >
                  {getCurrencyIcon(lastSalePrice.currency)}
                  <span>{lastSalePrice.amount}</span>
                </div>
              </>
            )}
          </div>

          {/* Action Button */}
          {(onBuy || onBid) && (
            <Button
              variant={isAuction ? 'outline' : 'primary'}
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={(e) => {
                e?.stopPropagation();
                if (isAuction) {
                  onBid?.();
                } else {
                  onBuy?.();
                }
              }}
            >
              {isAuction ? 'Place Bid' : 'Buy Now'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
};

export default NFTCard;
