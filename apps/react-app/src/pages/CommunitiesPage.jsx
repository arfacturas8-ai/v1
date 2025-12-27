/**
 * CRYB Platform - Communities Page
 * iOS-Style Polish with Crypto Community Focus
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Search, Bitcoin } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import { formatNumber, getInitials } from '../lib/utils';
import communityService from '../services/communityService';
import { useAuth } from '../contexts/AuthContext';

// Crypto gradient colors from DESIGN_SPEC.md
const cryptoColors = {
  bitcoin: { gradient: 'linear-gradient(135deg, #F7931A 0%, #FF9500 100%)' },
  ethereum: { gradient: 'linear-gradient(135deg, #627EEA 0%, #8B9BF7 100%)' },
  solana: { gradient: 'linear-gradient(135deg, #14F195 0%, #9945FF 100%)' },
  cardano: { gradient: 'linear-gradient(135deg, #0033AD 0%, #0066FF 100%)' },
  polygon: { gradient: 'linear-gradient(135deg, #8247E5 0%, #A855F7 100%)' },
  avalanche: { gradient: 'linear-gradient(135deg, #E84142 0%, #FF6B6B 100%)' },
  tether: { gradient: 'linear-gradient(135deg, #50AF95 0%, #26A17B 100%)' },
  binance: { gradient: 'linear-gradient(135deg, #F3BA2F 0%, #FFC940 100%)' },
  litecoin: { gradient: 'linear-gradient(135deg, #345D9D 0%, #4A7CC0 100%)' },
  polkadot: { gradient: 'linear-gradient(135deg, #E6007A 0%, #FF1A8C 100%)' },
};

const categories = [
  { id: 'crypto', label: 'Crypto' },
  { id: 'defi', label: 'DeFi' },
  { id: 'nft', label: 'NFT' },
  { id: 'metaverse', label: 'Metaverse' },
];

function CommunityCard({ community, onJoin, onLeave, isMobile }) {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/community/${community.name || community.id}`);
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (community.isJoined) {
      onLeave(community.id, community.name);
    } else {
      onJoin(community.id, community.name);
    }
  };

  // Get crypto-specific gradient or use default
  const getIconGradient = () => {
    const communityName = community.name?.toLowerCase();
    if (cryptoColors[communityName]) {
      return cryptoColors[communityName].gradient;
    }
    return 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)'; // Default gradient
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '20px',
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E5E5',
        boxShadow: isHovered
          ? '0 4px 12px rgba(0, 0, 0, 0.08)'
          : '0 1px 2px rgba(0, 0, 0, 0.06)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Crypto Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: getIconGradient(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
        }}
      >
        <Bitcoin size={24} strokeWidth={2} style={{ color: '#FFFFFF' }} />
      </div>

      {/* Community Name */}
      <h3
        style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#000000',
          marginBottom: '4px',
          lineHeight: '1.3',
        }}
      >
        {community.displayName || community.name}
      </h3>

      {/* Description */}
      {community.description && (
        <p
          style={{
            fontSize: '13px',
            color: '#666666',
            marginBottom: '12px',
            lineHeight: '1.4',
          }}
        >
          {community.description}
        </p>
      )}

      {/* Members */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginBottom: '12px',
        }}
      >
        <Users size={12} strokeWidth={2} style={{ color: '#666666' }} />
        <span
          style={{
            fontSize: '13px',
            color: '#666666',
            fontWeight: '400',
          }}
        >
          {formatNumber(community.members || community.memberCount || community.stats?.members || 0)} Members
        </span>
      </div>

      {/* Join Button */}
      <button
        onClick={handleButtonClick}
        style={{
          width: '100%',
          height: '36px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          border: community.isJoined ? '1px solid #E5E5E5' : 'none',
          cursor: 'pointer',
          background: community.isJoined ? '#FAFAFA' : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
          color: community.isJoined ? '#000000' : '#FFFFFF',
          transition: 'all 0.2s ease',
          boxShadow: community.isJoined ? 'none' : '0 2px 8px rgba(88, 166, 255, 0.3)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
        }}
        onMouseEnter={(e) => {
          if (!community.isJoined) {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 166, 255, 0.4)';
          } else {
            e.currentTarget.style.opacity = '0.85';
          }
        }}
        onMouseLeave={(e) => {
          if (!community.isJoined) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(88, 166, 255, 0.3)';
          } else {
            e.currentTarget.style.opacity = '1';
          }
        }}
        aria-label={community.isJoined ? 'Leave community' : 'Join community'}
      >
        {community.isJoined ? 'Joined' : 'Join'}
      </button>
    </div>
  );
}

function CommunitiesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('crypto');

  // Fetch communities
  useEffect(() => {
    const loadCommunities = async () => {
      setLoading(true);
      try {
        const result = await communityService.getCommunities({
          search: searchTerm,
          category: selectedCategory !== 'crypto' ? selectedCategory : undefined,
          limit: 50,
        });

        if (result.success && result.communities) {
          setCommunities(result.communities);
        } else {
          setCommunities([]);
        }
      } catch (err) {
        console.error('Error loading communities:', err);
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    };

    loadCommunities();
  }, [searchTerm, selectedCategory]);

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
    return communities.filter((community) => {
      const matchesSearch =
        !searchTerm ||
        community.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [communities, searchTerm]);

  // Responsive padding
  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAFAFA',
        paddingTop: isMobile ? '76px' : '92px',
        paddingBottom: isMobile ? '96px' : '48px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: padding,
        }}
      >
        {/* Search Bar - iOS Style */}
        <div
          style={{
            position: 'relative',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Search
              size={18}
              strokeWidth={2}
              style={{ color: '#999999' }}
              aria-hidden="true"
            />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Communities..."
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '44px',
              paddingRight: '16px',
              fontSize: '15px',
              lineHeight: '1.5',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              color: '#000000',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            }}
            aria-label="Search communities"
            onFocus={(e) => {
              e.target.style.borderColor = '#000000';
              e.target.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E5E5';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Category Filters - Pill Shaped */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '32px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: isActive ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)' : '#FFFFFF',
                  border: isActive ? 'none' : '1px solid #E5E5E5',
                  borderRadius: '9999px',
                  color: isActive ? '#FFFFFF' : '#666666',
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 12px rgba(88, 166, 255, 0.3)' : 'none',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                }}
                aria-label={`Filter by ${category.label}`}
                aria-pressed={isActive}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#FAFAFA';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#FFFFFF';
                  }
                }}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Section Title */}
        <h2
          style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: '600',
            color: '#000000',
            marginBottom: '20px',
            lineHeight: '1.3',
            letterSpacing: '-0.01em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          }}
        >
          Communities on CRYB
        </h2>

        {/* Communities Grid */}
        {!loading && filteredCommunities.length > 0 ? (
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
            {filteredCommunities.map((community, index) => (
              <CommunityCard
                key={community.id || community.name || index}
                community={community}
                onJoin={handleJoin}
                onLeave={handleLeave}
                isMobile={isMobile}
              />
            ))}
          </div>
        ) : !loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: isMobile ? '64px 16px' : '96px 32px',
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E8EAED',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1A1A1A',
                marginBottom: '8px',
                lineHeight: '1.4',
              }}
            >
              No communities found
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: '#666666',
                lineHeight: '1.5',
              }}
            >
              {searchTerm ? 'Try a different search term' : 'Check back later for new communities'}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CommunitiesPage;
