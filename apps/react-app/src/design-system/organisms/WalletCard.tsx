import React from 'react';
import { Copy, ExternalLink, Check, Circle } from 'lucide-react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { colors, spacing, typography, radii, shadows } from '../tokens';

interface WalletCardProps {
  address: string;
  balance?: {
    amount: number;
    currency: string;
    usdValue?: number;
  };
  network?: string;
  walletType?: 'metamask' | 'walletconnect' | 'coinbase' | 'rainbow' | 'other';
  isPrimary?: boolean;
  isConnected?: boolean;
  onCopy?: () => void;
  onDisconnect?: () => void;
  onViewExplorer?: () => void;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

const walletIcons: Record<string, string> = {
  metamask: '🦊',
  walletconnect: '🔗',
  coinbase: '🔵',
  rainbow: '🌈',
  other: '👛',
};

export const WalletCard: React.FC<WalletCardProps> = ({
  address,
  balance,
  network = 'Ethereum',
  walletType = 'other',
  isPrimary = false,
  isConnected = true,
  onCopy,
  onDisconnect,
  onViewExplorer,
  onClick,
  variant = 'default',
}) => {
  const [copied, setCopied] = React.useState(false);

  const truncateAddress = (addr: string): string => {
    if (addr.length <= 13) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDisconnect?.();
  };

  const handleViewExplorer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewExplorer?.();
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
        <div
          style={{
            fontSize: '24px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.md,
            backgroundColor: colors.bg.tertiary,
          }}
        >
          {walletIcons[walletType]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <span
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                fontFamily: typography.fontFamily.mono,
              }}
            >
              {truncateAddress(address)}
            </span>
            {isPrimary && <Badge variant="primary" size="sm">Primary</Badge>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            <Circle
              size={8}
              fill={isConnected ? colors.semantic.success : colors.text.tertiary}
              color={isConnected ? colors.semantic.success : colors.text.tertiary}
            />
            <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>{network}</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: radii.sm,
            border: 'none',
            backgroundColor: colors.bg.tertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 150ms ease-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.bg.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.bg.tertiary;
          }}
        >
          {copied ? <Check size={16} color={colors.semantic.success} /> : <Copy size={16} color={colors.text.secondary} />}
        </button>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        onClick={onClick}
        style={{
          borderRadius: radii.lg,
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          padding: spacing[5],
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[4], marginBottom: spacing[4] }}>
          <div
            style={{
              fontSize: '32px',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radii.lg,
              backgroundColor: colors.bg.tertiary,
            }}
          >
            {walletIcons[walletType]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] }}>
              <h3
                style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  textTransform: 'capitalize',
                }}
              >
                {walletType === 'other' ? 'Wallet' : walletType}
              </h3>
              {isPrimary && <Badge variant="primary" size="md">Primary</Badge>}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <Circle
                  size={8}
                  fill={isConnected ? colors.semantic.success : colors.text.tertiary}
                  color={isConnected ? colors.semantic.success : colors.text.tertiary}
                />
                <span style={{ fontSize: typography.fontSize.sm, color: isConnected ? colors.semantic.success : colors.text.tertiary }}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
                fontFamily: typography.fontFamily.mono,
                marginBottom: spacing[1],
              }}
            >
              {truncateAddress(address)}
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>{network}</div>
          </div>
        </div>

        {balance && (
          <div
            style={{
              padding: spacing[4],
              borderRadius: radii.md,
              backgroundColor: colors.bg.tertiary,
              marginBottom: spacing[4],
            }}
          >
            <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
              Balance
            </div>
            <div style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.text.primary, marginBottom: spacing[1] }}>
              {balance.amount.toFixed(4)} {balance.currency}
            </div>
            {balance.usdValue !== undefined && (
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                ≈ ${balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: spacing[2] }}>
          <Button variant="outline" size="sm" onClick={handleCopy} leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
          {onViewExplorer && (
            <Button variant="outline" size="sm" onClick={handleViewExplorer} leftIcon={<ExternalLink size={16} />}>
              Explorer
            </Button>
          )}
          {onDisconnect && (
            <Button variant="danger" size="sm" onClick={handleDisconnect} style={{ marginLeft: 'auto' }}>
              Disconnect
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
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        padding: spacing[4],
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
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[3] }}>
        <div
          style={{
            fontSize: '28px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: radii.md,
            backgroundColor: colors.bg.tertiary,
          }}
        >
          {walletIcons[walletType]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
            <span
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                textTransform: 'capitalize',
              }}
            >
              {walletType === 'other' ? 'Wallet' : walletType}
            </span>
            {isPrimary && <Badge variant="primary" size="sm">Primary</Badge>}
          </div>
          <div
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.secondary,
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {truncateAddress(address)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: spacing[3],
          borderTop: `1px solid ${colors.border.default}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
          <Circle
            size={8}
            fill={isConnected ? colors.semantic.success : colors.text.tertiary}
            color={isConnected ? colors.semantic.success : colors.text.tertiary}
          />
          <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>{network}</span>
        </div>

        {balance && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary }}>
              {balance.amount.toFixed(4)} {balance.currency}
            </div>
            {balance.usdValue !== undefined && (
              <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                ${balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: spacing[2], marginTop: spacing[3] }}>
        <Button variant="outline" size="sm" onClick={handleCopy} leftIcon={copied ? <Check size={14} /> : <Copy size={14} />} style={{ flex: 1 }}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        {onViewExplorer && (
          <Button variant="outline" size="sm" onClick={handleViewExplorer} leftIcon={<ExternalLink size={14} />}>
            Explorer
          </Button>
        )}
      </div>
    </div>
  );
};
