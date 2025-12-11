/**
 * CRYB Design System - CommentItem Organism
 * Comment with author, content, timestamp, like, reply, and nested replies
 */

import React, { useState } from 'react';
import { colors, spacing, typography, radii, animation } from '../../design-system/tokens';
import { formatRelativeTime, formatNumber } from '../../lib/utils';
import Button from '../atoms/Button';

// Icons
const HeartIcon: React.FC<{ filled?: boolean; size?: number }> = ({ filled = false, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M8 14L7.06 13.155C3.52 10.005 1.33333 8.085 1.33333 5.66667C1.33333 3.74667 2.8 2.28 4.72 2.28C5.76 2.28 6.76 2.74 7.42 3.52C8.08 2.74 9.08 2.28 10.12 2.28C12.04 2.28 13.5067 3.74667 13.5067 5.66667C13.5067 8.085 11.32 10.005 7.78 13.1617L8 14Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
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

const VerifiedIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path
      d="M4.9 7L6.3 8.4L9.1 5.6M12.6 7C12.6 10.0927 10.0927 12.6 7 12.6C3.90721 12.6 1.4 10.0927 1.4 7C1.4 3.90721 3.90721 1.4 7 1.4C10.0927 1.4 12.6 3.90721 12.6 7Z"
      stroke={colors.brand.primary}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={colors.brand.primary}
    />
  </svg>
);

const ChevronDownIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path
      d="M4 6L8 10L12 6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface CommentAuthor {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
  isOP?: boolean;
}

export interface CommentItemProps {
  id: string;
  author: CommentAuthor;
  content: string;
  timestamp: Date;
  likes?: number;
  isLiked?: boolean;
  replies?: CommentItemProps[];
  replyCount?: number;
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  loading?: boolean;
  error?: string;
  depth?: number;
  maxDepth?: number;
  onLike?: () => void;
  onReply?: () => void;
  onMore?: () => void;
  onAuthorClick?: () => void;
  onLoadMoreReplies?: () => void;
  showReplies?: boolean;
  variant?: 'default' | 'compact';
}

const CommentItem: React.FC<CommentItemProps> = ({
  id,
  author,
  content,
  timestamp,
  likes = 0,
  isLiked = false,
  replies = [],
  replyCount = 0,
  isEdited = false,
  isDeleted = false,
  isPinned = false,
  loading = false,
  error,
  depth = 0,
  maxDepth = 3,
  onLike,
  onReply,
  onMore,
  onAuthorClick,
  onLoadMoreReplies,
  showReplies = true,
  variant = 'default',
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [showNestedReplies, setShowNestedReplies] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleLike = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike?.();
  };

  const isCompact = variant === 'compact';
  const canNest = depth < maxDepth;
  const hasReplies = replies.length > 0 || replyCount > 0;
  const displayReplyCount = replyCount || replies.length;

  if (loading) {
    return null;
  }

  if (isDeleted) {
    return (
      <div
        style={{
          padding: spacing[3],
          color: colors.text.tertiary,
          fontSize: typography.fontSize.sm,
          fontStyle: 'italic',
          borderLeft: depth > 0 ? `2px solid ${colors.border.subtle}` : 'none',
          marginLeft: depth > 0 ? spacing[4] : 0,
          paddingLeft: depth > 0 ? spacing[4] : spacing[3],
        }}
      >
        [Comment deleted]
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: spacing[3],
          color: colors.semantic.error,
          fontSize: typography.fontSize.sm,
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        borderLeft: depth > 0 ? `2px solid ${colors.border.subtle}` : 'none',
        marginLeft: depth > 0 ? spacing[4] : 0,
        paddingLeft: depth > 0 ? spacing[4] : 0,
      }}
    >
      <div
        style={{
          padding: isCompact ? spacing[2] : spacing[3],
          backgroundColor: isHovered ? colors.bg.tertiary : 'transparent',
          borderRadius: radii.md,
          transition: `background-color ${animation.duration.fast} ${animation.easing.easeOut}`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={{ display: 'flex', gap: spacing[3] }}>
          {/* Avatar */}
          <div
            style={{
              width: isCompact ? '28px' : '36px',
              height: isCompact ? '28px' : '36px',
              borderRadius: radii.full,
              overflow: 'hidden',
              backgroundColor: colors.bg.tertiary,
              flexShrink: 0,
              cursor: onAuthorClick ? 'pointer' : 'default',
            }}
            onClick={onAuthorClick}
            role={onAuthorClick ? 'button' : undefined}
            tabIndex={onAuthorClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onAuthorClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onAuthorClick();
              }
            }}
          >
            {author.avatar && !avatarError ? (
              <img
                src={author.avatar}
                alt={author.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setAvatarError(true)}
                loading="lazy"
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
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing[2],
                marginBottom: spacing[1],
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  color: colors.text.primary,
                  fontSize: isCompact ? typography.fontSize.sm : typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: onAuthorClick ? 'pointer' : 'default',
                }}
                onClick={onAuthorClick}
                role={onAuthorClick ? 'button' : undefined}
                tabIndex={onAuthorClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onAuthorClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onAuthorClick();
                  }
                }}
              >
                {author.name}
              </span>

              {author.verified && <VerifiedIcon size={isCompact ? 12 : 14} />}

              {author.isOP && (
                <span
                  style={{
                    backgroundColor: colors.brand.primary,
                    color: '#FFFFFF',
                    fontSize: typography.fontSize.xs,
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: radii.sm,
                    fontWeight: typography.fontWeight.semibold,
                  }}
                >
                  OP
                </span>
              )}

              {isPinned && (
                <span
                  style={{
                    backgroundColor: colors.bg.elevated,
                    color: colors.text.secondary,
                    fontSize: typography.fontSize.xs,
                    padding: `${spacing[1]} ${spacing[2]}`,
                    borderRadius: radii.sm,
                    fontWeight: typography.fontWeight.medium,
                  }}
                >
                  Pinned
                </span>
              )}

              <span
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.xs,
                }}
              >
                {formatRelativeTime(timestamp)}
                {isEdited && ' (edited)'}
              </span>

              {/* More Button */}
              {onMore && (
                <button
                  onClick={onMore}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: colors.text.tertiary,
                    cursor: 'pointer',
                    padding: spacing[1],
                    borderRadius: radii.sm,
                    display: 'flex',
                    alignItems: 'center',
                    opacity: isHovered ? 1 : 0,
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.text.primary;
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = colors.text.tertiary;
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label="More options"
                >
                  <MoreIcon size={14} />
                </button>
              )}
            </div>

            {/* Comment Content */}
            <p
              style={{
                color: colors.text.primary,
                fontSize: isCompact ? typography.fontSize.sm : typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                marginBottom: spacing[2],
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {content}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
              {/* Like Button */}
              <button
                onClick={handleLike}
                style={{
                  background: 'none',
                  border: 'none',
                  color: liked ? colors.semantic.error : colors.text.tertiary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing[1],
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  padding: spacing[1],
                  borderRadius: radii.sm,
                  transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                }}
                onMouseEnter={(e) => {
                  if (!liked) {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label={`${liked ? 'Unlike' : 'Like'} comment`}
                aria-pressed={liked}
              >
                <HeartIcon filled={liked} size={14} />
                {likeCount > 0 && <span>{formatNumber(likeCount)}</span>}
              </button>

              {/* Reply Button */}
              {onReply && (
                <button
                  onClick={onReply}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.text.tertiary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    padding: spacing[1],
                    borderRadius: radii.sm,
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                    e.currentTarget.style.color = colors.text.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.text.tertiary;
                  }}
                  aria-label="Reply to comment"
                >
                  <ReplyIcon size={14} />
                  <span>Reply</span>
                </button>
              )}

              {/* Show Replies Button */}
              {hasReplies && showReplies && canNest && (
                <button
                  onClick={() => setShowNestedReplies(!showNestedReplies)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.brand.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing[1],
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    padding: spacing[1],
                    borderRadius: radii.sm,
                    transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.bg.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  aria-label={showNestedReplies ? 'Hide replies' : 'Show replies'}
                  aria-expanded={showNestedReplies}
                >
                  <div
                    style={{
                      transform: showNestedReplies ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: `transform ${animation.duration.fast} ${animation.easing.easeOut}`,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronDownIcon size={14} />
                  </div>
                  <span>
                    {showNestedReplies ? 'Hide' : 'Show'} {formatNumber(displayReplyCount)}{' '}
                    {displayReplyCount === 1 ? 'reply' : 'replies'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && showNestedReplies && canNest && replies.length > 0 && (
        <div style={{ marginTop: spacing[2] }}>
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              {...reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              variant={variant}
              onLike={reply.onLike}
              onReply={reply.onReply}
              onMore={reply.onMore}
              onAuthorClick={reply.onAuthorClick}
            />
          ))}

          {/* Load More Replies */}
          {onLoadMoreReplies && displayReplyCount > replies.length && (
            <button
              onClick={onLoadMoreReplies}
              style={{
                marginLeft: depth > 0 ? spacing[4] : 0,
                marginTop: spacing[2],
                paddingLeft: depth > 0 ? spacing[4] : 0,
                background: 'none',
                border: 'none',
                color: colors.brand.primary,
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                padding: spacing[2],
              }}
            >
              Load {formatNumber(displayReplyCount - replies.length)} more{' '}
              {displayReplyCount - replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
