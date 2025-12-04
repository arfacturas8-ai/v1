import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Edit, Trash2, Send } from 'lucide-react';
import { colors, spacing, typography } from '../design-system/tokens';

interface ScheduledMessage {
  id: string;
  content: string;
  recipientUsername: string;
  recipientDisplayName: string;
  recipientAvatar?: string;
  scheduledFor: string;
  createdAt: string;
}

const mockScheduledMessages: ScheduledMessage[] = [
  {
    id: '1',
    content: 'Hey! Just wanted to follow up on our meeting. Let me know when you have time to discuss the project details.',
    recipientUsername: 'alice_dev',
    recipientDisplayName: 'Alice Johnson',
    recipientAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=alice_dev',
    scheduledFor: '2024-01-16T09:00:00Z',
    createdAt: '2024-01-15T14:30:00Z',
  },
  {
    id: '2',
    content: 'Happy birthday! Hope you have an amazing day! 🎉',
    recipientUsername: 'bob_designer',
    recipientDisplayName: 'Bob Smith',
    recipientAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=bob_designer',
    scheduledFor: '2024-01-20T08:00:00Z',
    createdAt: '2024-01-15T10:15:00Z',
  },
  {
    id: '3',
    content: 'Reminder: We have a meeting tomorrow at 2 PM. Please prepare the slides.',
    recipientUsername: 'carol_crypto',
    recipientDisplayName: 'Carol Martinez',
    recipientAvatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=carol_crypto',
    scheduledFor: '2024-01-17T14:00:00Z',
    createdAt: '2024-01-14T16:45:00Z',
  },
];

export default function ScheduledMessagesPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ScheduledMessage[]>(mockScheduledMessages);

  const handleDelete = (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled message?')) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  const handleSendNow = (messageId: string) => {
    if (window.confirm('Send this message now instead of waiting?')) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      // In real app, would send the message immediately
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `in ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    if (diffHours < 24) return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    if (diffDays < 7) return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()
  );

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
              Scheduled messages
            </h1>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary, margin: 0 }}>
              {messages.length} {messages.length === 1 ? 'message' : 'messages'} scheduled
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {sortedMessages.length > 0 ? (
          sortedMessages.map((message) => (
            <div
              key={message.id}
              style={{
                padding: spacing[4],
                borderBottom: `1px solid ${colors.border.default}`,
              }}
            >
              {/* Recipient info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], marginBottom: spacing[3] }}>
                <img
                  src={message.recipientAvatar || `https://api.dicebear.com/7.x/avataaars/png?seed=${message.recipientUsername}`}
                  alt={message.recipientDisplayName}
                  onClick={() => navigate(`/user/${message.recipientUsername}`)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    onClick={() => navigate(`/user/${message.recipientUsername}`)}
                    style={{
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      cursor: 'pointer',
                      marginBottom: spacing[1],
                    }}
                  >
                    {message.recipientDisplayName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
                    <Clock size={14} color={colors.text.tertiary} />
                    <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>
                      Scheduled for {formatDateTime(message.scheduledFor)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message content */}
              <div
                style={{
                  padding: spacing[3],
                  backgroundColor: colors.bg.secondary,
                  borderRadius: '12px',
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

              {/* Actions */}
              <div style={{ display: 'flex', gap: spacing[2] }}>
                <button
                  onClick={() => handleSendNow(message.id)}
                  style={{
                    flex: 1,
                    padding: `${spacing[2]} ${spacing[3]}`,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border.default}`,
                    backgroundColor: colors.bg.secondary,
                    color: colors.brand.primary,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[2],
                    transition: 'all 150ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.brand.primary + '10';
                    e.currentTarget.style.borderColor = colors.brand.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.secondary;
                    e.currentTarget.style.borderColor = colors.border.default;
                  }}
                >
                  <Send size={16} />
                  Send now
                </button>
                <button
                  onClick={() => navigate(`/messages/scheduled/${message.id}/edit`)}
                  style={{
                    padding: `${spacing[2]} ${spacing[3]}`,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border.default}`,
                    backgroundColor: colors.bg.secondary,
                    color: colors.text.primary,
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[2],
                    transition: 'all 150ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.secondary;
                  }}
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(message.id)}
                  style={{
                    padding: `${spacing[2]} ${spacing[3]}`,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border.default}`,
                    backgroundColor: colors.bg.secondary,
                    color: colors.semantic.error,
                    fontSize: typography.fontSize.sm,
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
                  <Trash2 size={16} />
                  Delete
                </button>
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
              <Clock size={40} color={colors.text.tertiary} />
            </div>
            <h2
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[2],
              }}
            >
              No scheduled messages
            </h2>
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, maxWidth: '400px', margin: '0 auto' }}>
              Schedule messages to be sent at a specific time in the future.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
