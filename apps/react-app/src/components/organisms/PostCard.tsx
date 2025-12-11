/**
 * CRYB Design System - PostCard Organism
 * Social post with author, content, media, reactions, comments preview, and all post actions
 */

import React, { useState } from 'react';
import { colors, spacing, typography, radii, animation, shadows } from '../../design-system/tokens';
import { formatRelativeTime, formatNumber, truncate } from '../../lib/utils';
import Button from '../atoms/Button';

// Icons (inline SVG for no external dependencies)
const HeartIcon: React.FC<{ filled?: boolean; size?: number }> = ({ filled = false, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M10 17.5L8.825 16.4375C5.1 13.1042 2.5 10.7292 2.5 7.91667C2.5 5.54167 4.375 3.66667 6.75 3.66667C8.1 3.66667 9.4 4.25 10 5.23333C10.6 4.25 11.9 3.66667 13.25 3.66667C15.625 3.66667 17.5 5.54167 17.5 7.91667C17.5 10.7292 14.9 13.1042 11.175 16.4458L10 17.5Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const CommentIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M17.5 9.58333C17.5 13.4625 14.1417 16.5833 10 16.5833C8.8 16.5833 7.67917 16.3208 6.66667 15.8458L2.5 17.5L4.15417 13.3333C3.67917 12.3208 3.41667 11.2 3.41667 10C3.41667 6.12083 6.775 3 10.8333 3C14.7208 3 17.5 5.70417 17.5 9.58333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShareIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M15 6.66667C16.3807 6.66667 17.5 5.54738 17.5 4.16667C17.5 2.78595 16.3807 1.66667 15 1.66667C13.6193 1.66667 12.5 2.78595 12.5 4.16667C12.5 5.54738 13.6193 6.66667 15 6.66667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 12.5C6.38071 12.5 7.5 11.3807 7.5 10C7.5 8.61929 6.38071 7.5 5 7.5C3.61929 7.5 2.5 8.61929 2.5 10C2.5 11.3807 3.61929 12.5 5 12.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15 18.3333C16.3807 18.3333 17.5 17.214 17.5 15.8333C17.5 14.4526 16.3807 13.3333 15 13.3333C13.6193 13.3333 12.5 14.4526 12.5 15.8333C12.5 17.214 13.6193 18.3333 15 18.3333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.15833 11.175L12.85 14.6583M12.8417 5.34167L7.15833 8.825"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MoreIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="1.5" fill="currentColor" />
    <circle cx="4" cy="10" r="1.5" fill="currentColor" />
    <circle cx="16" cy="10" r="1.5" fill="currentColor" />
  </svg>
);

const BookmarkIcon: React.FC<{ filled?: boolean; size?: number }> = ({ filled = false, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M14.1667 2.5H5.83333C5.14 2.5 4.575 3.075 4.575 3.75L4.58333 17.5L10 15L15.4167 17.5V3.75C15.4167 3.075 14.8417 2.5 14.1667 2.5Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface PostAuthor {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  verified?: boolean;
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnail?: string;
  alt?: string;
}

export interface PostReaction {
  type: string;
  count: number;
  users: string[];
}

export interface PostComment {
  id: string;
  author: PostAuthor;
  content: string;
  timestamp: Date;
}

export interface PostCardProps {
  id: string;
  author: PostAuthor;
  content: string;
  media?: PostMedia[];
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  commentsPreview?: PostComment[];
  loading?: boolean;
  error?: string;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onAuthorClick?: () => void;
  onPostClick?: () => void;
  onMore?: () => void;
  showComments?: boolean;
  showMedia?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  author,
  content,
  media = [],
  timestamp,
  likes = 0,
  comments = 0,
  shares = 0,
  isLiked = false,
  isBookmarked = false,
  commentsPreview = [],
  loading = false,
  error,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onAuthorClick,
  onPostClick,
  onMore,
  showComments = true,
  showMedia = true,
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [bookmarked, setBookmarked] = useState(isBookmarked);
  const [likeCount, setLikeCount] = useState(likes);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const [showFullContent, setShowFullContent] = useState(false);

  const handleLike = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike?.();
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
    onBookmark?.();
  };

  const shouldTruncate = content.length > 280;
  const displayContent = !showFullContent && shouldTruncate ? truncate(content, 280) : content;

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div
        style={{
          backgroundColor: colors.bg.secondary,
          border: `1px solid ${colors.semantic.error}`,
          borderRadius: radii.lg,
          padding: spacing[4],
          color: colors.semantic.error,
          textAlign: 'center',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <article
      style={{
        backgroundColor: colors.bg.secondary,
        border: `1px solid ${colors.border.default}`,
        borderRadius: radii.lg,
        padding: spacing[4],
        transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
        cursor: onPostClick ? 'pointer' : 'default',
      }}
      onClick={onPostClick}
      role={onPostClick ? 'button' : undefined}
      tabIndex={onPostClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onPostClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onPostClick();
        }
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing[3] }}>
        <div
          style={{ display: 'flex', gap: spacing[3], cursor: 'pointer', flex: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            onAuthorClick?.();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onAuthorClick?.();
            }
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: radii.full,
              overflow: 'hidden',
              backgroundColor: colors.bg.tertiary,
              flexShrink: 0,
            }}
          >
            {author.avatar ? (
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
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.semibold,
                }}
              >
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Author Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
              <span
                style={{
                  color: colors.text.primary,
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {author.name}
              </span>
              {author.verified && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M5.6 8L7.2 9.6L10.4 6.4M14.4 8C14.4 11.5346 11.5346 14.4 8 14.4C4.46538 14.4 1.6 11.5346 1.6 8C1.6 4.46538 4.46538 1.6 8 1.6C11.5346 1.6 14.4 4.46538 14.4 8Z"
                    stroke={colors.brand.primary}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={colors.brand.primary}
                  />
                </svg>
              )}
            </div>
            <div style={{ display: 'flex', gap: spacing[2], alignItems: 'center' }}>
              <span
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.sm,
                }}
              >
                @{author.username}
              </span>
              <span style={{ color: colors.text.tertiary }}>•</span>
              <span
                style={{
                  color: colors.text.tertiary,
                  fontSize: typography.fontSize.sm,
                }}
              >
                {formatRelativeTime(timestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* More Button */}
        {onMore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMore();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text.tertiary,
              cursor: 'pointer',
              padding: spacing[2],
              borderRadius: radii.full,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="More options"
          >
            <MoreIcon />
          </button>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          color: colors.text.primary,
          fontSize: typography.fontSize.base,
          lineHeight: typography.lineHeight.relaxed,
          marginBottom: media.length > 0 && showMedia ? spacing[3] : spacing[4],
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {displayContent}
        {shouldTruncate && !showFullContent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFullContent(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: colors.brand.primary,
              cursor: 'pointer',
              padding: 0,
              marginLeft: spacing[2],
              fontSize: typography.fontSize.base,
            }}
          >
            Show more
          </button>
        )}
      </div>

      {/* Media */}
      {media.length > 0 && showMedia && (
        <div
          style={{
            marginBottom: spacing[4],
            borderRadius: radii.md,
            overflow: 'hidden',
            display: 'grid',
            gap: spacing[1],
            gridTemplateColumns: media.length === 1 ? '1fr' : media.length === 2 ? '1fr 1fr' : 'repeat(2, 1fr)',
          }}
        >
          {media.slice(0, 4).map((item, index) => (
            <div
              key={item.id}
              style={{
                position: 'relative',
                aspectRatio: media.length === 1 ? '16/9' : '1/1',
                backgroundColor: colors.bg.tertiary,
                gridColumn: media.length === 3 && index === 0 ? 'span 2' : undefined,
              }}
            >
              {item.type === 'image' && !imageError[item.id] ? (
                <img
                  src={item.url}
                  alt={item.alt || ''}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={() => {
                    setImageError(prev => ({ ...prev, [item.id]: true }));
                  }}
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
                    color: colors.text.tertiary,
                  }}
                >
                  Failed to load media
                </div>
              )}
              {index === 3 && media.length > 4 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.text.primary,
                    fontSize: typography.fontSize['2xl'],
                    fontWeight: typography.fontWeight.bold,
                  }}
                >
                  +{media.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
          paddingTop: spacing[3],
          borderTop: `1px solid ${colors.border.subtle}`,
        }}
      >
        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: liked ? colors.semantic.error : colors.text.tertiary,
            cursor: 'pointer',
            padding: spacing[2],
            borderRadius: radii.full,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            fontSize: typography.fontSize.sm,
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
          aria-label={`${liked ? 'Unlike' : 'Like'} post`}
          aria-pressed={liked}
        >
          <HeartIcon filled={liked} size={20} />
          {likeCount > 0 && <span>{formatNumber(likeCount)}</span>}
        </button>

        {/* Comment Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComment?.();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: colors.text.tertiary,
            cursor: 'pointer',
            padding: spacing[2],
            borderRadius: radii.full,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            fontSize: typography.fontSize.sm,
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.bg.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Comment on post"
        >
          <CommentIcon size={20} />
          {comments > 0 && <span>{formatNumber(comments)}</span>}
        </button>

        {/* Share Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare?.();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: colors.text.tertiary,
            cursor: 'pointer',
            padding: spacing[2],
            borderRadius: radii.full,
            display: 'flex',
            alignItems: 'center',
            gap: spacing[2],
            fontSize: typography.fontSize.sm,
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.bg.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Share post"
        >
          <ShareIcon size={20} />
          {shares > 0 && <span>{formatNumber(shares)}</span>}
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bookmark Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBookmark();
          }}
          style={{
            background: 'none',
            border: 'none',
            color: bookmarked ? colors.brand.primary : colors.text.tertiary,
            cursor: 'pointer',
            padding: spacing[2],
            borderRadius: radii.full,
            display: 'flex',
            alignItems: 'center',
            transition: `all ${animation.duration.fast} ${animation.easing.easeOut}`,
          }}
          onMouseEnter={(e) => {
            if (!bookmarked) {
              e.currentTarget.style.backgroundColor = colors.bg.hover;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label={`${bookmarked ? 'Remove bookmark' : 'Bookmark'} post`}
          aria-pressed={bookmarked}
        >
          <BookmarkIcon filled={bookmarked} size={20} />
        </button>
      </div>

      {/* Comments Preview */}
      {showComments && commentsPreview.length > 0 && (
        <div
          style={{
            marginTop: spacing[3],
            paddingTop: spacing[3],
            borderTop: `1px solid ${colors.border.subtle}`,
          }}
        >
          {commentsPreview.slice(0, 2).map((comment) => (
            <div
              key={comment.id}
              style={{
                display: 'flex',
                gap: spacing[2],
                marginBottom: spacing[3],
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: radii.full,
                  overflow: 'hidden',
                  backgroundColor: colors.bg.tertiary,
                  flexShrink: 0,
                }}
              >
                {comment.author.avatar ? (
                  <img
                    src={comment.author.avatar}
                    alt={comment.author.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                    }}
                  >
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div>
                  <span
                    style={{
                      color: colors.text.primary,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      marginRight: spacing[2],
                    }}
                  >
                    {comment.author.name}
                  </span>
                  <span
                    style={{
                      color: colors.text.primary,
                      fontSize: typography.fontSize.sm,
                    }}
                  >
                    {comment.content}
                  </span>
                </div>
                <span
                  style={{
                    color: colors.text.tertiary,
                    fontSize: typography.fontSize.xs,
                  }}
                >
                  {formatRelativeTime(comment.timestamp)}
                </span>
              </div>
            </div>
          ))}
          {comments > 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComment?.();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: colors.text.tertiary,
                cursor: 'pointer',
                padding: 0,
                fontSize: typography.fontSize.sm,
              }}
            >
              View all {formatNumber(comments)} comments
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default PostCard;
