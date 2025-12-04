import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: AvatarSize;
  name?: string;
  online?: boolean;
  verified?: boolean;
  fallback?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface AvatarGroupProps {
  children: React.ReactElement<AvatarProps>[];
  max?: number;
  size?: AvatarSize;
  overlap?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  name,
  online,
  verified,
  fallback,
  onClick,
  className,
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const getSizeStyles = () => {
    const sizes = {
      xs: { size: '24px', fontSize: typography.fontSize.xs, indicator: '6px', verifiedSize: '10px' },
      sm: { size: '32px', fontSize: typography.fontSize.sm, indicator: '8px', verifiedSize: '12px' },
      md: { size: '40px', fontSize: typography.fontSize.base, indicator: '10px', verifiedSize: '14px' },
      lg: { size: '48px', fontSize: typography.fontSize.lg, indicator: '12px', verifiedSize: '16px' },
      xl: { size: '64px', fontSize: typography.fontSize.xl, indicator: '14px', verifiedSize: '20px' },
      '2xl': { size: '96px', fontSize: typography.fontSize['2xl'], indicator: '18px', verifiedSize: '24px' },
    };
    return sizes[size];
  };

  const styles = getSizeStyles();

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const showImage = src && !imageError;
  const showInitials = !showImage && name;
  const showFallback = !showImage && !name && fallback;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: styles.size,
        height: styles.size,
        borderRadius: radii.full,
        backgroundColor: colors.bg.elevated,
        color: colors.text.primary,
        fontSize: styles.fontSize,
        fontWeight: typography.fontWeight.semibold,
        fontFamily: typography.fontFamily.sans,
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
        transform: onClick && isHovered ? 'scale(1.05)' : 'scale(1)',
        border: `2px solid ${colors.bg.primary}`,
        flexShrink: 0,
      }}
    >
      {showImage && (
        <img
          src={src}
          alt={alt || name}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}

      {showInitials && <span>{getInitials(name!)}</span>}

      {showFallback && fallback}

      {!showImage && !showInitials && !showFallback && (
        <svg
          width="50%"
          height="50%"
          viewBox="0 0 24 24"
          fill="none"
          style={{ color: colors.text.tertiary }}
        >
          <path
            d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            fill="currentColor"
          />
        </svg>
      )}

      {online !== undefined && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: styles.indicator,
            height: styles.indicator,
            borderRadius: radii.full,
            backgroundColor: online ? colors.semantic.success : colors.text.tertiary,
            border: `2px solid ${colors.bg.primary}`,
          }}
        />
      )}

      {verified && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: styles.verifiedSize,
            height: styles.verifiedSize,
            borderRadius: radii.full,
            backgroundColor: colors.brand.primary,
            border: `2px solid ${colors.bg.primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="60%"
            height="60%"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M5 8l2 2 4-4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 3,
  size = 'md',
  overlap = true,
}) => {
  const visibleAvatars = children.slice(0, max);
  const remainingCount = children.length - max;

  const getSizeStyles = () => {
    const sizes = {
      xs: { size: '24px', overlap: '-8px', fontSize: typography.fontSize.xs },
      sm: { size: '32px', overlap: '-10px', fontSize: typography.fontSize.xs },
      md: { size: '40px', overlap: '-12px', fontSize: typography.fontSize.sm },
      lg: { size: '48px', overlap: '-14px', fontSize: typography.fontSize.base },
      xl: { size: '64px', overlap: '-20px', fontSize: typography.fontSize.lg },
      '2xl': { size: '96px', overlap: '-30px', fontSize: typography.fontSize.xl },
    };
    return sizes[size];
  };

  const styles = getSizeStyles();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row-reverse',
        justifyContent: 'flex-end',
      }}
    >
      {remainingCount > 0 && (
        <div
          style={{
            width: styles.size,
            height: styles.size,
            borderRadius: radii.full,
            backgroundColor: colors.bg.elevated,
            color: colors.text.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: styles.fontSize,
            fontWeight: typography.fontWeight.semibold,
            fontFamily: typography.fontFamily.sans,
            border: `2px solid ${colors.bg.primary}`,
            marginLeft: overlap ? styles.overlap : spacing[2],
            flexShrink: 0,
          }}
        >
          +{remainingCount}
        </div>
      )}

      {visibleAvatars.reverse().map((avatar, index) => (
        <div
          key={index}
          style={{
            marginLeft: overlap && index > 0 ? styles.overlap : index > 0 ? spacing[2] : 0,
          }}
        >
          {React.cloneElement(avatar, { size })}
        </div>
      ))}
    </div>
  );
};

export default Avatar;
