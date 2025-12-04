import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pin, Trash2 } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface PinnedMessage {
  id: string;
  content: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  pinnedAt: string;
  originalTimestamp: string;
  pinnedBy: {
    username: string;
    displayName: string;
  };
}

const mockPinnedMessages: PinnedMessage[] = [
  {
    id: '1',
    content: 'Important: Our team meeting is scheduled for tomorrow at 2 PM. Please prepare your progress reports and be ready to discuss blockers.',
    author: {
      username: 'alice_dev',
      displayName: 'Alice Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=alice_dev',
    },
    pinnedAt: '2024-01-15T14:30:00Z',
    originalTimestamp: '2024-01-15T10:00:00Z',
    pinnedBy: {
      username: 'bob_designer',
      displayName: 'Bob Smith',
    },
  },
  {
    id: '2',
    content: 'Project repository: https://github.com/team/project\nDocs: https://docs.project.com\nSlack: #project-team',
    author: {
      username: 'bob_designer',
      displayName: 'Bob Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=bob_designer',
    },
    pinnedAt: '2024-01-10T09:00:00Z',
    originalTimestamp: '2024-01-01T08:00:00Z',
    pinnedBy: {
      username: 'alice_dev',
      displayName: 'Alice Johnson',
    },
  },
  {
    id: '3',
    content: 'Welcome to the team! Here are some resources to get you started:\n1. Team handbook\n2. Code style guide\n3. Development environment setup',
    author: {
      username: 'alice_dev',
      displayName: 'Alice Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=alice_dev',
    },
    pinnedAt: '2024-01-05T12:00:00Z',
    originalTimestamp: '2023-12-20T10:00:00Z',
    pinnedBy: {
      username: 'alice_dev',
      displayName: 'Alice Johnson',
    },
  },
];

export default function PinnedMessagesPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const [messages, setMessages] = useState<PinnedMessage[]>(mockPinnedMessages);

  const handleUnpin = (messageId: string) => {
    if (window.confirm('Unpin this message?')) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
              Pinned messages
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {messages.length} {messages.length === 1 ? 'message' : 'messages'} pinned
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div
              key={message.id}
              style={{
                padding: spacing[4],
                borderBottom: index < messages.length - 1 ? `1px solid ${colors.border.default}` : 'none',
              }}
            >
              {/* Author info */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing[3], marginBottom: spacing[3] }}>
                <img
                  src={message.author.avatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${message.author.username}`}
                  alt={message.author.displayName}
                  onClick={() => navigate(`/user/${message.author.username}`)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1] }}>
                    <span
                      onClick={() => navigate(`/user/${message.author.username}`)}
                      style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary,
                        cursor: 'pointer',
                      }}
                    >
                      {message.author.displayName}
                    </span>
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      {formatTimestamp(message.originalTimestamp)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnpin(message.id)}
                  style={{
                    padding: spacing[2],
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: colors.text.tertiary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 150ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.semantic.error + '10';
                    e.currentTarget.style.color = colors.semantic.error;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.text.tertiary;
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Message content */}
              <div
                style={{
                  padding: spacing[3],
                  backgroundColor: colors.bg.secondary,
                  borderRadius: '12px',
                  borderLeft: `3px solid ${colors.brand.primary}`,
                  marginBottom: spacing[3],
                }}
              >
                <p
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.primary,
                    margin: 0,
                    lineHeight: typography.lineHeight.relaxed,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </p>
              </div>

              {/* Pin info */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[2],
                  paddingLeft: `calc(40px + ${spacing[3]})`,
                }}
              >
                <Pin size={14} color={colors.text.tertiary} style={{ transform: 'rotate(45deg)' }} />
                <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>
                  Pinned by {message.pinnedBy.displayName} • {formatTimestamp(message.pinnedAt)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: spacing[8],
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                marginBottom: spacing[4],
              }}
            >
              <Pin size={40} color={colors.text.tertiary} style={{ transform: 'rotate(45deg)' }} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No pinned messages
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              Pin important messages to keep them easily accessible at the top of your conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
