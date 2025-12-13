/**
 * CRYB Platform - CryptoIcon Component v.1
 * Circular crypto icons with brand colors
 * Matching design screenshots
 */

import React from 'react';

export interface CryptoIconProps {
  /** Crypto name */
  name: string;
  /** Crypto symbol */
  symbol: string;
  /** Icon URL or React component */
  icon?: React.ReactNode | string;
  /** Brand color */
  brandColor: string;
  /** Size: sm (32px), md (48px), lg (64px) */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

export const CryptoIcon: React.FC<CryptoIconProps> = ({
  name,
  symbol,
  icon,
  brandColor,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: '32px',
    md: '48px',
    lg: '64px',
  };

  const iconSizeMap = {
    sm: '20px',
    md: '28px',
    lg: '40px',
  };

  return (
    <div
      className={`crypto-card-icon ${className}`}
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        backgroundColor: brandColor,
      }}
      title={`${name} (${symbol})`}
    >
      {icon ? (
        typeof icon === 'string' ? (
          <img
            src={icon}
            alt={name}
            style={{
              width: iconSizeMap[size],
              height: iconSizeMap[size],
            }}
          />
        ) : (
          icon
        )
      ) : (
        <span
          style={{
            color: 'var(--text-inverse)',
            fontSize: size === 'sm' ? 'var(--text-sm)' : size === 'lg' ? 'var(--text-xl)' : 'var(--text-base)',
            fontWeight: 'var(--font-bold)',
          }}
        >
          {symbol.slice(0, 3)}
        </span>
      )}
    </div>
  );
};

export default CryptoIcon;
