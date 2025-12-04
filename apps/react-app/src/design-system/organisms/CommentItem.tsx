import React, { useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Trash2, Flag } from 'lucide-react';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { colors, spacing, typography, radii } from '../tokens';

interface CommentItemProps {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  isAuthorVerified?: boolean;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked?: boolean;
  replyCount?: number;
  isOwnComment?: boolean;
  replies?: CommentItemProps[];
  depth?: number;
  onLike?: () => void;
  onReply?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onClick?: () => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  id,
  authorId,
  authorName,
  authorUsername,
  authorAvatar,
  isAuthorVerified = false,
  content,
  timestamp,
  likes,
  isLiked = false,
  replyCount = 0,
  isOwnComment = false,
  replies = [],
  depth = 0,
  onLike,
  onReply,
  onDelete,
  onReport,
  onClick,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReply?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete?.();
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onReport?.();
  };

  const maxDepth = 3;
  const isMaxDepth = depth >= maxDepth;
  const leftMargin = depth * 40;

  return (
    <div style={{ marginLeft: `${leftMargin}px` }}>
      <div
        onClick={onClick}
        style={{
          padding: spacing[3],
          borderRadius: radii.md,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'background-color 150ms ease-out',
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.backgroundColor = colors.bg.hover;
          }
        }}
        onMouseLeave={(e) => {
          if (onClick) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <div style={{ display: 'flex', gap: spacing[3] }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            <Avatar src={authorAvatar} alt={authorName} size="sm" fallback={authorName[0]} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Author info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], marginBottom: spacing[1], flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing[1] }}>
                <span
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                  }}
                >
                  {authorName}
                </span>
                {isAuthorVerified && <Badge variant="success" size="sm">✓</Badge>}
              </div>
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.tertiary,
                }}
              >
                @{authorUsername}
              </span>
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.tertiary,
                }}
              >
                •
              </span>
              <span
                style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.tertiary,
                }}
              >
                {formatTime(timestamp)}
              </span>
            </div>

            {/* Comment content */}
            <p
              style={{
                fontSize: typography.fontSize.base,
                color: colors.text.primary,
                lineHeight: typography.lineHeight.relaxed,
                marginBottom: spacing[2],
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[4] }}>
              {/* Like */}
              <button
                onClick={handleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1],
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: isLiked ? colors.semantic.error : colors.text.tertiary,
                  transition: 'color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.semantic.error;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isLiked ? colors.semantic.error : colors.text.tertiary;
                }}
              >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                {likes > 0 && <span style={{ fontSize: typography.fontSize.sm }}>{likes}</span>}
              </button>

              {/* Reply */}
              {!isMaxDepth && (
                <button
                  onClick={handleReply}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: colors.text.tertiary,
                    transition: 'color 150ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.brand.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.text.tertiary;
                  }}
                >
                  <MessageCircle size={16} />
                  <span style={{ fontSize: typography.fontSize.sm }}>Reply</span>
                </button>
              )}

              {/* Show replies toggle */}
              {replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: typography.fontSize.sm,
                    color: colors.brand.primary,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}

              {/* Menu */}
              <div style={{ marginLeft: 'auto', position: 'relative' }}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: spacing[1],
                    color: colors.text.tertiary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radii.sm,
                    transition: 'all 150ms ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                    e.currentTarget.style.color = colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.text.tertiary;
                  }}
                >
                  <MoreHorizontal size={16} />
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: spacing[1],
                      backgroundColor: colors.bg.elevated,
                      border: `1px solid ${colors.border.default}`,
                      borderRadius: radii.md,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      minWidth: '160px',
                      zIndex: 10,
                    }}
                  >
                    {isOwnComment && (
                      <button
                        onClick={handleDelete}
                        style={{
                          width: '100%',
                          padding: spacing[3],
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[2],
                          color: colors.semantic.error,
                          fontSize: typography.fontSize.sm,
                          transition: 'background-color 150ms ease-out',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.bg.hover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                    {!isOwnComment && (
                      <button
                        onClick={handleReport}
                        style={{
                          width: '100%',
                          padding: spacing[3],
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing[2],
                          color: colors.text.primary,
                          fontSize: typography.fontSize.sm,
                          transition: 'background-color 150ms ease-out',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.bg.hover;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Flag size={16} />
                        Report
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {showReplies && replies.length > 0 && (
        <div style={{ marginTop: spacing[2] }}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              {...reply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
