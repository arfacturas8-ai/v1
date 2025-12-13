import React, { useState, useEffect } from 'react';
import {
  Coins,
  RefreshCw,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useWeb3Auth } from '../../lib/hooks/useWeb3Auth';
import ComingSoonWrapper from './ComingSoonWrapper';

function TokenBalanceDisplay({
  showUsdValues = true,
  showPriceChanges = false,
  maxTokens = 10,
  refreshInterval = 30000, // 30 seconds
  className = '',
  onBalanceUpdate
}) {
  const { state } = useWeb3Auth();
  const [balances, setBalances] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Mock token balances for preview
  const mockBalances = [
    {
      address: '0x1234567890123456789012345678901234567890',
      symbol: 'CRYB',
      name: 'CRYB Token',
      balance: '125,432.50',
      decimals: 18,
      usdValue: 45234.75,
      change24h: 12.5,
      logo: '/icons/cryb-token.svg'
    },
    {
      address: '0x0987654321098765432109876543210987654321',
      symbol: 'ETH',
      name: 'Ethereum',
      balance: '2.4567',
      decimals: 18,
      usdValue: 8234.12,
      change24h: -3.2,
      logo: '/icons/eth.svg'
    },
    {
      address: '0x1111111111111111111111111111111111111111',
      symbol: 'USDC',
      name: 'USD Coin',
      balance: '1,250.00',
      decimals: 6,
      usdValue: 1250.00,
      change24h: 0.1,
      logo: '/icons/usdc.svg'
    }
  ];

  useEffect(() => {
    if (state.isConnected && state.account) {
      loadBalances();

      // Set up auto-refresh
      const interval = setInterval(() => {
        loadBalances();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [state.isConnected, state.account, refreshInterval]);

  const loadBalances = async () => {
    try {
      setIsLoading(true);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real implementation, this would fetch actual token balances
      const mockData = mockBalances.slice(0, maxTokens);
      setBalances(mockData);
      setLastUpdate(new Date());

      if (onBalanceUpdate) {
        onBalanceUpdate(mockData);
      }
    } catch (error) {
      console.error('Failed to load token balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBalances = () => {
    loadBalances();
  };

  const formatUsdValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatChange = (change) => {
    const isPositive = change > 0;
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-1)',
        fontSize: 'var(--text-xs)',
        color: isPositive ? 'var(--color-success)' : 'var(--color-error)'
      }}>
        {isPositive ? (
          <TrendingUp style={{ height: '12px', width: '12px' }} />
        ) : change < 0 ? (
          <TrendingDown style={{ height: '12px', width: '12px' }} />
        ) : null}
        <span>{Math.abs(change).toFixed(2)}%</span>
      </div>
    );
  };

  // Actual component content for when Web3 is enabled
  const TokenBalanceContent = () => (
    <Card className={`${className}`}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Coins style={{ height: 'var(--icon-md)', width: 'var(--icon-md)', color: 'var(--brand-primary)' }} />
          <h3 style={{
            fontWeight: 'var(--font-semibold)',
            fontSize: 'var(--text-lg)',
            color: 'var(--text-primary)',
            margin: 0
          }}>Token Balances</h3>
          {state.isConnected && (
            <span className="badge badge-beginner">
              Connected
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="btn-ghost btn-sm"
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isVisible ? (
              <Eye style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)' }} />
            ) : (
              <EyeOff style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)' }} />
            )}
          </button>

          <Button
            onClick={refreshBalances}
            disabled={isLoading}
            className="btn-secondary btn-sm"
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshCw
              style={{
                height: 'var(--icon-sm)',
                width: 'var(--icon-sm)',
                animation: isLoading ? 'spin 1s linear infinite' : 'none'
              }}
            />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 'var(--space-4)' }}>
        {!state.isConnected ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8) var(--space-4)',
            color: 'var(--text-secondary)'
          }}>
            <AlertCircle style={{
              height: 'var(--icon-xl)',
              width: 'var(--icon-xl)',
              color: 'var(--text-tertiary)',
              margin: '0 auto var(--space-3)'
            }} />
            <p style={{ fontSize: 'var(--text-base)', margin: 0 }}>Connect your wallet to view token balances</p>
          </div>
        ) : isLoading && balances.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div className="skeleton" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-full)'
                  }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <div className="skeleton" style={{
                      width: '80px',
                      height: '16px',
                      borderRadius: 'var(--radius-sm)'
                    }}></div>
                    <div className="skeleton" style={{
                      width: '60px',
                      height: '12px',
                      borderRadius: 'var(--radius-sm)'
                    }}></div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <div className="skeleton" style={{
                    width: '100px',
                    height: '16px',
                    borderRadius: 'var(--radius-sm)'
                  }}></div>
                  <div className="skeleton" style={{
                    width: '80px',
                    height: '12px',
                    borderRadius: 'var(--radius-sm)',
                    marginLeft: 'auto'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8) var(--space-4)',
            color: 'var(--text-secondary)'
          }}>
            <Coins style={{
              height: 'var(--icon-xl)',
              width: 'var(--icon-xl)',
              color: 'var(--text-tertiary)',
              margin: '0 auto var(--space-3)'
            }} />
            <p style={{ fontSize: 'var(--text-base)', margin: 0 }}>No tokens found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {balances.map((token) => (
              <div
                key={token.address}
                className="card-interactive"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'all var(--transition-normal)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  {token.logo ? (
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-full)',
                        display: 'block'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="avatar avatar-md" style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-bold)',
                    display: token.logo ? 'none' : 'flex'
                  }}>
                    {token.symbol.slice(0, 2)}
                  </div>

                  <div>
                    <div style={{
                      fontWeight: 'var(--font-medium)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--text-primary)'
                    }}>{token.symbol}</div>
                    <div style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-tertiary)'
                    }}>{token.name}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: 'var(--font-medium)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {isVisible ? token.balance : '***'}
                  </div>
                  {showUsdValues && token.usdValue && (
                    <div style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      {isVisible ? formatUsdValue(token.usdValue) : '***'}
                    </div>
                  )}
                  {showPriceChanges && token.change24h !== undefined && (
                    <div style={{ marginTop: 'var(--space-1)' }}>
                      {formatChange(token.change24h)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {lastUpdate && (
          <div style={{
            textAlign: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            marginTop: 'var(--space-4)',
            padding: 'var(--space-2)'
          }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </Card>
  );

  // Wrap with coming soon overlay
  return (
    <ComingSoonWrapper
      feature="Token Balance Tracking"
      title="Token Portfolio Coming Soon!"
      description="Track all your token balances, USD values, and price changes in one place."
      expectedDate="Q2 2025"
      showPreview={true}
    >
      <TokenBalanceContent />
    </ComingSoonWrapper>
  );
}



export default TokenBalanceDisplay;
