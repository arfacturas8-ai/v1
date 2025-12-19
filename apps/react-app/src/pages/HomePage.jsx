/**
 * CRYB Platform - Home Page
 * Modern iOS Aesthetic - Ultra Clean & Minimal
 *
 * DESIGN PRINCIPLES:
 * - Light theme with soft shadows
 * - Delicate borders and glassmorphism
 * - Generous whitespace
 * - System font feel
 * - Smooth transitions
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

  // Responsive breakpoints
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
        background: '#FAFAFA'
      }}
    >
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: isMobile ? '16px' : '20px',
          paddingTop: isMobile ? '76px' : '92px', // Account for fixed header
          paddingBottom: isMobile ? '96px' : '48px' // Account for mobile bottom nav
        }}
      >
        {/* Header with Tabs */}
        <div
          id="feed-tabs"
          style={{
            position: 'sticky',
            top: isMobile ? '56px' : '72px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '20px',
            padding: isMobile ? '16px' : '20px',
            marginBottom: '20px',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? '24px' : '28px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '16px',
              letterSpacing: '-0.02em',
              margin: '0 0 16px 0'
            }}
          >
            CRYB
          </h1>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.04)',
              padding: '4px',
              borderRadius: '16px'
            }}
          >
            <button
              onClick={() => setActiveTab('algorithmic')}
              style={{
                flex: 1,
                padding: isMobile ? '10px 16px' : '12px 20px',
                background: activeTab === 'algorithmic' ? 'white' : 'transparent',
                color: activeTab === 'algorithmic' ? '#000000' : '#666666',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: activeTab === 'algorithmic' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'algorithmic' ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none'
              }}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab('chronological')}
              style={{
                flex: 1,
                padding: isMobile ? '10px 16px' : '12px 20px',
                background: activeTab === 'chronological' ? 'white' : 'transparent',
                color: activeTab === 'chronological' ? '#000000' : '#666666',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: activeTab === 'chronological' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === 'chronological' ? '0 1px 4px rgba(0, 0, 0, 0.08)' : 'none'
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
              marginBottom: '20px'
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
