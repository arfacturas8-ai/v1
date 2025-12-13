import React from 'react';
import { Heart, ShoppingCart, Eye, TrendingUp } from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';

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
        className="card card-compact card-interactive"
        style={{
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
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
        <div style={{ padding: 'var(--space-3)' }}>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-tertiary)',
              marginBottom: 'var(--space-1)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {collectionName}
          </p>
          <p
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
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
                fontSize: 'var(--text-sm)',
                color: 'var(--brand-primary)',
                fontWeight: 'var(--font-medium)',
                marginTop: 'var(--space-2)',
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
        className="card card-elevated card-interactive"
        style={{
          overflow: 'hidden',
          border: '2px solid var(--brand-primary)',
          cursor: onClick ? 'pointer' : 'default',
          boxShadow: 'var(--shadow-lg)',
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
              top: 'var(--space-3)',
              right: 'var(--space-3)',
              display: 'flex',
              gap: 'var(--space-2)',
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
              padding: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <Eye size={16} color="white" />
            <span style={{ color: 'white', fontSize: 'var(--text-sm)' }}>{views.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ padding: 'var(--space-5)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              {collectionName}
            </p>
            <h3
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-3)',
              }}
            >
              {name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Avatar src={creatorAvatar} alt={creatorName} size="sm" fallback={creatorName[0]} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{creatorName}</span>
              {creatorVerified && <Badge variant="success" size="sm">✓</Badge>}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
                Current Price
              </p>
              <p style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                {price?.amount} {price?.currency}
              </p>
            </div>
            {lastSale && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
                  Last Sale
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                  {lastSale.amount} {lastSale.currency}
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
      className="card card-interactive"
      style={{
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
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
          className="btn-ghost"
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            right: 'var(--space-3)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: 0,
          }}
        >
          <Heart size={18} color="white" fill={isLiked ? 'white' : 'none'} />
        </button>
        <div
          style={{
            position: 'absolute',
            bottom: 'var(--space-3)',
            left: 'var(--space-3)',
            right: 'var(--space-3)',
            display: 'flex',
            gap: 'var(--space-3)',
            fontSize: 'var(--text-sm)',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Eye size={14} />
            <span>{views}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Heart size={14} />
            <span>{likes}</span>
          </div>
        </div>
      </div>
      <div style={{ padding: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
          {collectionName}
        </p>
        <h3
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <Avatar src={creatorAvatar} alt={creatorName} size="xs" fallback={creatorName[0]} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{creatorName}</span>
          {creatorVerified && <Badge variant="success" size="sm">✓</Badge>}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 'var(--space-3)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              Price
            </p>
            {price ? (
              <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                {price.amount} {price.currency}
              </p>
            ) : (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>Not for sale</p>
            )}
          </div>
          {lastSale && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <TrendingUp size={14} color="var(--color-success)" />
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                Last: {lastSale.amount} {lastSale.currency}
              </span>
            </div>
          )}
        </div>

        {price && onBuy && (
          <Button onClick={handleBuy} size="sm" style={{ width: '100%', marginTop: 'var(--space-3)' }} leftIcon={<ShoppingCart size={16} />}>
            Buy Now
          </Button>
        )}
      </div>
    </div>
  );
};
