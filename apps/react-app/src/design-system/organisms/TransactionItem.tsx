import React from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Repeat,
  ShoppingCart,
  Image as ImageIcon,
  Users,
  Zap,
  ExternalLink,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { Badge } from '../atoms/Badge';
import { colors, spacing, typography, radii } from '../tokens';

type TransactionType =
  | 'send'
  | 'receive'
  | 'swap'
  | 'mint'
  | 'sale'
  | 'purchase'
  | 'stake'
  | 'unstake'
  | 'claim'
  | 'approve'
  | 'contract';

type TransactionStatus = 'pending' | 'confirmed' | 'failed';

interface TransactionItemProps {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  from?: string;
  to?: string;
  tokens?: {
    symbol: string;
    amount: number;
    usdValue?: number;
  }[];
  nft?: {
    name: string;
    image?: string;
  };
  timestamp: Date;
  txHash: string;
  network: string;
  gasUsed?: number;
  onViewExplorer?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'compact';
}

const transactionConfig: Record<
  TransactionType,
  {
    icon: React.ReactNode;
    color: string;
    getTitle: (tokens?: TransactionItemProps['tokens'], nft?: TransactionItemProps['nft']) => string;
  }
> = {
  send: {
    icon: <ArrowUpRight size={20} />,
    color: colors.semantic.error,
    getTitle: (tokens) => `Sent ${tokens?.[0]?.amount} ${tokens?.[0]?.symbol || ''}`,
  },
  receive: {
    icon: <ArrowDownLeft size={20} />,
    color: colors.semantic.success,
    getTitle: (tokens) => `Received ${tokens?.[0]?.amount} ${tokens?.[0]?.symbol || ''}`,
  },
  swap: {
    icon: <Repeat size={20} />,
    color: colors.brand.primary,
    getTitle: (tokens) => {
      if (!tokens || tokens.length < 2) return 'Swap';
      return `Swapped ${tokens[0].amount} ${tokens[0].symbol} → ${tokens[1].amount} ${tokens[1].symbol}`;
    },
  },
  mint: {
    icon: <ImageIcon size={20} />,
    color: colors.brand.primary,
    getTitle: (tokens, nft) => `Minted ${nft?.name || 'NFT'}`,
  },
  sale: {
    icon: <ShoppingCart size={20} />,
    color: colors.semantic.success,
    getTitle: (tokens, nft) => `Sold ${nft?.name || 'NFT'}`,
  },
  purchase: {
    icon: <ShoppingCart size={20} />,
    color: colors.brand.primary,
    getTitle: (tokens, nft) => `Purchased ${nft?.name || 'NFT'}`,
  },
  stake: {
    icon: <Zap size={20} />,
    color: colors.brand.primary,
    getTitle: (tokens) => `Staked ${tokens?.[0]?.amount} ${tokens?.[0]?.symbol || ''}`,
  },
  unstake: {
    icon: <Zap size={20} />,
    color: colors.semantic.warning,
    getTitle: (tokens) => `Unstaked ${tokens?.[0]?.amount} ${tokens?.[0]?.symbol || ''}`,
  },
  claim: {
    icon: <Zap size={20} />,
    color: colors.semantic.success,
    getTitle: (tokens) => `Claimed ${tokens?.[0]?.amount} ${tokens?.[0]?.symbol || ''}`,
  },
  approve: {
    icon: <Check size={20} />,
    color: colors.text.secondary,
    getTitle: (tokens) => `Approved ${tokens?.[0]?.symbol || 'Token'}`,
  },
  contract: {
    icon: <Users size={20} />,
    color: colors.text.secondary,
    getTitle: () => 'Contract Interaction',
  },
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  id,
  type,
  status,
  from,
  to,
  tokens,
  nft,
  timestamp,
  txHash,
  network,
  gasUsed,
  onViewExplorer,
  onClick,
  variant = 'default',
}) => {
  const config = transactionConfig[type];

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateAddress = (addr: string): string => {
    if (addr.length <= 13) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const renderStatusBadge = () => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="warning" size="sm">
            <Clock size={10} style={{ marginRight: spacing[1] }} />
            Pending
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="success" size="sm">
            <Check size={10} style={{ marginRight: spacing[1] }} />
            Confirmed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="danger" size="sm">
            <X size={10} style={{ marginRight: spacing[1] }} />
            Failed
          </Badge>
        );
    }
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
        {/* Icon */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: radii.full,
            backgroundColor: config.color + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {React.cloneElement(config.icon as React.ReactElement, { color: config.color, size: 20 })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing[1],
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {config.getTitle(tokens, nft)}
          </div>
          <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>{formatTime(timestamp)}</div>
        </div>

        {/* Status */}
        {renderStatusBadge()}
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
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = colors.border.default;
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ display: 'flex', gap: spacing[4] }}>
        {/* Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: radii.full,
            backgroundColor: config.color + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {React.cloneElement(config.icon as React.ReactElement, { color: config.color, size: 24 })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title and status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2], flexWrap: 'wrap' }}>
            <h4
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
              }}
            >
              {config.getTitle(tokens, nft)}
            </h4>
            {renderStatusBadge()}
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1], marginBottom: spacing[3] }}>
            {from && (
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                From: <span style={{ fontFamily: typography.fontFamily.mono, color: colors.text.tertiary }}>{truncateAddress(from)}</span>
              </div>
            )}
            {to && (
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                To: <span style={{ fontFamily: typography.fontFamily.mono, color: colors.text.tertiary }}>{truncateAddress(to)}</span>
              </div>
            )}
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              Network: <span style={{ color: colors.text.tertiary }}>{network}</span>
            </div>
          </div>

          {/* Token values */}
          {tokens && tokens.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing[2],
                padding: spacing[3],
                borderRadius: radii.md,
                backgroundColor: colors.bg.tertiary,
                marginBottom: spacing[3],
              }}
            >
              {tokens.map((token, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
                    {token.amount} {token.symbol}
                  </div>
                  {token.usdValue !== undefined && (
                    <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      ${token.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* NFT preview */}
          {nft && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: spacing[3],
                borderRadius: radii.md,
                backgroundColor: colors.bg.tertiary,
                marginBottom: spacing[3],
              }}
            >
              {nft.image ? (
                <img
                  src={nft.image}
                  alt={nft.name}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: radii.md,
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: radii.md,
                    backgroundColor: colors.bg.secondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ImageIcon size={24} color={colors.text.tertiary} />
                </div>
              )}
              <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
                {nft.name}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing[2] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>{formatTime(timestamp)}</div>
              {gasUsed && (
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>Gas: {gasUsed.toFixed(6)}</div>
              )}
            </div>

            {onViewExplorer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewExplorer();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1],
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: radii.sm,
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border.default}`,
                  color: colors.text.secondary,
                  fontSize: typography.fontSize.sm,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                  e.currentTarget.style.color = colors.brand.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = colors.border.default;
                  e.currentTarget.style.color = colors.text.secondary;
                }}
              >
                <ExternalLink size={14} />
                View on Explorer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
