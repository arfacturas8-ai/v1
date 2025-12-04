import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Globe, Users } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface ListFormData {
  name: string;
  description: string;
  isPrivate: boolean;
}

export default function CreateListPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ListFormData>({
    name: '',
    description: '',
    isPrivate: false,
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleChange = (field: keyof ListFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;

    setIsCreating(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsCreating(false);
    navigate('/lists');
  };

  const canCreate = formData.name.trim().length > 0;

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
              onClick={() => navigate(-1)}
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
              Create a list
            </h1>
          </div>

          <button
            onClick={handleCreate}
            disabled={!canCreate || isCreating}
            style={{
              padding: `${spacing[2]} ${spacing[4]}`,
              borderRadius: '24px',
              border: 'none',
              backgroundColor: canCreate && !isCreating ? colors.brand.primary : colors.bg.tertiary,
              color: canCreate && !isCreating ? 'white' : colors.text.tertiary,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              cursor: canCreate && !isCreating ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease-out',
            }}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: spacing[4] }}>
        {/* List name */}
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
            List name
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Give your list a name"
              maxLength={25}
              autoFocus
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
              {characterCount(formData.name, 25)}
            </span>
          </div>
        </div>

        {/* Description */}
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
            Description
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="What is this list about?"
              maxLength={100}
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
              {characterCount(formData.description, 100)}
            </span>
          </div>
        </div>

        {/* Privacy settings */}
        <div style={{ marginBottom: spacing[4] }}>
          <h2
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.secondary,
              marginBottom: spacing[3],
            }}
          >
            Privacy
          </h2>

          {/* Public option */}
          <div
            onClick={() => handleChange('isPrivate', false)}
            style={{
              padding: spacing[4],
              backgroundColor: !formData.isPrivate ? colors.brand.primary + '10' : colors.bg.secondary,
              border: `2px solid ${!formData.isPrivate ? colors.brand.primary : colors.border.default}`,
              borderRadius: '12px',
              marginBottom: spacing[3],
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3] }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: !formData.isPrivate ? colors.brand.primary + '20' : colors.bg.tertiary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: !formData.isPrivate ? colors.brand.primary : colors.text.tertiary,
                  flexShrink: 0,
                }}
              >
                <Globe size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    marginBottom: spacing[1],
                  }}
                >
                  Public
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  Anyone can see this list and its members
                </div>
              </div>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${!formData.isPrivate ? colors.brand.primary : colors.border.default}`,
                  backgroundColor: !formData.isPrivate ? colors.brand.primary : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {!formData.isPrivate && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Private option */}
          <div
            onClick={() => handleChange('isPrivate', true)}
            style={{
              padding: spacing[4],
              backgroundColor: formData.isPrivate ? colors.brand.primary + '10' : colors.bg.secondary,
              border: `2px solid ${formData.isPrivate ? colors.brand.primary : colors.border.default}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 150ms ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3] }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: formData.isPrivate ? colors.brand.primary + '20' : colors.bg.tertiary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: formData.isPrivate ? colors.brand.primary : colors.text.tertiary,
                  flexShrink: 0,
                }}
              >
                <Lock size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    marginBottom: spacing[1],
                  }}
                >
                  Private
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  Only you can see this list and its members
                </div>
              </div>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${formData.isPrivate ? colors.brand.primary : colors.border.default}`,
                  backgroundColor: formData.isPrivate ? colors.brand.primary : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {formData.isPrivate && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.semantic.info + '10',
            borderRadius: '12px',
            border: `1px solid ${colors.border.default}`,
          }}
        >
          <div style={{ display: 'flex', gap: spacing[3] }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colors.semantic.info + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={20} color={colors.semantic.info} />
            </div>
            <div>
              <div
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing[1],
                }}
              >
                About lists
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, lineHeight: typography.lineHeight.relaxed }}>
                Lists let you organize accounts into groups. You'll see posts from list members in a dedicated timeline.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
