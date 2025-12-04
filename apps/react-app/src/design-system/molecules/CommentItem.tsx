import React from 'react';
import { colors, radii, spacing } from '../tokens';
import { Avatar, Text, IconButton } from '../atoms';

interface CommentItemProps {
  comment: {
    id: string;
    author: {
      username: string;
      displayName: string;
      avatar?: string;
      isVerified?: boolean;
    };
    content: string;
    createdAt: Date | string;
    likeCount: number;
    replyCount: number;
    isLiked?: boolean;
    depth?: number;
  };
  onLike?: () => void;
  onReply?: () => void;
  onUserClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onLike,
  onReply,
  onUserClick,
  className = '',
  style,
}) => {
  const depth = comment.depth || 0;
  const indentSize = Math.min(depth * 20, 60); // Max 3 levels of indent

  const containerStyle: React.CSSProperties = {
    backgroundColor: colors['bg-secondary'],
    borderRadius: radii.md,
    padding: spacing[3],
    marginLeft: `${indentSize}px`,
    border: `1px solid ${colors['border-subtle']}`,
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[2],
  };

  const userInfoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const nameRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const contentStyle: React.CSSProperties = {
    marginBottom: spacing[2],
    paddingLeft: '40px', // Align with avatar
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[4],
    paddingLeft: '40px',
  };

  const actionStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[1],
  };

  const formatTime = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return `${seconds}s`;
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  };

  const formatCount = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <div className={className} style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <Avatar
          src={comment.author.avatar}
          username={comment.author.username}
          size="sm"
          showVerified
          isVerified={comment.author.isVerified}
          onClick={onUserClick}
        />

        <div style={userInfoStyle}>
          <div style={nameRowStyle}>
            <Text
              size="sm"
              weight="semibold"
              truncate
              style={{ cursor: 'pointer' }}
              onClick={onUserClick}
            >
              {comment.author.displayName}
            </Text>
            <Text variant="secondary" size="xs" truncate>
              @{comment.author.username}
            </Text>
            <Text variant="secondary" size="xs">
              · {formatTime(comment.createdAt)}
            </Text>
          </div>
        </div>

        <IconButton
          icon={<span>⋯</span>}
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Handle more options
          }}
        />
      </div>

      {/* Content */}
      <div style={contentStyle}>
        <Text size="sm" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {comment.content}
        </Text>
      </div>

      {/* Actions */}
      <div style={actionsStyle}>
        {/* Reply */}
        <div style={actionStyle}>
          <IconButton
            icon={<span>💬</span>}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReply?.();
            }}
          />
          {comment.replyCount > 0 && (
            <Text variant="secondary" size="xs">
              {formatCount(comment.replyCount)}
            </Text>
          )}
        </div>

        {/* Like */}
        <div style={actionStyle}>
          <IconButton
            icon={
              <span style={{ color: comment.isLiked ? colors['like'] : 'inherit' }}>
                {comment.isLiked ? '❤️' : '🤍'}
              </span>
            }
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onLike?.();
            }}
          />
          {comment.likeCount > 0 && (
            <Text
              variant="secondary"
              size="xs"
              style={{ color: comment.isLiked ? colors['like'] : 'inherit' }}
            >
              {formatCount(comment.likeCount)}
            </Text>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
