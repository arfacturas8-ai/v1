import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, TrendingUp, TrendingDown, Search, Plus } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface WatchlistAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  volume24h: number;
  sparklineData: number[];
}

const mockWatchlist: WatchlistAsset[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 47156.78,
    change24h: 2345.67,
    changePercent24h: 5.23,
    marketCap: 923456789012,
    volume24h: 45678901234,
    sparklineData: [45000, 45500, 44800, 46200, 46800, 47000, 47156],
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2523.45,
    change24h: -123.45,
    changePercent24h: -4.66,
    marketCap: 303456789012,
    volume24h: 23456789012,
    sparklineData: [2650, 2600, 2580, 2550, 2540, 2530, 2523],
  },
  {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    price: 0.52,
    change24h: 0.05,
    changePercent24h: 10.64,
    marketCap: 18234567890,
    volume24h: 1234567890,
    sparklineData: [0.47, 0.48, 0.49, 0.50, 0.51, 0.52, 0.52],
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    price: 98.76,
    change24h: 12.34,
    changePercent24h: 14.28,
    marketCap: 42345678901,
    volume24h: 3456789012,
    sparklineData: [86, 88, 91, 93, 95, 97, 98.76],
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    symbol: 'DOT',
    price: 7.23,
    change24h: -0.45,
    changePercent24h: -5.86,
    marketCap: 9234567890,
    volume24h: 567890123,
    sparklineData: [7.7, 7.6, 7.5, 7.4, 7.3, 7.25, 7.23],
  },
];

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState<WatchlistAsset[]>(mockWatchlist);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = watchlist.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemoveFromWatchlist = (assetId: string) => {
    setWatchlist((prev) => prev.filter((asset) => asset.id !== assetId));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const renderSparkline = (data: number[]) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    const width = 80;
    const height = 40;

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    const isPositive = data[data.length - 1] >= data[0];

    return (
      <svg width={width} height={height} style={{ display: 'block' }}>
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? colors.semantic.success : colors.semantic.error}
          strokeWidth="2"
        />
      </svg>
    );
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
              Watchlist
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'} tracked
            </p>
          </div>
          <button
            onClick={() => navigate('/crypto/markets')}
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
            Add asset
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[4] }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: spacing[4] }}>
          <Search
            size={20}
            color={colors.text.tertiary}
            style={{
              position: 'absolute',
              left: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search watchlist..."
            style={{
              width: '100%',
              padding: spacing[3],
              paddingLeft: `calc(${spacing[3]} + 28px)`,
              backgroundColor: colors.bg.secondary,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '12px',
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.brand.primary;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border.default;
            }}
          />
        </div>

        {/* Watchlist */}
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => (
            <div
              key={asset.id}
              style={{
                padding: spacing[4],
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                marginBottom: spacing[3],
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
              onClick={() => navigate(`/crypto/asset/${asset.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
                {/* Asset info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                    <span
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary,
                      }}
                    >
                      {asset.name}
                    </span>
                    <span
                      style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.tertiary,
                      }}
                    >
                      {asset.symbol}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      Cap: {formatNumber(asset.marketCap)}
                    </span>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>•</span>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      Vol: {formatNumber(asset.volume24h)}
                    </span>
                  </div>
                </div>

                {/* Sparkline */}
                <div style={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
                  {renderSparkline(asset.sparklineData)}
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', minWidth: '140px' }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                      marginBottom: spacing[1],
                    }}
                  >
                    ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: spacing[1] }}>
                    {asset.changePercent24h >= 0 ? (
                      <TrendingUp size={16} color={colors.semantic.success} />
                    ) : (
                      <TrendingDown size={16} color={colors.semantic.error} />
                    )}
                    <span
                      style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: asset.changePercent24h >= 0 ? colors.semantic.success : colors.semantic.error,
                      }}
                    >
                      {asset.changePercent24h >= 0 ? '+' : ''}
                      {asset.changePercent24h.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromWatchlist(asset.id);
                  }}
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
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.semantic.warning + '20';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Star size={20} color={colors.semantic.warning} fill={colors.semantic.warning} />
                </button>
              </div>
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
              <Star size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              {searchQuery ? 'No assets found' : 'Your watchlist is empty'}
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto', marginBottom: spacing[4] }}>
              {searchQuery
                ? `No assets match "${searchQuery}". Try a different search term.`
                : 'Add assets to your watchlist to track their prices and performance.'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/crypto/markets')}
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
                Browse markets
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
