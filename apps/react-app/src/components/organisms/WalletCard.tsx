/**
 * CRYB Design System - WalletCard Organism
 * Wallet display with address (truncated), balance, and network indicator
 */

import React, { useState } from 'react';
import { colors, spacing, typography, radii, animation, shadows } from '../../design-system/tokens';
import { formatNumber, copyToClipboard } from '../../lib/utils';
import Button from '../atoms/Button';
import { getErrorMessage } from '../../utils/errorUtils'

// Icons
const WalletIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M17.5 8.33333H15.8333C14.45 8.33333 13.3333 9.45 13.3333 10.8333C13.3333 12.2167 14.45 13.3333 15.8333 13.3333H17.5V15C17.5 16.3833 16.3833 17.5 15 17.5H5C3.61667 17.5 2.5 16.3833 2.5 15V5C2.5 3.61667 3.61667 2.5 5 2.5H15C16.3833 2.5 17.5 3.61667 17.5 5V8.33333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.8333 11.6667H16.25M2.5 7.5H17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CopyIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M13.3333 6H7.33333C6.59695 6 6 6.59695 6 7.33333V13.3333C6 14.0697 6.59695 14.6667 7.33333 14.6667H13.3333C14.0697 14.6667 14.6667 14.0697 14.6667 13.3333V7.33333C14.6667 6.59695 14.0697 6 13.3333 6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.33333 10H2.66667C2.31304 10 1.97391 9.85952 1.72386 9.60947C1.47381 9.35942 1.33333 9.02029 1.33333 8.66667V2.66667C1.33333 2.31304 1.47381 1.97391 1.72386 1.72386C1.97391 1.47381 2.31304 1.33333 2.66667 1.33333H8.66667C9.02029 1.33333 9.35942 1.47381 9.60947 1.72386C9.85952 1.97391 10 2.31304 10 2.66667V3.33333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M13.3333 4L6 11.3333L2.66667 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DisconnectIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M10 6V4.66667C10 4.31304 9.85952 3.97391 9.60947 3.72386C9.35942 3.47381 9.02029 3.33333 8.66667 3.33333H3.33333C2.97971 3.33333 2.64057 3.47381 2.39052 3.72386C2.14048 3.97391 2 4.31304 2 4.66667V11.3333C2 11.687 2.14048 12.0261 2.39052 12.2761C2.64057 12.5262 2.97971 12.6667 3.33333 12.6667H8.66667C9.02029 12.6667 9.35942 12.5262 9.60947 12.2761C9.85952 12.0261 10 11.687 10 11.3333V10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.66667 8H14M14 8L12 6M14 8L12 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RefreshIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M1.33333 2.66667V6.66667H5.33333M14.6667 13.3333V9.33333H10.6667M2.24 5.99999C2.62914 4.84301 3.36951 3.83682 4.35479 3.12729C5.34008 2.41776 6.51964 2.04065 7.72667 2.04667C9.8 2.04667 11.6467 3.08 12.7333 4.66667L14.6667 6.66667M1.33333 9.33333L3.26667 11.3333C4.35333 12.92 6.2 13.9533 8.27333 13.9533C9.48036 13.9594 10.6599 13.5823 11.6452 12.8727C12.6305 12.1632 13.3709 11.157 13.76 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export type NetworkType = 'ethereum' | 'polygon' | 'solana' | 'binance' | 'arbitrum' | 'optimism' | 'avalanche';

export interface WalletBalance {
  amount: number;
  symbol: string;
  usdValue: number;
}

export interface WalletNetwork {
  name: string;
  type: NetworkType;
  chainId?: number;
  color?: string;
}

export interface WalletCardProps {
  address: string;
  balance?: WalletBalance;
  network?: WalletNetwork;
  ens?: string;
  avatar?: string;
  isConnected?: boolean;
  loading?: boolean;
  error?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
  onViewDetails?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  showBalance?: boolean;
  showNetwork?: boolean;
  showActions?: boolean;
}

const WalletCard: React.FC<WalletCardProps> = ({
  address,
  balance,
  network,
  ens,
  avatar,
  isConnected = false,
  loading = false,
  error,
  onConnect,
  onDisconnect,
  onRefresh,
  onViewDetails,
  variant = 'default',
  showBalance = true,
  showNetwork = true,
  showActions = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const truncateAddress = (addr: string, start = 6, end = 4) => {
    if (!addr) return '';
    return `${addr.slice(0, start)}...${addr.slice(-end)}`;
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const getNetworkColor = (type: NetworkType) => {
    const networkColors: Record<NetworkType, string> = {
      ethereum: '#627EEA',
      polygon: '#8247E5',
      solana: '#14F195',
      binance: '#F3BA2F',
      arbitrum: '#28A0F0',
      optimism: '#FF0420',
      avalanche: '#E84142',
    };
    return networkColors[type] || colors.text.secondary;
  };

  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

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
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: colors.semantic.error,
            fontSize: typography.fontSize.base,
            marginBottom: spacing[3],
          }}
        >
          {getErrorMessage(error, "An error occurred")}
        </div>
        {onConnect && (
          <Button variant="primary" size="md" onClick={onConnect}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (!isConnected && onConnect) {
    return (
      <div
        style={{
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          borderRadius: radii.xl,
          padding: spacing[6],
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: radii.full,
            backgroundColor: colors.bg.tertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: spacing[4],
            color: colors.text.secondary,
          }}
        >
          <WalletIcon size={48} />
        </div>
        <h3
          style={{
            color: colors.text.primary,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            marginBottom: spacing[2],
          }}
        >
          Connect Your Wallet
        </h3>
        <p
          style={{
            color: colors.text.secondary,
            fontSize: typography.fontSize.sm,
            marginBottom: spacing[4],
          }}
        >
          Connect your wallet to view your balance and manage your assets
        </p>
        <Button variant="primary" size="lg" fullWidth onClick={onConnect}>
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <article
      style={{
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radii.xl,
        padding: isCompact ? spacing[3] : spacing[4],
        boxShadow: shadows.sm,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          gap: spacing[3],
          alignItems: 'center',
          marginBottom: showBalance || showNetwork ? spacing[4] : 0,
        }}
      >
        {/* Wallet Avatar */}
        <div
          style={{
            width: isCompact ? '40px' : isDetailed ? '56px' : '48px',
            height: isCompact ? '40px' : isDetailed ? '56px' : '48px',
            borderRadius: radii.full,
            overflow: 'hidden',
            backgroundColor: colors.bg.tertiary,
            flexShrink: 0,
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt="Wallet avatar"
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
              }}
            >
              <WalletIcon size={isCompact ? 20 : 24} />
            </div>
          )}
        </div>

        {/* Address Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {ens && (
            <div
              style={{
                color: colors.text.primary,
                fontSize: isCompact ? typography.fontSize.sm : typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                marginBottom: spacing[1],
              }}
            >
              {ens}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            <code
              style={{
                color: colors.text.secondary,
                fontSize: isCompact ? typography.fontSize.xs : typography.fontSize.sm,
                fontFamily: typography.fontFamily.mono,
              }}
            >
              {truncateAddress(address)}
            </code>
            <button
              onClick={handleCopy}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? colors.semantic.success : colors.text.tertiary,
                cursor: 'pointer',
                padding: spacing[1],
                borderRadius: radii.sm,
                display: 'flex',
                alignItems: 'center',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = colors.text.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.color = colors.text.tertiary;
                }
              }}
              aria-label="Copy address"
            >
              {copied ? <CheckIcon size={24} /> : <CopyIcon size={24} />}
            </button>
          </div>
        </div>

        {/* Refresh Button */}
        {onRefresh && showActions && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.tertiary,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              padding: spacing[2],
              borderRadius: radii.full,
              display: 'flex',
              alignItems: 'center',
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Refresh balance"
          >
            <div
              style={{
                transform: isRefreshing ? 'rotate(360deg)' : 'rotate(0deg)',
                transition: isRefreshing ? 'transform 1s linear infinite' : 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RefreshIcon size={24} />
            </div>
          </button>
        )}
      </div>

      {/* Balance */}
      {showBalance && balance && (
        <div
          style={{
            backgroundColor: colors.bg.tertiary,
            borderRadius: radii.lg,
            padding: spacing[4],
            marginBottom: spacing[3],
          }}
        >
          <div
            style={{
              color: colors.text.tertiary,
              fontSize: typography.fontSize.xs,
              marginBottom: spacing[2],
            }}
          >
            Total Balance
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: spacing[2],
              marginBottom: spacing[2],
            }}
          >
            <span
              style={{
                color: colors.text.primary,
                fontSize: isCompact ? typography.fontSize.xl : typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.bold,
              }}
            >
              {balance.amount.toFixed(4)}
            </span>
            <span
              style={{
                color: colors.text.secondary,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {balance.symbol}
            </span>
          </div>
          <div
            style={{
              color: colors.text.tertiary,
              fontSize: typography.fontSize.sm,
            }}
          >
            ${formatNumber(balance.usdValue)} USD
          </div>
        </div>
      )}

      {/* Network */}
      {showNetwork && network && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: spacing[3],
            backgroundColor: colors.bg.tertiary,
            borderRadius: radii.md,
            marginBottom: showActions ? spacing[3] : 0,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: radii.full,
              backgroundColor: network.color || getNetworkColor(network.type),
            }}
          />
          <span
            style={{
              color: colors.text.primary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              flex: 1,
            }}
          >
            {network.name}
          </span>
          {network.chainId && (
            <span
              style={{
                color: colors.text.tertiary,
                fontSize: typography.fontSize.xs,
              }}
            >
              Chain {network.chainId}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div style={{ display: 'flex', gap: spacing[2] }}>
          {onViewDetails && (
            <Button
              variant="outline"
              size={isCompact ? 'sm' : 'md'}
              fullWidth
              onClick={onViewDetails}
            >
              View Details
            </Button>
          )}
          {onDisconnect && (
            <Button
              variant="ghost"
              size={isCompact ? 'sm' : 'md'}
              icon={<DisconnectIcon size={24} />}
              iconOnly={!onViewDetails}
              onClick={onDisconnect}
              aria-label="Disconnect wallet"
            >
              {!onViewDetails && undefined}
            </Button>
          )}
        </div>
      )}
    </article>
  );
};

export default WalletCard;
