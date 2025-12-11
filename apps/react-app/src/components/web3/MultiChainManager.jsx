import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Dialog, Select, Progress, Tabs } from '@radix-ui/themes';
import { 
  Network, Zap, ArrowRightLeft, AlertTriangle, CheckCircle, 
  ExternalLink, RefreshCw, Wallet, DollarSign, TrendingUp,
  Shield, Clock, Globe, Settings
} from 'lucide-react';
import { CHAIN_IDS, NETWORK_CONFIGS } from '../../lib/contracts/cryb-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { transactionManager } from '../../lib/web3/TransactionManager.js';

const MultiChainManager = () => {
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [supportedNetworks, setSupportedNetworks] = useState([]);
  const [networkBalances, setNetworkBalances] = useState(new Map());
  const [bridgeTransactions, setBridgeTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNetworkDialog, setShowNetworkDialog] = useState(false);
  const [showBridgeDialog, setShowBridgeDialog] = useState(false);
  const [selectedTargetNetwork, setSelectedTargetNetwork] = useState(null);
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [bridgeAsset, setBridgeAsset] = useState('ETH');
  const [isSwitching, setIsSwitching] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [gasEstimates, setGasEstimates] = useState(new Map());

  // Mock cross-chain data
  const mockBridgeTransactions = [
    {
      id: '1',
      fromChain: CHAIN_IDS.MAINNET,
      toChain: CHAIN_IDS.POLYGON,
      asset: 'USDC',
      amount: '1000',
      status: 'completed',
      timestamp: Date.now() - 3600000,
      txHash: '0x123...abc',
      bridgeTime: 180000 // 3 minutes
    },
    {
      id: '2',
      fromChain: CHAIN_IDS.POLYGON,
      toChain: CHAIN_IDS.ARBITRUM,
      asset: 'CRYB',
      amount: '5000',
      status: 'pending',
      timestamp: Date.now() - 300000,
      txHash: '0x456...def',
      bridgeTime: 600000 // 10 minutes
    }
  ];

  const mockNetworkBalances = {
    [CHAIN_IDS.MAINNET]: {
      ETH: { balance: '2.5', usdValue: 6250 },
      USDC: { balance: '1500', usdValue: 1500 },
      CRYB: { balance: '25000', usdValue: 21250 }
    },
    [CHAIN_IDS.POLYGON]: {
      MATIC: { balance: '1200', usdValue: 960 },
      USDC: { balance: '800', usdValue: 800 },
      CRYB: { balance: '15000', usdValue: 12750 }
    },
    [CHAIN_IDS.ARBITRUM]: {
      ETH: { balance: '1.2', usdValue: 3000 },
      USDC: { balance: '500', usdValue: 500 },
      CRYB: { balance: '8000', usdValue: 6800 }
    },
    [CHAIN_IDS.OPTIMISM]: {
      ETH: { balance: '0.8', usdValue: 2000 },
      USDC: { balance: '300', usdValue: 300 },
      CRYB: { balance: '5000', usdValue: 4250 }
    }
  };

  // Initialize multi-chain data
  const initializeMultiChain = useCallback(async () => {
    try {
      setLoading(true);

      // Get current network
      const currentChainId = walletManager.currentChainId;
      const currentNet = Object.entries(NETWORK_CONFIGS).find(
        ([chainId]) => parseInt(chainId) === currentChainId
      );
      
      if (currentNet) {
        setCurrentNetwork({
          chainId: currentChainId,
          ...currentNet[1]
        });
      }

      // Set supported networks
      const supported = Object.entries(NETWORK_CONFIGS).map(([chainId, config]) => ({
        chainId: parseInt(chainId),
        ...config
      }));
      setSupportedNetworks(supported);

      // Load network balances (mock data for now)
      setNetworkBalances(new Map(Object.entries(mockNetworkBalances)));

      // Load bridge transactions
      setBridgeTransactions(mockBridgeTransactions);

      // Load gas estimates for each network
      await loadGasEstimates();

    } catch (error) {
      console.error('Failed to initialize multi-chain data:', error);
    } finally {
      setLoading(false);
    }
  }, [walletManager.currentChainId]);

  // Load gas estimates for different networks
  const loadGasEstimates = async () => {
    const estimates = new Map();
    
    // Mock gas estimates (in practice, these would come from gas oracles)
    estimates.set(CHAIN_IDS.MAINNET, { standard: 25, fast: 35, instant: 50 });
    estimates.set(CHAIN_IDS.POLYGON, { standard: 30, fast: 40, instant: 60 });
    estimates.set(CHAIN_IDS.ARBITRUM, { standard: 0.1, fast: 0.15, instant: 0.2 });
    estimates.set(CHAIN_IDS.OPTIMISM, { standard: 0.05, fast: 0.08, instant: 0.12 });
    
    setGasEstimates(estimates);
  };

  // Switch to different network
  const handleNetworkSwitch = async (chainId) => {
    if (!walletManager.isConnected) return;

    try {
      setIsSwitching(true);
      
      await walletManager.switchNetwork(chainId);
      
      // Update current network
      const networkConfig = NETWORK_CONFIGS[chainId];
      setCurrentNetwork({
        chainId,
        ...networkConfig
      });
      
      setShowNetworkDialog(false);
      
    } catch (error) {
      console.error('Network switch failed:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  // Bridge assets between chains
  const handleBridge = async () => {
    if (!bridgeAmount || !selectedTargetNetwork || !walletManager.isConnected) return;

    try {
      setIsBridging(true);
      
      // In a real implementation, this would interact with bridge contracts
      // For now, we'll simulate the bridge transaction
      const bridgeTx = {
        id: Date.now().toString(),
        fromChain: walletManager.currentChainId,
        toChain: selectedTargetNetwork,
        asset: bridgeAsset,
        amount: bridgeAmount,
        status: 'pending',
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 8)}`,
        bridgeTime: getBridgeTime(walletManager.currentChainId, selectedTargetNetwork)
      };

      setBridgeTransactions(prev => [bridgeTx, ...prev]);
      
      // Execute bridge transaction
      const txResult = await transactionManager.executeTransaction({
        to: '0xBridgeContract000000000000000000000000', // Mock bridge contract
        data: '0x', // Bridge function call data
        value: bridgeAsset === 'ETH' || bridgeAsset === 'MATIC' ? 
               bridgeAmount : '0'
      }, {
        priority: 'fast',
        gasStrategy: 'moderate'
      });

      // Reset form
      setBridgeAmount('');
      setSelectedTargetNetwork(null);
      setBridgeAsset('ETH');
      setShowBridgeDialog(false);

    } catch (error) {
      console.error('Bridge transaction failed:', error);
    } finally {
      setIsBridging(false);
    }
  };

  // Get estimated bridge time between networks
  const getBridgeTime = (fromChain, toChain) => {
    const bridgeTimes = {
      [`${CHAIN_IDS.MAINNET}-${CHAIN_IDS.POLYGON}`]: 300000, // 5 minutes
      [`${CHAIN_IDS.POLYGON}-${CHAIN_IDS.MAINNET}`]: 3600000, // 1 hour
      [`${CHAIN_IDS.MAINNET}-${CHAIN_IDS.ARBITRUM}`]: 600000, // 10 minutes
      [`${CHAIN_IDS.ARBITRUM}-${CHAIN_IDS.MAINNET}`]: 900000, // 15 minutes
      [`${CHAIN_IDS.MAINNET}-${CHAIN_IDS.OPTIMISM}`]: 900000, // 15 minutes
      [`${CHAIN_IDS.OPTIMISM}-${CHAIN_IDS.MAINNET}`]: 900000, // 15 minutes
    };
    
    return bridgeTimes[`${fromChain}-${toChain}`] || 1800000; // Default 30 minutes
  };

  // Format bridge time
  const formatBridgeTime = (timeMs) => {
    const minutes = Math.floor(timeMs / 60000);
    if (minutes < 60) return `~${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `~${hours}h ${minutes % 60}m`;
  };

  // Get network icon
  const getNetworkIcon = (chainId) => {
    const icons = {
      [CHAIN_IDS.MAINNET]: '🔷',
      [CHAIN_IDS.POLYGON]: '🟣',
      [CHAIN_IDS.ARBITRUM]: '🔵',
      [CHAIN_IDS.OPTIMISM]: '🔴',
      [CHAIN_IDS.BASE]: '🔵',
    };
    return icons[chainId] || '⚪';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Calculate total portfolio value across all chains
  const getTotalPortfolioValue = () => {
    let total = 0;
    for (const [chainId, assets] of networkBalances) {
      for (const [asset, data] of Object.entries(assets)) {
        total += data.usdValue;
      }
    }
    return total;
  };

  // Get top assets across all chains
  const getTopAssets = () => {
    const assetTotals = new Map();
    
    for (const [chainId, assets] of networkBalances) {
      for (const [asset, data] of Object.entries(assets)) {
        if (assetTotals.has(asset)) {
          assetTotals.set(asset, assetTotals.get(asset) + data.usdValue);
        } else {
          assetTotals.set(asset, data.usdValue);
        }
      }
    }
    
    return Array.from(assetTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  useEffect(() => {
    initializeMultiChain();
  }, [initializeMultiChain]);

  useEffect(() => {
    // Setup wallet event listeners
    const handleChainChanged = (chainId) => {
      const networkConfig = NETWORK_CONFIGS[chainId];
      if (networkConfig) {
        setCurrentNetwork({
          chainId,
          ...networkConfig
        });
      }
    };
    
    walletManager.on('chainChanged', handleChainChanged);
    
    return () => {
      walletManager.off('chainChanged', handleChainChanged);
    };
  }, []);

  if (!walletManager.isConnected) {
    return (
      <Card style={{
  padding: '24px',
  textAlign: 'center'
}}>
        <div className="mb-4">
          <Network style={{
  width: '48px',
  height: '48px',
  color: '#A0A0A0'
}} />
        </div>
        <h3 style={{
  fontWeight: '600'
}}>Connect Wallet</h3>
        <p style={{
  color: '#A0A0A0'
}}>
          Connect your wallet to manage assets across multiple chains
        </p>
        <Button onClick={() => walletManager.connect()}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card style={{
  padding: '24px'
}}>
        <div className=" space-y-4">
          <div style={{
  height: '24px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
          <div style={{
  height: '16px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
          <div style={{
  display: 'grid',
  gap: '16px'
}}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
  height: '128px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const totalPortfolioValue = getTotalPortfolioValue();
  const topAssets = getTopAssets();

  return (
    <div className="space-y-6">
      {/* Header Stats */}
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
              <DollarSign style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Total Portfolio</p>
              <p style={{
  fontWeight: '600'
}}>
                ${totalPortfolioValue.toLocaleString()}
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
              <Network style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Active Networks</p>
              <p style={{
  fontWeight: '600'
}}>
                {networkBalances.size}
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
              <ArrowRightLeft style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Bridge Transactions</p>
              <p style={{
  fontWeight: '600'
}}>
                {bridgeTransactions.length}
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
              <Zap style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Current Gas</p>
              <p style={{
  fontWeight: '600'
}}>
                {gasEstimates.get(currentNetwork?.chainId)?.standard || 0} gwei
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Network */}
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
            <Network style={{
  width: '24px',
  height: '24px'
}} />
            <span>Multi-Chain Portfolio</span>
          </h2>
          
          <div style={{
  display: 'flex'
}}>
            <Button 
              variant="outline" 
              onClick={() => setShowNetworkDialog(true)}
            >
              <Settings style={{
  width: '16px',
  height: '16px'
}} />
              Switch Network
            </Button>
            <Button onClick={() => setShowBridgeDialog(true)}>
              <ArrowRightLeft style={{
  width: '16px',
  height: '16px'
}} />
              Bridge Assets
            </Button>
          </div>
        </div>

        {/* Current Network Info */}
        <div style={{
  padding: '16px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
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
              <span className="text-2xl">{getNetworkIcon(currentNetwork?.chainId)}</span>
              <div>
                <h3 style={{
  fontWeight: '600'
}}>{currentNetwork?.name}</h3>
                <p style={{
  color: '#A0A0A0'
}}>
                  Connected to {currentNetwork?.name}
                </p>
              </div>
            </div>
            
            <div style={{
  textAlign: 'right'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <Badge color="green">
                  <CheckCircle style={{
  width: '12px',
  height: '12px'
}} />
                  Connected
                </Badge>
              </div>
              <p style={{
  color: '#A0A0A0'
}}>
                Gas: {gasEstimates.get(currentNetwork?.chainId)?.standard || 0} gwei
              </p>
            </div>
          </div>
        </div>

        {/* Top Assets Overview */}
        <div className="mb-6">
          <h3 style={{
  fontWeight: '600'
}}>Top Assets</h3>
          <div style={{
  display: 'grid',
  gap: '12px'
}}>
            {topAssets.map(([asset, value]) => (
              <div key={asset} style={{
  background: 'rgba(20, 20, 20, 0.6)',
  padding: '12px',
  borderRadius: '12px',
  textAlign: 'center'
}}>
                <p style={{
  fontWeight: '600'
}}>{asset}</p>
                <p style={{
  color: '#A0A0A0'
}}>${value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Network Balances */}
      <div style={{
  display: 'grid',
  gap: '24px'
}}>
        {Array.from(networkBalances.entries()).map(([chainId, assets]) => {
          const networkConfig = NETWORK_CONFIGS[parseInt(chainId)];
          if (!networkConfig) return null;

          const totalValue = Object.values(assets).reduce((sum, asset) => sum + asset.usdValue, 0);

          return (
            <Card key={chainId} style={{
  padding: '24px'
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
                  <span className="text-xl">{getNetworkIcon(parseInt(chainId))}</span>
                  <div>
                    <h3 style={{
  fontWeight: '600'
}}>{networkConfig.name}</h3>
                    <p style={{
  color: '#A0A0A0'
}}>
                      ${totalValue.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{
  display: 'flex'
}}>
                  {parseInt(chainId) !== currentNetwork?.chainId && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleNetworkSwitch(parseInt(chainId))}
                    >
                      Switch
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.open(networkConfig.blockExplorerUrls[0], '_blank')}
                  >
                    <ExternalLink style={{
  width: '12px',
  height: '12px'
}} />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(assets).map(([asset, data]) => (
                  <div key={asset} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <div style={{
  width: '32px',
  height: '32px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                        <span style={{
  fontWeight: '600'
}}>{asset[0]}</span>
                      </div>
                      <div>
                        <p style={{
  fontWeight: '600'
}}>{asset}</p>
                        <p style={{
  color: '#A0A0A0'
}}>
                          {parseFloat(data.balance).toLocaleString()} {asset}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
  textAlign: 'right'
}}>
                      <p style={{
  fontWeight: '600'
}}>${data.usdValue.toLocaleString()}</p>
                      <p style={{
  color: '#A0A0A0'
}}>
                        {((data.usdValue / totalValue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bridge Transactions */}
      {bridgeTransactions.length > 0 && (
        <Card style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
              <ArrowRightLeft style={{
  width: '20px',
  height: '20px'
}} />
              <span>Bridge History</span>
            </h3>
            
            <Button variant="outline" size="sm" onClick={() => setBridgeTransactions([])}>
              <RefreshCw style={{
  width: '16px',
  height: '16px'
}} />
              Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {bridgeTransactions.slice(0, 5).map((tx) => {
              const fromNetwork = NETWORK_CONFIGS[tx.fromChain];
              const toNetwork = NETWORK_CONFIGS[tx.toChain];
              
              return (
                <div key={tx.id} style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '12px'
}}>
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <span className="text-lg">{getNetworkIcon(tx.fromChain)}</span>
                      <ArrowRightLeft style={{
  width: '16px',
  height: '16px',
  color: '#A0A0A0'
}} />
                      <span className="text-lg">{getNetworkIcon(tx.toChain)}</span>
                    </div>
                    
                    <div>
                      <p style={{
  fontWeight: '600'
}}>
                        {tx.amount} {tx.asset}
                      </p>
                      <p style={{
  color: '#A0A0A0'
}}>
                        {fromNetwork?.name} → {toNetwork?.name}
                      </p>
                    </div>
                  </div>

                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <div style={{
  textAlign: 'right'
}}>
                      <Badge color={getStatusColor(tx.status)}>
                        {tx.status}
                      </Badge>
                      <p style={{
  color: '#A0A0A0'
}}>
                        {formatBridgeTime(tx.bridgeTime)}
                      </p>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`https://etherscan.io/tx/${tx.txHash}`, '_blank')}
                    >
                      <ExternalLink style={{
  width: '12px',
  height: '12px'
}} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Network Switch Dialog */}
      <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>Switch Network</Dialog.Title>
          
          <div className="space-y-4 mt-4">
            <p style={{
  color: '#A0A0A0'
}}>
              Select a network to switch to. Make sure your wallet supports the selected network.
            </p>

            <div className="space-y-3">
              {supportedNetworks.map((network) => {
                const isCurrentNetwork = network.chainId === currentNetwork?.chainId;
                const gasInfo = gasEstimates.get(network.chainId);
                
                return (
                  <Card 
                    key={network.chainId}
                    style={{
  padding: '16px',
  background: 'rgba(20, 20, 20, 0.6)'
}}
                    onClick={() => !isCurrentNetwork && handleNetworkSwitch(network.chainId)}
                  >
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <span className="text-xl">{getNetworkIcon(network.chainId)}</span>
                        <div>
                          <h4 style={{
  fontWeight: '600'
}}>{network.name}</h4>
                          <p style={{
  color: '#A0A0A0'
}}>
                            {network.nativeCurrency.symbol}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        {gasInfo && (
                          <Badge variant="outline" size="sm">
                            {gasInfo.standard} gwei
                          </Badge>
                        )}
                        {isCurrentNetwork ? (
                          <Badge color="blue">
                            <CheckCircle style={{
  width: '12px',
  height: '12px'
}} />
                            Current
                          </Badge>
                        ) : (
                          <Button size="sm" disabled={isSwitching}>
                            {isSwitching ? 'Switching...' : 'Switch'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </Dialog.Content>
      </Dialog>

      {/* Bridge Dialog */}
      <Dialog open={showBridgeDialog} onOpenChange={setShowBridgeDialog}>
        <Dialog.Content maxWidth="500px">
          <Dialog.Title>Bridge Assets</Dialog.Title>
          
          <div className="space-y-4 mt-4">
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                From Network
              </label>
              <Card style={{
  padding: '12px'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <span className="text-lg">{getNetworkIcon(currentNetwork?.chainId)}</span>
                  <div>
                    <p style={{
  fontWeight: '600'
}}>{currentNetwork?.name}</p>
                    <p style={{
  color: '#A0A0A0'
}}>Current network</p>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                To Network
              </label>
              <Select 
                value={selectedTargetNetwork?.toString() || ''} 
                onValueChange={(value) => setSelectedTargetNetwork(parseInt(value))}
              >
                <Select.Trigger>
                  {selectedTargetNetwork ? 
                    NETWORK_CONFIGS[selectedTargetNetwork]?.name : 
                    'Select target network'
                  }
                </Select.Trigger>
                <Select.Content>
                  {supportedNetworks
                    .filter(network => network.chainId !== currentNetwork?.chainId)
                    .map(network => (
                      <Select.Item key={network.chainId} value={network.chainId.toString()}>
                        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                          <span>{getNetworkIcon(network.chainId)}</span>
                          <span>{network.name}</span>
                        </div>
                      </Select.Item>
                    ))
                  }
                </Select.Content>
              </Select>
            </div>

            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                Asset to Bridge
              </label>
              <Select value={bridgeAsset} onValueChange={setBridgeAsset}>
                <Select.Trigger>
                  {bridgeAsset}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="ETH">ETH</Select.Item>
                  <Select.Item value="USDC">USDC</Select.Item>
                  <Select.Item value="CRYB">CRYB</Select.Item>
                </Select.Content>
              </Select>
            </div>

            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                Amount
              </label>
              <input
                type="number"
                placeholder="0.0"
                style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
              />
              {currentNetwork && networkBalances.get(currentNetwork.chainId.toString())?.[bridgeAsset] && (
                <p style={{
  color: '#A0A0A0'
}}>
                  Available: {networkBalances.get(currentNetwork.chainId.toString())[bridgeAsset].balance} {bridgeAsset}
                </p>
              )}
            </div>

            {selectedTargetNetwork && (
              <div style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                  <Clock style={{
  width: '16px',
  height: '16px'
}} />
                  <div>
                    <p className="text-sm text-yellow-800">
                      Estimated bridge time: {formatBridgeTime(getBridgeTime(currentNetwork?.chainId, selectedTargetNetwork))}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Bridge fees may apply. Transaction is irreversible once confirmed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={{
  display: 'flex'
}}>
              <Button
                variant="outline"
                style={{
  flex: '1'
}}
                onClick={() => setShowBridgeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                style={{
  flex: '1'
}}
                onClick={handleBridge}
                disabled={!bridgeAmount || !selectedTargetNetwork || isBridging}
              >
                {isBridging ? (
                  <>
                    <div style={{
  borderRadius: '50%',
  height: '16px',
  width: '16px'
}} />
                    Bridging...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft style={{
  width: '16px',
  height: '16px'
}} />
                    Bridge Assets
                  </>
                )}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  );
};



export default MultiChainManager;