import React, { useState, useEffect, useCallback } from 'react';
import { Edit3, RefreshCw } from 'lucide-react';
import { AppLayout } from './AppLayout';
import { Feed } from '../design-system/organisms/Feed';
import { TabBar } from '../design-system/molecules/TabBar';
import { EmptyState } from '../design-system/molecules/EmptyState';
import { Skeleton } from '../design-system/atoms/Skeleton';
import { colors, spacing, radii, shadows, zIndex } from '../design-system/tokens';

interface HomePageProps {
  onNavigate?: (route: string, params?: any) => void;
}

// Mock data generator
const generateMockPost = (id: number) => ({
  id: `post-${id}`,
  author: {
    username: `user${id}`,
    displayName: `User ${id}`,
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    isVerified: Math.random() > 0.7,
  },
  content: [
    'Just minted my first NFT on CRYB! This platform is amazing!',
    'The future of social media is here. Web3 is changing everything.',
    'Love the community vibes here. Everyone is so supportive!',
    'Just launched my new collection. Check it out!',
    'GM everyone! What are you working on today?',
    'This is the best social platform for creators. Period.',
    'Building in public is so rewarding. Thanks for all the support!',
  ][id % 7],
  createdAt: new Date(Date.now() - id * 3600000).toISOString(),
  likeCount: Math.floor(Math.random() * 1000),
  repostCount: Math.floor(Math.random() * 100),
  replyCount: Math.floor(Math.random() * 50),
  bookmarkCount: Math.floor(Math.random() * 75),
  isLiked: Math.random() > 0.5,
  isReposted: Math.random() > 0.8,
  isBookmarked: Math.random() > 0.7,
  media:
    id % 3 === 0
      ? [
          {
            type: 'IMAGE' as const,
            url: `https://picsum.photos/800/600?random=${id}`,
            thumbnail: `https://picsum.photos/400/300?random=${id}`,
          },
        ]
      : id % 5 === 0
      ? [
          {
            type: 'IMAGE' as const,
            url: `https://picsum.photos/800/600?random=${id}a`,
            thumbnail: `https://picsum.photos/400/300?random=${id}a`,
          },
          {
            type: 'IMAGE' as const,
            url: `https://picsum.photos/800/600?random=${id}b`,
            thumbnail: `https://picsum.photos/400/300?random=${id}b`,
          },
        ]
      : undefined,
  quotedPost:
    id % 7 === 0
      ? {
          author: {
            username: `quoted${id}`,
            displayName: `Quoted User ${id}`,
          },
          content: 'This is a quoted post with some interesting content to share!',
        }
      : undefined,
});

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState('for-you');
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Initial load
  useEffect(() => {
    loadInitialPosts();
  }, [activeFilter]);

  const loadInitialPosts = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const initialPosts = Array.from({ length: 10 }, (_, i) => generateMockPost(i));
    setPosts(initialPosts);
    setPage(1);
    setHasMore(true);
    setIsLoading(false);
  };

  const loadMorePosts = async () => {
    if (isLoading || !hasMore) return;

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    const newPosts = Array.from({ length: 5 }, (_, i) => generateMockPost(page * 10 + i));
    setPosts((prev) => [...prev, ...newPosts]);
    setPage((prev) => prev + 1);

    // Stop loading more after 50 posts
    if (posts.length >= 50) {
      setHasMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialPosts();
    setIsRefreshing(false);
  };

  const handlePostClick = (postId: string) => {
    onNavigate?.(`/post/${postId}`);
  };

  const handleUserClick = (username: string) => {
    onNavigate?.(`/user/${username}`);
  };

  const handleReplyClick = (postId: string) => {
    onNavigate?.(`/compose?replyTo=${postId}`);
  };

  const handleComposeClick = () => {
    onNavigate?.('/compose');
  };

  const filterTabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' },
    { id: 'trending', label: 'Trending' },
  ];

  return (
    <AppLayout
      activeTab="home"
      onTabChange={(tab) => onNavigate?.(`/${tab}`)}
      onSearch={() => onNavigate?.('/search')}
      onNotifications={() => onNavigate?.('/notifications')}
      onWallet={() => onNavigate?.('/wallet')}
      notificationCount={3}
    >
      {/* Filter Tabs */}
      <div
        style={{
          position: 'sticky',
          top: '73px',
          zIndex: zIndex.sticky - 1,
          backgroundColor: colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
          padding: spacing[3],
        }}
      >
        <TabBar
          tabs={filterTabs}
          activeTab={activeFilter}
          onChange={setActiveFilter}
          variant="underline"
          fullWidth
        />
      </div>

      {/* Pull to Refresh Indicator */}
      {isRefreshing && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing[4],
            gap: spacing[2],
            color: colors.text.secondary,
          }}
        >
          <RefreshCw size={16} className="spinning" />
          <span style={{ fontSize: '14px' }}>Refreshing...</span>
        </div>
      )}

      {/* Feed Content */}
      <div style={{ padding: spacing[4] }}>
        {posts.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Edit3 size={64} />}
            title="No posts yet"
            description="Follow some users or create your first post to get started!"
            action={{
              label: 'Create Post',
              onClick: handleComposeClick,
            }}
            secondaryAction={{
              label: 'Find Users',
              onClick: () => onNavigate?.('/explore'),
            }}
          />
        ) : !isLoading ? (
          <Feed
            posts={posts}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={loadMorePosts}
            onPostClick={handlePostClick}
            onUserClick={handleUserClick}
            onReplyClick={handleReplyClick}
          />
        ) : null}
      </div>

      {/* Floating Compose Button */}
      <button
        onClick={handleComposeClick}
        aria-label="Compose new post"
        style={{
          position: 'fixed',
          bottom: '90px',
          right: spacing[6],
          width: '56px',
          height: '56px',
          borderRadius: radii.full,
          border: 'none',
          background: colors.brand.gradient,
          color: colors.text.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: shadows.lg,
          transition: 'all 150ms ease-out',
          zIndex: zIndex.fixed,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = shadows.xl;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = shadows.lg;
        }}
      >
        <Edit3 size={24} />
      </button>

      {/* Add spinning animation for refresh icon */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .spinning {
            animation: spin 0.8s linear infinite;
          }
        `}
      </style>
    </AppLayout>
  );
};

export default HomePage;
