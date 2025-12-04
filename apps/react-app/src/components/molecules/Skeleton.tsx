import React from 'react';
import { colors, spacing, radii, animation } from '../../design-system/tokens';

export type SkeletonVariant =
  | 'text'
  | 'heading'
  | 'avatar'
  | 'thumbnail'
  | 'card'
  | 'listItem'
  | 'button'
  | 'input'
  | 'custom';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  circle?: boolean;
  count?: number;
  spacing?: keyof typeof spacing;
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  circle = false,
  count = 1,
  spacing: spacingProp = 3,
  animate = true,
  className,
  style,
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    const variants: Record<SkeletonVariant, React.CSSProperties> = {
      text: {
        height: '16px',
        width: width || '100%',
        borderRadius: radii.sm,
      },
      heading: {
        height: '32px',
        width: width || '70%',
        borderRadius: radii.md,
      },
      avatar: {
        width: width || '40px',
        height: height || width || '40px',
        borderRadius: radii.full,
      },
      thumbnail: {
        width: width || '120px',
        height: height || '120px',
        borderRadius: radii.lg,
      },
      card: {
        width: width || '100%',
        height: height || '200px',
        borderRadius: radii.lg,
      },
      listItem: {
        width: width || '100%',
        height: height || '60px',
        borderRadius: radii.md,
      },
      button: {
        width: width || '120px',
        height: height || '40px',
        borderRadius: radii.md,
      },
      input: {
        width: width || '100%',
        height: height || '44px',
        borderRadius: radii.md,
      },
      custom: {
        width: width || '100px',
        height: height || '100px',
        borderRadius: circle ? radii.full : radii.md,
      },
    };

    return variants[variant];
  };

  const baseStyles: React.CSSProperties = {
    backgroundColor: colors.bg.tertiary,
    position: 'relative',
    overflow: 'hidden',
    ...getVariantStyles(),
    ...style,
  };

  const shimmerStyles: React.CSSProperties = animate
    ? {
        position: 'absolute',
        top: 0,
        left: '-100%',
        height: '100%',
        width: '100%',
        background: `linear-gradient(90deg, transparent, ${colors.bg.hover}, transparent)`,
        animation: `shimmer 1.5s infinite`,
      }
    : {};

  const renderSkeleton = (index: number) => (
    <div
      key={index}
      className={className}
      style={{
        ...baseStyles,
        marginBottom: index < count - 1 ? spacing[spacingProp] : 0,
      }}
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading..."
    >
      {animate && <div style={shimmerStyles} />}
    </div>
  );

  return (
    <>
      {Array.from({ length: count }, (_, i) => renderSkeleton(i))}

      {/* Shimmer Animation */}
      {animate && (
        <style>
          {`
            @keyframes shimmer {
              0% {
                left: -100%;
              }
              100% {
                left: 100%;
              }
            }
          `}
        </style>
      )}
    </>
  );
};

// Composite Skeleton Components
export const SkeletonText: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="text" {...props} />
);

export const SkeletonHeading: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="heading" {...props} />
);

export const SkeletonAvatar: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="avatar" {...props} />
);

export const SkeletonCard: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton variant="card" {...props} />
);

export const SkeletonListItem: React.FC<{ showAvatar?: boolean; showSubtitle?: boolean }> = ({
  showAvatar = true,
  showSubtitle = true,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
      padding: `${spacing[3]} ${spacing[4]}`,
    }}
  >
    {showAvatar && <Skeleton variant="avatar" width="40px" height="40px" />}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
      <Skeleton variant="text" width="60%" height="16px" />
      {showSubtitle && <Skeleton variant="text" width="40%" height="14px" />}
    </div>
  </div>
);

export const SkeletonCardWithImage: React.FC = () => (
  <div style={{ width: '100%' }}>
    <Skeleton variant="thumbnail" width="100%" height="200px" />
    <div style={{ padding: spacing[4] }}>
      <Skeleton variant="heading" width="80%" height="24px" />
      <div style={{ marginTop: spacing[3] }}>
        <Skeleton variant="text" width="100%" count={3} spacing={2} />
      </div>
      <div style={{ marginTop: spacing[4] }}>
        <Skeleton variant="button" width="120px" />
      </div>
    </div>
  </div>
);

export const SkeletonProfile: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: spacing[4] }}>
    <Skeleton variant="avatar" width="100px" height="100px" />
    <Skeleton variant="heading" width="200px" height="28px" />
    <Skeleton variant="text" width="300px" height="16px" />
    <div style={{ display: 'flex', gap: spacing[3], marginTop: spacing[4] }}>
      <Skeleton variant="button" width="100px" />
      <Skeleton variant="button" width="100px" />
    </div>
  </div>
);

export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 3 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[4] }}>
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
        <Skeleton variant="text" width="120px" height="14px" />
        <Skeleton variant="input" width="100%" />
      </div>
    ))}
    <Skeleton variant="button" width="150px" style={{ marginTop: spacing[2] }} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div style={{ width: '100%' }}>
    {/* Header */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: spacing[3],
        padding: spacing[3],
        borderBottom: `1px solid ${colors.border.subtle}`,
      }}
    >
      {Array.from({ length: columns }, (_, i) => (
        <Skeleton key={i} variant="text" width="80px" height="14px" />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div
        key={rowIndex}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: spacing[3],
          padding: spacing[3],
          borderBottom: `1px solid ${colors.border.subtle}`,
        }}
      >
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton key={colIndex} variant="text" width="100%" height="16px" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
