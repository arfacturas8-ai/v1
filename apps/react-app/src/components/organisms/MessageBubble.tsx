/**
 * CRYB Design System - MessageBubble Organism
 * Chat message with text, media, reactions, timestamp, and read receipt
 */

import React, { useState } from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';
import { formatRelativeTime } from '../../lib/utils';

// Icons
const CheckIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path
      d="M11.6667 3.5L5.25 9.91667L2.33333 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DoubleCheckIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path
      d="M11.6667 3.5L5.25 9.91667L2.33333 7M7.58333 9.91667L14 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ReplyIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M8 13.3333V9.33333C11.3137 9.33333 13.3333 10.6667 14.6667 13.3333C14.6667 8 12 6 8 6V2L2 7.33333L8 13.3333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MoreIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    <circle cx="3.2" cy="8" r="1.2" fill="currentColor" />
    <circle cx="12.8" cy="8" r="1.2" fill="currentColor" />
  </svg>
);

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  isReactedByMe?: boolean;
}

export interface MessageMedia {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnail?: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface ReplyToMessage {
  id: string;
  author: string;
  content: string;
}

export interface MessageBubbleProps {
  id: string;
  content: string;
  timestamp: Date;
  isMine: boolean;
  author?: {
    name: string;
    avatar?: string;
  };
  media?: MessageMedia[];
  reactions?: MessageReaction[];
  replyTo?: ReplyToMessage;
  isRead?: boolean;
  isDelivered?: boolean;
  isSending?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  loading?: boolean;
  error?: string;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onMore?: () => void;
  onMediaClick?: (media: MessageMedia) => void;
  groupWithPrevious?: boolean;
  groupWithNext?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  content,
  timestamp,
  isMine,
  author,
  media = [],
  reactions = [],
  replyTo,
  isRead = false,
  isDelivered = false,
  isSending = false,
  isEdited = false,
  isDeleted = false,
  showAvatar = true,
  showTimestamp = true,
  loading = false,
  error,
  onReact,
  onReply,
  onMore,
  onMediaClick,
  groupWithPrevious = false,
  groupWithNext = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const bubbleColor = isMine ? colors.brand.primary : colors.bg.tertiary;
  const textColor = isMine ? '#FFFFFF' : colors.text.primary;

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginBottom: spacing[2],
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            backgroundColor: colors.bg.tertiary,
            borderRadius: radii.lg,
            padding: spacing[3],
            opacity: 0.5,
          }}
        >
          <div
            style={{
              width: '200px',
              height: '16px',
              backgroundColor: colors.bg.elevated,
              borderRadius: radii.sm,
            }}
          />
        </div>
      </div>
    );
  }

  if (isDeleted) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          marginBottom: groupWithNext ? spacing[1] : spacing[3],
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            padding: spacing[3],
            fontStyle: 'italic',
            color: colors.text.tertiary,
            fontSize: typography.fontSize.sm,
          }}
        >
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        marginBottom: groupWithNext ? spacing[1] : spacing[3],
        alignItems: 'flex-end',
        gap: spacing[2],
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar (for received messages) */}
      {!isMine && showAvatar && !groupWithNext && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: radii.full,
            overflow: 'hidden',
            backgroundColor: colors.bg.tertiary,
            flexShrink: 0,
            marginBottom: spacing[1],
          }}
        >
          {author?.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
              }}
            >
              {author?.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Spacer for grouped messages */}
      {!isMine && groupWithNext && <div style={{ width: '32px', flexShrink: 0 }} />}

      {/* Message Container */}
      <div
        style={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isMine ? 'flex-end' : 'flex-start',
          gap: spacing[1],
        }}
      >
        {/* Author Name (for received messages in group chats) */}
        {!isMine && !groupWithPrevious && author && (
          <span
            style={{
              color: colors.text.tertiary,
              fontSize: typography.fontSize.xs,
              paddingLeft: spacing[3],
            }}
          >
            {author.name}
          </span>
        )}

        {/* Message Bubble */}
        <div
          style={{
            position: 'relative',
            backgroundColor: error ? colors.semantic.error : bubbleColor,
            borderRadius: radii.lg,
            borderTopRightRadius: isMine && !groupWithPrevious ? radii.sm : undefined,
            borderTopLeftRadius: !isMine && !groupWithPrevious ? radii.sm : undefined,
            borderBottomRightRadius: isMine && !groupWithNext ? radii.sm : undefined,
            borderBottomLeftRadius: !isMine && !groupWithNext ? radii.sm : undefined,
            overflow: 'hidden',
            opacity: isSending ? 0.6 : 1,
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
        >
          {/* Reply Context */}
          {replyTo && (
            <div
              style={{
                padding: spacing[2],
                paddingLeft: spacing[3],
                borderLeft: `3px solid ${isMine ? 'rgba(255, 255, 255, 0.3)' : colors.border.strong}`,
                backgroundColor: isMine ? 'rgba(0, 0, 0, 0.1)' : colors.bg.secondary,
                margin: spacing[2],
                marginBottom: spacing[1],
                borderRadius: radii.sm,
              }}
            >
              <div
                style={{
                  color: isMine ? 'rgba(255, 255, 255, 0.7)' : colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.semibold,
                  marginBottom: spacing[1],
                }}
              >
                {replyTo.author}
              </div>
              <div
                style={{
                  color: isMine ? 'rgba(255, 255, 255, 0.6)' : colors.text.secondary,
                  fontSize: typography.fontSize.sm,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {replyTo.content}
              </div>
            </div>
          )}

          {/* Media */}
          {media.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: media.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                gap: spacing[1],
                padding: spacing[2],
                paddingBottom: content ? 0 : spacing[2],
              }}
            >
              {media.map((item) => (
                <div
                  key={item.id}
                  style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    backgroundColor: isMine ? 'rgba(0, 0, 0, 0.1)' : colors.bg.secondary,
                    borderRadius: radii.md,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onClick={() => onMediaClick?.(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onMediaClick?.(item);
                    }
                  }}
                >
                  {item.type === 'image' && !imageErrors[item.id] ? (
                    <img
                      src={item.thumbnail || item.url}
                      alt={item.name || 'Image'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={() => {
                        setImageErrors(prev => ({ ...prev, [item.id]: true }));
                      }}
                      loading="lazy"
                    />
                  ) : item.type === 'file' ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        padding: spacing[3],
                        gap: spacing[2],
                        color: textColor,
                      }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14 2V8H20"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div style={{ fontSize: typography.fontSize.xs }}>
                        {item.name}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {/* Message Content */}
          {content && (
            <div
              style={{
                padding: spacing[3],
                color: textColor,
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content}
            </div>
          )}

          {/* Reactions */}
          {reactions.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: spacing[1],
                padding: spacing[2],
                paddingTop: 0,
              }}
            >
              {reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => onReact?.(reaction.emoji)}
                  style={{
                    background: reaction.isReactedByMe
                      ? isMine
                        ? 'rgba(255, 255, 255, 0.2)'
                        : colors.brand.primary
                      : isMine
                      ? 'rgba(0, 0, 0, 0.1)'
                      : colors.bg.secondary,
                    border: reaction.isReactedByMe ? `1px solid ${isMine ? 'rgba(255, 255, 255, 0.3)' : colors.brand.primary}` : 'none',
                    borderRadius: radii.full,
                    padding: `${spacing[1]} ${spacing[2]}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    cursor: 'pointer',
                    fontSize: typography.fontSize.xs,
                    color: textColor,
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  aria-label={`React with ${reaction.emoji}`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            paddingLeft: isMine ? 0 : spacing[3],
            paddingRight: isMine ? spacing[3] : 0,
          }}
        >
          {/* Timestamp */}
          {showTimestamp && (
            <span
              style={{
                color: colors.text.tertiary,
                fontSize: typography.fontSize.xs,
              }}
            >
              {formatRelativeTime(timestamp)}
              {isEdited && ' (edited)'}
            </span>
          )}

          {/* Read Receipt (for sent messages) */}
          {isMine && (
            <div
              style={{
                color: isRead ? colors.brand.primary : colors.text.tertiary,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {isSending ? (
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    border: `2px solid ${colors.text.tertiary}`,
                    borderTopColor: 'transparent',
                    borderRadius: radii.full,
                    animation: 'spin 1s linear infinite',
                  }}
                />
              ) : isDelivered ? (
                <DoubleCheckIcon />
              ) : (
                <CheckIcon />
              )}
            </div>
          )}

          {/* Actions (shown on hover) */}
          {isHovered && !isSending && (
            <div
              style={{
                display: 'flex',
                gap: spacing[1],
                opacity: isHovered ? 1 : 0,
                transition: `opacity ${animation.duration.fast} ${animation.easing.easeOut}`,
              }}
            >
              {onReply && (
                <button
                  onClick={onReply}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.text.tertiary,
                    cursor: 'pointer',
                    padding: spacing[1],
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: radii.sm,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.text.tertiary;
                  }}
                  aria-label="Reply to message"
                >
                  <ReplyIcon size={14} />
                </button>
              )}
              {onMore && (
                <button
                  onClick={onMore}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.text.tertiary,
                    cursor: 'pointer',
                    padding: spacing[1],
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: radii.sm,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.text.tertiary;
                  }}
                  aria-label="More options"
                >
                  <MoreIcon size={14} />
                </button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <span
              style={{
                color: colors.semantic.error,
                fontSize: typography.fontSize.xs,
              }}
            >
              Failed to send
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
