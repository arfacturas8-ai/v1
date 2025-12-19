/**
 * CRYB Platform - Discover Page
 * Modern iOS Aesthetic - Ultra Clean & Minimal
 *
 * DESIGN PRINCIPLES:
 * - Light theme with soft shadows
 * - Delicate borders and glassmorphism
 * - Generous whitespace
 * - System font feel
 * - Smooth transitions
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Users, Hash, Star, Filter, Search } from 'lucide-react';
import { PageSkeleton } from '../components/LoadingSkeleton';
import { useResponsive } from '../hooks/useResponsive';

// Helper components
function CommunityCard({ community }) {
  return (
    <Link
      to={`/community/${community.name}`}
      style={{
        display: 'block',
        padding: '24px',
        textDecoration: 'none',
        background: 'white',
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#000000',
          marginBottom: '8px',
          lineHeight: '1.4',
        }}
      >
        {community.displayName || community.name}
      </h3>
      {community.description && (
        <p
          style={{
            fontSize: '14px',
            color: '#666666',
            marginBottom: '16px',
            lineHeight: '1.5',
          }}
        >
          {community.description}
        </p>
      )}
      {community.memberCount !== undefined && (
        <span
          style={{
            fontSize: '13px',
            color: '#999999',
            lineHeight: '1.5',
          }}
        >
          {community.memberCount} members
        </span>
      )}
    </Link>
  );
}

function TagChip({ tag }) {
  return (
    <Link
      to={`/tag/${tag.name}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'rgba(99, 102, 241, 0.08)',
        color: '#6366F1',
        fontSize: '14px',
        fontWeight: '500',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '12px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.12)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
      }}
    >
      #{tag.name}
      {tag.postCount !== undefined && (
        <span
          style={{
            fontSize: '13px',
            color: '#999999',
          }}
        >
          {tag.postCount}
        </span>
      )}
    </Link>
  );
}

function UserCard({ user }) {
  return (
    <Link
      to={`/profile/${user.username}`}
      style={{
        display: 'block',
        padding: '24px',
        textDecoration: 'none',
        background: 'white',
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#000000',
          marginBottom: '4px',
          lineHeight: '1.4',
        }}
      >
        {user.displayName || user.username}
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: '#999999',
          marginBottom: '8px',
          lineHeight: '1.5',
        }}
      >
        @{user.username}
      </p>
      {user.bio && (
        <p
          style={{
            fontSize: '14px',
            color: '#666666',
            marginBottom: '8px',
            lineHeight: '1.5',
          }}
        >
          {user.bio}
        </p>
      )}
      {user.followers !== undefined && (
        <span
          style={{
            fontSize: '13px',
            color: '#999999',
            lineHeight: '1.5',
          }}
        >
          {user.followers} followers
        </span>
      )}
    </Link>
  );
}

export default function DiscoverPage() {
  const { isMobile, isTablet } = useResponsive();

  const [activeTab, setActiveTab] = useState('trending');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingCommunities, setTrendingCommunities] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);

  useEffect(() => {
    fetchDiscoverData();
  }, [activeTab]);

  const fetchDiscoverData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/discover?type=${activeTab}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTrendingCommunities(data.communities || []);
        setTrendingTags(data.tags || []);
        setSuggestedUsers(data.users || []);
      }
    } catch (error) {
      console.error('Discover fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'tags', label: 'Tags', icon: Hash },
    { id: 'people', label: 'People', icon: Star },
  ];

  // Responsive breakpoints
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <div
      role="main"
      aria-label="Discover page"
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        paddingTop: isMobile ? '76px' : '92px',
        paddingBottom: isMobile ? '96px' : '48px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: isMobile ? '16px' : isTablet ? '24px' : '48px',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1
            style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
              lineHeight: '1.2',
              letterSpacing: '-0.02em',
            }}
          >
            Discover
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#666666',
              lineHeight: '1.5',
            }}
          >
            Explore trending communities, topics, and people
          </p>
        </div>

        {/* Search bar */}
        <div
          style={{
            position: 'relative',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              flexShrink: 0,
            }}
          >
            <Search
              size={20}
              strokeWidth={2}
              aria-hidden="true"
              style={{
                color: '#999999',
              }}
            />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities, tags, or people..."
            style={{
              width: '100%',
              height: '52px',
              paddingLeft: '48px',
              paddingRight: '16px',
              fontSize: '15px',
              lineHeight: '1.5',
              borderRadius: '16px',
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              color: '#000000',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
            aria-label="Search discover page"
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(99, 102, 241, 0.3)';
              e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
            }}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '32px',
            background: 'white',
            borderRadius: '16px',
            padding: '8px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isMobile ? '10px 16px' : '12px 20px',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '12px',
                  color: isActive ? '#6366F1' : '#666666',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                aria-label={`View ${tab.label}`}
                aria-pressed={isActive}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                  <Icon size={20} strokeWidth={2} aria-hidden="true" />
                </div>
                {!isMobile && tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {!isLoading && (
          <>
            {/* Trending Tab */}
            {activeTab === 'trending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                <section>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#000000',
                      marginBottom: '20px',
                      lineHeight: '1.4',
                    }}
                  >
                    Trending Communities
                  </h2>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile
                        ? '1fr'
                        : isTablet
                        ? 'repeat(2, 1fr)'
                        : 'repeat(3, 1fr)',
                      gap: '20px',
                    }}
                  >
                    {trendingCommunities.slice(0, 6).map((community, index) => (
                      <CommunityCard key={community.id || index} community={community} />
                    ))}
                  </div>
                </section>

                <section>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#000000',
                      marginBottom: '20px',
                      lineHeight: '1.4',
                    }}
                  >
                    Trending Tags
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    {trendingTags.slice(0, 12).map((tag, index) => (
                      <TagChip key={tag.name || index} tag={tag} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Communities Tab */}
            {activeTab === 'communities' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : isTablet
                    ? 'repeat(2, 1fr)'
                    : 'repeat(3, 1fr)',
                  gap: '20px',
                }}
              >
                {trendingCommunities.map((community, index) => (
                  <CommunityCard key={community.id || index} community={community} />
                ))}
              </div>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {trendingTags.map((tag, index) => (
                  <TagChip key={tag.name || index} tag={tag} />
                ))}
              </div>
            )}

            {/* People Tab */}
            {activeTab === 'people' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : isTablet
                    ? 'repeat(2, 1fr)'
                    : 'repeat(3, 1fr)',
                  gap: '20px',
                }}
              >
                {suggestedUsers.map((user, index) => (
                  <UserCard key={user.id || index} user={user} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {((activeTab === 'communities' && trendingCommunities.length === 0) ||
              (activeTab === 'tags' && trendingTags.length === 0) ||
              (activeTab === 'people' && suggestedUsers.length === 0)) && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '64px 16px' : '64px 32px',
                  background: 'white',
                  borderRadius: '20px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0, 0, 0, 0.04)',
                    borderRadius: '50%',
                  }}
                >
                  <Filter
                    size={32}
                    strokeWidth={2}
                    color="#999999"
                    aria-hidden="true"
                  />
                </div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#000000',
                    marginBottom: '8px',
                    lineHeight: '1.4',
                  }}
                >
                  No results found
                </h3>
                <p
                  style={{
                    fontSize: '15px',
                    color: '#666666',
                    lineHeight: '1.5',
                  }}
                >
                  Try adjusting your search or check back later
                </p>
              </div>
            )}
          </>
        )}

        {isLoading && <PageSkeleton />}
      </div>
    </div>
  );
}
