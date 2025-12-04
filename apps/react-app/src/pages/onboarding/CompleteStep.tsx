import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Home, Share2 } from 'lucide-react';
import { Button } from '../../design-system/atoms/Button';
import { colors, spacing, typography, radii } from '../../design-system/tokens';

interface CompleteStepProps {
  username?: string;
  displayName?: string;
}

export const CompleteStep: React.FC<CompleteStepProps> = ({ username = 'user', displayName = 'User' }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/@${username}`;
    if (navigator.share) {
      navigator.share({
        title: `Check out my CRYB profile!`,
        text: `Follow me on CRYB`,
        url: profileUrl,
      });
    } else {
      navigator.clipboard.writeText(profileUrl);
      // Show toast: "Profile link copied!"
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing[8], textAlign: 'center' }}>
      <div
        style={{
          width: '120px',
          height: '120px',
          margin: '0 auto',
          marginBottom: spacing[8],
          borderRadius: radii.full,
          backgroundColor: `${colors.semantic.success}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'successPulse 2s ease-in-out',
        }}
      >
        <CheckCircle size={64} color={colors.semantic.success} />
      </div>

      <h1
        style={{
          fontSize: typography.fontSize['4xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: spacing[4],
        }}
      >
        You're all set, {displayName}!
      </h1>

      <p
        style={{
          fontSize: typography.fontSize.xl,
          color: colors.text.secondary,
          lineHeight: typography.lineHeight.relaxed,
          marginBottom: spacing[8],
        }}
      >
        Your CRYB profile is ready. Start exploring, connecting, and creating in the Web3 social space.
      </p>

      <div
        style={{
          padding: spacing[6],
          borderRadius: radii.lg,
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.border.default}`,
          marginBottom: spacing[8],
        }}
      >
        <h3
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            marginBottom: spacing[4],
          }}
        >
          What's next?
        </h3>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          <div style={{ display: 'flex', gap: spacing[3] }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: radii.full,
                backgroundColor: colors.brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#FFFFFF',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              1
            </div>
            <div>
              <p style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
                Explore your personalized feed
              </p>
              <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                Discover content from creators you follow
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing[3] }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: radii.full,
                backgroundColor: colors.brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#FFFFFF',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              2
            </div>
            <div>
              <p style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
                Create your first post
              </p>
              <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                Share your thoughts with the community
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: spacing[3] }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: radii.full,
                backgroundColor: colors.brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#FFFFFF',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
              }}
            >
              3
            </div>
            <div>
              <p style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.medium, color: colors.text.primary }}>
                Join communities
              </p>
              <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                Connect with like-minded people
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: spacing[3], justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button onClick={handleGoHome} size="lg" leftIcon={<Home size={20} />} style={{ minWidth: '200px' }}>
          Go to Home
        </Button>
        <Button variant="outline" onClick={handleShareProfile} size="lg" leftIcon={<Share2 size={20} />}>
          Share Profile
        </Button>
      </div>

      <style>
        {`
          @keyframes successPulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.9;
            }
          }
        `}
      </style>
    </div>
  );
};
