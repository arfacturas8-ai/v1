import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Search, Image as ImageIcon, File, LogOut, Trash2, UserX } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface ConversationMember {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  isVerified: boolean;
}

const mockMembers: ConversationMember[] = [
  {
    id: '1',
    username: 'alice_dev',
    displayName: 'Alice Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=alice_dev',
    isVerified: true,
  },
  {
    id: '2',
    username: 'bob_designer',
    displayName: 'Bob Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=bob_designer',
    isVerified: false,
  },
  {
    id: '3',
    username: 'you',
    displayName: 'You',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=you',
    isVerified: true,
  },
];

export default function ConversationInfoPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [members] = useState<ConversationMember[]>(mockMembers);
  const [conversationName] = useState('Project Team');
  const [muteNotifications, setMuteNotifications] = useState(false);
  const [searchInConversation, setSearchInConversation] = useState(false);

  const isGroupChat = members.length > 2;

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
          <h1
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0,
            }}
          >
            Conversation info
          </h1>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Conversation header */}
        {isGroupChat && (
          <div
            style={{
              padding: spacing[6],
              textAlign: 'center',
              borderBottom: `1px solid ${colors.border.default}`,
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: colors.brand.primary + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[3],
                fontSize: typography.fontSize['2xl'],
              }}
            >
              {conversationName.charAt(0).toUpperCase()}
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              {conversationName}
            </h2>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {members.length} members
            </p>
          </div>
        )}

        {/* Settings */}
        <div style={{ borderBottom: `1px solid ${colors.border.default}` }}>
          {/* Mute notifications */}
          <div
            onClick={() => setMuteNotifications(!muteNotifications)}
            style={{
              padding: spacing[4],
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
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
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {muteNotifications ? (
                <BellOff size={20} color={colors.text.tertiary} />
              ) : (
                <Bell size={20} color={colors.text.tertiary} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}
              >
                {muteNotifications ? 'Unmute notifications' : 'Mute notifications'}
              </div>
            </div>
          </div>

          {/* Search in conversation */}
          <div
            onClick={() => setSearchInConversation(true)}
            style={{
              padding: spacing[4],
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
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
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Search size={20} color={colors.text.tertiary} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}
              >
                Search in conversation
              </div>
            </div>
          </div>
        </div>

        {/* Shared content */}
        <div style={{ borderBottom: `1px solid ${colors.border.default}` }}>
          {/* Shared media */}
          <div
            onClick={() => navigate(`/conversations/${conversationId}/media`)}
            style={{
              padding: spacing[4],
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
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
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ImageIcon size={20} color={colors.text.tertiary} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}
              >
                Shared media
              </div>
            </div>
          </div>

          {/* Shared files */}
          <div
            onClick={() => navigate(`/conversations/${conversationId}/files`)}
            style={{
              padding: spacing[4],
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
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
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <File size={20} color={colors.text.tertiary} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}
              >
                Shared files
              </div>
            </div>
          </div>
        </div>

        {/* Members */}
        {isGroupChat && (
          <div style={{ borderBottom: `1px solid ${colors.border.default}` }}>
            <div style={{ padding: `${spacing[4]} ${spacing[4]} ${spacing[2]}` }}>
              <h3
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.tertiary,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Members
              </h3>
            </div>
            {members.map((member) => (
              <div
                key={member.id}
                onClick={() => member.username !== 'you' && navigate(`/user/${member.username}`)}
                style={{
                  padding: spacing[4],
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[3],
                  cursor: member.username !== 'you' ? 'pointer' : 'default',
                  transition: 'background-color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  if (member.username !== 'you') {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <img
                  src={member.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${member.username}`}
                  alt={member.displayName}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <span
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                      }}
                    >
                      {member.displayName}
                    </span>
                    {member.isVerified && (
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: `0 ${spacing[1]}`,
                          backgroundColor: colors.semantic.success,
                          borderRadius: '2px',
                          fontSize: typography.fontSize.xs,
                          color: 'white',
                          fontWeight: typography.fontWeight.bold,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                    @{member.username}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Danger zone */}
        <div style={{ padding: spacing[4] }}>
          {isGroupChat ? (
            <>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to leave this conversation?')) {
                    navigate('/messages');
                  }
                }}
                style={{
                  width: '100%',
                  padding: spacing[4],
                  marginBottom: spacing[3],
                  borderRadius: '12px',
                  border: `1px solid ${colors.border.default}`,
                  backgroundColor: colors.bg.secondary,
                  color: colors.semantic.error,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing[2],
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.semantic.error + '10';
                  e.currentTarget.style.borderColor = colors.semantic.error;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.bg.secondary;
                  e.currentTarget.style.borderColor = colors.border.default;
                }}
              >
                <LogOut size={20} />
                Leave conversation
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to block this user?')) {
                  navigate('/messages');
                }
              }}
              style={{
                width: '100%',
                padding: spacing[4],
                marginBottom: spacing[3],
                borderRadius: '12px',
                border: `1px solid ${colors.border.default}`,
                backgroundColor: colors.bg.secondary,
                color: colors.semantic.error,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing[2],
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.semantic.error + '10';
                e.currentTarget.style.borderColor = colors.semantic.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.secondary;
                e.currentTarget.style.borderColor = colors.border.default;
              }}
            >
              <UserX size={20} />
              Block user
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
                navigate('/messages');
              }
            }}
            style={{
              width: '100%',
              padding: spacing[4],
              borderRadius: '12px',
              border: `1px solid ${colors.border.default}`,
              backgroundColor: colors.bg.secondary,
              color: colors.semantic.error,
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing[2],
              transition: 'all 150ms ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.semantic.error + '10';
              e.currentTarget.style.borderColor = colors.semantic.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
              e.currentTarget.style.borderColor = colors.border.default;
            }}
          >
            <Trash2 size={20} />
            Delete conversation
          </button>
        </div>
      </div>
    </div>
  );
}
