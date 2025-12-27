import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Tabs, Progress } from '@radix-ui/themes';
import { 
  Wallet, Coins, Image, Vote, TrendingUp, Network, 
  Settings, ExternalLink, RefreshCw, AlertTriangle,
  Shield, Zap, DollarSign, Users, Globe
} from 'lucide-react';
import StakingDashboard from './StakingDashboard';
import GovernanceDashboard from './GovernanceDashboard';
import NFTProfileSystem from './NFTProfileSystem';
import MultiChainManager from './MultiChainManager';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { getCRYBTokenContract } from '../../lib/contracts/cryb-contracts.js';
import { getDaoGovernor } from '../../lib/contracts/governance-contracts.js';
import { getNFTMarketplace } from '../../lib/contracts/nft-marketplace-contracts.js';
import { getDEXRouter } from '../../lib/contracts/defi-contracts.js';

const Web3Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    totalBalance: BigInt(0),
    stakedAmount: BigInt(0),
    nftCount: 0,
    votingPower: BigInt(0),
    portfolioValue: 0,
    loading: true
  });
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    account: null,
    chainId: null,
    providerType: null
  });

  // Load comprehensive dashboard data
  const loadDashboardData = async () => {
    if (!walletManager.isConnected) {
      setDashboardData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setDashboardData(prev => ({ ...prev, loading: true }));

      const chainId = walletManager.currentChainId || 1;
      const account = walletManager.account;

      // Initialize contracts
      const cryb = getCRYBTokenContract(chainId);
      const governance = getDaoGovernor(chainId);
      const marketplace = getNFTMarketplace(chainId);
      const dex = getDEXRouter(chainId);

      // Load data from all contracts
      const [
        tokenBalance,
        stakingInfo,
        nftData,
        votingPower,
        portfolioData
      ] = await Promise.all([
        cryb.getBalance(account).catch(() => BigInt(0)),
        cryb.getStakingInfo(account).catch(() => ({ stakedAmount: BigInt(0) })),
        cryb.getUserNFTs(account).catch(() => ({ tokenIds: [] })),
        governance.getUserVotingPower(account).catch(() => BigInt(0)),
        // Mock portfolio data - in real implementation would aggregate from multiple sources
        Promise.resolve({ totalValueUSD: 25000 })
      ]);

      setDashboardData({
        totalBalance: tokenBalance,
        stakedAmount: stakingInfo.stakedAmount,
        nftCount: nftData.tokenIds.length,
        votingPower,
        portfolioValue: portfolioData.totalValueUSD,
        loading: false
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  // Handle wallet connection status
  useEffect(() => {
    const updateConnectionStatus = () => {
      setConnectionStatus({
        isConnected: walletManager.isConnected,
        account: walletManager.account,
        chainId: walletManager.currentChainId,
        providerType: walletManager.providerType
      });
    };

    // Initial status
    updateConnectionStatus();

    // Setup event listeners
    const handleConnectionChange = (connected) => updateConnectionStatus();
    const handleAccountChange = (account) => updateConnectionStatus();
    const handleChainChange = (chainId) => updateConnectionStatus();

    walletManager.on('connectionStateChanged', handleConnectionChange);
    walletManager.on('accountChanged', handleAccountChange);
    walletManager.on('chainChanged', handleChainChange);

    return () => {
      walletManager.off('connectionStateChanged', handleConnectionChange);
      walletManager.off('accountChanged', handleAccountChange);
      walletManager.off('chainChanged', handleChainChange);
    };
  }, []);

  // Load dashboard data when connection changes
  useEffect(() => {
    loadDashboardData();
  }, [connectionStatus.isConnected, connectionStatus.account, connectionStatus.chainId]);

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format token amount
  const formatTokenAmount = (amount, decimals = 18) => {
    return (Number(amount) / (10 ** decimals)).toFixed(2);
  };

  // Get network name
  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base'
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  // Get provider name
  const getProviderName = (providerType) => {
    const providers = {
      metamask: 'MetaMask',
      walletconnect: 'WalletConnect',
      coinbase: 'Coinbase Wallet',
      injected: 'Injected Wallet'
    };
    return providers[providerType] || 'Unknown';
  };

  // Connection component
  const ConnectionCard = () => (
    <Card style={{
  padding: '24px'
}}>
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
        <h2 style={{
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center'
}}>
          <Wallet style={{
  width: '24px',
  height: '24px'
}} />
          <span>Web3 Dashboard</span>
        </h2>
        
        {connectionStatus.isConnected && (
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw style={{
  width: '16px',
  height: '16px'
}} />
            Refresh
          </Button>
        )}
      </div>

      {connectionStatus.isConnected ? (
        <div style={{
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid #E8EAED'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <div style={{
  width: '12px',
  height: '12px',
  borderRadius: '50%'
}}></div>
              <div>
                <p style={{
  fontWeight: '600'
}}>
                  Connected to {getProviderName(connectionStatus.providerType)}
                </p>
                <p className="text-sm text-green-600">
                  {formatAddress(connectionStatus.account)} on {getNetworkName(connectionStatus.chainId)}
                </p>
              </div>
            </div>
            
            <div style={{
  display: 'flex'
}}>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`https://etherscan.io/address/${connectionStatus.account}`, '_blank')}
              >
                <ExternalLink style={{
  width: '12px',
  height: '12px'
}} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                color="red"
                onClick={() => walletManager.disconnect()}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
  background: '#FFFFFF',
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid #E8EAED',
  textAlign: 'center'
}}>
          <div className="mb-4">
            <Wallet style={{
  width: '48px',
  height: '48px',
  color: '#A0A0A0'
}} />
          </div>
          <h3 style={{
  fontWeight: '600'
}}>Connect Your Wallet</h3>
          <p style={{
  color: '#A0A0A0'
}}>
            Connect your Web3 wallet to access CRYB platform features
          </p>
          <Button onClick={() => walletManager.connect()}>
            Connect Wallet
          </Button>
        </div>
      )}
    </Card>
  );

  // Overview stats component
  const OverviewStats = () => (
    <div style={{
  display: 'grid',
  gap: '16px'
}}>
      <Card style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
            <Coins style={{
  width: '20px',
  height: '20px'
}} />
          </div>
          <div>
            <p style={{
  color: '#A0A0A0'
}}>CRYB Balance</p>
            <p style={{
  fontWeight: '600'
}}>
              {dashboardData.loading ? '...' : formatTokenAmount(dashboardData.totalBalance)}
            </p>
          </div>
        </div>
      </Card>

      <Card style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
            <Shield style={{
  width: '20px',
  height: '20px'
}} />
          </div>
          <div>
            <p style={{
  color: '#A0A0A0'
}}>Staked CRYB</p>
            <p style={{
  fontWeight: '600'
}}>
              {dashboardData.loading ? '...' : formatTokenAmount(dashboardData.stakedAmount)}
            </p>
          </div>
        </div>
      </Card>

      <Card style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
            <Image style={{
  width: '20px',
  height: '20px'
}} />
          </div>
          <div>
            <p style={{
  color: '#A0A0A0'
}}>NFTs Owned</p>
            <p style={{
  fontWeight: '600'
}}>
              {dashboardData.loading ? '...' : dashboardData.nftCount}
            </p>
          </div>
        </div>
      </Card>

      <Card style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <div style={{
  padding: '8px',
  borderRadius: '12px'
}}>
            <DollarSign style={{
  width: '20px',
  height: '20px'
}} />
          </div>
          <div>
            <p style={{
  color: '#A0A0A0'
}}>Portfolio Value</p>
            <p style={{
  fontWeight: '600'
}}>
              {dashboardData.loading ? '...' : `$${dashboardData.portfolioValue.toLocaleString()}`}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  // Quick actions component
  const QuickActions = () => (
    <Card style={{
  padding: '24px'
}}>
      <h3 style={{
  fontWeight: '600'
}}>Quick Actions</h3>
      <div style={{
  display: 'grid',
  gap: '12px'
}}>
        <Button 
          variant="outline" 
          style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '80px'
}}
          onClick={() => setActiveTab('staking')}
        >
          <Shield style={{
  width: '20px',
  height: '20px'
}} />
          <span className="text-sm">Stake CRYB</span>
        </Button>
        
        <Button 
          variant="outline" 
          style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '80px'
}}
          onClick={() => setActiveTab('governance')}
        >
          <Vote style={{
  width: '20px',
  height: '20px'
}} />
          <span className="text-sm">Vote</span>
        </Button>
        
        <Button 
          variant="outline" 
          style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '80px'
}}
          onClick={() => setActiveTab('nfts')}
        >
          <Image style={{
  width: '20px',
  height: '20px'
}} />
          <span className="text-sm">Mint NFT</span>
        </Button>
        
        <Button 
          variant="outline" 
          style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '80px'
}}
          onClick={() => setActiveTab('multichain')}
        >
          <Network style={{
  width: '20px',
  height: '20px'
}} />
          <span className="text-sm">Bridge</span>
        </Button>
      </div>
    </Card>
  );

  // Platform stats component
  const PlatformStats = () => (
    <Card style={{
  padding: '24px'
}}>
      <h3 style={{
  fontWeight: '600'
}}>Platform Statistics</h3>
      <div style={{
  display: 'grid',
  gap: '16px'
}}>
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  fontWeight: 'bold'
}}>2.5M+</div>
          <div style={{
  color: '#A0A0A0'
}}>Total CRYB Staked</div>
        </div>
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  fontWeight: 'bold'
}}>15,847</div>
          <div style={{
  color: '#A0A0A0'
}}>NFTs Minted</div>
        </div>
        <div style={{
  textAlign: 'center'
}}>
          <div style={{
  fontWeight: 'bold'
}}>342</div>
          <div style={{
  color: '#A0A0A0'
}}>Governance Proposals</div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <ConnectionCard />

      {/* Overview Section */}
      {connectionStatus.isConnected && (
        <>
          {/* Stats Overview */}
          <OverviewStats />

          {/* Main Tabs */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Trigger value="overview">
                <TrendingUp style={{
  width: '16px',
  height: '16px'
}} />
                Overview
              </Tabs.Trigger>
              <Tabs.Trigger value="staking">
                <Shield style={{
  width: '16px',
  height: '16px'
}} />
                Staking
              </Tabs.Trigger>
              <Tabs.Trigger value="governance">
                <Vote style={{
  width: '16px',
  height: '16px'
}} />
                Governance
              </Tabs.Trigger>
              <Tabs.Trigger value="nfts">
                <Image style={{
  width: '16px',
  height: '16px'
}} />
                NFTs
              </Tabs.Trigger>
              <Tabs.Trigger value="multichain">
                <Network style={{
  width: '16px',
  height: '16px'
}} />
                Multi-Chain
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="overview">
              <div className="space-y-6">
                <QuickActions />
                <PlatformStats />
                
                {/* Activity Summary */}
                <div style={{
  display: 'grid',
  gap: '24px'
}}>
                  <Card style={{
  padding: '24px'
}}>
                    <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
                      <Zap style={{
  width: '20px',
  height: '20px'
}} />
                      <span>Recent Activity</span>
                    </h3>
                    <div className="space-y-3">
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  background: '#F8F9FA',
  borderRadius: '12px'
}}>
                        <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
                        <div style={{
  flex: '1'
}}>
                          <p style={{
  fontWeight: '600'
}}>Staked 1,000 CRYB</p>
                          <p style={{
  color: '#A0A0A0'
}}>2 hours ago</p>
                        </div>
                      </div>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  background: '#F8F9FA',
  borderRadius: '12px'
}}>
                        <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
                        <div style={{
  flex: '1'
}}>
                          <p style={{
  fontWeight: '600'
}}>Voted on Proposal #42</p>
                          <p style={{
  color: '#A0A0A0'
}}>1 day ago</p>
                        </div>
                      </div>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  background: '#F8F9FA',
  borderRadius: '12px'
}}>
                        <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
                        <div style={{
  flex: '1'
}}>
                          <p style={{
  fontWeight: '600'
}}>Minted NFT #1234</p>
                          <p style={{
  color: '#A0A0A0'
}}>3 days ago</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card style={{
  padding: '24px'
}}>
                    <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
                      <Globe style={{
  width: '20px',
  height: '20px'
}} />
                      <span>Network Status</span>
                    </h3>
                    <div className="space-y-3">
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                        <span className="text-sm">Ethereum Mainnet</span>
                        <Badge color="green">Active</Badge>
                      </div>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                        <span className="text-sm">Polygon</span>
                        <Badge color="green">Active</Badge>
                      </div>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                        <span className="text-sm">Arbitrum</span>
                        <Badge color="green">Active</Badge>
                      </div>
                      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                        <span className="text-sm">Optimism</span>
                        <Badge color="yellow">Maintenance</Badge>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value="staking">
              <StakingDashboard />
            </Tabs.Content>

            <Tabs.Content value="governance">
              <GovernanceDashboard />
            </Tabs.Content>

            <Tabs.Content value="nfts">
              <NFTProfileSystem />
            </Tabs.Content>

            <Tabs.Content value="multichain">
              <MultiChainManager />
            </Tabs.Content>
          </Tabs.Root>
        </>
      )}

      {/* Help and Support */}
      {connectionStatus.isConnected && (
        <Card style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div>
              <h3 style={{
  fontWeight: '600'
}}>Need Help?</h3>
              <p style={{
  color: '#A0A0A0'
}}>
                Check out our documentation or join our community for support
              </p>
            </div>
            <div style={{
  display: 'flex'
}}>
              <Button variant="outline" size="sm">
                <ExternalLink style={{
  width: '16px',
  height: '16px'
}} />
                Docs
              </Button>
              <Button variant="outline" size="sm">
                <Users style={{
  width: '16px',
  height: '16px'
}} />
                Discord
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};



export default Web3Dashboard;