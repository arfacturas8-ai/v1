/**
 * CRYB Platform - Discover Page
 * Complete Discovery Hub matching reference design
 * Features: Search, Categories, Communities, Learn, Top NFTs
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Users, Bitcoin, Image, BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import { PageSkeleton } from '../components/LoadingSkeleton';
import { useResponsive } from '../hooks/useResponsive';

// Crypto gradient colors
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
  { id: 'nft', label: 'NFT', icon: Image },
  { id: 'defi', label: 'DeFi', icon: TrendingUp },
  { id: 'metaverse', label: 'Metaverse', icon: Sparkles },
];

const learnLevels = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'expert', label: 'Expert' },
];

function CommunityCard({ community, isMobile }) {
  const [isHovered, setIsHovered] = useState(false);

  // Get crypto-specific gradient or use default
  // Get community-specific styling from crypto reference
  const getCommunityStyle = () => {
    const name = (community.slug || community.name || '').toLowerCase();

    // Match reference design colors exactly
    const styleMap = {
      bitcoin: { bg: 'linear-gradient(135deg, #F7931A 0%, #FF9500 100%)', icon: Bitcoin },
      ethereum: { bg: 'linear-gradient(135deg, #627EEA 0%, #8B9BF7 100%)', icon: Bitcoin },
      solana: { bg: 'linear-gradient(135deg, #14F195 0%, #9945FF 100%)', icon: Bitcoin },
      cardano: { bg: 'linear-gradient(135deg, #0033AD 0%, #0066FF 100%)', icon: Bitcoin },
      tether: { bg: 'linear-gradient(135deg, #26A17B 0%, #2AAD8A 100%)', icon: Bitcoin },
      avalanche: { bg: 'linear-gradient(135deg, #E84142 0%, #FF6B6B 100%)', icon: Bitcoin },
      binance: { bg: 'linear-gradient(135deg, #F3BA2F 0%, #FFD700 100%)', icon: Bitcoin },
      xrp: { bg: 'linear-gradient(135deg, #23292F 0%, #3A4A5A 100%)', icon: Bitcoin },
      terra: { bg: 'linear-gradient(135deg, #172852 0%, #2C4A8F 100%)', icon: Bitcoin },
      polygon: { bg: 'linear-gradient(135deg, #8247E5 0%, #A855F7 100%)', icon: Bitcoin },
      litecoin: { bg: 'linear-gradient(135deg, #345D9D 0%, #4A7FD8 100%)', icon: Bitcoin },
      ftx: { bg: 'linear-gradient(135deg, #00D2D2 0%, #00E8E8 100%)', icon: Bitcoin },
      vechain: { bg: 'linear-gradient(135deg, #15BDFF 0%, #4DD5FF 100%)', icon: Bitcoin },
      flow: { bg: 'linear-gradient(135deg, #00EF8B 0%, #00FFA3 100%)', icon: Bitcoin },
    };

    return styleMap[name] || { bg: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)', icon: Bitcoin };
  };

  const { bg, icon: Icon } = getCommunityStyle();
  const coinHolders = community.stats?.coinHolders || community.coinHolders || 13989;
  const members = community.stats?.members || community.members || 15867;

  return (
    <Link
      to={`/community/${community.slug || community.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: isMobile ? '24px' : '32px',
        textDecoration: 'none',
        background: bg,
        borderRadius: '20px',
        border: 'none',
        boxShadow: isHovered
          ? '0 8px 24px rgba(0, 0, 0, 0.15)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        minHeight: isMobile ? '180px' : '200px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        <Icon size={32} strokeWidth={2.5} style={{ color: '#FFFFFF' }} />
      </div>

      {/* Community Name */}
      <h3
        style={{
          fontSize: isMobile ? '22px' : '24px',
          fontWeight: '700',
          color: '#FFFFFF',
          marginBottom: '12px',
          letterSpacing: '-0.02em',
        }}
      >
        {community.displayName || community.name}
      </h3>

      {/* Coin Holders */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600' }}>
          {coinHolders.toLocaleString()}
        </span>
        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '400' }}>
          Coin Holders
        </span>
      </div>

      {/* Members with avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
        {/* Mock member avatars */}
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.6)',
              marginLeft: '-8px',
            }}
          />
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.6)',
              marginLeft: '-8px',
            }}
          />
        </div>
        <span style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.95)', fontWeight: '600' }}>
          {members.toLocaleString()}
        </span>
        <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: '400' }}>
          Members
        </span>
      </div>
    </Link>
  );
}

function LearnCard({ article, isMobile }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={`/learn/${article.slug || article.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'block',
        background: '#FFFFFF',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #E5E5E5',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      {article.imageUrl && (
        <div style={{ width: '100%', height: '140px', overflow: 'hidden' }}>
          <img
            src={article.imageUrl}
            alt={article.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
      <div style={{ padding: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#000000', marginBottom: '4px' }}>
          {article.title}
        </h4>
        {article.description && (
          <p style={{ fontSize: '13px', color: '#666666', lineHeight: '1.4' }}>
            {article.description}
          </p>
        )}
      </div>
    </Link>
  );
}

function NFTCard({ nft, isMobile }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      to={`/nft/${nft.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'block',
        background: '#FFFFFF',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #E8EAED',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 16px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#F8F9FA' }}>
        <img
          src={nft.imageUrl || '/placeholder-nft.png'}
          alt={nft.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
      <div style={{ padding: '12px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
          {nft.name}
        </h4>
        <p style={{ fontSize: '13px', color: '#666666' }}>
          {nft.collection || 'Collection'}
        </p>
      </div>
    </Link>
  );
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('crypto');
  const [selectedLearnLevel, setSelectedLearnLevel] = useState('beginner');
  const [communities, setCommunities] = useState([]);
  const [learnArticles, setLearnArticles] = useState([]);
  const [topNFTs, setTopNFTs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDiscoverData();
  }, [selectedCategory, selectedLearnLevel]);

  const fetchDiscoverData = async () => {
    setIsLoading(true);
    try {
      // Fetch communities
      const commRes = await fetch(`/api/discover/communities?category=${selectedCategory}`, {
        credentials: 'include',
      });
      if (commRes.ok) {
        const commData = await commRes.json();
        setCommunities(commData.communities || []);
      }

      // Fetch learn articles
      const learnRes = await fetch(`/api/discover/learn?level=${selectedLearnLevel}`, {
        credentials: 'include',
      });
      if (learnRes.ok) {
        const learnData = await learnRes.json();
        setLearnArticles(learnData.articles || []);
      }

      // Fetch top NFTs
      const nftRes = await fetch('/api/discover/nfts/top', {
        credentials: 'include',
      });
      if (nftRes.ok) {
        const nftData = await nftRes.json();
        setTopNFTs(nftData.nfts || []);
      }
    } catch (error) {
      console.error('Discover fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const padding = isMobile ? '16px' : isTablet ? '24px' : '32px';

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
          maxWidth: '1280px',
          margin: '0 auto',
          padding: padding,
        }}
      >
        {/* Search Bar - Hidden on mobile since MobileHeader has one */}
        {!isMobile && (
          <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                }}
              >
                <Search size={18} strokeWidth={2} style={{ color: '#999999' }} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Communities, Articles..."
                style={{
                  width: '100%',
                  height: '48px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  fontSize: '15px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  color: '#000000',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#58a6ff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E5E5';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </form>
        )}

        {/* Category Filters */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '40px',
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
                  gap: '8px',
                  padding: '12px 24px',
                  background: isActive ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)' : '#FFFFFF',
                  border: isActive ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '16px',
                  color: isActive ? '#FFFFFF' : '#666666',
                  fontSize: '15px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 16px rgba(88, 166, 255, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#F8F9FA';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  } else {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(88, 166, 255, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.transform = 'translateY(0)';
                  } else {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(88, 166, 255, 0.3)';
                  }
                }}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Communities on CRYB */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '20px',
            }}
          >
            Communities on CRYB
          </h2>

          {!isLoading && communities.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              {communities.slice(0, 6).map((community, index) => (
                <CommunityCard key={community.id || index} community={community} isMobile={isMobile} />
              ))}
            </div>
          )}
        </section>

        {/* Learn with Cryb */}
        <section style={{ marginBottom: '48px' }}>
          <h2
            style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '600',
              color: '#000000',
              marginBottom: '20px',
            }}
          >
            Learn with Cryb
          </h2>

          {/* Learn Level Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', overflowX: 'auto' }}>
            {learnLevels.map((level) => {
              const isActive = selectedLearnLevel === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedLearnLevel(level.id)}
                  style={{
                    padding: '10px 20px',
                    background: isActive ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)' : 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    color: isActive ? '#FFFFFF' : '#666666',
                    fontSize: '15px',
                    fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                    boxShadow: isActive ? '0 2px 8px rgba(88, 166, 255, 0.25)' : 'none',
                  }}
                >
                  {level.label}
                </button>
              );
            })}
          </div>

          {!isLoading && learnArticles.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: '16px',
              }}
            >
              {learnArticles.slice(0, 3).map((article, index) => (
                <LearnCard key={article.id || index} article={article} isMobile={isMobile} />
              ))}
            </div>
          )}

          {!isLoading && learnArticles.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link
                to="/learn"
                style={{
                  display: 'inline-block',
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  border: 'none',
                  borderRadius: '16px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 4px 16px rgba(88, 166, 255, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(88, 166, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(88, 166, 255, 0.3)';
                }}
              >
                View All Articles
              </Link>
            </div>
          )}
        </section>

        {/* Top NFTs section removed - was showing mock Genesis Collection data */}

        {/* Loading State */}
        {isLoading && <PageSkeleton />}
      </div>
    </div>
  );
}
