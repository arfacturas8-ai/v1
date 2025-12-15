/**
 * EditProfilePage - Edit own profile
 * Features:
 * - Avatar upload with crop modal
 * - Banner upload with crop modal
 * - Display name input with validation
 * - Username input with availability check and rules
 * - Bio textarea with character limit
 * - Website input with validation
 * - Location input
 * - Social links (Twitter, Instagram, Discord, GitHub)
 * - Save button with unsaved changes warning
 * - Loading state
 * - Success/error feedback
 * - Real-time validation
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  X,
  Check,
  AlertCircle,
  Loader,
  Upload,
  Twitter,
  Instagram,
  Github,
  MessageCircle,
  Link as LinkIcon,
  MapPin,
  User,
} from 'lucide-react';
import { colors, spacing, typography, radii, animation, shadows } from '../../design-system/tokens';

interface ProfileData {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatar: string;
  banner: string;
  socialLinks: {
    twitter: string;
    instagram: string;
    discord: string;
    github: string;
  };
}

interface ValidationError {
  field: string;
  message: string;
}

interface ImageCropData {
  type: 'avatar' | 'banner';
  imageUrl: string;
  file: File;
}

const MAX_BIO_LENGTH = 160;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_USERNAME_LENGTH = 30;
const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();

  const [initialProfile] = useState<ProfileData>({
    displayName: 'Sarah Anderson',
    username: 'sarahartist',
    bio: 'Digital artist & NFT creator. Building the future of Web3. 🎨✨',
    location: 'Los Angeles, CA',
    website: 'https://sarahartworks.com',
    avatar: 'https://i.pravatar.cc/300?u=sarah',
    banner: 'https://picsum.photos/1200/400?random=profile',
    socialLinks: {
      twitter: 'sarahartist',
      instagram: 'sarahartist',
      discord: '',
      github: '',
    },
  });

  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropData, setCropData] = useState<ImageCropData | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(profile.avatar);
  const [previewBanner, setPreviewBanner] = useState(profile.banner);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout>();

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(initialProfile);

  // Username availability check
  useEffect(() => {
    if (profile.username === initialProfile.username) {
      setUsernameAvailable(true);
      return;
    }

    if (!profile.username || !USERNAME_PATTERN.test(profile.username)) {
      setUsernameAvailable(null);
      return;
    }

    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    setIsCheckingUsername(true);

    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock check - some usernames are "taken"
        const takenUsernames = ['admin', 'test', 'user', 'crypto', 'nft'];
        const available = !takenUsernames.includes(profile.username.toLowerCase());

        setUsernameAvailable(available);
      } catch (err) {
        console.error('Username check failed:', err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [profile.username, initialProfile.username]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    setErrors((prev) => prev.filter((e) => e.field !== field));
  };

  const handleSocialLinkChange = (platform: keyof ProfileData['socialLinks'], value: string) => {
    setProfile((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const validateProfile = (): boolean => {
    const newErrors: ValidationError[] = [];

    // Display name
    if (!profile.displayName.trim()) {
      newErrors.push({ field: 'displayName', message: 'Display name is required' });
    } else if (profile.displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      newErrors.push({
        field: 'displayName',
        message: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or less`,
      });
    }

    // Username
    if (!profile.username.trim()) {
      newErrors.push({ field: 'username', message: 'Username is required' });
    } else if (profile.username.length > MAX_USERNAME_LENGTH) {
      newErrors.push({
        field: 'username',
        message: `Username must be ${MAX_USERNAME_LENGTH} characters or less`,
      });
    } else if (!USERNAME_PATTERN.test(profile.username)) {
      newErrors.push({
        field: 'username',
        message: 'Username can only contain lowercase letters, numbers, and underscores',
      });
    } else if (usernameAvailable === false) {
      newErrors.push({ field: 'username', message: 'Username is already taken' });
    }

    // Bio
    if (profile.bio.length > MAX_BIO_LENGTH) {
      newErrors.push({
        field: 'bio',
        message: `Bio must be ${MAX_BIO_LENGTH} characters or less`,
      });
    }

    // Website
    if (profile.website && !isValidUrl(profile.website)) {
      newErrors.push({ field: 'website', message: 'Please enter a valid URL' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageSelect = (type: 'avatar' | 'banner', file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCropData({
          type,
          imageUrl: e.target.result as string,
          file,
        });
        setShowCropModal(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    if (cropData?.type === 'avatar') {
      setPreviewAvatar(croppedImage);
      setProfile((prev) => ({ ...prev, avatar: croppedImage }));
    } else if (cropData?.type === 'banner') {
      setPreviewBanner(croppedImage);
      setProfile((prev) => ({ ...prev, banner: croppedImage }));
    }
    setShowCropModal(false);
    setCropData(null);
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      return;
    }

    setIsSaving(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log('Saving profile:', profile);

      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      // Navigate back after a short delay
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    navigate(-1);
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find((e) => e.field === field)?.message;
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
                borderRadius: radii.full,
                border: 'none',
                backgroundColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: `background-color ${animation.duration.fast}`,
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
            disabled={!hasChanges || isSaving || isCheckingUsername}
            style={{
              padding: `${spacing[2]} ${spacing[5]}`,
              borderRadius: radii.full,
              border: 'none',
              backgroundColor:
                hasChanges && !isSaving && !isCheckingUsername
                  ? colors.brand.primary
                  : colors.bg.tertiary,
              color:
                hasChanges && !isSaving && !isCheckingUsername ? 'white' : colors.text.tertiary,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor:
                hasChanges && !isSaving && !isCheckingUsername ? 'pointer' : 'not-allowed',
              transition: `all ${animation.duration.fast}`,
              display: 'flex',
              alignItems: 'center',
              gap: spacing[2],
            }}
          >
            Save
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
            backgroundImage: previewBanner ? `url(${previewBanner})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)',
            }}
          />
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageSelect('banner', file);
            }}
          />
          <button
            onClick={() => bannerInputRef.current?.click()}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '48px',
              height: '48px',
              borderRadius: radii.full,
              border: 'none',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: `background-color ${animation.duration.fast}`,
              zIndex: 10,
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
            {previewAvatar ? (
              <img
                src={previewAvatar}
                alt="Profile"
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: radii.full,
                  objectFit: 'cover',
                  border: `4px solid ${colors.bg.primary}`,
                  boxShadow: shadows.lg,
                }}
              />
            ) : (
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: radii.full,
                  border: `4px solid ${colors.bg.primary}`,
                  background: colors.brand.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: typography.fontSize['3xl'],
                  fontWeight: typography.fontWeight.bold,
                }}
              >
                {profile.displayName[0] || '?'}
              </div>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect('avatar', file);
              }}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '32px',
                height: '32px',
                borderRadius: radii.full,
                border: `2px solid ${colors.bg.primary}`,
                backgroundColor: colors.brand.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: shadows.md,
              }}
            >
              <Camera size={16} color="white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: spacing[4] }}>
          {/* Display Name */}
          <FormField
            label="Display name"
            value={profile.displayName}
            onChange={(value) => handleChange('displayName', value)}
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            error={getFieldError('displayName')}
            placeholder="Your display name"
            showCharCount
            icon={<User size={16} />}
          />

          {/* Username */}
          <FormField
            label="Username"
            value={profile.username}
            onChange={(value) =>
              handleChange('username', value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
            }
            maxLength={MAX_USERNAME_LENGTH}
            error={getFieldError('username')}
            placeholder="yourhandle"
            prefix="@"
            showCharCount
            helperText="Your username can only contain lowercase letters, numbers, and underscores"
            validationStatus={
              isCheckingUsername
                ? 'checking'
                : usernameAvailable === true && profile.username !== initialProfile.username
                ? 'success'
                : usernameAvailable === false
                ? 'error'
                : undefined
            }
          />

          {/* Bio */}
          <FormField
            label="Bio"
            value={profile.bio}
            onChange={(value) => handleChange('bio', value)}
            maxLength={MAX_BIO_LENGTH}
            error={getFieldError('bio')}
            placeholder="Tell people about yourself"
            multiline
            rows={4}
            showCharCount
          />

          {/* Location */}
          <FormField
            label="Location"
            value={profile.location}
            onChange={(value) => handleChange('location', value)}
            maxLength={30}
            placeholder="Where are you based?"
            icon={<MapPin size={16} />}
          />

          {/* Website */}
          <FormField
            label="Website"
            value={profile.website}
            onChange={(value) => handleChange('website', value)}
            error={getFieldError('website')}
            placeholder="https://your-website.com"
            type="url"
            icon={<LinkIcon size={16} />}
          />

          {/* Social Links */}
          <div style={{ marginTop: spacing[6] }}>
            <h3
              style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                marginBottom: spacing[4],
              }}
            >
              Social Links
            </h3>

            <FormField
              label="Twitter"
              value={profile.socialLinks.twitter}
              onChange={(value) => handleSocialLinkChange('twitter', value.replace('@', ''))}
              placeholder="username"
              prefix="@"
              icon={<Twitter size={16} />}
            />

            <FormField
              label="Instagram"
              value={profile.socialLinks.instagram}
              onChange={(value) => handleSocialLinkChange('instagram', value.replace('@', ''))}
              placeholder="username"
              prefix="@"
              icon={<Instagram size={16} />}
            />

            <FormField
              label="Discord"
              value={profile.socialLinks.discord}
              onChange={(value) => handleSocialLinkChange('discord', value)}
              placeholder="username#0000"
              icon={<MessageCircle size={16} />}
            />

            <FormField
              label="GitHub"
              value={profile.socialLinks.github}
              onChange={(value) => handleSocialLinkChange('github', value.replace('@', ''))}
              placeholder="username"
              icon={<Github size={16} />}
            />
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && cropData && (
        <ImageCropModal
          imageUrl={cropData.imageUrl}
          aspectRatio={cropData.type === 'avatar' ? 1 : 3}
          onComplete={handleCropComplete}
          onCancel={() => {
            setShowCropModal(false);
            setCropData(null);
          }}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div
          style={{
            position: 'fixed',
            bottom: spacing[6],
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors.semantic.success,
            color: 'white',
            padding: `${spacing[3]} ${spacing[6]}`,
            borderRadius: radii.full,
            boxShadow: shadows.xl,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            zIndex: 1000,
            animation: `slideUp ${animation.duration.normal} ${animation.easing.easeOut}`,
          }}
        >
          <Check size={20} />
          <span style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold }}>
            Profile updated successfully!
          </span>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Form Field Component
const FormField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  error?: string;
  placeholder?: string;
  type?: string;
  prefix?: string;
  multiline?: boolean;
  rows?: number;
  showCharCount?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
  validationStatus?: 'checking' | 'success' | 'error';
}> = ({
  label,
  value,
  onChange,
  maxLength,
  error,
  placeholder,
  type = 'text',
  prefix,
  multiline = false,
  rows = 1,
  showCharCount = false,
  helperText,
  icon,
  validationStatus,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: spacing[3],
    paddingLeft: prefix ? `calc(${spacing[3]} + 16px)` : icon ? `calc(${spacing[3]} + 24px)` : spacing[3],
    backgroundColor: colors.bg.secondary,
    border: `1px solid ${error ? colors.semantic.error : isFocused ? colors.brand.primary : colors.border.default}`,
    borderRadius: radii.lg,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.sans,
    outline: 'none',
    transition: `border-color ${animation.duration.fast}`,
    resize: multiline ? 'none' : undefined,
  };

  return (
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
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: spacing[3],
              top: multiline ? spacing[3] : '50%',
              transform: multiline ? 'none' : 'translateY(-50%)',
              color: colors.text.tertiary,
              pointerEvents: 'none',
            }}
          >
            {icon}
          </div>
        )}
        {prefix && (
          <span
            style={{
              position: 'absolute',
              left: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: typography.fontSize.base,
              color: colors.text.tertiary,
              pointerEvents: 'none',
            }}
          >
            {prefix}
          </span>
        )}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            rows={rows}
            placeholder={placeholder}
            style={inputStyle}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            style={inputStyle}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        )}
        {showCharCount && maxLength && (
          <span
            style={{
              position: 'absolute',
              right: spacing[3],
              top: multiline ? 'auto' : '50%',
              bottom: multiline ? spacing[3] : 'auto',
              transform: multiline ? 'none' : 'translateY(-50%)',
              fontSize: typography.fontSize.xs,
              color: value.length >= maxLength ? colors.semantic.error : colors.text.tertiary,
            }}
          >
            {value.length}/{maxLength}
          </span>
        )}
        {validationStatus && (
          <div
            style={{
              position: 'absolute',
              right: spacing[3],
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {validationStatus === 'checking' && <Loader size={16} className="spin" color={colors.text.tertiary} />}
            {validationStatus === 'success' && <Check size={16} color={colors.semantic.success} />}
            {validationStatus === 'error' && <AlertCircle size={16} color={colors.semantic.error} />}
          </div>
        )}
      </div>
      {error && (
        <div
          style={{
            marginTop: spacing[2],
            fontSize: typography.fontSize.xs,
            color: colors.semantic.error,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
          }}
        >
          <AlertCircle size={12} />
          {typeof error === 'string' ? error : 'An error occurred'}
        </div>
      )}
      {helperText && !error && (
        <p
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.tertiary,
            marginTop: spacing[2],
            margin: 0,
            marginTop: spacing[2],
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

// Simple Image Crop Modal (production apps should use a library like react-easy-crop)
const ImageCropModal: React.FC<{
  imageUrl: string;
  aspectRatio: number;
  onComplete: (croppedImage: string) => void;
  onCancel: () => void;
}> = ({ imageUrl, aspectRatio, onComplete, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);

  const handleCrop = () => {
    // In production, implement proper cropping logic
    // For now, just return the original image
    onComplete(imageUrl);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-tertiary)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: spacing[4],
          borderBottom: `1px solid ${colors.border.default}`,
        }}
      >
        <h2
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: 'white',
            margin: 0,
          }}
        >
          Crop Image
        </h2>
        <button
          onClick={onCancel}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: radii.full,
            border: 'none',
            backgroundColor: colors.bg.tertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={20} color={colors.text.primary} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing[6],
        }}
      >
        <img
          src={imageUrl}
          alt="Crop preview"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease',
          }}
        />
      </div>

      <div style={{ padding: spacing[4], borderTop: `1px solid ${colors.border.default}` }}>
        <div style={{ marginBottom: spacing[4] }}>
          <label
            style={{
              display: 'block',
              fontSize: typography.fontSize.sm,
              color: 'white',
              marginBottom: spacing[2],
            }}
          >
            Zoom: {Math.round(zoom * 100)}%
          </label>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: spacing[3] }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: `${spacing[3]} ${spacing[4]}`,
              borderRadius: radii.full,
              border: `1px solid ${colors.border.default}`,
              backgroundColor: 'transparent',
              color: 'white',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            style={{
              flex: 1,
              padding: `${spacing[3]} ${spacing[4]}`,
              borderRadius: radii.full,
              border: 'none',
              backgroundColor: colors.brand.primary,
              color: 'white',
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
