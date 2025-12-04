import React, { useState } from 'react';
import { User, Camera, Check, X } from 'lucide-react';
import { Button } from '../../design-system/atoms/Button';
import { Input } from '../../design-system/atoms/Input';
import { Avatar } from '../../design-system/atoms/Avatar';
import { colors, spacing, typography, radii } from '../../design-system/tokens';

interface CreateProfileStepProps {
  onNext: () => void;
}

export const CreateProfileStep: React.FC<CreateProfileStepProps> = ({ onNext }) => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const checkUsernameAvailability = (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    // Simulate API check
    setTimeout(() => {
      setUsernameAvailable(value !== 'admin' && value !== 'cryb');
      setIsCheckingUsername(false);
    }, 500);
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
    checkUsernameAvailability(sanitized);
  };

  const isValid = username.length >= 3 && username.length <= 15 && displayName.length > 0 && usernameAvailable;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing[8] }}>
      <div style={{ textAlign: 'center', marginBottom: spacing[8] }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto',
            marginBottom: spacing[6],
            borderRadius: radii.full,
            backgroundColor: colors.bg.elevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <User size={40} color={colors.brand.primary} />
        </div>
        <h1
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing[3],
          }}
        >
          Create Your Profile
        </h1>
        <p
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            lineHeight: typography.lineHeight.relaxed,
          }}
        >
          Tell us a bit about yourself
        </p>
      </div>

      <div style={{ marginBottom: spacing[8] }}>
        {/* Avatar Upload */}
        <div style={{ textAlign: 'center', marginBottom: spacing[6] }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              src={avatar}
              alt={displayName || 'Profile'}
              size="xl"
              fallback={displayName?.[0] || 'U'}
            />
            <button
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colors.brand.primary,
                border: `3px solid ${colors.bg.primary}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#FFFFFF',
              }}
            >
              <Camera size={20} />
            </button>
          </div>
          <p style={{ marginTop: spacing[2], fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
            Click to upload profile picture
          </p>
        </div>

        {/* Username */}
        <div style={{ marginBottom: spacing[4] }}>
          <label
            style={{
              display: 'block',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing[2],
            }}
          >
            Username *
          </label>
          <div style={{ position: 'relative' }}>
            <Input
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Enter username"
              style={{ paddingLeft: spacing[8] }}
            />
            <span
              style={{
                position: 'absolute',
                left: spacing[3],
                top: '50%',
                transform: 'translateY(-50%)',
                color: colors.text.tertiary,
              }}
            >
              @
            </span>
            {username.length >= 3 && (
              <span
                style={{
                  position: 'absolute',
                  right: spacing[3],
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                {isCheckingUsername ? (
                  <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>Checking...</span>
                ) : usernameAvailable ? (
                  <Check size={20} color={colors.semantic.success} />
                ) : (
                  <X size={20} color={colors.semantic.error} />
                )}
              </span>
            )}
          </div>
          <p style={{ marginTop: spacing[1], fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
            3-15 characters, alphanumeric and underscores only
          </p>
          {username.length >= 3 && !usernameAvailable && !isCheckingUsername && (
            <p style={{ marginTop: spacing[1], fontSize: typography.fontSize.xs, color: colors.semantic.error }}>
              Username not available
            </p>
          )}
        </div>

        {/* Display Name */}
        <div style={{ marginBottom: spacing[4] }}>
          <label
            style={{
              display: 'block',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing[2],
            }}
          >
            Display Name *
          </label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter display name"
          />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: spacing[6] }}>
          <label
            style={{
              display: 'block',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              marginBottom: spacing[2],
            }}
          >
            Bio (optional)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            placeholder="Tell us about yourself..."
            maxLength={160}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: spacing[3],
              borderRadius: radii.md,
              border: `1px solid ${colors.border.default}`,
              backgroundColor: colors.bg.secondary,
              color: colors.text.primary,
              fontSize: typography.fontSize.base,
              fontFamily: typography.fontFamily.sans,
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <p style={{ marginTop: spacing[1], fontSize: typography.fontSize.xs, color: colors.text.tertiary, textAlign: 'right' }}>
            {bio.length}/160
          </p>
        </div>

        <Button onClick={onNext} disabled={!isValid} fullWidth size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
};
