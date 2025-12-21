/**
 * CRYB Platform - Home Page
 * iOS-Style Polish - Clean, Minimal, Professional
 *
 * DESIGN PRINCIPLES:
 * - Light theme with soft shadows
 * - Clean white backgrounds
 * - Proper card hierarchy
 * - Generous whitespace
 * - Smooth transitions
 * - iOS system font feel
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFeedQuery, useCreatePost } from '../hooks/api/usePosts';
import { Feed, Composer } from '../design-system/organisms';
import { useOnboardingTour } from '../hooks/useOnboardingTour';

function HomePageContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('algorithmic');
  const { startTour } = useOnboardingTour();

  // Responsive breakpoints
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        background: '#F8F9FA',
        paddingTop: isMobile ? '60px' : '72px',
        paddingBottom: isMobile ? '80px' : '40px',
      }}
    >
      {/* Main Container */}
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: isMobile ? '0' : '0 20px',
        }}
      >
        {/* Header Section - Sticky */}
        <div
          id="feed-tabs"
          style={{
            position: 'sticky',
            top: isMobile ? '60px' : '72px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E8EAED',
            marginBottom: '0',
            zIndex: 10,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Page Title */}
          <div
            style={{
              padding: isMobile ? '16px 16px 12px 16px' : '20px 24px 16px 24px',
            }}
          >
            <h1
              style={{
                fontSize: isMobile ? '26px' : '30px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0',
                letterSpacing: '-0.02em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              CRYB
            </h1>
          </div>

          {/* Tab Switcher */}
          <div
            style={{
              display: 'flex',
              padding: '0',
              borderTop: '1px solid #F0F2F5',
            }}
          >
            <button
              onClick={() => setActiveTab('algorithmic')}
              style={{
                flex: 1,
                padding: isMobile ? '14px 16px' : '16px 20px',
                background: 'transparent',
                color: activeTab === 'algorithmic' ? '#1A1A1A' : '#666666',
                border: 'none',
                borderBottom: activeTab === 'algorithmic' ? '3px solid #58a6ff' : '3px solid transparent',
                fontSize: '15px',
                fontWeight: activeTab === 'algorithmic' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              For You
            </button>
            <button
              onClick={() => setActiveTab('chronological')}
              style={{
                flex: 1,
                padding: isMobile ? '14px 16px' : '16px 20px',
                background: 'transparent',
                color: activeTab === 'chronological' ? '#1A1A1A' : '#666666',
                border: 'none',
                borderBottom: activeTab === 'chronological' ? '3px solid #58a6ff' : '3px solid transparent',
                fontSize: '15px',
                fontWeight: activeTab === 'chronological' ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
              }}
            >
              Following
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            padding: isMobile ? '0' : '0',
          }}
        >
          {/* Composer */}
          {currentUser && (
            <div
              id="create-post-button"
              style={{
                background: '#FFFFFF',
                borderBottom: '1px solid #E8EAED',
                padding: isMobile ? '12px 16px' : '16px 24px',
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
          <div
            style={{
              background: '#FFFFFF',
            }}
          >
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
      </div>
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
