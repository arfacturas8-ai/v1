import React from "react";
import { Star, Crown, Gem, Zap } from 'lucide-react'
import { Card } from '../ui/Card';

// OpenSea-inspired rarity config
const rarityConfig = {
  common: { color: 'var(--text-secondary)', bgColor: 'var(--bg-tertiary)', borderColor: 'var(--border-default)', icon: null },
  rare: { color: 'var(--brand-primary)', bgColor: 'var(--color-info-light)', borderColor: 'var(--brand-primary)', icon: Star },
  epic: { color: 'var(--brand-secondary)', bgColor: 'var(--color-info-light)', borderColor: 'var(--brand-secondary)', icon: Gem },
  legendary: { color: 'var(--color-warning)', bgColor: 'var(--color-warning-light)', borderColor: 'var(--color-warning)', icon: Crown },
  mythic: { color: 'var(--color-error)', bgColor: 'var(--color-error-light)', borderColor: 'var(--color-error)', icon: Zap }
};

const sizeConfig = {
  xs: { height: '20px', padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-xs)' },
  sm: { height: '24px', padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' },
  md: { height: '28px', padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' },
  lg: { height: '32px', padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--text-sm)' }
};

function NFTProfileBadge({
  collection,
  tokenId,
  rarity = 'common',
  size = 'sm',
  className = '',
  showTooltip = true
}) {
  const config = rarityConfig[rarity];
  const sizeStyle = sizeConfig[size];
  const Icon = config.icon;

  // NFT features coming soon - show OpenSea-style disabled badge
  const comingSoonBadge = (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          borderRadius: 'var(--radius-full)',
          fontWeight: 'var(--font-medium)',
          border: `1px solid ${config.borderColor}`,
          backgroundColor: config.bgColor,
          color: config.color,
          opacity: 0.7,
          ...sizeStyle
        }}
      >
        <Gem style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
        <span style={{ fontWeight: 'var(--font-semibold)' }}>
          NFT Badge
        </span>
      </span>
      <span className="badge badge-coming-soon" style={{
        position: 'absolute',
        top: '-var(--space-1)',
        right: '-var(--space-2)',
        fontSize: 'var(--text-xs)',
        padding: 'var(--space-1)',
        fontWeight: 'var(--font-bold)'
      }}>
        SOON
      </span>
    </div>
  );

  if (!showTooltip) {
    return comingSoonBadge;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {comingSoonBadge}

      {/* OpenSea-style Tooltip */}
      <div
        className="card card-elevated"
        style={{
          position: 'absolute',
          top: 'calc(100% + var(--space-2))',
          left: '50%',
          transform: 'translateX(-50%)',
          minWidth: '200px',
          padding: 'var(--space-3)',
          textAlign: 'center',
          zIndex: 'var(--z-tooltip)',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity var(--transition-normal)'
        }}
      >
        <div>
          <div style={{
            fontWeight: 'var(--font-semibold)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            justifyContent: 'center',
            marginBottom: 'var(--space-1)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)'
          }}>
            <Gem size={14} style={{ color: 'var(--brand-primary)' }} />
            NFT Profile Badges
          </div>
          <div style={{
            fontWeight: 'var(--font-medium)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-1)'
          }}>Coming Soon!</div>
          <div style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-xs)'
          }}>Show off your NFT collections</div>
        </div>
        {/* Arrow */}
        <div style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: `6px solid var(--bg-secondary)`
        }}></div>
      </div>
    </div>
  );
}




export default NFTProfileBadge;
