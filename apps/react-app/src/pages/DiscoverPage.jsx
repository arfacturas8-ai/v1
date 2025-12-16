/**
 * Cryb.ai - Discover Page
 * Explore trending communities, tags, and people
 * Master Prompt Standards Applied:
 * - Spacing scale: 4, 8, 16, 24, 32, 48, 64px only
 * - Icons: All exactly 24px in fixed containers
 * - Button heights: 48px (md)
 * - Responsive padding: 16px mobile, 24px tablet, 80px desktop
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
      className="card card-interactive"
      style={{
        display: 'block',
        padding: '24px',
        textDecoration: 'none',
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
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
            color: 'var(--text-secondary)',
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
            fontSize: '12px',
            color: 'var(--text-tertiary)',
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
      className="badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        background: 'rgba(88, 166, 255, 0.1)',
        color: 'var(--brand-primary)',
        fontSize: '14px',
        fontWeight: 500,
        textDecoration: 'none',
        transition: 'all 0.2s',
        border: '1px solid var(--brand-primary)',
        borderRadius: '12px',
        opacity: 0.8,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
    >
      #{tag.name}
      {tag.postCount !== undefined && (
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
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
      className="card card-interactive"
      style={{
        display: 'block',
        padding: '24px',
        textDecoration: 'none',
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '4px',
          lineHeight: '1.4',
        }}
      >
        {user.displayName || user.username}
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
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
            color: 'var(--text-primary)',
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
            fontSize: '12px',
            color: 'var(--text-tertiary)',
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

  // Determine responsive values
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const isTabletView = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;
  const pagePadding = isDesktop ? '80px' : isTabletView ? '24px' : '16px';

  return (
    <div
      role="main"
      aria-label="Discover page"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingTop: typeof window !== 'undefined' && window.innerWidth >= 768 ? '72px' : '56px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `48px ${pagePadding}`,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1
            style={{
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
              lineHeight: '1.2',
            }}
          >
            Discover
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
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
            marginBottom: '48px',
          }}
        >
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '24px',
              height: '24px',
              flexShrink: 0,
            }}
          >
            <Search
              size={24}
              strokeWidth={2}
              aria-hidden="true"
              style={{
                color: 'var(--text-tertiary)',
              }}
            />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities, tags, or people..."
            className="input search-input w-full"
            style={{
              height: '48px',
              paddingLeft: '48px',
              paddingRight: '16px',
              fontSize: '16px',
              lineHeight: '1.5',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)',
            }}
            aria-label="Search discover page"
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '48px',
            borderBottom: '1px solid var(--border-subtle)',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom:
                    activeTab === tab.id
                      ? '2px solid var(--brand-primary)'
                      : '2px solid transparent',
                  color:
                    activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '-1px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
                aria-label={`View ${tab.label}`}
                aria-pressed={activeTab === tab.id}
              >
                <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                  <Icon size={24} strokeWidth={2} aria-hidden="true" />
                </div>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {!isLoading && (
          <>
            {/* Trending Tab */}
            {activeTab === 'trending' && (
              <div className="flex flex-col" style={{ gap: '48px' }}>
                <section>
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '24px',
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
                      gap: '24px',
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
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '24px',
                      lineHeight: '1.4',
                    }}
                  >
                    Trending Tags
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: isMobile ? '8px' : '16px',
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
                  gap: '24px',
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
                  gap: isMobile ? '8px' : '16px',
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
                  gap: '24px',
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
                className="card"
                style={{
                  textAlign: 'center',
                  padding: isMobile ? '64px 16px' : '64px 32px',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Filter
                    size={48}
                    strokeWidth={2}
                    color="var(--text-tertiary)"
                    aria-hidden="true"
                  />
                </div>
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                    lineHeight: '1.4',
                  }}
                >
                  No results found
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
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
