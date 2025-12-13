/**
 * CRYB Platform - Wallet Page v.1
 * Light theme wallet/portfolio matching design spec
 * NFTs, tokens, transactions display
 */

import React, { useState } from 'react';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Grid, List } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import { Badge } from '../components/ui/Badge';

function WalletPageV1() {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('coins');

  const tabs = [
    { id: 'coins', label: 'Coins' },
    { id: 'nfts', label: 'NFTs' },
    { id: 'activity', label: 'Activity' }
  ];

  const mockPortfolio = {
    totalValue: '$12,485.50',
    change24h: '+$324.12',
    changePercent: '+2.67%'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: 'var(--space-4)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1
            className="gradient-text"
            style={{
              fontSize: isMobile ? 'var(--text-3xl)' : 'var(--text-4xl)',
              fontWeight: 'var(--font-bold)',
              marginBottom: 'var(--space-2)'
            }}
          >
            Wallet
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
            Manage your crypto assets and NFTs
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-gradient-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Wallet size={24} style={{ color: 'var(--brand-primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                Total Portfolio Value
              </div>
              <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                {mockPortfolio.totalValue}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <TrendingUp size={16} style={{ color: 'var(--color-success)' }} />
            <span style={{ fontSize: 'var(--text-base)', color: 'var(--color-success)', fontWeight: 'var(--font-semibold)' }}>
              {mockPortfolio.change24h} ({mockPortfolio.changePercent})
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              Last 24 hours
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            background: 'var(--bg-tertiary)',
            padding: 'var(--space-1)',
            borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--space-6)'
          }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: 'var(--space-2) var(--space-4)',
                  background: isActive ? 'var(--bg-secondary)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-normal)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          {activeTab === 'coins' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>
                Your Coins
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Connect your wallet to view your crypto holdings
              </p>
              <button className="btn-primary" style={{ marginTop: 'var(--space-4)' }}>
                Connect Wallet
              </button>
            </div>
          )}

          {activeTab === 'nfts' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>
                Your NFTs
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                View and manage your NFT collection
              </p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>
                Recent Activity
              </h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                No recent transactions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WalletPageV1;
