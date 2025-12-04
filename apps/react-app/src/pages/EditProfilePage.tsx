import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface ProfileData {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatar: string;
  banner: string;
}

const initialProfile: ProfileData = {
  displayName: 'John Developer',
  username: 'johndoe',
  bio: 'Full-stack developer | Tech enthusiast | Building cool stuff with React and Node.js',
  location: 'San Francisco, CA',
  website: 'https://johndoe.dev',
  avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=johndoe',
  banner: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1500',
};

export default function EditProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
    navigate(-1);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate(-1);
  };

  const characterCount = (text: string, max: number) => {
    return `${text.length}/${max}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing[4],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
            <button
              onClick={handleCancel}
              aria-label="Cancel"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={20} color={colors.text.primary} />
            </button>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Edit profile
            </h1>
          </div>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: 'none',
              backgroundColor: hasChanges && !isSaving ? colors.brand.primary : colors.bg.tertiary,
              color: hasChanges && !isSaving ? 'white' : colors.text.tertiary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: hasChanges && !isSaving ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease-out',
            }}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Banner */}
        <div
          style={{
            position: 'relative',
            height: '200px',
            backgroundColor: colors.bg.secondary,
            backgroundImage: profile.banner ? `url(${profile.banner})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <button
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            }}
          >
            <Camera size={20} color="white" />
          </button>
        </div>

        {/* Avatar */}
        <div
          style={{
            position: 'relative',
            marginTop: '-48px',
            marginLeft: spacing[4],
            marginBottom: spacing[4],
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '96px',
              height: '96px',
            }}
          >
            <img
              src={profile.avatar}
              alt={profile.displayName}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `4px solid ${colors.bg.primary}`,
              }}
            />
            <button
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: `2px solid ${colors.bg.primary}`,
                backgroundColor: colors.brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Camera size={16} color="white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: spacing[4] }}>
          {/* Display Name */}
          <div style={{ marginBottom: spacing[4] }}>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
                marginBottom: spacing[2],
              }}
            >
              Display name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => handleChange('displayName', e.target.value)}
                maxLength={50}
                style={{
                  width: '100%',
                  padding: spacing[3],
                  backgroundColor: colors.bg.secondary,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '12px',
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.default;
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: spacing[3],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                {characterCount(profile.displayName, 50)}
              </span>
            </div>
          </div>

          {/* Username */}
          <div style={{ marginBottom: spacing[4] }}>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
                marginBottom: spacing[2],
              }}
            >
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: spacing[3],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: typography.fontSize.base,
                  color: colors.text.tertiary,
                }}
              >
                @
              </span>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => handleChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                maxLength={30}
                style={{
                  width: '100%',
                  padding: spacing[3],
                  paddingLeft: `calc(${spacing[3]} + 16px)`,
                  backgroundColor: colors.bg.secondary,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '12px',
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.default;
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: spacing[3],
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                {characterCount(profile.username, 30)}
              </span>
            </div>
            <p style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginTop: spacing[2], margin: 0 }}>
              Your username can only contain lowercase letters, numbers, and underscores
            </p>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: spacing[4] }}>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
                marginBottom: spacing[2],
              }}
            >
              Bio
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={profile.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                maxLength={160}
                rows={4}
                style={{
                  width: '100%',
                  padding: spacing[3],
                  backgroundColor: colors.bg.secondary,
                  border: `1px solid ${colors.border.default}`,
                  borderRadius: '12px',
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.brand.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.default;
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  right: spacing[3],
                  bottom: spacing[3],
                  fontSize: typography.fontSize.xs,
                  color: colors.text.tertiary,
                }}
              >
                {characterCount(profile.bio, 160)}
              </span>
            </div>
          </div>

          {/* Location */}
          <div style={{ marginBottom: spacing[4] }}>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
                marginBottom: spacing[2],
              }}
            >
              Location
            </label>
            <input
              type="text"
              value={profile.location}
              onChange={(e) => handleChange('location', e.target.value)}
              maxLength={30}
              placeholder="Where are you based?"
              style={{
                width: '100%',
                padding: spacing[3],
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            />
          </div>

          {/* Website */}
          <div style={{ marginBottom: spacing[4] }}>
            <label
              style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.secondary,
                marginBottom: spacing[2],
              }}
            >
              Website
            </label>
            <input
              type="url"
              value={profile.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://your-website.com"
              style={{
                width: '100%',
                padding: spacing[3],
                backgroundColor: colors.bg.secondary,
                border: `1px solid ${colors.border.default}`,
                borderRadius: '12px',
                color: colors.text.primary,
                fontSize: typography.fontSize.base,
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.brand.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
