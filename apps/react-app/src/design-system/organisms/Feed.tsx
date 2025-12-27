import React from 'react';
import { colors, spacing } from '../tokens';
import { PostCard } from '../molecules';
import { Spinner, Text } from '../atoms';
import { useLikePost, useUnlikePost, useRepost, useUnrepost, useBookmark, useUnbookmark } from '../../api';

interface Post {
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
}

interface FeedProps {
  posts: Post[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onPostClick?: (postId: string) => void;
  onUserClick?: (username: string) => void;
  onReplyClick?: (postId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Feed: React.FC<FeedProps> = ({
  posts,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onPostClick,
  onUserClick,
  onReplyClick,
  className = '',
  style,
}) => {
  const observerTarget = React.useRef<HTMLDivElement>(null);

  // Infinite scroll using Intersection Observer
  React.useEffect(() => {
    if (!observerTarget.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore?.();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    ...style,
  };

  const emptyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 16px',
    gap: '16px',
  };

  const loadingStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  if (isLoading && posts.length === 0) {
    return null;
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div style={emptyStyle}>
        <Text size="xl" variant="secondary" weight="semibold">
          No posts yet
        </Text>
        <Text variant="muted" size="sm">
          Follow some users to see their posts here
        </Text>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      {posts.map((post) => (
        <FeedItem
          key={post.id}
          post={post}
          onPostClick={() => onPostClick?.(post.id)}
          onUserClick={() => onUserClick?.(post.author.username)}
          onReplyClick={() => onReplyClick?.(post.id)}
        />
      ))}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} style={loadingStyle} />
      )}

      {!hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid #E8EAED' }}>
          <Text variant="muted" size="sm">
            You're all caught up!
          </Text>
        </div>
      )}
    </div>
  );
};

// Individual feed item with mutation hooks
interface FeedItemProps {
  post: Post;
  onPostClick: () => void;
  onUserClick: () => void;
  onReplyClick: () => void;
}

const FeedItem: React.FC<FeedItemProps> = ({
  post,
  onPostClick,
  onUserClick,
  onReplyClick,
}) => {
  const likePost = useLikePost(post.id);
  const unlikePost = useUnlikePost(post.id);
  const repost = useRepost(post.id);
  const unrepost = useUnrepost(post.id);
  const bookmark = useBookmark(post.id);
  const unbookmark = useUnbookmark(post.id);

  const handleLike = () => {
    if (post.isLiked) {
      unlikePost.mutate();
    } else {
      likePost.mutate();
    }
  };

  const handleRepost = () => {
    if (post.isReposted) {
      unrepost.mutate();
    } else {
      // TODO: Show repost modal with option for quote
      repost.mutate();
    }
  };

  const handleBookmark = () => {
    if (post.isBookmarked) {
      unbookmark.mutate();
    } else {
      bookmark.mutate();
    }
  };

  return (
    <PostCard
      post={post}
      onLike={handleLike}
      onRepost={handleRepost}
      onReply={onReplyClick}
      onBookmark={handleBookmark}
      onUserClick={onUserClick}
      onPostClick={onPostClick}
    />
  );
};

export default Feed;
