import React from 'react';
import { Check, CheckCheck, Clock, Image as ImageIcon, File, Play } from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { colors, spacing, typography, radii } from '../tokens';

interface MessageBubbleProps {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  timestamp: Date;
  isOwnMessage?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  media?: {
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    thumbnail?: string;
    filename?: string;
  };
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  reactions?: {
    emoji: string;
    count: number;
    hasReacted: boolean;
  }[];
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onClick?: () => void;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  content,
  senderId,
  senderName,
  senderAvatar,
  timestamp,
  isOwnMessage = false,
  status = 'sent',
  media,
  replyTo,
  reactions = [],
  onReact,
  onReply,
  onClick,
  showAvatar = true,
}) => {
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderStatusIcon = () => {
    if (!isOwnMessage) return null;

    switch (status) {
      case 'sending':
        return <Clock size={12} color={colors.text.tertiary} />;
      case 'sent':
        return <Check size={12} color={colors.text.tertiary} />;
      case 'delivered':
        return <CheckCheck size={12} color={colors.text.tertiary} />;
      case 'read':
        return <CheckCheck size={12} color={colors.brand.primary} />;
      case 'failed':
        return <span style={{ fontSize: typography.fontSize.xs, color: colors.semantic.error }}>Failed</span>;
      default:
        return null;
    }
  };

  const renderMedia = () => {
    if (!media) return null;

    switch (media.type) {
      case 'image':
        return (
          <div
            style={{
              maxWidth: '300px',
              borderRadius: radii.md,
              overflow: 'hidden',
              marginBottom: content ? spacing[2] : 0,
              cursor: 'pointer',
            }}
            onClick={() => {
              // Open image viewer
            }}
          >
            <img
              src={media.url}
              alt="Shared image"
              style={{
                width: '100%',
                display: 'block',
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div
            style={{
              maxWidth: '300px',
              borderRadius: radii.md,
              overflow: 'hidden',
              marginBottom: content ? spacing[2] : 0,
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            {media.thumbnail ? (
              <img
                src={media.thumbnail}
                alt="Video thumbnail"
                style={{
                  width: '100%',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  backgroundColor: colors.bg.tertiary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Play size={48} color={colors.text.tertiary} />
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '56px',
                height: '56px',
                borderRadius: radii.full,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Play size={24} color="white" />
            </div>
          </div>
        );

      case 'file':
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing[3],
              padding: spacing[3],
              borderRadius: radii.md,
              backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.1)' : colors.bg.tertiary,
              marginBottom: content ? spacing[2] : 0,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: radii.sm,
                backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.2)' : colors.bg.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <File size={20} color={isOwnMessage ? 'white' : colors.text.secondary} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: isOwnMessage ? 'white' : colors.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {media.filename || 'File'}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderReplyTo = () => {
    if (!replyTo) return null;

    return (
      <div
        style={{
          padding: spacing[2],
          paddingLeft: spacing[3],
          borderLeft: `3px solid ${isOwnMessage ? 'rgba(255, 255, 255, 0.3)' : colors.brand.primary}`,
          backgroundColor: isOwnMessage ? 'rgba(255, 255, 255, 0.1)' : colors.bg.tertiary,
          borderRadius: radii.sm,
          marginBottom: spacing[2],
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: isOwnMessage ? 'rgba(255, 255, 255, 0.9)' : colors.brand.primary,
            marginBottom: spacing[1],
          }}
        >
          {replyTo.senderName}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.sm,
            color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : colors.text.secondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {replyTo.content}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        gap: spacing[2],
        marginBottom: spacing[3],
        alignItems: 'flex-end',
      }}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <Avatar src={senderAvatar} alt={senderName || 'User'} size="sm" fallback={(senderName || 'U')[0]} />
      )}

      {/* Spacer when no avatar */}
      {!showAvatar && !isOwnMessage && <div style={{ width: '32px' }} />}

      {/* Message bubble */}
      <div
        style={{
          maxWidth: '70%',
          minWidth: '60px',
        }}
      >
        {/* Sender name for group chats */}
        {!isOwnMessage && senderName && showAvatar && (
          <div
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.tertiary,
              marginBottom: spacing[1],
              marginLeft: spacing[2],
            }}
          >
            {senderName}
          </div>
        )}

        {/* Bubble content */}
        <div
          onClick={onClick}
          style={{
            padding: spacing[3],
            borderRadius: isOwnMessage ? `${radii.lg} ${radii.lg} ${radii.sm} ${radii.lg}` : `${radii.lg} ${radii.lg} ${radii.lg} ${radii.sm}`,
            backgroundColor: isOwnMessage ? colors.brand.primary : colors.bg.secondary,
            color: isOwnMessage ? 'white' : colors.text.primary,
            cursor: onClick ? 'pointer' : 'default',
            border: isOwnMessage ? 'none' : `1px solid ${colors.border.default}`,
          }}
        >
          {renderReplyTo()}
          {renderMedia()}
          {content && (
            <div
              style={{
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content}
            </div>
          )}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: spacing[1],
              marginTop: spacing[1],
              marginLeft: isOwnMessage ? 'auto' : spacing[2],
              marginRight: isOwnMessage ? spacing[2] : 'auto',
              flexWrap: 'wrap',
              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
            }}
          >
            {reactions.map((reaction, index) => (
              <button
                key={index}
                onClick={() => onReact?.(reaction.emoji)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1],
                  padding: `${spacing[1]} ${spacing[2]}`,
                  borderRadius: radii.full,
                  backgroundColor: reaction.hasReacted ? colors.brand.primary + '30' : colors.bg.tertiary,
                  border: reaction.hasReacted ? `1px solid ${colors.brand.primary}` : `1px solid ${colors.border.default}`,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
              >
                <span style={{ fontSize: typography.fontSize.sm }}>{reaction.emoji}</span>
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    color: reaction.hasReacted ? colors.brand.primary : colors.text.tertiary,
                  }}
                >
                  {reaction.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp and status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[1],
            marginTop: spacing[1],
            marginLeft: isOwnMessage ? 'auto' : spacing[2],
            marginRight: isOwnMessage ? spacing[2] : 'auto',
            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          }}
        >
          <span style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary }}>{formatTime(timestamp)}</span>
          {renderStatusIcon()}
        </div>
      </div>

      {/* Spacer for own messages */}
      {isOwnMessage && <div style={{ width: '32px' }} />}
    </div>
  );
};
