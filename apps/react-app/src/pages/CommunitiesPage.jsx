/**
 * Cryb.ai - Communities Page
 * Discover and join communities
 * Master Prompt Standards Applied:
 * - Spacing scale: 4, 8, 16, 24, 32, 48, 64px only
 * - Icons: All exactly 24px in fixed containers
 * - Input heights: 48px
 * - Button heights: 48px (md)
 * - Responsive padding: 16px mobile, 24px tablet, 80px desktop
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Star,
  Sparkles,
  ChevronDown,
  Hash,
  Loader,
} from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import { formatNumber, getInitials } from '../lib/utils';
import communityService from '../services/communityService';
import { useAuth } from '../contexts/AuthContext';

function CommunitiesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('members');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all');
  const [error, setError] = useState(null);

  // Fetch communities
  useEffect(() => {
    const loadCommunities = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await communityService.getCommunities({
          search: searchTerm,
          category: filterCategory !== 'all' ? filterCategory : undefined,
          sort: sortBy,
          limit: 50,
        });

        if (result.success && result.communities) {
          setCommunities(result.communities);
        } else {
          setCommunities([]);
        }
      } catch (err) {
        console.error('Error loading communities:', err);
        setError(err.message || 'Failed to load communities');
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };

    loadCommunities();
  }, [searchTerm, sortBy, filterCategory]);

  const handleJoin = useCallback(async (communityId, communityName) => {
    try {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId || c.name === communityName
            ? { ...c, isJoined: true, members: (c.members || 0) + 1 }
            : c
        )
      );
      await communityService.joinCommunity(communityId || communityName);
    } catch (err) {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId || c.name === communityName
            ? { ...c, isJoined: false, members: (c.members || 0) - 1 }
            : c
        )
      );
      console.error('Failed to join:', err);
    }
  }, []);

  const handleLeave = useCallback(async (communityId, communityName) => {
    try {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId || c.name === communityName
            ? { ...c, isJoined: false, members: (c.members || 0) - 1 }
            : c
        )
      );
      await communityService.leaveCommunity(communityId || communityName);
    } catch (err) {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId || c.name === communityName
            ? { ...c, isJoined: true, members: (c.members || 0) + 1 }
            : c
        )
      );
      console.error('Failed to leave:', err);
    }
  }, []);

  const filteredCommunities = useMemo(() => {
    return communities
      .filter((community) => {
        const matchesSearch =
          !searchTerm ||
          community.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          community.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          community.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory === 'all' || community.category === filterCategory;

        const matchesTab =
          selectedTab === 'all' ||
          (selectedTab === 'trending' && community.trending) ||
          (selectedTab === 'featured' && community.featured) ||
          (selectedTab === 'new' && community.isNew);

        return matchesSearch && matchesCategory && matchesTab;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'trending':
            return (b.growthRate || 0) - (a.growthRate || 0);
          case 'members':
            return (b.members || 0) - (a.members || 0);
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'newest':
            return new Date(b.createdAt) - new Date(a.createdAt);
          default:
            return 0;
        }
      });
  }, [communities, searchTerm, filterCategory, selectedTab, sortBy]);

  const categories = [
    'all',
    'technology',
    'gaming',
    'science',
    'entertainment',
    'finance',
    'creative',
    'general',
  ];

  const tabs = [
    { id: 'all', label: 'All', icon: Users },
    { id: 'featured', label: 'Featured', icon: Star },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Sparkles },
  ];

  // Determine responsive values
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const isTabletView = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;
  const pagePadding = isDesktop ? '64px' : isTabletView ? '32px' : '16px';

  if (loading) {
    return null;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        paddingTop: typeof window !== 'undefined' && window.innerWidth >= 768 ? '72px' : '56px',
      }}
    >
      <div
        className="max-w-7xl mx-auto"
        style={{
          padding: pagePadding,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1
            className="font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent"
            style={{
              fontSize: isMobile ? '24px' : '32px',
              lineHeight: '1.2',
              marginBottom: '8px',
            }}
          >
            Discover Communities
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '16px',
              lineHeight: '1.5',
            }}
          >
            Explore and join communities that match your interests
          </p>
        </div>

        {/* Search and Filters */}
        <div
          className="rounded-2xl"
          style={{
            padding: isMobile ? '16px' : '24px',
            marginBottom: '32px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            className="flex flex-col sm:flex-row"
            style={{
              gap: '16px',
            }}
          >
            <div className="flex-1 relative">
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
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-hidden="true"
                />
              </div>
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full outline-none transition-all"
                style={{
                  height: '48px',
                  paddingLeft: '48px',
                  paddingRight: '16px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                aria-label="Search communities"
              />
            </div>

            <div className="relative min-w-full sm:min-w-[160px]">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full appearance-none cursor-pointer outline-none transition-all"
                style={{
                  height: '48px',
                  paddingLeft: '16px',
                  paddingRight: '48px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                aria-label="Filter by category"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <div
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                }}
              >
                <ChevronDown
                  size={24}
                  strokeWidth={2}
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="relative min-w-full sm:min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none cursor-pointer outline-none transition-all"
                style={{
                  height: '48px',
                  paddingLeft: '16px',
                  paddingRight: '48px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                aria-label="Sort by"
              >
                <option value="members">Most Members</option>
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="name">Name</option>
              </select>
              <div
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                }}
              >
                <ChevronDown
                  size={24}
                  strokeWidth={2}
                  style={{ color: 'var(--text-tertiary)' }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center justify-between flex-wrap"
          style={{
            marginBottom: '32px',
            gap: '16px',
          }}
        >
          <div
            className="flex overflow-x-auto"
            style={{
              gap: '8px',
              paddingBottom: '8px',
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className="flex items-center whitespace-nowrap transition-all"
                  style={{
                    gap: '8px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    height: '48px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive
                      ? 'linear-gradient(to right, #58a6ff, #a371f7)'
                      : 'var(--bg-secondary)',
                    color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                    boxShadow: isActive ? 'var(--shadow-lg)' : 'none',
                  }}
                  aria-label={`View ${tab.label} communities`}
                  aria-pressed={isActive}
                >
                  <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                    <Icon size={24} strokeWidth={2} aria-hidden="true" />
                  </div>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {user && (
            <button
              onClick={() => navigate('/communities/create')}
              className="flex items-center transition-all"
              style={{
                gap: '8px',
                paddingLeft: '24px',
                paddingRight: '24px',
                height: '48px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                color: 'var(--text-inverse)',
                boxShadow: 'var(--shadow-md)',
              }}
              aria-label="Create new community"
            >
              <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                <Plus size={24} strokeWidth={2} aria-hidden="true" />
              </div>
              Create
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-xl text-center"
            style={{
              padding: '16px',
              marginBottom: '32px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
            role="alert"
          >
            {typeof error === 'string' ? error : 'An error occurred'}
          </div>
        )}

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <div
            className="rounded-2xl text-center"
            style={{
              padding: isMobile ? '48px 16px' : '64px 32px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
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
                opacity: 0.5,
              }}
            >
              <Hash
                size={64}
                strokeWidth={2}
                style={{ color: 'var(--text-tertiary)' }}
                aria-hidden="true"
              />
            </div>
            <h3
              className="font-semibold"
              style={{
                fontSize: '20px',
                lineHeight: '1.4',
                marginBottom: '8px',
                color: 'var(--text-primary)',
              }}
            >
              No communities found
            </h3>
            <p
              style={{
                marginBottom: '32px',
                fontSize: '16px',
                lineHeight: '1.5',
                color: 'var(--text-secondary)',
              }}
            >
              {searchTerm ? 'Try a different search term' : 'Be the first to create a community!'}
            </p>
            {user && (
              <button
                onClick={() => navigate('/communities/create')}
                className="font-semibold transition-all"
                style={{
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  height: '48px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                  color: 'var(--text-inverse)',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  boxShadow: 'var(--shadow-md)',
                }}
                aria-label="Create new community"
              >
                Create Community
              </button>
            )}
          </div>
        ) : (
          <div
            className="grid"
            style={{
              gap: '24px',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            }}
          >
            {filteredCommunities.map((community) => (
              <div
                key={community.id || community.name}
                onClick={() => navigate(`/community/${community.name || community.id}`)}
                className="rounded-2xl cursor-pointer transition-all group"
                style={{
                  padding: '24px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <div
                  className="flex items-start"
                  style={{
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  {community.icon ? (
                    <img
                      src={community.icon}
                      alt=""
                      className="rounded-xl object-cover"
                      style={{
                        width: '56px',
                        height: '56px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    />
                  ) : (
                    <div
                      className="rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center font-bold"
                      style={{
                        width: '56px',
                        height: '56px',
                        color: 'var(--text-inverse)',
                        fontSize: '20px',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      {getInitials(community.displayName || community.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-bold truncate group-hover:text-[#58a6ff] transition-colors"
                      style={{
                        fontSize: '18px',
                        lineHeight: '1.4',
                        marginBottom: '4px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {community.displayName || community.name}
                    </div>
                    <div
                      className="inline-flex items-center rounded-lg"
                      style={{
                        gap: '4px',
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        background: 'rgba(88, 166, 255, 0.15)',
                        fontSize: '12px',
                        color: '#58a6ff',
                        fontWeight: 500,
                      }}
                    >
                      <div style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                        <Hash size={24} strokeWidth={2} aria-hidden="true" />
                      </div>
                      {community.category || 'general'}
                    </div>
                    {(community.featured || community.trending) && (
                      <div
                        className="flex"
                        style={{
                          gap: '8px',
                          marginTop: '8px',
                        }}
                      >
                        {community.featured && (
                          <span
                            className="flex items-center font-semibold rounded-md"
                            style={{
                              gap: '4px',
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '2px',
                              paddingBottom: '2px',
                              background: 'rgba(245, 158, 11, 0.2)',
                              fontSize: '10px',
                              color: '#f59e0b',
                            }}
                          >
                            <Star size={10} strokeWidth={2} aria-hidden="true" /> Featured
                          </span>
                        )}
                        {community.trending && (
                          <span
                            className="flex items-center font-semibold rounded-md"
                            style={{
                              gap: '4px',
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '2px',
                              paddingBottom: '2px',
                              background: 'rgba(34, 197, 94, 0.2)',
                              fontSize: '10px',
                              color: '#22c55e',
                            }}
                          >
                            <TrendingUp size={10} strokeWidth={2} aria-hidden="true" /> Trending
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p
                  className="line-clamp-2"
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {community.description || 'No description available'}
                </p>

                <div
                  className="flex"
                  style={{
                    gap: '16px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div
                    className="flex items-center"
                    style={{
                      gap: '4px',
                    }}
                  >
                    <div style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                      <Users size={24} strokeWidth={2} aria-hidden="true" />
                    </div>
                    {formatNumber(community.members || community.memberCount || 0)} members
                  </div>
                  <div
                    className="flex items-center"
                    style={{
                      gap: '4px',
                    }}
                  >
                    <div style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                      <Sparkles size={24} strokeWidth={2} aria-hidden="true" />
                    </div>
                    {formatNumber(community.postCount || 0)} posts
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (community.isJoined) {
                      handleLeave(community.id, community.name);
                    } else {
                      handleJoin(community.id, community.name);
                    }
                  }}
                  className="w-full font-semibold transition-all"
                  style={{
                    height: '48px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    border: community.isJoined ? '1px solid var(--border-default)' : 'none',
                    cursor: 'pointer',
                    background: community.isJoined
                      ? 'var(--bg-hover)'
                      : 'linear-gradient(to right, #58a6ff, #a371f7)',
                    color: community.isJoined ? 'var(--text-secondary)' : 'var(--text-inverse)',
                    boxShadow: community.isJoined ? 'none' : 'var(--shadow-sm)',
                  }}
                  aria-label={community.isJoined ? 'Leave community' : 'Join community'}
                >
                  {community.isJoined ? 'Joined' : 'Join Community'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunitiesPage;
