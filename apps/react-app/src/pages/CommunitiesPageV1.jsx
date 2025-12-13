/**
 * CRYB Platform - Communities Page v.1
 * Light theme communities grid matching design spec
 * Using CryptoCard component for colorful crypto communities
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Search, Plus, Star, Sparkles, Hash } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import communityService from '../services/communityService';
import { useAuth } from '../contexts/AuthContext';
import { CryptoCard } from '../components/crypto/CryptoCard';
import { SearchInput } from '../components/ui/InputV1';
import { Select } from '../components/ui/InputV1';

function CommunitiesPageV1() {
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
          limit: 50
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
      setCommunities(prev => prev.map(c =>
        c.id === communityId || c.name === communityName
          ? { ...c, isJoined: true, members: (c.members || 0) + 1 }
          : c
      ));
      await communityService.joinCommunity(communityId || communityName);
    } catch (err) {
      setCommunities(prev => prev.map(c =>
        c.id === communityId || c.name === communityName
          ? { ...c, isJoined: false, members: (c.members || 0) - 1 }
          : c
      ));
      console.error('Failed to join:', err);
    }
  }, []);

  const filteredCommunities = useMemo(() => {
    return communities
      .filter(community => {
        const matchesSearch = !searchTerm ||
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
          case 'trending': return (b.growthRate || 0) - (a.growthRate || 0);
          case 'members': return (b.members || 0) - (a.members || 0);
          case 'name': return (a.name || '').localeCompare(b.name || '');
          case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
          default: return 0;
        }
      });
  }, [communities, searchTerm, filterCategory, selectedTab, sortBy]);

  const categories = ['all', 'technology', 'gaming', 'science', 'entertainment', 'finance', 'creative', 'general'];

  const tabs = [
    { id: 'all', label: 'All', icon: Users },
    { id: 'featured', label: 'Featured', icon: Star },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Sparkles }
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 'var(--space-4)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1
            className="gradient-text"
            style={{
              fontSize: isMobile ? 'var(--text-3xl)' : 'var(--text-4xl)',
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--space-2)'
            }}
          >
            Discover Communities
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
            Explore and join communities that match your interests
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 'var(--space-3)' }}>
            <div style={{ flex: 1 }}>
              <SearchInput
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={categories.map(cat => ({
                value: cat,
                label: cat.charAt(0).toUpperCase() + cat.slice(1)
              }))}
              style={{ minWidth: isMobile ? '100%' : '160px' }}
            />

            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'members', label: 'Most Members' },
                { value: 'trending', label: 'Trending' },
                { value: 'newest', label: 'Newest' },
                { value: 'name', label: 'Name' }
              ]}
              style={{ minWidth: isMobile ? '100%' : '160px' }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-6)',
            flexWrap: 'wrap',
            gap: 'var(--space-3)'
          }}
        >
          <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={isActive ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    whiteSpace: 'nowrap',
                    fontSize: 'var(--text-sm)'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {user && (
            <button
              onClick={() => navigate('/communities/create')}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-sm)'
              }}
            >
              <Plus size={18} />
              Create
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="card"
            style={{
              background: 'var(--color-error-light)',
              border: '1px solid var(--color-error)',
              color: 'var(--color-error-dark)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-6)',
              textAlign: 'center'
            }}
          >
            {typeof error === 'string' ? error : 'An error occurred'}
          </div>
        )}

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <div className="card" style={{ padding: isMobile ? 'var(--space-12)' : 'var(--space-16)', textAlign: 'center' }}>
            <Hash size={56} style={{ margin: '0 auto var(--space-4)', color: 'var(--text-tertiary)', opacity: 0.5 }} />
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              No communities found
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
              {searchTerm ? 'Try a different search term' : 'Be the first to create a community!'}
            </p>
            {user && (
              <button
                onClick={() => navigate('/communities/create')}
                className="btn-primary"
                style={{ fontSize: 'var(--text-base)' }}
              >
                Create Community
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 'var(--space-5)',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
            }}
          >
            {filteredCommunities.map(community => (
              <CryptoCard
                key={community.id || community.name}
                name={community.displayName || community.name}
                symbol={community.name}
                color={community.color || '#58a6ff'}
                coinHolders={community.members || 0}
                members={community.activeMembers || community.members || 0}
                grade={community.grade}
                onClick={() => navigate(`/community/${community.name || community.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunitiesPageV1;
