/**
 * CRYB Platform - Communities Page
 * Modern iOS Aesthetic - Ultra Clean & Minimal
 *
 * DESIGN PRINCIPLES:
 * - Light theme with soft shadows
 * - Delicate borders and glassmorphism
 * - Generous whitespace
 * - System font feel
 * - Smooth transitions
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
  const [hoveredCard, setHoveredCard] = useState(null);

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

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  const isTabletView = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  const pagePadding = isDesktop ? '80px' : isTabletView ? '24px' : '16px';

  if (loading) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        color: '#666666',
        paddingTop: typeof window !== 'undefined' && window.innerWidth >= 768 ? '72px' : '56px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: pagePadding,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <h1
            style={{
              fontSize: isMobile ? '28px' : '36px',
              fontWeight: '700',
              lineHeight: '1.2',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Discover Communities
          </h1>
          <p
            style={{
              color: '#666666',
              fontSize: '16px',
              lineHeight: '1.5',
            }}
          >
            Explore and join communities that match your interests
          </p>
        </div>

        {/* Search and Filters */}
        <div
          style={{
            padding: isMobile ? '20px' : '24px',
            marginBottom: '32px',
            background: 'white',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Search
                  size={20}
                  strokeWidth={2}
                  style={{ color: '#999999' }}
                  aria-hidden="true"
                />
              </div>
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  height: '52px',
                  paddingLeft: '48px',
                  paddingRight: '16px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  borderRadius: '14px',
                  background: '#FAFAFA',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  color: '#000000',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)';
                  e.target.style.boxShadow = 'none';
                }}
                aria-label="Search communities"
              />
            </div>

            <div style={{ position: 'relative', minWidth: isMobile ? '100%' : '180px' }}>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  width: '100%',
                  height: '52px',
                  paddingLeft: '16px',
                  paddingRight: '48px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  borderRadius: '14px',
                  background: '#FAFAFA',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  color: '#000000',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  appearance: 'none',
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
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  pointerEvents: 'none',
                }}
              >
                <ChevronDown
                  size={20}
                  strokeWidth={2}
                  style={{ color: '#999999' }}
                  aria-hidden="true"
                />
              </div>
            </div>

            <div style={{ position: 'relative', minWidth: isMobile ? '100%' : '180px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  height: '52px',
                  paddingLeft: '16px',
                  paddingRight: '48px',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  borderRadius: '14px',
                  background: '#FAFAFA',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  color: '#000000',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  appearance: 'none',
                }}
                aria-label="Sort by"
              >
                <option value="members">Most Members</option>
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="name">Name</option>
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  pointerEvents: 'none',
                }}
              >
                <ChevronDown
                  size={20}
                  strokeWidth={2}
                  style={{ color: '#999999' }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            marginBottom: '32px',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
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
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    height: '48px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    background: isActive
                      ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                      : 'white',
                    color: isActive ? 'white' : '#666666',
                    boxShadow: isActive ? '0 4px 16px rgba(99, 102, 241, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                    }
                  }}
                  aria-label={`View ${tab.label} communities`}
                  aria-pressed={isActive}
                >
                  <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={20} strokeWidth={2} aria-hidden="true" />
                  </div>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {user && (
            <button
              onClick={() => navigate('/communities/create')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingLeft: '24px',
                paddingRight: '24px',
                height: '56px',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.2)';
              }}
              aria-label="Create new community"
            >
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Plus size={20} strokeWidth={2} aria-hidden="true" />
              </div>
              Create
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: '16px',
              marginBottom: '32px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              color: '#ef4444',
              fontSize: '14px',
              lineHeight: '1.5',
              textAlign: 'center',
            }}
            role="alert"
          >
            {typeof error === 'string' ? error : 'An error occurred'}
          </div>
        )}

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <div
            style={{
              padding: isMobile ? '48px 16px' : '64px 32px',
              background: 'white',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              borderRadius: '24px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
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
                style={{ color: '#999999' }}
                aria-hidden="true"
              />
            </div>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: '600',
                lineHeight: '1.4',
                marginBottom: '8px',
                color: '#000000',
              }}
            >
              No communities found
            </h3>
            <p
              style={{
                marginBottom: '32px',
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#666666',
              }}
            >
              {searchTerm ? 'Try a different search term' : 'Be the first to create a community!'}
            </p>
            {user && (
              <button
                onClick={() => navigate('/communities/create')}
                style={{
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  height: '56px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  lineHeight: '1.5',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.2)';
                }}
                aria-label="Create new community"
              >
                Create Community
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '24px',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            }}
          >
            {filteredCommunities.map((community) => (
              <div
                key={community.id || community.name}
                onClick={() => navigate(`/community/${community.name || community.id}`)}
                onMouseEnter={() => setHoveredCard(community.id || community.name)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: '24px',
                  background: 'white',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '20px',
                  boxShadow: hoveredCard === (community.id || community.name)
                    ? '0 8px 24px rgba(0, 0, 0, 0.08)'
                    : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: hoveredCard === (community.id || community.name) ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'start',
                    gap: '16px',
                    marginBottom: '16px',
                  }}
                >
                  {community.icon ? (
                    <img
                      src={community.icon}
                      alt=""
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        objectFit: 'cover',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: '700',
                        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
                      }}
                    >
                      {getInitials(community.displayName || community.name)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        lineHeight: '1.4',
                        marginBottom: '4px',
                        color: hoveredCard === (community.id || community.name) ? '#6366F1' : '#000000',
                        transition: 'color 0.2s ease',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {community.displayName || community.name}
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        paddingLeft: '8px',
                        paddingRight: '8px',
                        paddingTop: '4px',
                        paddingBottom: '4px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#6366F1',
                        fontWeight: '500',
                      }}
                    >
                      <div style={{ width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Hash size={14} strokeWidth={2} aria-hidden="true" />
                      </div>
                      {community.category || 'general'}
                    </div>
                    {(community.featured || community.trending) && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '8px',
                        }}
                      >
                        {community.featured && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '2px',
                              paddingBottom: '2px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '600',
                              color: '#f59e0b',
                            }}
                          >
                            <Star size={10} strokeWidth={2} aria-hidden="true" /> Featured
                          </span>
                        )}
                        {community.trending && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              paddingLeft: '8px',
                              paddingRight: '8px',
                              paddingTop: '2px',
                              paddingBottom: '2px',
                              background: 'rgba(34, 197, 94, 0.15)',
                              borderRadius: '6px',
                              fontSize: '10px',
                              fontWeight: '600',
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
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                    color: '#666666',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {community.description || 'No description available'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    color: '#666666',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={16} strokeWidth={2} aria-hidden="true" />
                    </div>
                    {formatNumber(community.members || community.memberCount || 0)} members
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Sparkles size={16} strokeWidth={2} aria-hidden="true" />
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
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    lineHeight: '1.5',
                    border: community.isJoined ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                    cursor: 'pointer',
                    background: community.isJoined
                      ? 'white'
                      : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    color: community.isJoined ? '#666666' : 'white',
                    boxShadow: community.isJoined ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.15)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!community.isJoined) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!community.isJoined) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.15)';
                    }
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
