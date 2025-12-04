import React, { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';
import Button from '../atoms/Button';

interface ComingSoonGateProps {
  feature: string;
  description: string;
  icon?: React.ReactNode;
  notifyOption?: boolean;
  mockupImage?: string;
  estimatedLaunch?: string;
  onNotifyMe?: (email: string) => void;
}

const ComingSoonGate: React.FC<ComingSoonGateProps> = ({
  feature,
  description,
  icon,
  notifyOption = true,
  mockupImage,
  estimatedLaunch,
  onNotifyMe,
}) => {
  const [email, setEmail] = useState('');
  const [isNotified, setIsNotified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotifyMe = async () => {
    if (!email || isSubmitting) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (onNotifyMe) {
      onNotifyMe(email);
    }

    setIsNotified(true);
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: spacing[8],
        textAlign: 'center',
      }}
    >
      {/* Icon */}
      {icon && (
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: radii.full,
            background: colors.brand.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing[4],
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          <div style={{ color: '#FFFFFF', transform: 'scale(1.5)' }}>{icon}</div>
        </div>
      )}

      {/* Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: spacing[2],
          padding: `${spacing[2]} ${spacing[3]}`,
          backgroundColor: colors.brand.primary + '20',
          border: `1px solid ${colors.brand.primary}40`,
          borderRadius: radii.full,
          marginBottom: spacing[3],
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: radii.full,
            backgroundColor: colors.brand.primary,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
        <span
          style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.brand.primary,
          }}
        >
          Coming Soon
        </span>
      </div>

      {/* Title */}
      <h2
        style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: spacing[3],
          maxWidth: '600px',
        }}
      >
        {feature}
      </h2>

      {/* Description */}
      <p
        style={{
          fontSize: typography.fontSize.base,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.relaxed,
          marginBottom: spacing[6],
          maxWidth: '500px',
        }}
      >
        {description}
      </p>

      {/* Estimated Launch */}
      {estimatedLaunch && (
        <div
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.tertiary,
            marginBottom: spacing[6],
          }}
        >
          Expected launch: <span style={{ color: colors.brand.primary, fontWeight: typography.fontWeight.semibold }}>{estimatedLaunch}</span>
        </div>
      )}

      {/* Mockup Image */}
      {mockupImage && (
        <div
          style={{
            width: '100%',
            maxWidth: '600px',
            height: '300px',
            borderRadius: radii.xl,
            backgroundColor: colors.bg.secondary,
            border: `1px solid ${colors.border.default}`,
            marginBottom: spacing[6],
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <img
            src={mockupImage}
            alt={`${feature} preview`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.6,
              filter: 'blur(2px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: `${spacing[3]} ${spacing[4]}`,
              backgroundColor: colors.bg.primary + 'CC',
              borderRadius: radii.lg,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            Preview
          </div>
        </div>
      )}

      {/* Notify Me Section */}
      {notifyOption && !isNotified && (
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div
            style={{
              display: 'flex',
              gap: spacing[3],
              marginBottom: spacing[3],
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: spacing[3],
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: radii.md,
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
                transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNotifyMe();
                }
              }}
            />
            <Button
              variant="primary"
              size="md"
              loading={isSubmitting}
              disabled={!email || isSubmitting}
              onClick={handleNotifyMe}
              icon={<Bell size={16} />}
            >
              Notify Me
            </Button>
          </div>
          <p
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.tertiary,
              margin: 0,
            }}
          >
            We'll send you an email when {feature.toLowerCase()} launches
          </p>
        </div>
      )}

      {/* Success Message */}
      {isNotified && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            padding: spacing[4],
            backgroundColor: colors.semantic.success + '20',
            border: `1px solid ${colors.semantic.success}40`,
            borderRadius: radii.lg,
            maxWidth: '400px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: radii.full,
              backgroundColor: colors.semantic.success,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Check size={20} color="#FFFFFF" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: spacing[1],
              }}
            >
              You're on the list!
            </div>
            <div
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
              }}
            >
              We'll notify you at {email}
            </div>
          </div>
        </div>
      )}

      {/* Features Preview (optional) */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ComingSoonGate;
