import React from 'react';
import { colors, radii, spacing, shadows, typography } from '../design-system/tokens';
import { Text, Button } from '../design-system';

interface ComingSoonGateProps {
  feature: string;
  description: string;
  icon?: React.ReactNode;
  notifyOption?: boolean;
  onBack?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ComingSoonGate: React.FC<ComingSoonGateProps> = ({
  feature,
  description,
  icon,
  notifyOption = true,
  onBack,
  className = '',
  style,
}) => {
  const [isNotified, setIsNotified] = React.useState(false);
  const [email, setEmail] = React.useState('');

  const handleNotify = () => {
    // Save interest to localStorage for now
    const notifications = JSON.parse(localStorage.getItem('coming_soon_notifications') || '{}');
    notifications[feature] = {
      email,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('coming_soon_notifications', JSON.stringify(notifications));
    setIsNotified(true);
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors['bg-primary'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    ...style,
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: colors['bg-secondary'],
    borderRadius: radii.xl,
    padding: spacing[8],
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    border: `1px solid ${colors['border-default']}`,
    boxShadow: shadows.lg,
  };

  const iconWrapperStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    margin: '0 auto',
    marginBottom: spacing[6],
    backgroundColor: colors['bg-elevated'],
    borderRadius: radii.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: spacing[3],
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.sans,
    color: colors['text-primary'],
    backgroundColor: colors['bg-tertiary'],
    border: `1px solid ${colors['border-default']}`,
    borderRadius: radii.md,
    outline: 'none',
    marginBottom: spacing[3],
    transition: `all ${colors}ms ease-out`,
  };

  const buttonRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
    marginTop: spacing[6],
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={cardStyle}>
        {/* Icon */}
        {icon && (
          <div style={iconWrapperStyle}>
            {icon}
          </div>
        )}

        {/* Coming Soon Badge */}
        <div style={{ marginBottom: spacing[4] }}>
          <span
            style={{
              display: 'inline-block',
              padding: `${spacing[1]} ${spacing[3]}`,
              backgroundColor: colors['brand-primary'],
              color: colors['text-primary'],
              borderRadius: radii.full,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Coming Soon
          </span>
        </div>

        {/* Feature Name */}
        <Text size="3xl" weight="bold" style={{ marginBottom: spacing[3] }}>
          {feature}
        </Text>

        {/* Description */}
        <Text
          size="lg"
          variant="secondary"
          style={{ marginBottom: spacing[6], lineHeight: '1.6' }}
        >
          {description}
        </Text>

        {/* Notify Me Section */}
        {notifyOption && !isNotified && (
          <div>
            <Text
              size="sm"
              variant="secondary"
              style={{ marginBottom: spacing[3] }}
            >
              Want to be the first to know when this launches?
            </Text>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors['border-focus'];
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors['border-default'];
              }}
            />
            <Button
              variant="primary"
              fullWidth
              onClick={handleNotify}
              disabled={!email || !/\S+@\S+\.\S+/.test(email)}
            >
              Notify Me
            </Button>
          </div>
        )}

        {/* Notified State */}
        {isNotified && (
          <div
            style={{
              padding: spacing[4],
              backgroundColor: colors['success-bg'],
              borderRadius: radii.md,
              border: `1px solid ${colors['success']}`,
            }}
          >
            <Text size="base" style={{ color: colors['success'] }} weight="semibold">
              ✓ You're on the list!
            </Text>
            <Text size="sm" variant="secondary" style={{ marginTop: spacing[1] }}>
              We'll notify you when {feature} launches.
            </Text>
          </div>
        )}

        {/* Action Buttons */}
        <div style={buttonRowStyle}>
          {onBack && (
            <Button
              variant="outline"
              fullWidth
              onClick={onBack}
            >
              Go Back
            </Button>
          )}
          <Button
            variant="ghost"
            fullWidth
            onClick={() => window.location.href = '/home'}
          >
            Explore CRYB
          </Button>
        </div>

        {/* Footer Text */}
        <Text
          size="xs"
          variant="muted"
          style={{ marginTop: spacing[6] }}
        >
          Building the future of social Web3 🚀
        </Text>
      </div>
    </div>
  );
};

export default ComingSoonGate;
