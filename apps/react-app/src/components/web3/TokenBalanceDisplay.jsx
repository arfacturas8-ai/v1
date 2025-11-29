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
  alignItems: 'center'
}}>
        {isPositive ? (
          <TrendingUp style={{
  height: '12px',
  width: '12px'
}} />
        ) : change < 0 ? (
          <TrendingDown style={{
  height: '12px',
  width: '12px'
}} />
        ) : null}
        {Math.abs(change).toFixed(2)}%
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
  justifyContent: 'space-between'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <Coins style={{
  height: '20px',
  width: '20px'
}} />
          <h3 style={{
  fontWeight: '500'
}}>Token Balances</h3>
          {state.isConnected && (
            <span style={{
  borderRadius: '4px'
}}>
              Connected
            </span>
          )}
        </div>
        
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <button
            onClick={() => setIsVisible(!isVisible)}
            style={{
  borderRadius: '12px'
}}
          >
            {isVisible ? (
              <Eye style={{
  height: '16px',
  width: '16px'
}} />
            ) : (
              <EyeOff style={{
  height: '16px',
  width: '16px'
}} />
            )}
          </button>
          
          <Button
            onClick={refreshBalances}
            disabled={isLoading}
            className="btn-secondary p-sm"
          >
            <RefreshCw style={{
  height: '16px',
  width: '16px'
}} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-lg">
        {!state.isConnected ? (
          <div style={{
  textAlign: 'center'
}}>
            <AlertCircle style={{
  height: '32px',
  width: '32px'
}} />
            <p className="text-secondary">Connect your wallet to view token balances</p>
          </div>
        ) : isLoading && balances.length === 0 ? (
          <div className="space-y-md">
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '12px'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%'
}}></div>
                  <div className="space-y-sm">
                    <div style={{
  width: '64px',
  height: '16px',
  borderRadius: '4px'
}}></div>
                    <div style={{
  width: '48px',
  height: '12px',
  borderRadius: '4px'
}}></div>
                  </div>
                </div>
                <div style={{
  textAlign: 'right'
}}>
                  <div style={{
  width: '80px',
  height: '16px',
  borderRadius: '4px'
}}></div>
                  <div style={{
  width: '64px',
  height: '12px',
  borderRadius: '4px'
}}></div>
                </div>
              </div>
            ))}
          </div>
        ) : balances.length === 0 ? (
          <div style={{
  textAlign: 'center'
}}>
            <Coins style={{
  height: '32px',
  width: '32px'
}} />
            <p className="text-secondary">No tokens found</p>
          </div>
        ) : (
          <div className="space-y-sm">
            {balances.map((token) => (
              <div
                key={token.address}
                style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderRadius: '12px'
}}
              >
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  {token.logo ? (
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%'
}}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                    {token.symbol.slice(0, 2)}
                  </div>
                  
                  <div>
                    <div style={{
  fontWeight: '500'
}}>{token.symbol}</div>
                    <div className="text-sm text-muted">{token.name}</div>
                  </div>
                </div>
                
                <div style={{
  textAlign: 'right'
}}>
                  <div style={{
  fontWeight: '500'
}}>
                    {isVisible ? token.balance : '***'}
                  </div>
                  {showUsdValues && token.usdValue && (
                    <div className="text-sm text-muted">
                      {isVisible ? formatUsdValue(token.usdValue) : '***'}
                    </div>
                  )}
                  {showPriceChanges && token.change24h !== undefined && (
                    <div className="mt-xs">
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
  textAlign: 'center'
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