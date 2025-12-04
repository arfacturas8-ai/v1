import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Star, Share2, AlertCircle, ExternalLink } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface PriceData {
  timestamp: string;
  price: number;
}

const mockPriceData: PriceData[] = [
  { timestamp: '2024-01-01', price: 38000 },
  { timestamp: '2024-01-02', price: 39500 },
  { timestamp: '2024-01-03', price: 38800 },
  { timestamp: '2024-01-04', price: 41200 },
  { timestamp: '2024-01-05', price: 40500 },
  { timestamp: '2024-01-06', price: 42800 },
  { timestamp: '2024-01-07', price: 43500 },
  { timestamp: '2024-01-08', price: 42100 },
  { timestamp: '2024-01-09', price: 44800 },
  { timestamp: '2024-01-10', price: 43900 },
  { timestamp: '2024-01-11', price: 45200 },
  { timestamp: '2024-01-12', price: 44500 },
  { timestamp: '2024-01-13', price: 46100 },
  { timestamp: '2024-01-14', price: 45800 },
  { timestamp: '2024-01-15', price: 47200 },
];

export default function AssetDetailPage() {
  const navigate = useNavigate();
  const { assetId } = useParams<{ assetId: string }>();
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'>('1W');
  const [isWatching, setIsWatching] = useState(false);

  const assetName = 'Bitcoin';
  const assetSymbol = 'BTC';
  const currentPrice = 47156.78;
  const priceChange24h = 5.67;
  const priceChangePercent24h = 12.5;
  const marketCap = 923456789012;
  const volume24h = 45678901234;
  const circulatingSupply = 19600000;
  const maxSupply = 21000000;
  const allTimeHigh = 69000;
  const allTimeLow = 67.81;

  const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;

  const formatNumber = (num: number): string => {
    if (num >= 1000000000000) return `$${(num / 1000000000000).toFixed(2)}T`;
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const maxPrice = Math.max(...mockPriceData.map((d) => d.price));
  const minPrice = Math.min(...mockPriceData.map((d) => d.price));
  const priceRange = maxPrice - minPrice;

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
              {assetName}
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {assetSymbol}
            </p>
          </div>
          <button
            onClick={() => setIsWatching(!isWatching)}
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
            <Star
              size={20}
              color={isWatching ? colors.semantic.warning : colors.text.tertiary}
              fill={isWatching ? colors.semantic.warning : 'none'}
            />
          </button>
          <button
            onClick={() => navigate(`/share/asset/${assetId}`)}
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
            <Share2 size={20} color={colors.text.tertiary} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: spacing[4] }}>
        {/* Price overview */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.bg.secondary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: '12px',
            marginBottom: spacing[4],
          }}
        >
          <div style={{ marginBottom: spacing[4] }}>
            <div
              style={{
                fontSize: typography.fontSize['3xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              {priceChangePercent24h >= 0 ? (
                <TrendingUp size={20} color={colors.semantic.success} />
              ) : (
                <TrendingDown size={20} color={colors.semantic.error} />
              )}
              <span
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  color: priceChangePercent24h >= 0 ? colors.semantic.success : colors.semantic.error,
                }}
              >
                {priceChangePercent24h >= 0 ? '+' : ''}
                {priceChange24h.toFixed(2)} ({priceChangePercent24h.toFixed(2)}%)
              </span>
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                24h
              </span>
            </div>
          </div>

          {/* Timeframe selector */}
          <div
            style={{
              display: 'flex',
              gap: spacing[2],
              marginBottom: spacing[4],
              padding: spacing[2],
              backgroundColor: colors.bg.primary,
              borderRadius: '8px',
            }}
          >
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  flex: 1,
                  padding: spacing[2],
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: timeframe === tf ? colors.brand.primary : 'transparent',
                  color: timeframe === tf ? 'white' : colors.text.secondary,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: spacing[1] }}>
            {mockPriceData.map((point, index) => {
              const heightPercent = ((point.price - minPrice) / priceRange) * 100;
              return (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: `${heightPercent}%`,
                    backgroundColor: priceChangePercent24h >= 0 ? colors.semantic.success : colors.semantic.error,
                    borderRadius: '2px 2px 0 0',
                    transition: 'all 150ms ease-out',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  title={`${point.timestamp}: $${point.price.toLocaleString()}`}
                />
              );
            })}
          </div>
        </div>

        {/* Market stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: spacing[4],
            marginBottom: spacing[4],
          }}
        >
          <div
            style={{
              padding: spacing[4],
              backgroundColor: colors.bg.secondary,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[2] }}>
              Market cap
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {formatNumber(marketCap)}
            </div>
          </div>

          <div
            style={{
              padding: spacing[4],
              backgroundColor: colors.bg.secondary,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[2] }}>
              24h volume
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {formatNumber(volume24h)}
            </div>
          </div>

          <div
            style={{
              padding: spacing[4],
              backgroundColor: colors.bg.secondary,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[2] }}>
              Circulating supply
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              {circulatingSupply.toLocaleString()} {assetSymbol}
            </div>
            <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[1] }}>
              Max: {maxSupply.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              padding: spacing[4],
              backgroundColor: colors.bg.secondary,
              border: `1px solid ${colors.border.default}`,
              borderRadius: '12px',
            }}
          >
            <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, marginBottom: spacing[2] }}>
              All-time high
            </div>
            <div
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
              }}
            >
              ${allTimeHigh.toLocaleString()}
            </div>
            <div style={{ fontSize: typography.fontSize.xs, color: colors.semantic.error, marginTop: spacing[1] }}>
              -{((allTimeHigh - currentPrice) / allTimeHigh * 100).toFixed(2)}% from ATH
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: spacing[3],
            marginBottom: spacing[4],
          }}
        >
          <button
            onClick={() => navigate(`/crypto/trade/${assetId}`)}
            style={{
              padding: spacing[4],
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
            Trade
          </button>

          <button
            onClick={() => navigate(`/vote/${assetId}`)}
            style={{
              padding: spacing[4],
              borderRadius: '12px',
              border: `1px solid ${colors.border.default}`,
              backgroundColor: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
            }}
          >
            Vote on price
          </button>

          <button
            onClick={() => window.open(`https://coinmarketcap.com/currencies/${assetName.toLowerCase()}`, '_blank')}
            style={{
              padding: spacing[4],
              borderRadius: '12px',
              border: `1px solid ${colors.border.default}`,
              backgroundColor: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
            }}
          >
            View on CMC
            <ExternalLink size={16} />
          </button>
        </div>

        {/* About */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.bg.secondary,
            border: `1px solid ${colors.border.default}`,
            borderRadius: '12px',
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[3],
            }}
          >
            About {assetName}
          </h2>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              margin: 0,
            }}
          >
            Bitcoin is a decentralized digital currency that can be transferred on the peer-to-peer bitcoin network. Bitcoin transactions are verified by network nodes through cryptography and recorded in a public distributed ledger called a blockchain. The cryptocurrency was invented in 2008 by an unknown person or group of people using the name Satoshi Nakamoto.
          </p>
        </div>
      </div>
    </div>
  );
}
