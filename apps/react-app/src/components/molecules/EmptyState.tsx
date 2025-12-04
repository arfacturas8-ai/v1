import React from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaIcon?: React.ReactNode;
  secondaryCtaLabel?: string;
  onCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
  illustrationUrl?: string;
  maxWidth?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  ctaLabel,
  ctaIcon,
  secondaryCtaLabel,
  onCtaClick,
  onSecondaryCtaClick,
  illustrationUrl,
  maxWidth = '400px',
}) => {
  const [ctaHovered, setCtaHovered] = React.useState(false);
  const [secondaryCtaHovered, setSecondaryCtaHovered] = React.useState(false);

  const defaultIcon = (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="38" stroke={colors.border.default} strokeWidth="4" strokeDasharray="8 8" />
      <circle cx="40" cy="40" r="24" fill={colors.bg.tertiary} />
      <path
        d="M40 28v24M28 40h24"
        stroke={colors.text.tertiary}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: spacing[8],
        maxWidth,
        margin: '0 auto',
      }}
    >
      {/* Illustration or Icon */}
      <div style={{ marginBottom: spacing[5] }}>
        {illustrationUrl ? (
          <img
            src={illustrationUrl}
            alt=""
            style={{
              width: '200px',
              height: '200px',
              objectFit: 'contain',
              opacity: 0.8,
            }}
          />
        ) : (
          <div style={{ opacity: 0.6 }}>{icon || defaultIcon}</div>
        )}
      </div>

      {/* Title */}
      <h3
        style={{
          margin: 0,
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.bold,
          fontFamily: typography.fontFamily.sans,
          color: colors.text.primary,
          marginBottom: description ? spacing[3] : spacing[5],
          lineHeight: typography.lineHeight.snug,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: typography.fontSize.base,
            fontFamily: typography.fontFamily.sans,
            color: colors.text.secondary,
            lineHeight: typography.lineHeight.relaxed,
            marginBottom: spacing[5],
            maxWidth: '90%',
          }}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(ctaLabel || secondaryCtaLabel) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing[3],
            alignItems: 'center',
            width: '100%',
          }}
        >
          {ctaLabel && onCtaClick && (
            <button
              type="button"
              onClick={onCtaClick}
              onMouseEnter={() => setCtaHovered(true)}
              onMouseLeave={() => setCtaHovered(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
                padding: `${spacing[3]} ${spacing[5]}`,
                backgroundColor: ctaHovered ? colors.brand.hover : colors.brand.primary,
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                fontFamily: typography.fontFamily.sans,
                border: 'none',
                borderRadius: radii.md,
                cursor: 'pointer',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                minWidth: '200px',
              }}
            >
              {ctaIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{ctaIcon}</span>}
              {ctaLabel}
            </button>
          )}

          {secondaryCtaLabel && onSecondaryCtaClick && (
            <button
              type="button"
              onClick={onSecondaryCtaClick}
              onMouseEnter={() => setSecondaryCtaHovered(true)}
              onMouseLeave={() => setSecondaryCtaHovered(false)}
              style={{
                padding: `${spacing[2]} ${spacing[4]}`,
                backgroundColor: 'transparent',
                color: secondaryCtaHovered ? colors.text.primary : colors.text.secondary,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                fontFamily: typography.fontFamily.sans,
                border: 'none',
                borderRadius: radii.md,
                cursor: 'pointer',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
            >
              {secondaryCtaLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
