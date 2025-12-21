/**
 * CRYB Platform - Discover Page
 * iOS-Style Polish with Crypto Community Focus
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Users, Bitcoin } from 'lucide-react';
import { PageSkeleton } from '../components/LoadingSkeleton';
import { useResponsive } from '../hooks/useResponsive';

// Crypto gradient colors from DESIGN_SPEC.md
const cryptoColors = {
  bitcoin: { gradient: 'linear-gradient(135deg, #F7931A 0%, #FF9500 100%)' },
  ethereum: { gradient: 'linear-gradient(135deg, #627EEA 0%, #8B9BF7 100%)' },
  solana: { gradient: 'linear-gradient(135deg, #14F195 0%, #9945FF 100%)' },
  cardano: { gradient: 'linear-gradient(135deg, #0033AD 0%, #0066FF 100%)' },
  polygon: { gradient: 'linear-gradient(135deg, #8247E5 0%, #A855F7 100%)' },
  avalanche: { gradient: 'linear-gradient(135deg, #E84142 0%, #FF6B6B 100%)' },
};

const categories = [
  { id: 'crypto', label: 'Crypto', icon: Bitcoin },
  { id: 'defi', label: 'DeFi', icon: Users },
  { id: 'nft', label: 'NFT', icon: Users },
  { id: 'metaverse', label: 'Metaverse', icon: Users },
];

function CommunityCard({ community, isMobile }) {
  const [isHovered, setIsHovered] = useState(false);
  const cryptoKey = community.name?.toLowerCase() || 'bitcoin';
  const colorConfig = cryptoColors[cryptoKey] || cryptoColors.bitcoin;

  return (
    <Link
      to={`/community/${community.name}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'block',
        padding: '24px',
        textDecoration: 'none',
        background: colorConfig.gradient,
        borderRadius: '16px',
        border: 'none',
        boxShadow: isHovered
          ? '0 12px 24px rgba(0, 0, 0, 0.15)'
          : '0 4px 12px rgba(0, 0, 0, 0.12)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Crypto Icon */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Bitcoin size={28} strokeWidth={2} style={{ color: '#FFFFFF' }} />
      </div>

      {/* Community Name */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#FFFFFF',
          marginBottom: '8px',
          lineHeight: '1.3',
        }}
      >
        {community.displayName || community.name}
      </h3>

      {/* Coin Holders */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <Bitcoin size={14} strokeWidth={2} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
        <span
          style={{
            fontSize: '13px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '500',
          }}
        >
          {community.coinHolders || '3,859'} Coin Holders
        </span>
      </div>

      {/* Members */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', marginRight: '4px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
            }}
          />
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              marginLeft: '-8px',
            }}
          />
        </div>
        <span
          style={{
            fontSize: '14px',
            color: '#FFFFFF',
            fontWeight: '600',
          }}
        >
          {community.members || '15,867'} Members
        </span>
      </div>
    </Link>
  );
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('crypto');
  const [communities, setCommunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, [selectedCategory]);

  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/discover?category=${selectedCategory}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error('Discover fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for display
  const mockCommunities = [
    { name: 'solana', displayName: 'Solana', coinHolders: '3,859', members: '15,867' },
    { name: 'bitcoin', displayName: 'Bitcoin', coinHolders: '3,859', members: '15,867' },
    { name: 'ethereum', displayName: 'Ethereum', coinHolders: '4,200', members: '18,500' },
    { name: 'cardano', displayName: 'Cardano', coinHolders: '2,900', members: '12,400' },
    { name: 'polygon', displayName: 'Polygon', coinHolders: '3,100', members: '14,200' },
    { name: 'avalanche', displayName: 'Avalanche', coinHolders: '2,500', members: '11,800' },
  ];

  const displayCommunities = communities.length > 0 ? communities : mockCommunities;

  // Responsive padding
  const padding = isMobile ? '16px' : isTablet ? '24px' : '80px';

  return (
    <div
      role="main"
      aria-label="Discover page"
      style={{
        minHeight: '100vh',
        background: '#F8F9FA',
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Cryptos, Articles, NFT's..."
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '44px',
              paddingRight: '16px',
              fontSize: '16px',
              lineHeight: '1.5',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid #E8EAED',
              color: '#1A1A1A',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxShadow: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
            }}
            aria-label="Search discover page"
            onFocus={(e) => {
              e.target.style.borderColor = '#58a6ff';
              e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E8EAED';
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
                  background: isActive ? '#1A1A1A' : '#FFFFFF',
                  border: '1px solid #E8EAED',
                  borderRadius: '9999px',
                  color: isActive ? '#FFFFFF' : '#666666',
                  fontSize: '15px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: 'none',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
                }}
                aria-label={`Filter by ${category.label}`}
                aria-pressed={isActive}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#F0F2F5';
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
            fontWeight: '700',
            color: '#1A1A1A',
            marginBottom: '20px',
            lineHeight: '1.3',
            letterSpacing: '-0.01em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
          }}
        >
          Communities on CRYB
        </h2>

        {/* Communities Grid */}
        {!isLoading && (
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
            {displayCommunities.map((community, index) => (
              <CommunityCard
                key={community.id || index}
                community={community}
                isMobile={isMobile}
              />
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && <PageSkeleton />}

        {/* Empty State */}
        {!isLoading && displayCommunities.length === 0 && (
          <div
            role="status"
            aria-live="polite"
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
              Try adjusting your search or check back later
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
