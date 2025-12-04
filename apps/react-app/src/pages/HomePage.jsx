import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFeedQuery, useCreatePost } from '../hooks/api/usePosts';
import { Feed, Composer } from '../design-system/organisms';
import { colors, spacing } from '../design-system/tokens';
import { Text } from '../design-system/atoms';

function HomePageContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('algorithmic');

  // Fetch feed using React Query with infinite scroll
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFeedQuery(activeTab);

  // Create post mutation
  const createPostMutation = useCreatePost();

  // Flatten paginated data into single posts array
  const posts = useMemo(() => {
    if (!data?.pages) return [];

    return data.pages.flatMap(page => {
      const pagePosts = page.posts || [];
      return pagePosts.map(post => ({
        id: post.id,
        author: {
          username: post.author?.username || 'unknown',
          displayName: post.author?.displayName || post.author?.username || 'Unknown',
          avatar: post.author?.avatarUrl,
          isVerified: post.author?.verified || false,
        },
        content: post.content || '',
        createdAt: post.createdAt,
        likeCount: post.stats?.likes || 0,
        repostCount: post.stats?.reposts || 0,
        replyCount: post.stats?.comments || 0,
        bookmarkCount: post.stats?.bookmarks || 0,
        isLiked: post.userInteractions?.liked || false,
        isReposted: post.userInteractions?.reposted || false,
        isBookmarked: post.userInteractions?.bookmarked || false,
      }));
    });
  }, [data]);

  const handleLoadMore = () => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
  };

  const handleCreatePost = async (content) => {
    await createPostMutation.mutateAsync({
      content,
      type: 'text',
    });
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: colors['bg-primary'],
  };

  const maxWidthContainerStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    padding: spacing[4],
  };

  const headerStyle = {
    position: 'sticky',
    top: 0,
    backgroundColor: colors['bg-primary'],
    borderBottom: `1px solid ${colors['border-default']}`,
    padding: spacing[4],
    marginBottom: spacing[4],
    zIndex: 10,
    backdropFilter: 'blur(10px)',
  };

  const tabsStyle = {
    display: 'flex',
    gap: spacing[4],
    marginTop: spacing[3],
  };

  const tabStyle = (isActive) => ({
    cursor: 'pointer',
    padding: `${spacing[2]} 0`,
    borderBottom: `2px solid ${isActive ? colors['brand-primary'] : 'transparent'}`,
    transition: 'all 150ms ease-out',
    flex: 1,
    textAlign: 'center',
  });

  const composerWrapperStyle = {
    marginBottom: spacing[4],
  };

  const currentUser = user ? {
    username: user.username || 'user',
    displayName: user.displayName || user.username || 'User',
    avatar: user.avatar,
  } : null;

  return (
    <div style={containerStyle}>
      <div style={maxWidthContainerStyle}>
        <div style={headerStyle}>
          <Text size="xl" weight="bold">
            CRYB.AI
          </Text>
          <div style={tabsStyle}>
            <div
              style={tabStyle(activeTab === 'algorithmic')}
              onClick={() => setActiveTab('algorithmic')}
            >
              <Text weight={activeTab === 'algorithmic' ? 'semibold' : 'regular'}>
                For You
              </Text>
            </div>
            <div
              style={tabStyle(activeTab === 'chronological')}
              onClick={() => setActiveTab('chronological')}
            >
              <Text weight={activeTab === 'chronological' ? 'semibold' : 'regular'}>
                Following
              </Text>
            </div>
          </div>
        </div>

        {currentUser && (
          <div style={composerWrapperStyle}>
            <Composer
              currentUser={currentUser}
              onPost={handleCreatePost}
              placeholder="What's happening on CRYB?"
            />
          </div>
        )}

        <Feed
          posts={posts}
          isLoading={isLoading || isFetchingNextPage}
          hasMore={hasNextPage}
          onLoadMore={handleLoadMore}
          onPostClick={(postId) => navigate(`/post/${postId}`)}
          onUserClick={(username) => navigate(`/profile/${username}`)}
          onReplyClick={(postId) => navigate(`/post/${postId}#reply`)}
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
