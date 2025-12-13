/**
 * CRYB Platform - CryptoCard Component v.1
 * Colorful crypto community cards matching design screenshots
 * Used on Communities page
 */

import React from 'react';

export interface CryptoCardProps {
  /** Crypto name (e.g., "Bitcoin") */
  name: string;
  /** Crypto symbol (e.g., "BTC") */
  symbol: string;
  /** Crypto icon URL or component */
  icon: React.ReactNode | string;
  /** Brand color (e.g., var(--crypto-bitcoin)) */
  brandColor: string;
  /** Number of coin holders */
  coinHolders?: number;
  /** Number of community members */
  members?: number;
  /** Optional grade/rating */
  grade?: string;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

export const CryptoCard: React.FC<CryptoCardProps> = ({
  name,
  symbol,
  icon,
  brandColor,
  coinHolders,
  members,
  grade,
  onClick,
  className = '',
}) => {
  const formattedHolders = coinHolders
    ? coinHolders.toLocaleString()
    : null;
  const formattedMembers = members
    ? members.toLocaleString()
    : null;

  return (
    <div className={`crypto-card ${className}`} onClick={onClick}>
      <div className="crypto-card-header">
        {/* Circular crypto icon */}
        <div
          className="crypto-card-icon"
          style={{ backgroundColor: brandColor }}
        >
          {typeof icon === 'string' ? (
            <img src={icon} alt={name} style={{ width: '28px', height: '28px' }} />
          ) : (
            icon
          )}
        </div>

        {/* Name and symbol */}
        <div style={{ flex: 1 }}>
          <div className="crypto-card-title">{name}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
            {symbol}
          </div>
        </div>

        {/* Optional grade badge */}
        {grade && (
          <div
            className="badge"
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
          >
            {grade}
          </div>
        )}
      </div>

      {/* Stats */}
      {(coinHolders || members) && (
        <div className="crypto-card-stats">
          {coinHolders && (
            <div>
              <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                {formattedHolders}
              </span>{' '}
              coin holders
            </div>
          )}
          {members && (
            <div>
              <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                {formattedMembers}
              </span>{' '}
              members
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CryptoCard;
