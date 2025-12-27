/**
 * CRYB Platform - Home Page
 * World-Class Social Feed - FB/IG/X/Telegram Level UX
 *
 * FEATURES:
 * - 3-column layout (left sidebar, feed, right sidebar)
 * - Real-time updates
 * - Trending topics & communities
 * - Who to follow suggestions
 * - Web3 widgets
 * - Infinite scroll
 * - Perfect responsive design
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { useFeedQuery, useCreatePost } from '../hooks/api/usePosts';
import { useTrendingTagsQuery } from '../hooks/api/useSearch';
import { useSuggestedUsersQuery } from '../hooks/api/useUsers';
import { useTrendingCommunitiesQuery } from '../hooks/api/useCommunities';
import { Feed, Composer } from '../design-system/organisms';
import {
  TrendingUp, Users, Hash, Sparkles, Wallet,
  Trophy, Zap, ChevronRight, Crown
} from 'lucide-react';

function HomePageContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
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

  // Post interaction handlers
  const handleVote = async (postId, voteType) => {
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ voteType }) // 'up' or 'down'
      })
      if (response.ok) {
        refetch() // Refresh feed to show updated vote
      }
    } catch (error) {
      console.error('Vote error:', error)
    }
  }

  const handleComment = (postId) => {
    window.location.href = `/posts/${postId}`
  }

  const handleShare = async (post) => {
    const url = `${window.location.origin}/posts/${post.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content?.substring(0, 100),
          url
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(url)
        }
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show toast notification
      console.log('Link copied!')
    })
  }

  const handleSave = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        console.log('Post saved!')
      }
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const handleReport = (postId) => {
    // TODO: Open report modal
    console.log('Report post:', postId)
  }

  const handleAward = (postId) => {
    // TODO: Open award modal
    console.log('Award post:', postId)
  }

  const currentUser = user ? {
    username: user.username || 'user',
    displayName: user.displayName || user.username || 'User',
    avatar: user.avatar,
  } : null;

  // Fetch trending topics, suggested users, and trending communities from API
  const { data: trendingTagsData } = useTrendingTagsQuery(5);
  const { data: suggestedUsersData } = useSuggestedUsersQuery(3);
  const { data: trendingCommunitiesData } = useTrendingCommunitiesQuery(3);

  // Extract data with fallbacks
  const trendingTopics = trendingTagsData?.tags || [];
  const suggestedUsers = suggestedUsersData?.users || [];
  const trendingCommunities = trendingCommunitiesData?.communities || [];

  if (isMobile) {
    // Mobile: Single column feed only
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#FAFAFA',
          paddingTop: '60px',
          paddingBottom: '80px',
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          {/* Tabs */}
          <div
            style={{
              position: 'sticky',
              top: '60px',
              background: '#FFFFFF',
              borderBottom: '1px solid #E5E5E5',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex' }}>
              <button
                onClick={() => setActiveTab('algorithmic')}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'transparent',
                  color: activeTab === 'algorithmic' ? '#58a6ff' : '#666666',
                  border: 'none',
                  borderBottom: activeTab === 'algorithmic' ? '2px solid #58a6ff' : '2px solid transparent',
                  fontSize: '15px',
                  fontWeight: activeTab === 'algorithmic' ? '600' : '400',
                  cursor: 'pointer',
                }}
              >
                For You
              </button>
              <button
                onClick={() => setActiveTab('chronological')}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'transparent',
                  color: activeTab === 'chronological' ? '#58a6ff' : '#666666',
                  border: 'none',
                  borderBottom: activeTab === 'chronological' ? '2px solid #58a6ff' : '2px solid transparent',
                  fontSize: '15px',
                  fontWeight: activeTab === 'chronological' ? '600' : '400',
                  cursor: 'pointer',
                }}
              >
                Following
              </button>
            </div>
          </div>

          {/* Composer */}
          {currentUser && (
            <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E5E5', padding: '16px' }}>
              <Composer
                currentUser={currentUser}
                onPost={handleCreatePost}
                placeholder="What's happening on CRYB?"
              />
            </div>
          )}

          {/* Feed */}
          <div style={{ background: '#FFFFFF' }}>
            <Feed
              posts={posts}
              isLoading={isLoading || isFetchingNextPage}
              hasMore={hasNextPage}
              onLoadMore={handleLoadMore}
              onPostClick={(postId) => navigate(`/post/${postId}`)}
              onUserClick={(username) => navigate(`/profile/${username}`)}
              onReplyClick={(postId) => navigate(`/post/${postId}#reply`)}
              onVote={handleVote}
              onComment={handleComment}
              onShare={handleShare}
              onSave={handleSave}
              onReport={handleReport}
              onAward={handleAward}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop & Tablet: 3-column layout
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        paddingTop: '72px',
        paddingBottom: '40px',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'grid',
          gridTemplateColumns: isTablet ? '1fr 600px' : '280px 600px 340px',
          gap: '24px',
        }}
      >
        {/* LEFT SIDEBAR - Navigation & Shortcuts */}
        {!isTablet && (
          <aside
            style={{
              position: 'sticky',
              top: '92px',
              height: 'calc(100vh - 112px)',
              overflowY: 'auto',
            }}
          >
            {/* Quick Actions */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '16px' }}>
                Quick Actions
              </h3>
              <Link
                to="/submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                  backdropFilter: 'blur(40px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(88, 166, 255, 0.3)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  transition: 'all 0.2s',
                  boxShadow: '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(88, 166, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                <Sparkles size={18} />
                Create Post
              </Link>
              {/* Only show Create Community for admins */}
              {(user?.isAdmin || user?.role === 'admin' || user?.role === 'super_admin') && (
                <Link
                  to="/communities/create"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: '#FAFAFA',
                    color: '#1A1A1A',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid #E5E5E5',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F0F0F0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#FAFAFA'}
                >
                  <Hash size={18} />
                  Create Community
                </Link>
              )}
            </div>

            {/* Trending Topics */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} />
                Trending
              </h3>
              {trendingTopics.map((topic, index) => (
                <Link
                  key={index}
                  to={`/search?q=${encodeURIComponent(topic.name || topic.tag || '')}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'background 0.2s',
                    marginBottom: '4px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A' }}>
                      #{topic.name || topic.tag}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666666' }}>
                      {topic.count} posts
                    </div>
                  </div>
                  <ChevronRight size={16} color="#CCCCCC" />
                </Link>
              ))}
            </div>
          </aside>
        )}

        {/* CENTER - Main Feed */}
        <main>
          {/* Tabs */}
          <div
            style={{
              position: 'sticky',
              top: '72px',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E5E5E5',
              marginBottom: '16px',
              zIndex: 10,
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex' }}>
              <button
                onClick={() => setActiveTab('algorithmic')}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'transparent',
                  color: activeTab === 'algorithmic' ? '#58a6ff' : '#666666',
                  border: 'none',
                  borderBottom: activeTab === 'algorithmic' ? '2px solid #58a6ff' : '2px solid transparent',
                  fontSize: '15px',
                  fontWeight: activeTab === 'algorithmic' ? '600' : '400',
                  cursor: 'pointer',
                  borderRadius: '12px 12px 0 0',
                }}
              >
                For You
              </button>
              <button
                onClick={() => setActiveTab('chronological')}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: 'transparent',
                  color: activeTab === 'chronological' ? '#58a6ff' : '#666666',
                  border: 'none',
                  borderBottom: activeTab === 'chronological' ? '2px solid #58a6ff' : '2px solid transparent',
                  fontSize: '15px',
                  fontWeight: activeTab === 'chronological' ? '600' : '400',
                  cursor: 'pointer',
                  borderRadius: '12px 12px 0 0',
                }}
              >
                Following
              </button>
            </div>
          </div>

          {/* Composer */}
          {currentUser && (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E5E5E5',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
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
              borderRadius: '12px',
              border: '1px solid #E5E5E5',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
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
              onVote={handleVote}
              onComment={handleComment}
              onShare={handleShare}
              onSave={handleSave}
              onReport={handleReport}
              onAward={handleAward}
            />
          </div>
        </main>

        {/* RIGHT SIDEBAR - Who to Follow & Communities */}
        <aside
          style={{
            position: 'sticky',
            top: '92px',
            height: 'calc(100vh - 112px)',
            overflowY: 'auto',
          }}
        >
          {/* Who to Follow */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} />
              Who to Follow
            </h3>
            {suggestedUsers.map((suggestedUser, index) => (
              <div
                key={suggestedUser.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                  {suggestedUser.avatarUrl ? (
                    <img
                      src={suggestedUser.avatarUrl}
                      alt={suggestedUser.displayName}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                        backdropFilter: 'blur(40px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                        border: '1px solid rgba(88, 166, 255, 0.3)',
                        boxShadow: '0 2px 8px rgba(88, 166, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontWeight: '600',
                        fontSize: '16px',
                        flexShrink: 0,
                      }}
                    >
                      {suggestedUser.displayName.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {suggestedUser.displayName}
                      </span>
                      {suggestedUser.verified && <Crown size={14} color="#58a6ff" />}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666666' }}>
                      @{suggestedUser.username}
                    </div>
                  </div>
                </div>
                <button
                  style={{
                    padding: '6px 16px',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(88, 166, 255, 0.3)',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(88, 166, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Follow
                </button>
              </div>
            ))}
            <Link
              to="/discover"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                color: '#1A1A1A',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Show more
            </Link>
          </div>

          {/* Trending Communities */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={18} />
              Trending Communities
            </h3>
            {trendingCommunities.map((community) => (
              <Link
                key={community.id}
                to={`/community/${community.slug || community.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  marginBottom: '8px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: community.avatarUrl
                      ? `url(${community.avatarUrl})`
                      : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: !community.avatarUrl ? 'blur(40px) saturate(200%)' : undefined,
                    WebkitBackdropFilter: !community.avatarUrl ? 'blur(40px) saturate(200%)' : undefined,
                    border: !community.avatarUrl ? '1px solid rgba(88, 166, 255, 0.3)' : undefined,
                    boxShadow: !community.avatarUrl ? '0 2px 8px rgba(88, 166, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)' : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0,
                    color: '#FFFFFF',
                    fontWeight: '600',
                  }}
                >
                  {!community.avatarUrl && (community.icon || community.name.charAt(0).toUpperCase())}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {community.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666666' }}>
                    {community.stats?.members?.toLocaleString() || community.members || '0'} members
                  </div>
                </div>
                <ChevronRight size={16} color="#CCCCCC" />
              </Link>
            ))}
            <Link
              to="/communities"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '12px',
                color: '#1A1A1A',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                borderRadius: '8px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#FAFAFA'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Explore all
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}
