/**
 * ExplorePage.tsx
 * iOS-inspired modern design with clean aesthetics
 * Updated: 2025-12-19
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, Hash } from 'lucide-react';

interface TrendingTopic {
  tag: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

interface SuggestedUser {
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  followers: number;
  isVerified: boolean;
}

interface TrendingPost {
  id: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
    isVerified: boolean;
  };
  content: string;
  createdAt: string;
  likeCount: number;
  repostCount: number;
  replyCount: number;
  bookmarkCount: number;
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
}

export function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'people' | 'topics'>('trending');
  const [trendingTopics] = useState<TrendingTopic[]>([
    { tag: 'Web3', count: 12453, trend: 'up' },
    { tag: 'NFTs', count: 8932, trend: 'up' },
    { tag: 'DeFi', count: 6721, trend: 'stable' },
    { tag: 'AI', count: 15234, trend: 'up' },
    { tag: 'CryptoArt', count: 4521, trend: 'down' },
  ]);

  const [suggestedUsers] = useState<SuggestedUser[]>([
    {
      username: 'vitalik',
      displayName: 'Vitalik Buterin',
      bio: 'Ethereum co-founder',
      followers: 2500000,
      isVerified: true,
    },
    {
      username: 'punk6529',
      displayName: 'punk6529',
      bio: 'NFT collector & Web3 advocate',
      followers: 450000,
      isVerified: true,
    },
    {
      username: 'defi_dad',
      displayName: 'DeFi Dad',
      bio: 'Teaching DeFi to the masses',
      followers: 320000,
      isVerified: false,
    },
  ]);

  const [trendingPosts] = useState<TrendingPost[]>([
    {
      id: '1',
      author: {
        username: 'cryptowhale',
        displayName: 'Crypto Whale',
        isVerified: true,
      },
      content: 'The future of social media is decentralized. CRYB is leading the way.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likeCount: 1420,
      repostCount: 234,
      replyCount: 89,
      bookmarkCount: 156,
      isLiked: false,
      isReposted: false,
      isBookmarked: false,
    },
  ]);

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
        <div style={{
          position: 'sticky',
          top: 0,
          background: 'white',
          borderRadius: '0 0 20px 20px',
          padding: '24px',
          marginBottom: '24px',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#000', marginBottom: '16px' }}>
            Explore
          </h1>

          <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
              pointerEvents: 'none'
            }}>
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search CRYB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '52px',
                paddingLeft: '48px',
                paddingRight: '16px',
                borderRadius: '14px',
                border: '1px solid #E5E5E5',
                fontSize: '16px',
                outline: 'none',
                background: 'white'
              }}
            />
          </form>

          <div style={{ display: 'flex', gap: '16px' }}>
            {['trending', 'people', 'topics'].map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                style={{
                  cursor: 'pointer',
                  padding: '12px 0',
                  borderBottom: `2px solid ${activeTab === tab ? '#6366F1' : 'transparent'}`,
                  transition: 'all 150ms ease-out',
                  flex: 1,
                  textAlign: 'center',
                  fontWeight: activeTab === tab ? '600' : '400',
                  color: activeTab === tab ? '#6366F1' : '#666'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </div>
            ))}
          </div>
        </div>

        {activeTab === 'trending' && (
          <div>
            <div style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '16px' }}>
                Trending Posts
              </h2>
              {trendingPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '24px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                  }}
                >
                  <p style={{ color: '#000', fontSize: '16px', lineHeight: '1.5' }}>{post.content}</p>
                  <div style={{ marginTop: '12px', color: '#666', fontSize: '14px' }}>
                    {post.likeCount} likes · {post.replyCount} replies
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '16px' }}>
                Trending Topics
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {trendingTopics.map((topic) => (
                  <div
                    key={topic.tag}
                    onClick={() => navigate(`/search?q=${encodeURIComponent('#' + topic.tag)}`)}
                    style={{
                      background: 'white',
                      borderRadius: '20px',
                      padding: '24px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: hoveredCard === topic.tag ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                      transform: hoveredCard === topic.tag ? 'translateY(-2px)' : 'translateY(0)'
                    }}
                    onMouseEnter={() => setHoveredCard(topic.tag)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Hash size={20} style={{ color: '#6366F1' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000' }}>
                        {topic.tag}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        {formatNumber(topic.count)} posts
                      </span>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 12px',
                        background: topic.trend === 'up' ? 'rgba(34, 197, 94, 0.1)' : topic.trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                        color: topic.trend === 'up' ? '#22C55E' : topic.trend === 'down' ? '#EF4444' : '#6B7280',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        <TrendingUp size={12} />
                        {topic.trend === 'up' ? 'Trending' : topic.trend === 'down' ? 'Declining' : 'Stable'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'people' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '16px' }}>
              Suggested People
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {suggestedUsers.map((user) => (
                <div
                  key={user.username}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: hoveredCard === user.username ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: hoveredCard === user.username ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  onMouseEnter={() => setHoveredCard(user.username)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => navigate(`/profile/${user.username}`)}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <h3 style={{
                        fontWeight: '600',
                        color: '#000',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {user.displayName}
                      </h3>
                      {user.isVerified && (
                        <span style={{ color: '#6366F1', fontSize: '16px' }}>✓</span>
                      )}
                    </div>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p style={{ fontSize: '14px', color: '#000', marginBottom: '8px' }}>
                        {user.bio}
                      </p>
                    )}
                    <p style={{ color: '#666', fontSize: '12px' }}>
                      {formatNumber(user.followers)} followers
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${user.username}`);
                      }}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        height: '48px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#000', marginBottom: '16px' }}>
              Popular Topics
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {trendingTopics.map((topic) => (
                <div
                  key={topic.tag}
                  onClick={() => navigate(`/search?q=${encodeURIComponent('#' + topic.tag)}`)}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    padding: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: hoveredCard === `topic-${topic.tag}` ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: hoveredCard === `topic-${topic.tag}` ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  onMouseEnter={() => setHoveredCard(`topic-${topic.tag}`)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Hash size={24} style={{ color: '#6366F1' }} />
                    <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#000' }}>
                      {topic.tag}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ color: '#666', fontSize: '16px' }}>
                      {formatNumber(topic.count)} posts
                    </span>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      background: topic.trend === 'up' ? 'rgba(34, 197, 94, 0.1)' : topic.trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                      color: topic.trend === 'up' ? '#22C55E' : topic.trend === 'down' ? '#EF4444' : '#6B7280',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      <TrendingUp size={14} />
                      {topic.trend === 'up' ? 'Trending' : topic.trend === 'down' ? 'Declining' : 'Stable'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/search?q=${encodeURIComponent('#' + topic.tag)}`);
                    }}
                    style={{
                      width: '100%',
                      height: '48px',
                      background: 'white',
                      color: '#6366F1',
                      border: '1px solid #E5E5E5',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Explore #{topic.tag}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExplorePage;
