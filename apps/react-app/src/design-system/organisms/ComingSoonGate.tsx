/**
 * ComingSoonGate Organism Component
 * Gates features that are designed but not yet implemented
 * Used for social-first approach - crypto features designed but behind gate
 */

import React from 'react';
import { colors, spacing, radii, typography, shadows } from '../tokens';
import { Button } from '../atoms/Button';
import { Text } from '../atoms/Text';

export interface ComingSoonGateProps {
  /**
   * Feature name to display
   */
  feature: string;

  /**
   * Description of the feature
   */
  description?: string;

  /**
   * Icon or image to display
   */
  icon?: React.ReactNode;

  /**
   * Callback when user wants to be notified
   */
  onNotifyMe?: () => void;

  /**
   * Show as inline banner vs full-page overlay
   */
  variant?: 'banner' | 'overlay' | 'card';

  /**
   * Custom style
   */
  style?: React.CSSProperties;

  className?: string;
}

export const ComingSoonGate: React.FC<ComingSoonGateProps> = ({
  feature,
  description,
  icon,
  onNotifyMe,
  variant = 'overlay',
  className,
  style,
}) => {
  const [notified, setNotified] = React.useState(false);

  const handleNotify = () => {
    if (onNotifyMe) {
      onNotifyMe();
      setNotified(true);
    }
  };

  if (variant === 'banner') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing[4],
          backgroundColor: colors['bg-elevated'],
          border: `1px solid ${colors['border-default']}`,
          borderRadius: radii.lg,
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
          {icon && (
            <div
              style={{
                fontSize: '32px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <Text variant="body" size="lg" weight="semibold">
              {feature} - Coming Soon
            </Text>
            {description && (
              <Text variant="caption" size="sm" color="text-secondary">
                {description}
              </Text>
            )}
          </div>
        </div>
        {onNotifyMe && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNotify}
            disabled={notified}
          >
            {notified ? ' Notified' : 'Notify Me'}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[8],
          backgroundColor: colors['bg-secondary'],
          border: `1px solid ${colors['border-default']}`,
          borderRadius: radii.xl,
          textAlign: 'center',
          ...style,
        }}
      >
        {icon && (
          <div
            style={{
              fontSize: '64px',
              marginBottom: spacing[4],
              opacity: 0.8,
            }}
          >
            {icon}
          </div>
        )}
        <Text variant="body" size="2xl" weight="bold" style={{ marginBottom: spacing[2] }}>
          {feature}
        </Text>
        <Text variant="caption" size="base" color="text-secondary" style={{ marginBottom: spacing[4], maxWidth: '400px' }}>
          {description || 'This feature is currently under development and will be available soon.'}
        </Text>
        <div style={{ display: 'flex', gap: spacing[3] }}>
          {onNotifyMe && (
            <Button
              variant="primary"
              onClick={handleNotify}
              disabled={notified}
            >
              {notified ? ' You\'ll be notified' : 'Notify Me When Ready'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Overlay variant (default)
  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors['overlay-backdrop'],
        backdropFilter: 'blur(8px)',
        zIndex: 1100, // Modal layer
        padding: spacing[6],
        ...style,
      }}
    >
      <div
        style={{
          backgroundColor: colors['bg-elevated'],
          borderRadius: radii['2xl'],
          padding: spacing[8],
          maxWidth: '500px',
          width: '100%',
          boxShadow: shadows['2xl'],
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {icon && (
          <div
            style={{
              fontSize: '96px',
              marginBottom: spacing[6],
              background: colors['brand-gradient'],
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {icon}
          </div>
        )}

        <div
          style={{
            display: 'inline-block',
            padding: `${spacing[1]} ${spacing[3]}`,
            backgroundColor: colors['brand-primary'],
            borderRadius: radii.full,
            marginBottom: spacing[4],
          }}
        >
          <Text variant="overline" size="xs" color="text-primary" weight="bold">
            COMING SOON
          </Text>
        </div>

        <Text variant="body" size="3xl" weight="bold" style={{ marginBottom: spacing[3] }}>
          {feature}
        </Text>

        <Text
          variant="body"
          size="base"
          color="text-secondary"
          style={{
            marginBottom: spacing[6],
            lineHeight: '1.6',
          }}
        >
          {description ||
            'We\'re working hard to bring you this amazing feature. It\'s designed and ready - we\'re just putting the finishing touches on it!'}
        </Text>

        <div style={{ display: 'flex', gap: spacing[3], width: '100%' }}>
          {onNotifyMe && (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNotify}
              disabled={notified}
            >
              {notified ? ' You\'ll be notified!' : 'Notify Me When It Launches'}
            </Button>
          )}
        </div>

        <Text
          variant="caption"
          size="sm"
          color="text-tertiary"
          style={{ marginTop: spacing[4] }}
        >
          We'll send you an update as soon as it's ready
        </Text>
      </div>
    </div>
  );
};

/**
 * Wrapper component that conditionally shows ComingSoonGate or children
 */
export interface GatedFeatureProps {
  /**
   * Whether the feature is enabled
   */
  enabled: boolean;

  /**
   * Props to pass to ComingSoonGate when feature is disabled
   */
  gateProps: Omit<ComingSoonGateProps, 'variant'>;

  /**
   * Variant of the gate to show
   */
  gateVariant?: 'banner' | 'overlay' | 'card';

  /**
   * Content to show when feature is enabled
   */
  children: React.ReactNode;
}

export const GatedFeature: React.FC<GatedFeatureProps> = ({
  enabled,
  gateProps,
  gateVariant = 'card',
  children,
}) => {
  if (!enabled) {
    return <ComingSoonGate {...gateProps} variant={gateVariant} />;
  }

  return <>{children}</>;
};

export default ComingSoonGate;
