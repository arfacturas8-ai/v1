import React from 'react';
import { Copy, ExternalLink, Check, Circle } from 'lucide-react';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';

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
        className="card card-compact card-interactive"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          cursor: onClick ? 'pointer' : 'default',
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
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        >
          {walletIcons[walletType]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {truncateAddress(address)}
            </span>
            {isPrimary && <Badge variant="primary" size="sm">Primary</Badge>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Circle
              size={8}
              fill={isConnected ? 'var(--color-success)' : 'var(--text-tertiary)'}
              color={isConnected ? 'var(--color-success)' : 'var(--text-tertiary)'}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{network}</span>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="btn-ghost"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--radius-sm)',
            padding: 0,
          }}
        >
          {copied ? <Check size={16} color="var(--color-success)" /> : <Copy size={16} color="var(--text-secondary)" />}
        </button>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        onClick={onClick}
        className="card card-elevated card-interactive"
        style={{
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div
            style={{
              fontSize: '32px',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-tertiary)',
            }}
          >
            {walletIcons[walletType]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  textTransform: 'capitalize',
                }}
              >
                {walletType === 'other' ? 'Wallet' : walletType}
              </h3>
              {isPrimary && <Badge variant="primary" size="md">Primary</Badge>}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <Circle
                  size={8}
                  fill={isConnected ? 'var(--color-success)' : 'var(--text-tertiary)'}
                  color={isConnected ? 'var(--color-success)' : 'var(--text-tertiary)'}
                />
                <span style={{ fontSize: 'var(--text-sm)', color: isConnected ? 'var(--color-success)' : 'var(--text-tertiary)' }}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-medium)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                marginBottom: 'var(--space-1)',
              }}
            >
              {truncateAddress(address)}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{network}</div>
          </div>
        </div>

        {balance && (
          <div
            style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>
              Balance
            </div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
              {balance.amount.toFixed(4)} {balance.currency}
            </div>
            {balance.usdValue !== undefined && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                ≈ ${balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
      className="card card-interactive"
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        <div
          style={{
            fontSize: '28px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-tertiary)',
          }}
        >
          {walletIcons[walletType]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
                textTransform: 'capitalize',
              }}
            >
              {walletType === 'other' ? 'Wallet' : walletType}
            </span>
            {isPrimary && <Badge variant="primary" size="sm">Primary</Badge>}
          </div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
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
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Circle
            size={8}
            fill={isConnected ? 'var(--color-success)' : 'var(--text-tertiary)'}
            color={isConnected ? 'var(--color-success)' : 'var(--text-tertiary)'}
          />
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{network}</span>
        </div>

        {balance && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
              {balance.amount.toFixed(4)} {balance.currency}
            </div>
            {balance.usdValue !== undefined && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                ${balance.usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
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
