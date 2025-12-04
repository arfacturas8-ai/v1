import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { colors, spacing } from '../design-system/tokens';
import { Feed, Composer, Text, Button } from '../design-system';
import { useAuth } from '../contexts/AuthContext';
import postsService from '../services/postsService';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

// Tabs for feed filtering
type FeedTab = 'foryou' | 'following';

export function HomePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<FeedTab>('foryou');
  const [posts, setPosts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  const [page, setPage] = React.useState(1);

  // Fetch posts
  const fetchPosts = React.useCallback(async (pageNum: number, tabFilter: FeedTab) => {
    try {
      setIsLoading(pageNum === 1);

      const result = await postsService.getPosts({
        sort: tabFilter === 'foryou' ? 'hot' : 'new',
        limit: 20,
        page: pageNum,
        following: tabFilter === 'following',
      });

      if (result.success && result.posts) {
        if (pageNum === 1) {
          setPosts(result.posts);
        } else {
          setPosts(prev => [...prev, ...result.posts]);
        }
        setHasMore(result.posts.length === 20);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  React.useEffect(() => {
    fetchPosts(1, activeTab);
  }, [activeTab, fetchPosts]);

  // Handle load more
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage, activeTab);
    }
  };

  // Handle new post creation
  const handleCreatePost = async (content: string) => {
    try {
      const result = await postsService.createPost({
        title: '', // Optional for social posts
        content,
        communityId: null, // Personal post, not in community
      });

      if (result.success && result.post) {
        // Optimistically add to feed
        setPosts(prev => [result.post, ...prev]);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error; // Let Composer handle error
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors['bg-primary'],
  };

  const maxWidthContainerStyle: React.CSSProperties = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: spacing[4],
  };

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    backgroundColor: colors['bg-primary'],
    borderBottom: `1px solid ${colors['border-default']}`,
    padding: spacing[4],
    marginBottom: spacing[4],
    zIndex: 10,
    backdropFilter: 'blur(10px)',
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
    marginTop: spacing[3],
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    cursor: 'pointer',
    padding: `${spacing[2]} 0`,
    borderBottom: `2px solid ${isActive ? colors['brand-primary'] : 'transparent'}`,
    transition: 'all 150ms ease-out',
    flex: 1,
    textAlign: 'center',
  });

  const composerWrapperStyle: React.CSSProperties = {
    marginBottom: spacing[4],
  };

  const currentUser = user ? {
    username: user.username || 'user',
    displayName: user.displayName || user.username || 'User',
    avatar: user.avatar,
  } : undefined;

  return (
    <QueryClientProvider client={queryClient}>
      <div style={containerStyle}>
        <div style={maxWidthContainerStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <Text size="xl" weight="bold">
              CRYB.AI
            </Text>
            <div style={tabsStyle}>
              <div
                style={tabStyle(activeTab === 'foryou')}
                onClick={() => {
                  setActiveTab('foryou');
                  setPage(1);
                  setPosts([]);
                }}
              >
                <Text weight={activeTab === 'foryou' ? 'semibold' : 'regular'}>
                  For You
                </Text>
              </div>
              <div
                style={tabStyle(activeTab === 'following')}
                onClick={() => {
                  setActiveTab('following');
                  setPage(1);
                  setPosts([]);
                }}
              >
                <Text weight={activeTab === 'following' ? 'semibold' : 'regular'}>
                  Following
                </Text>
              </div>
            </div>
          </div>

          {/* Composer */}
          {currentUser && (
            <div style={composerWrapperStyle}>
              <Composer
                currentUser={currentUser}
                onPost={handleCreatePost}
                placeholder="What's happening on CRYB?"
              />
            </div>
          )}

          {/* Feed */}
          <Feed
            posts={posts}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onPostClick={(postId) => window.location.href = `/post/${postId}`}
            onUserClick={(username) => window.location.href = `/profile/${username}`}
            onReplyClick={(postId) => window.location.href = `/post/${postId}#reply`}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
}

export default HomePage;
