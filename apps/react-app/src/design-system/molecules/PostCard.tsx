import React from 'react';
import { colors, radii, spacing, shadows, typography } from '../tokens';
import { Avatar, Text, IconButton } from '../atoms';

interface PostCardProps {
  post: {
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
    repostCount: number;
    replyCount: number;
    bookmarkCount: number;
    isLiked?: boolean;
    isReposted?: boolean;
    isBookmarked?: boolean;
    media?: Array<{
      type: 'IMAGE' | 'VIDEO' | 'GIF';
      url: string;
      thumbnail?: string;
    }>;
    quotedPost?: {
      author: {
        username: string;
        displayName: string;
      };
      content: string;
    };
  };
  onLike?: () => void;
  onRepost?: () => void;
  onReply?: () => void;
  onBookmark?: () => void;
  onUserClick?: () => void;
  onPostClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onRepost,
  onReply,
  onBookmark,
  onUserClick,
  onPostClick,
  className = '',
  style,
}) => {
  const cardStyle: React.CSSProperties = {
    backgroundColor: colors['bg-secondary'],
    borderRadius: radii.lg,
    padding: spacing[4],
    border: `1px solid ${colors['border-subtle']}`,
    cursor: onPostClick ? 'pointer' : 'default',
    transition: 'all 150ms ease-out',
    ...style,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[3],
    marginBottom: spacing[3],
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
    marginBottom: spacing[3],
  };

  const mediaGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: post.media && post.media.length === 1 ? '1fr' : '1fr 1fr',
    gap: spacing[2],
    marginBottom: spacing[3],
    borderRadius: radii.md,
    overflow: 'hidden',
  };

  const mediaItemStyle: React.CSSProperties = {
    width: '100%',
    height: post.media && post.media.length === 1 ? '300px' : '150px',
    objectFit: 'cover',
    backgroundColor: colors['bg-tertiary'],
  };

  const quotedPostStyle: React.CSSProperties = {
    border: `1px solid ${colors['border-default']}`,
    borderRadius: radii.md,
    padding: spacing[3],
    marginBottom: spacing[3],
    backgroundColor: colors['bg-primary'],
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[6],
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
    <div
      className={className}
      style={cardStyle}
      onClick={onPostClick}
    >
      {/* Header: Avatar + User Info */}
      <div style={headerStyle}>
        <Avatar
          src={post.author.avatar}
          username={post.author.username}
          size="md"
          showVerified
          isVerified={post.author.isVerified}
          onClick={(e) => {
            e?.stopPropagation();
            onUserClick?.();
          }}
        />

        <div style={userInfoStyle}>
          <div style={nameRowStyle}>
            <Text
              size="base"
              weight="semibold"
              truncate
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                onUserClick?.();
              }}
            >
              {post.author.displayName}
            </Text>
            <Text variant="secondary" size="sm" truncate>
              @{post.author.username}
            </Text>
            <Text variant="secondary" size="sm">
              · {formatTime(post.createdAt)}
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
        <Text size="base" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {post.content}
        </Text>
      </div>

      {/* Media Grid */}
      {post.media && post.media.length > 0 && (
        <div style={mediaGridStyle}>
          {post.media.slice(0, 4).map((item, index) => (
            <img
              key={index}
              src={item.thumbnail || item.url}
              alt=""
              style={mediaItemStyle}
            />
          ))}
        </div>
      )}

      {/* Quoted Post */}
      {post.quotedPost && (
        <div style={quotedPostStyle}>
          <div style={{ marginBottom: spacing[1] }}>
            <Text size="sm" weight="semibold">
              {post.quotedPost.author.displayName}
            </Text>
            <Text variant="secondary" size="sm">
              {' '}@{post.quotedPost.author.username}
            </Text>
          </div>
          <Text size="sm" variant="secondary" numberOfLines={3}>
            {post.quotedPost.content}
          </Text>
        </div>
      )}

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
          {post.replyCount > 0 && (
            <Text variant="secondary" size="sm">
              {formatCount(post.replyCount)}
            </Text>
          )}
        </div>

        {/* Repost */}
        <div style={actionStyle}>
          <IconButton
            icon={<span style={{ color: post.isReposted ? colors['repost'] : 'inherit' }}>🔁</span>}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRepost?.();
            }}
          />
          {post.repostCount > 0 && (
            <Text
              variant="secondary"
              size="sm"
              style={{ color: post.isReposted ? colors['repost'] : 'inherit' }}
            >
              {formatCount(post.repostCount)}
            </Text>
          )}
        </div>

        {/* Like */}
        <div style={actionStyle}>
          <IconButton
            icon={<span style={{ color: post.isLiked ? colors['like'] : 'inherit' }}>❤️</span>}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onLike?.();
            }}
          />
          {post.likeCount > 0 && (
            <Text
              variant="secondary"
              size="sm"
              style={{ color: post.isLiked ? colors['like'] : 'inherit' }}
            >
              {formatCount(post.likeCount)}
            </Text>
          )}
        </div>

        {/* Bookmark */}
        <div style={actionStyle}>
          <IconButton
            icon={<span style={{ color: post.isBookmarked ? colors['bookmark'] : 'inherit' }}>🔖</span>}
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PostCard;
