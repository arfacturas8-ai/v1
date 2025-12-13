/**
 * CRYB Platform - Home Page v.1
 * Light theme home feed matching design spec
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFeedQuery, useCreatePost } from '../hooks/api/usePosts';
import { Feed, Composer } from '../design-system/organisms';
import { Text } from '../design-system/atoms';
import { useOnboardingTour } from '../hooks/useOnboardingTour';

function HomePageContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('algorithmic');
  const { startTour } = useOnboardingTour();

  // Auto-start tour for new users
  useEffect(() => {
    const shouldShowTour = localStorage.getItem('show_onboarding_tour');
    if (shouldShowTour === 'true') {
      setTimeout(() => {
        startTour();
        localStorage.removeItem('show_onboarding_tour');
      }, 1500);
    }
  }, [startTour]);

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

  const currentUser = user ? {
    username: user.username || 'user',
    displayName: user.displayName || user.username || 'User',
    avatar: user.avatar,
  } : null;

  return (
    <div
      id="home-feed"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: 'var(--space-4)',
        }}
      >
        {/* Header */}
        <div
          id="feed-tabs"
          style={{
            position: 'sticky',
            top: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
            zIndex: 10,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Text
            size="xl"
            weight="bold"
            style={{
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)',
            }}
          >
            CRYB
          </Text>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              background: 'var(--bg-tertiary)',
              padding: 'var(--space-1)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <button
              onClick={() => setActiveTab('algorithmic')}
              style={{
                flex: 1,
                padding: 'var(--space-2) var(--space-4)',
                background: activeTab === 'algorithmic' ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === 'algorithmic' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: activeTab === 'algorithmic' ? 'var(--font-semibold)' : 'var(--font-medium)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                boxShadow: activeTab === 'algorithmic' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab('chronological')}
              style={{
                flex: 1,
                padding: 'var(--space-2) var(--space-4)',
                background: activeTab === 'chronological' ? 'var(--bg-secondary)' : 'transparent',
                color: activeTab === 'chronological' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)',
                fontWeight: activeTab === 'chronological' ? 'var(--font-semibold)' : 'var(--font-medium)',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                boxShadow: activeTab === 'chronological' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Following
            </button>
          </div>
        </div>

        {/* Composer */}
        {currentUser && (
          <div
            id="create-post-button"
            style={{
              marginBottom: 'var(--space-4)',
            }}
          >
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
