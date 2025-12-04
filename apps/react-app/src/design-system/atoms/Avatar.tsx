import React from 'react';
import { colors, radii, spacing, typography, shadows } from '../tokens';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  username?: string;
  showOnline?: boolean;
  isOnline?: boolean;
  showVerified?: boolean;
  isVerified?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const sizeMap: Record<AvatarSize, { size: string; fontSize: string; indicatorSize: string }> = {
  xs: { size: '24px', fontSize: '10px', indicatorSize: '8px' },
  sm: { size: '32px', fontSize: '12px', indicatorSize: '10px' },
  md: { size: '40px', fontSize: '14px', indicatorSize: '12px' },
  lg: { size: '48px', fontSize: '16px', indicatorSize: '14px' },
  xl: { size: '64px', fontSize: '20px', indicatorSize: '16px' },
  '2xl': { size: '96px', fontSize: '32px', indicatorSize: '20px' },
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  username,
  showOnline = false,
  isOnline = false,
  showVerified = false,
  isVerified = false,
  className = '',
  style,
  onClick,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const { size: avatarSize, fontSize, indicatorSize } = sizeMap[size];

  // Generate initials from username
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: avatarSize,
    height: avatarSize,
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  const avatarStyle: React.CSSProperties = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: radii.full,
    overflow: 'hidden',
    backgroundColor: colors['bg-elevated'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize,
    fontWeight: typography.fontWeight.semibold,
    color: colors['text-secondary'],
    fontFamily: typography.fontFamily.sans,
    border: `2px solid ${colors['border-default']}`,
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const onlineIndicatorStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '0',
    right: '0',
    width: indicatorSize,
    height: indicatorSize,
    borderRadius: radii.full,
    backgroundColor: isOnline ? colors['online'] : colors['offline'],
    border: `2px solid ${colors['bg-primary']}`,
  };

  const verifiedBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: indicatorSize,
    height: indicatorSize,
    borderRadius: radii.full,
    backgroundColor: colors['verified'],
    border: `2px solid ${colors['bg-primary']}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size === 'xs' || size === 'sm' ? '6px' : '8px',
    color: colors['text-primary'],
  };

  return (
    <div className={className} style={containerStyle} onClick={onClick}>
      <div style={avatarStyle}>
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || username || 'Avatar'}
            style={imageStyle}
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{getInitials(username || alt)}</span>
        )}
      </div>

      {showOnline && !showVerified && <div style={onlineIndicatorStyle} />}

      {showVerified && isVerified && (
        <div style={verifiedBadgeStyle}>
          <span>✓</span>
        </div>
      )}
    </div>
  );
};

// AvatarGroup component for stacking avatars
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
  style?: React.CSSProperties;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 3,
  size = 'md',
  className = '',
  style,
}) => {
  const avatars = React.Children.toArray(children).slice(0, max);
  const remaining = React.Children.count(children) - max;
  const { size: avatarSize } = sizeMap[size];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    ...style,
  };

  const avatarWrapperStyle = (index: number): React.CSSProperties => ({
    marginLeft: index > 0 ? '-8px' : '0',
    position: 'relative',
    zIndex: avatars.length - index,
  });

  const remainingStyle: React.CSSProperties = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: radii.full,
    backgroundColor: colors['bg-elevated'],
    border: `2px solid ${colors['border-default']}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: sizeMap[size].fontSize,
    fontWeight: typography.fontWeight.semibold,
    color: colors['text-secondary'],
    fontFamily: typography.fontFamily.sans,
    marginLeft: '-8px',
    zIndex: 0,
  };

  return (
    <div className={className} style={containerStyle}>
      {avatars.map((avatar, index) => (
        <div key={index} style={avatarWrapperStyle(index)}>
          {React.isValidElement(avatar)
            ? React.cloneElement(avatar as React.ReactElement<AvatarProps>, { size })
            : avatar}
        </div>
      ))}
      {remaining > 0 && (
        <div style={remainingStyle}>
          +{remaining}
        </div>
      )}
    </div>
  );
};

export default Avatar;
