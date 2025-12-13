/**
 * CRYB Platform - Discover Page v.1
 * Light theme discover/explore matching design spec
 * Search, trending, filters for crypto/NFT/DeFi content
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Users, Coins, Hash } from 'lucide-react';
import { SearchInput } from '../components/ui/InputV1';
import { CryptoCard } from '../components/crypto/CryptoCard';
import { LearnCard } from '../components/ui/LearnCard';
import { useResponsive } from '../hooks/useResponsive';

function DiscoverPageV1() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All', icon: Hash },
    { id: 'communities', label: 'Communities', icon: Users },
    { id: 'crypto', label: 'Crypto', icon: Coins },
    { id: 'trending', label: 'Trending', icon: TrendingUp }
  ];

  const trendingTopics = [
    { name: 'Bitcoin', count: '12.5K posts' },
    { name: 'Ethereum', count: '8.2K posts' },
    { name: 'Web3', count: '5.1K posts' },
    { name: 'NFTs', count: '3.8K posts' }
  ];

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
            Discover
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
            Explore trending topics, communities, and learn about crypto
          </p>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <SearchInput
            placeholder="Search for communities, topics, or people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-6)',
            overflowX: 'auto',
            paddingBottom: 'var(--space-2)'
          }}
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={isActive ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grid Layout */}
        <div
          style={{
            display: 'grid',
            gap: 'var(--space-6)',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 360px'
          }}
        >
          {/* Main Content */}
          <div>
            <h2
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 'var(--font-bold)',
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-4)'
              }}
            >
              Learn
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <LearnCard
                title="Getting Started with Bitcoin"
                description="Learn the basics of Bitcoin and how to get started with crypto"
                skillLevel="beginner"
                steps={5}
                duration="15 min"
                onClick={() => navigate('/learn/bitcoin-basics')}
              />
              <LearnCard
                title="Understanding DeFi"
                description="Explore decentralized finance and its applications"
                skillLevel="intermediate"
                steps={8}
                duration="25 min"
                onClick={() => navigate('/learn/defi-guide')}
              />
              <LearnCard
                title="Advanced Trading Strategies"
                description="Master crypto trading with advanced techniques"
                skillLevel="expert"
                steps={12}
                duration="45 min"
                onClick={() => navigate('/learn/trading-advanced')}
              />
            </div>
          </div>

          {/* Sidebar */}
          {!isMobile && (
            <div>
              {/* Trending Topics */}
              <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-4)' }}>
                <h3
                  style={{
                    fontSize: 'var(--text-lg)',
                    fontWeight: 'var(--font-bold)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}
                >
                  <TrendingUp size={20} style={{ color: 'var(--brand-primary)' }} />
                  Trending Topics
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {trendingTopics.map((topic, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchTerm(topic.name)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--space-3)',
                        background: 'var(--bg-tertiary)',
                        border: 'none',
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-normal)',
                        textAlign: 'left'
                      }}
                      className="hover:bg-[var(--bg-hover)]"
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 'var(--text-base)',
                            fontWeight: 'var(--font-semibold)',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--space-1)'
                          }}
                        >
                          #{topic.name}
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                          {topic.count}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-bold)',
                          color: 'var(--text-tertiary)'
                        }}
                      >
                        {index + 1}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DiscoverPageV1;
