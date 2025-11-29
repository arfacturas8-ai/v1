import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Progress, Tabs, Dialog, Select } from '@radix-ui/themes';
import { 
  TrendingUp, DollarSign, Zap, RefreshCw, Settings,
  PlusCircle, MinusCircle, Target, Calendar, Info,
  ArrowUpRight, ArrowDownRight, Coins, Shield,
  AlertTriangle, CheckCircle, ExternalLink, Copy
} from 'lucide-react';
import { 
  getCRYBTokenContract, 
  STAKING_POOLS, 
  YIELD_FARMS,
  YieldCalculator,
  TokenEconomics
} from '../../lib/contracts/cryb-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';

const YieldFarmingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stakingData, setStakingData] = useState({});
  const [farmingData, setFarmingData] = useState({});
  const [totalValueLocked, setTotalValueLocked] = useState(null);
  const [userPortfolio, setUserPortfolio] = useState({
    totalStaked: BigInt(0),
    totalFarmed: BigInt(0),
    pendingRewards: BigInt(0),
    portfolioValueUSD: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ open: false, type: '', pool: null });
  const [actionAmount, setActionAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoCompoundEnabled, setAutoCompoundEnabled] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState({
    CRYB: 1.85,
    ETH: 2450.50,
    USDC: 1.00
  });

  // Load dashboard data
  useEffect(() => {
    if (walletManager.isConnected) {
      loadDashboardData();
    }
  }, [walletManager.isConnected]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const chainId = walletManager.currentChainId || 1;
      const userAddress = walletManager.account;
      const contract = getCRYBTokenContract(chainId);

      // Load staking pools data
      const stakingPoolsData = {};
      for (const [poolKey, pool] of Object.entries(STAKING_POOLS)) {
        const userStakeInfo = await contract.getUserStakeInfo(userAddress, pool.id);
        stakingPoolsData[pool.id] = {
          ...pool,
          ...userStakeInfo,
          currentAPY: calculateCurrentAPY(pool, userStakeInfo),
          timeToUnlock: calculateTimeToUnlock(userStakeInfo.stakeTime, pool.lockPeriod)
        };
      }
      setStakingData(stakingPoolsData);

      // Load yield farming data
      const farmingPoolsData = {};
      for (const [farmKey, farm] of Object.entries(YIELD_FARMS)) {
        const userFarmInfo = await contract.getUserFarmInfo(userAddress, farm.id);
        farmingPoolsData[farm.id] = {
          ...farm,
          ...userFarmInfo,
          currentAPY: calculateFarmAPY(farm, userFarmInfo),
          impermanentLoss: calculateImpermanentLoss(farm)
        };
      }
      setFarmingData(farmingPoolsData);

      // Load TVL and portfolio data
      const tvl = await contract.getTotalValueLocked();
      setTotalValueLocked(tvl);

      // Calculate user portfolio
      calculateUserPortfolio(stakingPoolsData, farmingPoolsData);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCurrentAPY = (pool, userStakeInfo) => {
    if (!userStakeInfo || userStakeInfo.amount === BigInt(0)) {
      return pool.baseAPY * pool.bonusMultiplier;
    }

    const stakingDuration = Date.now() - userStakeInfo.stakeTime;
    const yearInMs = 365 * 24 * 60 * 60 * 1000;
    
    if (stakingDuration < yearInMs) {
      // Bonus APY for early stakers
      const earlyStakerBonus = 1 + (0.1 * (yearInMs - stakingDuration) / yearInMs);
      return pool.baseAPY * pool.bonusMultiplier * earlyStakerBonus;
    }
    
    return pool.baseAPY * pool.bonusMultiplier;
  };

  const calculateFarmAPY = (farm, userFarmInfo) => {
    // Mock calculation - in real implementation would use actual farm metrics
    const baseAPY = 45; // Base 45% APY
    const multiplierBonus = farm.multiplier * 5; // Multiplier adds 5% per point
    return baseAPY + multiplierBonus;
  };

  const calculateImpermanentLoss = (farm) => {
    // Mock IL calculation - in real implementation would use actual price data
    return Math.random() * 5; // 0-5% IL
  };

  const calculateTimeToUnlock = (stakeTime, lockPeriod) => {
    const unlockTime = stakeTime + (lockPeriod * 1000);
    const remaining = unlockTime - Date.now();
    return Math.max(0, remaining);
  };

  const calculateUserPortfolio = (stakingData, farmingData) => {
    let totalStaked = BigInt(0);
    let totalFarmed = BigInt(0);
    let pendingRewards = BigInt(0);

    // Sum staking amounts
    Object.values(stakingData).forEach(pool => {
      if (pool.amount) {
        totalStaked += pool.amount;
        pendingRewards += pool.pendingRewards || BigInt(0);
      }
    });

    // Sum farming amounts
    Object.values(farmingData).forEach(farm => {
      if (farm.stakedAmount) {
        totalFarmed += farm.stakedAmount;
        pendingRewards += farm.pendingRewards || BigInt(0);
      }
    });

    const portfolioValueUSD = (
      (Number(totalStaked) / 1e18) * cryptoPrices.CRYB +
      (Number(totalFarmed) / 1e18) * cryptoPrices.CRYB +
      (Number(pendingRewards) / 1e18) * cryptoPrices.CRYB
    );

    setUserPortfolio({
      totalStaked,
      totalFarmed,
      pendingRewards,
      portfolioValueUSD
    });
  };

  const formatTokenAmount = (amount, decimals = 18) => {
    return (Number(amount) / (10 ** decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTimeRemaining = (timeMs) => {
    if (timeMs <= 0) return 'Unlocked';
    
    const days = Math.floor(timeMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      const minutes = Math.floor((timeMs % (60 * 60 * 1000)) / (60 * 1000));
      return `${minutes}m`;
    }
  };

  const handleStakeAction = async (poolId, action, amount) => {
    try {
      setIsProcessing(true);
      const chainId = walletManager.currentChainId || 1;
      const contract = getCRYBTokenContract(chainId);
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));

      let txHash;
      if (action === 'stake') {
        txHash = await contract.stakeInPool(poolId, amountWei);
      } else if (action === 'unstake') {
        txHash = await contract.unstake(amountWei);
      } else if (action === 'compound') {
        txHash = await contract.compoundStakingRewards();
      }

      setActionModal({ open: false, type: '', pool: null });
      setActionAmount('');
      
      // Refresh data after transaction
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      console.error(`${action} error:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFarmAction = async (farmId, action, amount) => {
    try {
      setIsProcessing(true);
      const chainId = walletManager.currentChainId || 1;
      const contract = getCRYBTokenContract(chainId);
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18));

      let txHash;
      if (action === 'deposit') {
        txHash = await contract.depositToFarm(farmId, amountWei);
      } else if (action === 'withdraw') {
        txHash = await contract.withdrawFromFarm(farmId, amountWei);
      } else if (action === 'harvest') {
        txHash = await contract.harvestFarmRewards(farmId);
      }

      setActionModal({ open: false, type: '', pool: null });
      setActionAmount('');
      
      // Refresh data after transaction
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      console.error(`${action} error:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Portfolio Overview Component
  const PortfolioOverview = () => (
    <div className="space-y-6">
      {/* Portfolio Stats */}
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
  color: '#c9d1d9'
}}>Portfolio Value</p>
              <p style={{
  fontWeight: '600'
}}>
                {formatCurrency(userPortfolio.portfolioValueUSD)}
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
  color: '#c9d1d9'
}}>Total Staked</p>
              <p style={{
  fontWeight: '600'
}}>
                {formatTokenAmount(userPortfolio.totalStaked)} CRYB
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
              <TrendingUp style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#c9d1d9'
}}>Total Farmed</p>
              <p style={{
  fontWeight: '600'
}}>
                {formatTokenAmount(userPortfolio.totalFarmed)} LP
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
  color: '#c9d1d9'
}}>Pending Rewards</p>
              <p style={{
  fontWeight: '600'
}}>
                {formatTokenAmount(userPortfolio.pendingRewards)} CRYB
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* TVL Information */}
      {totalValueLocked && (
        <Card style={{
  padding: '24px'
}}>
          <h3 style={{
  fontWeight: '600'
}}>Total Value Locked (TVL)</h3>
          <div style={{
  display: 'grid',
  gap: '16px'
}}>
            <div style={{
  textAlign: 'center'
}}>
              <p style={{
  fontWeight: 'bold'
}}>
                {formatCurrency(totalValueLocked.totalValueUSD)}
              </p>
              <p style={{
  color: '#c9d1d9'
}}>Total TVL</p>
            </div>
            <div style={{
  textAlign: 'center'
}}>
              <p style={{
  fontWeight: 'bold'
}}>
                {formatTokenAmount(totalValueLocked.totalStaked)}
              </p>
              <p style={{
  color: '#c9d1d9'
}}>Total Staked CRYB</p>
            </div>
            <div style={{
  textAlign: 'center'
}}>
              <p style={{
  fontWeight: 'bold'
}}>
                {formatTokenAmount(totalValueLocked.totalFarmed)}
              </p>
              <p style={{
  color: '#c9d1d9'
}}>Total LP Farmed</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
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
            style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '80px'
}}
            onClick={() => setActionModal({ open: true, type: 'stake', pool: 'basic' })}
          >
            <PlusCircle style={{
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
            onClick={() => setActiveTab('staking')}
          >
            <Target style={{
  width: '20px',
  height: '20px'
}} />
            <span className="text-sm">View Pools</span>
          </Button>
          
          <Button 
            variant="outline"
            style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '80px'
}}
            onClick={() => setActiveTab('farming')}
          >
            <TrendingUp style={{
  width: '20px',
  height: '20px'
}} />
            <span className="text-sm">Farm LP</span>
          </Button>
          
          <Button 
            variant="outline"
            style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '80px'
}}
            disabled={userPortfolio.pendingRewards === BigInt(0)}
          >
            <Zap style={{
  width: '20px',
  height: '20px'
}} />
            <span className="text-sm">Claim All</span>
          </Button>
        </div>
      </Card>
    </div>
  );

  // Staking Pools Component
  const StakingPools = () => (
    <div className="space-y-4">
      {Object.values(stakingData).map((pool) => (
        <Card key={pool.id} style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}}>
            <div>
              <h3 style={{
  fontWeight: '600'
}}>{pool.name}</h3>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <Badge color="green">{pool.currentAPY.toFixed(1)}% APY</Badge>
                <Badge variant="outline">
                  Lock: {pool.lockPeriod / (24 * 60 * 60)} days
                </Badge>
                <Badge variant="outline">
                  Min: {formatTokenAmount(pool.minStake)} CRYB
                </Badge>
              </div>
            </div>
            
            <div style={{
  textAlign: 'right'
}}>
              <p style={{
  color: '#c9d1d9'
}}>Your Stake</p>
              <p style={{
  fontWeight: '600'
}}>
                {formatTokenAmount(pool.amount || BigInt(0))} CRYB
              </p>
              <p style={{
  color: '#c9d1d9'
}}>
                ≈ {formatCurrency((Number(pool.amount || 0) / 1e18) * cryptoPrices.CRYB)}
              </p>
            </div>
          </div>

          {pool.amount && pool.amount > BigInt(0) && (
            <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '16px',
  borderRadius: '12px'
}}>
              <div style={{
  display: 'grid',
  gap: '16px'
}}>
                <div>
                  <p style={{
  color: '#c9d1d9'
}}>Pending Rewards</p>
                  <p style={{
  fontWeight: '600'
}}>
                    {formatTokenAmount(pool.pendingRewards || BigInt(0))} CRYB
                  </p>
                </div>
                <div>
                  <p style={{
  color: '#c9d1d9'
}}>Time to Unlock</p>
                  <p style={{
  fontWeight: '600'
}}>
                    {formatTimeRemaining(pool.timeToUnlock)}
                  </p>
                </div>
                <div>
                  <p style={{
  color: '#c9d1d9'
}}>Staked Since</p>
                  <p style={{
  fontWeight: '600'
}}>
                    {new Date(pool.stakeTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{
  display: 'flex'
}}>
            <Button 
              onClick={() => setActionModal({ 
                open: true, 
                type: 'stake', 
                pool: pool 
              })}
            >
              <PlusCircle style={{
  width: '16px',
  height: '16px'
}} />
              Stake
            </Button>
            
            {pool.amount && pool.amount > BigInt(0) && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setActionModal({ 
                    open: true, 
                    type: 'unstake', 
                    pool: pool 
                  })}
                  disabled={pool.timeToUnlock > 0}
                >
                  <MinusCircle style={{
  width: '16px',
  height: '16px'
}} />
                  Unstake
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setActionModal({ 
                    open: true, 
                    type: 'compound', 
                    pool: pool 
                  })}
                  disabled={!pool.pendingRewards || pool.pendingRewards === BigInt(0)}
                >
                  <RefreshCw style={{
  width: '16px',
  height: '16px'
}} />
                  Compound
                </Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  // Yield Farming Component
  const YieldFarming = () => (
    <div className="space-y-4">
      {Object.values(farmingData).map((farm) => (
        <Card key={farm.id} style={{
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start'
}}>
            <div>
              <h3 style={{
  fontWeight: '600'
}}>{farm.name}</h3>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <Badge color="purple">{farm.currentAPY.toFixed(1)}% APY</Badge>
                <Badge variant="outline">
                  Multiplier: {farm.multiplier}x
                </Badge>
                {farm.impermanentLoss > 2 && (
                  <Badge color="yellow">
                    <AlertTriangle style={{
  width: '12px',
  height: '12px'
}} />
                    IL: {farm.impermanentLoss.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            
            <div style={{
  textAlign: 'right'
}}>
              <p style={{
  color: '#c9d1d9'
}}>Your LP Tokens</p>
              <p style={{
  fontWeight: '600'
}}>
                {formatTokenAmount(farm.stakedAmount || BigInt(0))}
              </p>
              <p style={{
  color: '#c9d1d9'
}}>
                ≈ {formatCurrency((Number(farm.stakedAmount || 0) / 1e18) * cryptoPrices.CRYB * 2)}
              </p>
            </div>
          </div>

          {farm.stakedAmount && farm.stakedAmount > BigInt(0) && (
            <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
              <div style={{
  display: 'grid',
  gap: '16px'
}}>
                <div>
                  <p style={{
  color: '#c9d1d9'
}}>Pending Rewards</p>
                  <p style={{
  fontWeight: '600'
}}>
                    {formatTokenAmount(farm.pendingRewards || BigInt(0))} CRYB
                  </p>
                </div>
                <div>
                  <p style={{
  color: '#c9d1d9'
}}>Last Harvest</p>
                  <p style={{
  fontWeight: '600'
}}>
                    {new Date(farm.lastHarvestTime).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p style={{
  color: '#c9d1d9'
}}>Impermanent Loss</p>
                  <p style={{
  fontWeight: '600'
}}>
                    -{farm.impermanentLoss.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{
  display: 'flex'
}}>
            <Button 
              onClick={() => setActionModal({ 
                open: true, 
                type: 'deposit', 
                pool: farm 
              })}
            >
              <PlusCircle style={{
  width: '16px',
  height: '16px'
}} />
              Deposit LP
            </Button>
            
            {farm.stakedAmount && farm.stakedAmount > BigInt(0) && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setActionModal({ 
                    open: true, 
                    type: 'withdraw', 
                    pool: farm 
                  })}
                >
                  <MinusCircle style={{
  width: '16px',
  height: '16px'
}} />
                  Withdraw
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handleFarmAction(farm.id, 'harvest', '0')}
                  disabled={!farm.pendingRewards || farm.pendingRewards === BigInt(0)}
                >
                  <Zap style={{
  width: '16px',
  height: '16px'
}} />
                  Harvest
                </Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  // Action Modal Component
  const ActionModal = () => (
    <Dialog.Root open={actionModal.open} onOpenChange={(open) => setActionModal({ ...actionModal, open })}>
      <Dialog.Content className="max-w-md">
        <Dialog.Title style={{
  fontWeight: '600'
}}>
          {actionModal.type === 'stake' && 'Stake CRYB Tokens'}
          {actionModal.type === 'unstake' && 'Unstake CRYB Tokens'}
          {actionModal.type === 'deposit' && 'Deposit LP Tokens'}
          {actionModal.type === 'withdraw' && 'Withdraw LP Tokens'}
          {actionModal.type === 'compound' && 'Compound Rewards'}
        </Dialog.Title>
        
        {actionModal.pool && (
          <div className="space-y-4">
            <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '12px',
  borderRadius: '12px'
}}>
              <p style={{
  fontWeight: '500'
}}>{actionModal.pool.name}</p>
              <p style={{
  color: '#c9d1d9'
}}>
                APY: {actionModal.pool.currentAPY?.toFixed(1) || actionModal.pool.baseAPY}%
              </p>
            </div>

            {actionModal.type !== 'compound' && (
              <div>
                <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                  Amount {actionModal.type.includes('stake') ? 'CRYB' : 'LP'}
                </label>
                <input
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  style={{
  width: '100%',
  padding: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                {actionModal.pool.minStake && actionModal.type === 'stake' && (
                  <p style={{
  color: '#c9d1d9'
}}>
                    Minimum: {formatTokenAmount(actionModal.pool.minStake)} CRYB
                  </p>
                )}
              </div>
            )}

            <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
              <Button 
                variant="outline" 
                onClick={() => setActionModal({ open: false, type: '', pool: null })}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (actionModal.type.includes('stake') || actionModal.type === 'compound') {
                    handleStakeAction(actionModal.pool.id, actionModal.type, actionAmount);
                  } else {
                    handleFarmAction(actionModal.pool.id, actionModal.type, actionAmount);
                  }
                }}
                disabled={isProcessing || (!actionAmount && actionModal.type !== 'compound')}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw style={{
  width: '16px',
  height: '16px'
}} />
                    Processing...
                  </>
                ) : (
                  `Confirm ${actionModal.type}`
                )}
              </Button>
            </div>
          </div>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );

  if (!walletManager.isConnected) {
    return (
      <Card style={{
  padding: '32px',
  textAlign: 'center'
}}>
        <TrendingUp style={{
  width: '64px',
  height: '64px',
  color: '#c9d1d9'
}} />
        <h2 style={{
  fontWeight: 'bold'
}}>Connect Wallet</h2>
        <p style={{
  color: '#c9d1d9'
}}>
          Connect your wallet to access DeFi yield farming features
        </p>
        <Button onClick={() => walletManager.connect()}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card style={{
  padding: '32px',
  textAlign: 'center'
}}>
        <RefreshCw style={{
  width: '32px',
  height: '32px'
}} />
        <p>Loading DeFi dashboard...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
        <div>
          <h1 style={{
  fontWeight: 'bold'
}}>DeFi Yield Farming</h1>
          <p style={{
  color: '#c9d1d9'
}}>Maximize your CRYB token rewards</p>
        </div>
        <div style={{
  display: 'flex'
}}>
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw style={{
  width: '16px',
  height: '16px'
}} />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings style={{
  width: '16px',
  height: '16px'
}} />
            Settings
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="overview">
            <DollarSign style={{
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
            Staking Pools
          </Tabs.Trigger>
          <Tabs.Trigger value="farming">
            <TrendingUp style={{
  width: '16px',
  height: '16px'
}} />
            Yield Farming
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <PortfolioOverview />
        </Tabs.Content>

        <Tabs.Content value="staking">
          <StakingPools />
        </Tabs.Content>

        <Tabs.Content value="farming">
          <YieldFarming />
        </Tabs.Content>
      </Tabs.Root>

      {/* Action Modal */}
      <ActionModal />
    </div>
  );
};




export default YieldFarmingDashboard
