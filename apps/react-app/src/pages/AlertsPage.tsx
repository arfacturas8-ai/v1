import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, TrendingUp, TrendingDown, Trash2, Plus, Edit } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface PriceAlert {
  id: string;
  assetName: string;
  assetSymbol: string;
  currentPrice: number;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

const mockAlerts: PriceAlert[] = [
  {
    id: '1',
    assetName: 'Bitcoin',
    assetSymbol: 'BTC',
    currentPrice: 47156.78,
    targetPrice: 50000,
    condition: 'above',
    isActive: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    assetName: 'Ethereum',
    assetSymbol: 'ETH',
    currentPrice: 2523.45,
    targetPrice: 2000,
    condition: 'below',
    isActive: true,
    createdAt: '2024-01-14T15:30:00Z',
  },
  {
    id: '3',
    assetName: 'Solana',
    assetSymbol: 'SOL',
    currentPrice: 98.76,
    targetPrice: 100,
    condition: 'above',
    isActive: true,
    createdAt: '2024-01-13T09:15:00Z',
  },
  {
    id: '4',
    assetName: 'Cardano',
    assetSymbol: 'ADA',
    currentPrice: 0.52,
    targetPrice: 0.50,
    condition: 'above',
    isActive: false,
    createdAt: '2024-01-12T12:00:00Z',
    triggeredAt: '2024-01-13T08:30:00Z',
  },
  {
    id: '5',
    assetName: 'Polkadot',
    assetSymbol: 'DOT',
    currentPrice: 7.23,
    targetPrice: 8.00,
    condition: 'below',
    isActive: false,
    createdAt: '2024-01-11T16:45:00Z',
    triggeredAt: '2024-01-12T10:20:00Z',
  },
];

export default function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<PriceAlert[]>(mockAlerts);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'triggered'>('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return alert.isActive;
    if (filterStatus === 'triggered') return !alert.isActive;
    return true;
  });

  const handleDeleteAlert = (alertId: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    }
  };

  const handleToggleAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId && !alert.triggeredAt ? { ...alert, isActive: !alert.isActive } : alert
      )
    );
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressPercent = (current: number, target: number, condition: 'above' | 'below'): number => {
    if (condition === 'above') {
      const distance = Math.abs(target - current);
      const progress = Math.min((current / target) * 100, 100);
      return progress;
    } else {
      const progress = Math.min((target / current) * 100, 100);
      return progress;
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ArrowLeft size={20} color={colors.text.primary} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Price alerts
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'}
            </p>
          </div>
          <button
            onClick={() => navigate('/crypto/alerts/new')}
            style={{
              padding: `${spacing[2]} ${spacing[3]}`,
              borderRadius: '8px',
              border: `1px solid ${colors.border.default}`,
              backgroundColor: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
            }}
          >
            <Plus size={16} />
            New alert
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: spacing[4] }}>
        {/* Filter */}
        <div
          style={{
            display: 'flex',
            gap: spacing[2],
            marginBottom: spacing[4],
            padding: spacing[2],
            backgroundColor: colors.bg.secondary,
            borderRadius: '12px',
          }}
        >
          {[
            { value: 'all' as const, label: 'All alerts' },
            { value: 'active' as const, label: 'Active' },
            { value: 'triggered' as const, label: 'Triggered' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilterStatus(option.value)}
              style={{
                flex: 1,
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: '8px',
                border: 'none',
                backgroundColor: filterStatus === option.value ? colors.brand.primary : 'transparent',
                color: filterStatus === option.value ? 'white' : colors.text.secondary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Alerts list */}
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: spacing[4],
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                marginBottom: spacing[3],
                opacity: alert.isActive ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3], marginBottom: spacing[3] }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: alert.isActive
                      ? alert.condition === 'above'
                        ? colors.semantic.success + '20'
                        : colors.semantic.error + '20'
                      : colors.bg.tertiary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {alert.isActive ? (
                    alert.condition === 'above' ? (
                      <TrendingUp size={24} color={colors.semantic.success} />
                    ) : (
                      <TrendingDown size={24} color={colors.semantic.error} />
                    )
                  ) : (
                    <Bell size={24} color={colors.text.tertiary} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      marginBottom: spacing[1],
                    }}
                  >
                    {alert.assetName} ({alert.assetSymbol})
                  </div>
                  <div
                    style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                      marginBottom: spacing[1],
                    }}
                  >
                    Alert when price goes {alert.condition} ${alert.targetPrice.toLocaleString()}
                  </div>
                  <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                    {alert.triggeredAt
                      ? `Triggered ${formatTimestamp(alert.triggeredAt)}`
                      : `Created ${formatTimestamp(alert.createdAt)}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: spacing[2] }}>
                  {!alert.triggeredAt && (
                    <button
                      onClick={() => handleToggleAlert(alert.id)}
                      style={{
                        padding: spacing[2],
                        borderRadius: '8px',
                        border: `1px solid ${colors.border.default}`,
                        backgroundColor: colors.bg.primary,
                        color: colors.text.primary,
                        fontSize: typography.fontSize.sm,
                        cursor: 'pointer',
                        transition: 'all 150ms ease-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg.primary;
                      }}
                    >
                      {alert.isActive ? 'Pause' : 'Resume'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    style={{
                      padding: spacing[2],
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: colors.semantic.error,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 150ms ease-out',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.semantic.error + '10';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Current price and progress */}
              {alert.isActive && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: spacing[2],
                      fontSize: typography.fontSize.sm,
                      color: colors.text.secondary,
                    }}
                  >
                    <span>Current: ${alert.currentPrice.toLocaleString()}</span>
                    <span>Target: ${alert.targetPrice.toLocaleString()}</span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: colors.bg.tertiary,
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${getProgressPercent(alert.currentPrice, alert.targetPrice, alert.condition)}%`,
                        height: '100%',
                        backgroundColor:
                          alert.condition === 'above' ? colors.semantic.success : colors.semantic.error,
                        transition: 'width 300ms ease-out',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div
            style={{
              padding: spacing[8],
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[4],
              }}
            >
              <Bell size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No alerts found
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto', marginBottom: spacing[4] }}>
              {filterStatus === 'all'
                ? 'Create price alerts to get notified when your favorite assets reach target prices.'
                : `No ${filterStatus} alerts at the moment.`}
            </p>
            {filterStatus === 'all' && (
              <button
                onClick={() => navigate('/crypto/alerts/new')}
                style={{
                  padding: `${spacing[3]} ${spacing[4]}`,
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: colors.brand.primary,
                  color: 'white',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.brand.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.brand.primary;
                }}
              >
                Create your first alert
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
