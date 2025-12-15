import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Users, Hash, Star, Filter, Search } from 'lucide-react'
import { PageSkeleton } from '../components/LoadingSkeleton'
import { useResponsive } from '../hooks/useResponsive'

// Helper components
function CommunityCard({ community }) {
  return (
    <Link
      to={`/community/${community.name}`}
      className="card card-interactive"
      style={{
        display: 'block',
        padding: 'var(--space-5)',
        textDecoration: 'none',
      }}
    >
      <h3 style={{
        fontSize: 'var(--text-lg)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-2)',
      }}>
        {community.displayName || community.name}
      </h3>
      {community.description && (
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-3)',
        }}>
          {community.description}
        </p>
      )}
      {community.memberCount !== undefined && (
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}>
          {community.memberCount} members
        </span>
      )}
    </Link>
  )
}

function TagChip({ tag }) {
  return (
    <Link
      to={`/tag/${tag.name}`}
      className="badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-4)',
        background: 'var(--color-info-light)',
        color: 'var(--brand-primary)',
        fontSize: 'var(--text-sm)',
        fontWeight: 'var(--font-medium)',
        textDecoration: 'none',
        transition: 'all var(--transition-normal)',
        border: '1px solid var(--brand-primary)',
        opacity: 0.8,
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
    >
      #{tag.name}
      {tag.postCount !== undefined && (
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
        }}>
          {tag.postCount}
        </span>
      )}
    </Link>
  )
}

function UserCard({ user }) {
  return (
    <Link
      to={`/profile/${user.username}`}
      className="card card-interactive"
      style={{
        display: 'block',
        padding: 'var(--space-5)',
        textDecoration: 'none',
      }}
    >
      <h3 style={{
        fontSize: 'var(--text-base)',
        fontWeight: 'var(--font-semibold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-1)',
      }}>
        {user.displayName || user.username}
      </h3>
      <p style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)',
        marginBottom: 'var(--space-2)',
      }}>
        @{user.username}
      </p>
      {user.bio && (
        <p style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-2)',
        }}>
          {user.bio}
        </p>
      )}
      {user.followers !== undefined && (
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
        }}>
          {user.followers} followers
        </span>
      )}
    </Link>
  )
}

export default function DiscoverPage() {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const compactSpacing = {
    formGap: isMobile ? 16 : isTablet ? 14 : 12,
    headerMargin: isMobile ? 20 : isTablet ? 18 : 16,
    logoMargin: isMobile ? 12 : isTablet ? 10 : 8,
    labelMargin: isMobile ? 8 : 6,
    inputPadding: isMobile ? 12 : 10,
    dividerMargin: isMobile ? 20 : isTablet ? 18 : 14,
    cardPadding: isMobile ? 20 : isTablet ? 24 : 20,
    sectionGap: isMobile ? 16 : isTablet ? 14 : 12
  }
  const [activeTab, setActiveTab] = useState('trending')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [trendingCommunities, setTrendingCommunities] = useState([])
  const [trendingTags, setTrendingTags] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])

  useEffect(() => {
    fetchDiscoverData()
  }, [activeTab])

  const fetchDiscoverData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/discover?type=${activeTab}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setTrendingCommunities(data.communities || [])
        setTrendingTags(data.tags || [])
        setSuggestedUsers(data.users || [])
      }
    } catch (error) {
      console.error('Discover fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'tags', label: 'Tags', icon: Hash },
    { id: 'people', label: 'People', icon: Star }
  ]
  return (
    <div
      role="main"
      aria-label="Discover page"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingTop: '80px',
      }}
    >
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? 'var(--space-8) var(--space-3)' : 'var(--space-8) var(--space-4)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{
            fontSize: isMobile ? 'var(--text-2xl)' : 'var(--text-3xl)',
            fontWeight: 'var(--font-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
          }}>
            Discover
          </h1>
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--text-secondary)',
            lineHeight: 'var(--leading-relaxed)',
          }}>
            Explore trending communities, topics, and people
          </p>
        </div>

        {/* Search bar */}
        <div style={{
          position: 'relative',
          marginBottom: 'var(--space-8)',
        }}>
          <Search
            size={20}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: isMobile ? '12px' : '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search communities, tags, or people..."
            className="input search-input"
            style={{
              width: '100%',
              padding: isMobile ? '12px 12px 12px 44px' : '14px 16px 14px 44px',
              fontSize: 'var(--text-base)',
            }}
            aria-label="Search discover page"
          />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-8)',
          borderBottom: '1px solid var(--border-subtle)',
          overflowX: 'auto',
        }}>
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: isMobile ? '10px 12px' : '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-semibold)',
                  cursor: 'pointer',
                  marginBottom: '-1px',
                  transition: 'all var(--transition-normal)',
                  whiteSpace: 'nowrap',
                }}
                aria-label={`View ${tab.label}`}
                aria-pressed={activeTab === tab.id}
              >
                <Icon size={18} aria-hidden="true" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {!isLoading && (
          <>
            {/* Trending Tab */}
            {activeTab === 'trending' && (
              <div className="flex flex-col gap-8">
                <section>
                  <h2 style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    Trending Communities
                  </h2>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: 'var(--space-4)',
                  }}>
                    {trendingCommunities.slice(0, 6).map((community, index) => (
                      <CommunityCard key={community.id || index} community={community} />
                    ))}
                  </div>
                </section>

                <section style={{ marginTop: 'var(--space-8)' }}>
                  <h2 style={{
                    fontSize: 'var(--text-xl)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    Trending Tags
                  </h2>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: isMobile ? 'var(--space-2)' : 'var(--space-3)',
                  }}>
                    {trendingTags.slice(0, 12).map((tag, index) => (
                      <TagChip key={tag.name || index} tag={tag} />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Communities Tab */}
            {activeTab === 'communities' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: 'var(--space-4)',
              }}>
                {trendingCommunities.map((community, index) => (
                  <CommunityCard key={community.id || index} community={community} />
                ))}
              </div>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: isMobile ? 'var(--space-2)' : 'var(--space-3)',
              }}>
                {trendingTags.map((tag, index) => (
                  <TagChip key={tag.name || index} tag={tag} />
                ))}
              </div>
            )}

            {/* People Tab */}
            {activeTab === 'people' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: 'var(--space-4)',
              }}>
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
                  padding: isMobile ? 'var(--space-12) var(--space-3)' : 'var(--space-16) var(--space-5)',
                }}
              >
                <Filter size={48} color="var(--text-tertiary)" aria-hidden="true" style={{
                  marginBottom: 'var(--space-4)',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }} />
                <h3 style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-semibold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-2)',
                }}>
                  No results found
                </h3>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                }}>
                  Try adjusting your search or check back later
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}


