import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, MessageCircle, Repeat2, UserPlus, AtSign, Bell, CheckCircle } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface NotificationFilter {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const initialFilters: NotificationFilter[] = [
  {
    id: 'likes',
    label: 'Likes',
    description: 'When someone likes your posts',
    icon: <Heart size={20} />,
    enabled: true,
  },
  {
    id: 'comments',
    label: 'Comments',
    description: 'When someone comments on your posts',
    icon: <MessageCircle size={20} />,
    enabled: true,
  },
  {
    id: 'reposts',
    label: 'Reposts',
    description: 'When someone reposts your content',
    icon: <Repeat2 size={20} />,
    enabled: true,
  },
  {
    id: 'mentions',
    label: 'Mentions',
    description: 'When someone mentions you in a post',
    icon: <AtSign size={20} />,
    enabled: true,
  },
  {
    id: 'follows',
    label: 'New followers',
    description: 'When someone follows you',
    icon: <UserPlus size={20} />,
    enabled: true,
  },
  {
    id: 'community_posts',
    label: 'Community posts',
    description: 'New posts in communities you follow',
    icon: <Bell size={20} />,
    enabled: false,
  },
  {
    id: 'community_invites',
    label: 'Community invites',
    description: 'When you are invited to join a community',
    icon: <CheckCircle size={20} />,
    enabled: true,
  },
];

export default function NotificationFilterPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<NotificationFilter[]>(initialFilters);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const handleToggleFilter = (filterId: string) => {
    setFilters((prev) =>
      prev.map((filter) =>
        filter.id === filterId ? { ...filter, enabled: !filter.enabled } : filter
      )
    );
  };

  const enabledCount = filters.filter((f) => f.enabled).length;

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
            padding: spacing[4],
            gap: spacing[3],
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
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
            <ArrowLeft size={20} color={colors.text.primary} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0,
              }}
            >
              Notification preferences
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {enabledCount} of {filters.length} enabled
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Global settings */}
        <div
          style={{
            padding: spacing[4],
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[3],
            }}
          >
            Notification channels
          </h2>

          {/* Push notifications */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing[4],
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing[1],
                }}
              >
                Push notifications
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                Receive notifications on your device
              </div>
            </div>
            <button
              onClick={() => setPushEnabled(!pushEnabled)}
              style={{
                width: '48px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: pushEnabled ? colors.brand.primary : colors.bg.tertiary,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-out',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: pushEnabled ? '22px' : '2px',
                  transition: 'left 150ms ease-out',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              />
            </button>
          </div>

          {/* Email notifications */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing[1],
                }}
              >
                Email notifications
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                Receive notifications via email
              </div>
            </div>
            <button
              onClick={() => setEmailEnabled(!emailEnabled)}
              style={{
                width: '48px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: emailEnabled ? colors.brand.primary : colors.bg.tertiary,
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-out',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: emailEnabled ? '22px' : '2px',
                  transition: 'left 150ms ease-out',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              />
            </button>
          </div>
        </div>

        {/* Notification types */}
        <div
          style={{
            padding: spacing[4],
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <h2
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[3],
            }}
          >
            Notification types
          </h2>

          {filters.map((filter, index) => (
            <div
              key={filter.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[3],
                padding: `${spacing[3]} 0`,
                borderBottom: index < filters.length - 1 ? `1px solid ${colors.border.default}` : 'none',
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: filter.enabled ? colors.brand.primary + '20' : colors.bg.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: filter.enabled ? colors.brand.primary : colors.text.tertiary,
                  flexShrink: 0,
                }}
              >
                {filter.icon}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                    marginBottom: spacing[1],
                  }}
                >
                  {filter.label}
                </div>
                <div
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.tertiary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {filter.description}
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => handleToggleFilter(filter.id)}
                style={{
                  width: '48px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: filter.enabled ? colors.brand.primary : colors.bg.tertiary,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease-out',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: filter.enabled ? '22px' : '2px',
                    transition: 'left 150ms ease-out',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div
          style={{
            padding: spacing[4],
            backgroundColor: colors.semantic.info + '10',
            borderBottom: `1px solid ${colors.border.default}`,
          }}
        >
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              margin: 0,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            You can customize which notifications you receive. Disabled notifications will not be sent via push or email.
          </p>
        </div>
      </div>
    </div>
  );
}
