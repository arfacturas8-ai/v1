/**
 * CRYB Design System - TransactionItem Organism
 * Transaction with type icon, description, amount, status, and timestamp
 */

import React, { useState } from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';
import { formatRelativeTime, formatNumber } from '../../lib/utils';

// Icons
const SendIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M17.5 2.5L8.75 11.25M17.5 2.5L12.5 17.5L8.75 11.25M17.5 2.5L2.5 7.5L8.75 11.25"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ReceiveIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 17.5V2.5M10 17.5L15 12.5M10 17.5L5 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SwapIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M15.8333 5.83333L17.5 4.16667L15.8333 2.5M17.5 4.16667H10C8.61929 4.16667 7.5 5.28595 7.5 6.66667V8.33333M4.16667 14.1667L2.5 15.8333L4.16667 17.5M2.5 15.8333H10C11.3807 15.8333 12.5 14.714 12.5 13.3333V11.6667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BuyIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M7.5 17.5C8.42047 17.5 9.16667 16.7538 9.16667 15.8333C9.16667 14.9129 8.42047 14.1667 7.5 14.1667C6.57953 14.1667 5.83333 14.9129 5.83333 15.8333C5.83333 16.7538 6.57953 17.5 7.5 17.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.1667 17.5C15.0871 17.5 15.8333 16.7538 15.8333 15.8333C15.8333 14.9129 15.0871 14.1667 14.1667 14.1667C13.2462 14.1667 12.5 14.9129 12.5 15.8333C12.5 16.7538 13.2462 17.5 14.1667 17.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.83333 15.8333H4.16667C3.24619 15.8333 2.5 15.0871 2.5 14.1667V4.16667M2.5 4.16667L4.16667 2.5M2.5 4.16667L4.16667 5.83333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2.5 9.16667H15C15.9205 9.16667 16.6667 9.91286 16.6667 10.8333V14.1667C16.6667 15.0871 15.9205 15.8333 15 15.8333H14.1667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MintIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 6.66667V13.3333M6.66667 10H13.3333M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ApproveIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M16.6667 5.83333L7.5 15L3.33333 10.8333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ContractIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M12.5 2.5H5C4.07953 2.5 3.33333 3.24619 3.33333 4.16667V15.8333C3.33333 16.7538 4.07953 17.5 5 17.5H15C15.9205 17.5 16.6667 16.7538 16.6667 15.8333V7.5L12.5 2.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.5 2.5V7.5H16.6667M13.3333 10.8333H6.66667M13.3333 13.3333H6.66667M8.33333 8.33333H6.66667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExternalLinkIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333M10 2H14M14 2V6M14 2L6.66667 9.33333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export type TransactionType = 'send' | 'receive' | 'swap' | 'buy' | 'mint' | 'approve' | 'contract';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface TransactionAsset {
  symbol: string;
  amount: number;
  icon?: string;
  usdValue?: number;
}

export interface TransactionItemProps {
  id: string;
  type: TransactionType;
  description: string;
  fromAsset?: TransactionAsset;
  toAsset?: TransactionAsset;
  timestamp: Date;
  status: TransactionStatus;
  hash?: string;
  blockExplorerUrl?: string;
  fee?: number;
  feeCurrency?: string;
  from?: string;
  to?: string;
  loading?: boolean;
  error?: string;
  onClick?: () => void;
  onViewDetails?: () => void;
  variant?: 'default' | 'compact';
  showFee?: boolean;
  showHash?: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
  id,
  type,
  description,
  fromAsset,
  toAsset,
  timestamp,
  status,
  hash,
  blockExplorerUrl,
  fee,
  feeCurrency = 'ETH',
  from,
  to,
  loading = false,
  error,
  onClick,
  onViewDetails,
  variant = 'default',
  showFee = true,
  showHash = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getTypeIcon = () => {
    switch (type) {
      case 'send':
        return <SendIcon />;
      case 'receive':
        return <ReceiveIcon />;
      case 'swap':
        return <SwapIcon />;
      case 'buy':
        return <BuyIcon />;
      case 'mint':
        return <MintIcon />;
      case 'approve':
        return <ApproveIcon />;
      case 'contract':
        return <ContractIcon />;
      default:
        return <ContractIcon />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'send':
        return colors.semantic.warning;
      case 'receive':
        return colors.semantic.success;
      case 'swap':
        return colors.brand.primary;
      case 'buy':
        return colors.brand.secondary;
      case 'mint':
        return colors.semantic.info;
      case 'approve':
        return colors.semantic.success;
      case 'contract':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return colors.semantic.success;
      case 'pending':
        return colors.semantic.warning;
      case 'failed':
        return colors.semantic.error;
      case 'cancelled':
        return colors.text.tertiary;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const truncateHash = (hashStr: string) => {
    if (!hashStr) return '';
    return `${hashStr.slice(0, 6)}...${hashStr.slice(-4)}`;
  };

  const isCompact = variant === 'compact';

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.semantic.error}`,
          borderRadius: radii.lg,
          padding: spacing[3],
          color: colors.semantic.error,
          fontSize: typography.fontSize.sm,
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
        borderRadius: radii.lg,
        padding: isCompact ? spacing[3] : spacing[4],
        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
        cursor: onClick ? 'pointer' : 'default',
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
      <div style={{ display: 'flex', gap: spacing[3], alignItems: 'flex-start' }}>
        {/* Type Icon */}
        <div
          style={{
            width: isCompact ? '36px' : '44px',
            height: isCompact ? '36px' : '44px',
            borderRadius: radii.full,
            backgroundColor: `${getTypeColor()}20`,
            color: getTypeColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: spacing[1],
              gap: spacing[2],
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4
                style={{
                  color: colors.text.primary,
                  fontSize: isCompact ? typography.fontSize.sm : typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  marginBottom: spacing[1],
                }}
              >
                {description}
              </h4>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  flexWrap: 'wrap',
                }}
              >
                {/* Status Badge */}
                <span
                  style={{
                    color: getStatusColor(),
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    backgroundColor: `${getStatusColor()}20`,
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: radii.full,
                  }}
                >
                  {getStatusText()}
                </span>

                {/* Timestamp */}
                <span
                  style={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  {formatRelativeTime(timestamp)}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {fromAsset && (
                <div
                  style={{
                    color: type === 'receive' ? colors.semantic.success : colors.text.primary,
                    fontSize: isCompact ? typography.fontSize.base : typography.fontSize.lg,
                    fontWeight: typography.fontWeight.bold,
                    marginBottom: spacing[1],
                  }}
                >
                  {type === 'receive' ? '+' : '-'}
                  {fromAsset.amount} {fromAsset.symbol}
                </div>
              )}
              {fromAsset?.usdValue && (
                <div
                  style={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  ${formatNumber(fromAsset.usdValue)}
                </div>
              )}
              {type === 'swap' && toAsset && (
                <div
                  style={{
                    color: colors.semantic.success,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    marginTop: spacing[1],
                  }}
                >
                  +{toAsset.amount} {toAsset.symbol}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          {(from || to || showFee || showHash) && (
            <div
              style={{
                marginTop: spacing[2],
                paddingTop: spacing[2],
                borderTop: `1px solid ${colors.border.subtle}`,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: `${spacing[1]} ${spacing[3]}`,
                fontSize: typography.fontSize.xs,
              }}
            >
              {from && (
                <>
                  <span style={{ color: colors.text.tertiary }}>From:</span>
                  <code
                    style={{
                      color: colors.text.secondary,
                      fontFamily: typography.fontFamily.mono,
                    }}
                  >
                    {truncateHash(from)}
                  </code>
                </>
              )}
              {to && (
                <>
                  <span style={{ color: colors.text.tertiary }}>To:</span>
                  <code
                    style={{
                      color: colors.text.secondary,
                      fontFamily: typography.fontFamily.mono,
                    }}
                  >
                    {truncateHash(to)}
                  </code>
                </>
              )}
              {showFee && fee !== undefined && (
                <>
                  <span style={{ color: colors.text.tertiary }}>Fee:</span>
                  <span style={{ color: colors.text.secondary }}>
                    {fee} {feeCurrency}
                  </span>
                </>
              )}
              {showHash && hash && (
                <>
                  <span style={{ color: colors.text.tertiary }}>Hash:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <code
                      style={{
                        color: colors.text.secondary,
                        fontFamily: typography.fontFamily.mono,
                      }}
                    >
                      {truncateHash(hash)}
                    </code>
                    {blockExplorerUrl && (
                      <a
                        href={blockExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          color: colors.brand.primary,
                          display: 'flex',
                          alignItems: 'center',
                          textDecoration: 'none',
                        }}
                        aria-label="View on block explorer"
                      >
                        <ExternalLinkIcon size={12} />
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* View Details Button */}
          {onViewDetails && isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              style={{
                marginTop: spacing[2],
                background: 'none',
                border: `1px solid ${colors.border.default}`,
                borderRadius: radii.md,
                padding: `${spacing[2]} ${spacing[3]}`,
                color: colors.text.primary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                width: '100%',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default TransactionItem;
