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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <DollarSign style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-secondary">Portfolio Value</p>
              <p className="text-xl font-semibold text-primary">
                {formatCurrency(userPortfolio.portfolioValueUSD)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10">
              <Shield style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-secondary">Total Staked</p>
              <p className="text-xl font-semibold text-primary">
                {formatTokenAmount(userPortfolio.totalStaked)} CRYB
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/10 to-blue-500/10">
              <TrendingUp style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-secondary">Total Farmed</p>
              <p className="text-xl font-semibold text-primary">
                {formatTokenAmount(userPortfolio.totalFarmed)} LP
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
              <Zap style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-secondary">Pending Rewards</p>
              <p className="text-xl font-semibold text-primary">
                {formatTokenAmount(userPortfolio.pendingRewards)} CRYB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TVL Information */}
      {totalValueLocked && (
        <div className="card">
          <h3 className="text-lg font-semibold text-primary mb-4">Total Value Locked (TVL)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-tertiary">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(totalValueLocked.totalValueUSD)}
              </p>
              <p className="text-sm text-secondary mt-1">Total TVL</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-tertiary">
              <p className="text-2xl font-bold text-primary">
                {formatTokenAmount(totalValueLocked.totalStaked)}
              </p>
              <p className="text-sm text-secondary mt-1">Total Staked CRYB</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-tertiary">
              <p className="text-2xl font-bold text-primary">
                {formatTokenAmount(totalValueLocked.totalFarmed)}
              </p>
              <p className="text-sm text-secondary mt-1">Total LP Farmed</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            className="btn-primary flex flex-col items-center justify-center gap-2 h-20"
            onClick={() => setActionModal({ open: true, type: 'stake', pool: 'basic' })}
          >
            <PlusCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <span className="text-sm font-medium">Stake CRYB</span>
          </button>

          <button
            className="btn-secondary flex flex-col items-center justify-center gap-2 h-20"
            onClick={() => setActiveTab('staking')}
          >
            <Target style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <span className="text-sm font-medium">View Pools</span>
          </button>

          <button
            className="btn-secondary flex flex-col items-center justify-center gap-2 h-20"
            onClick={() => setActiveTab('farming')}
          >
            <TrendingUp style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <span className="text-sm font-medium">Farm LP</span>
          </button>

          <button
            className="btn-secondary flex flex-col items-center justify-center gap-2 h-20"
            disabled={userPortfolio.pendingRewards === BigInt(0)}
          >
            <Zap style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <span className="text-sm font-medium">Claim All</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Staking Pools Component
  const StakingPools = () => (
    <div className="space-y-4">
      {Object.values(stakingData).map((pool) => (
        <div key={pool.id} className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">{pool.name}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge color="green">{pool.currentAPY.toFixed(1)}% APY</Badge>
                <Badge variant="outline">
                  Lock: {pool.lockPeriod / (24 * 60 * 60)} days
                </Badge>
                <Badge variant="outline">
                  Min: {formatTokenAmount(pool.minStake)} CRYB
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-secondary">Your Stake</p>
              <p className="text-lg font-semibold text-primary">
                {formatTokenAmount(pool.amount || BigInt(0))} CRYB
              </p>
              <p className="text-sm text-tertiary">
                ≈ {formatCurrency((Number(pool.amount || 0) / 1e18) * cryptoPrices.CRYB)}
              </p>
            </div>
          </div>

          {pool.amount && pool.amount > BigInt(0) && (
            <div className="bg-tertiary p-4 rounded-xl mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-secondary">Pending Rewards</p>
                  <p className="text-base font-semibold text-primary">
                    {formatTokenAmount(pool.pendingRewards || BigInt(0))} CRYB
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Time to Unlock</p>
                  <p className="text-base font-semibold text-primary">
                    {formatTimeRemaining(pool.timeToUnlock)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Staked Since</p>
                  <p className="text-base font-semibold text-primary">
                    {new Date(pool.stakeTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              className="btn-primary"
              onClick={() => setActionModal({
                open: true,
                type: 'stake',
                pool: pool
              })}
            >
              <PlusCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              Stake
            </button>

            {pool.amount && pool.amount > BigInt(0) && (
              <>
                <button
                  className="btn-secondary"
                  onClick={() => setActionModal({
                    open: true,
                    type: 'unstake',
                    pool: pool
                  })}
                  disabled={pool.timeToUnlock > 0}
                >
                  <MinusCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  Unstake
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => setActionModal({
                    open: true,
                    type: 'compound',
                    pool: pool
                  })}
                  disabled={!pool.pendingRewards || pool.pendingRewards === BigInt(0)}
                >
                  <RefreshCw style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  Compound
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Yield Farming Component
  const YieldFarming = () => (
    <div className="space-y-4">
      {Object.values(farmingData).map((farm) => (
        <div key={farm.id} className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">{farm.name}</h3>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge color="purple">{farm.currentAPY.toFixed(1)}% APY</Badge>
                <Badge variant="outline">
                  Multiplier: {farm.multiplier}x
                </Badge>
                {farm.impermanentLoss > 2 && (
                  <Badge color="yellow">
                    <AlertTriangle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    IL: {farm.impermanentLoss.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-secondary">Your LP Tokens</p>
              <p className="text-lg font-semibold text-primary">
                {formatTokenAmount(farm.stakedAmount || BigInt(0))}
              </p>
              <p className="text-sm text-tertiary">
                ≈ {formatCurrency((Number(farm.stakedAmount || 0) / 1e18) * cryptoPrices.CRYB * 2)}
              </p>
            </div>
          </div>

          {farm.stakedAmount && farm.stakedAmount > BigInt(0) && (
            <div className="bg-tertiary p-4 rounded-xl mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-secondary">Pending Rewards</p>
                  <p className="text-base font-semibold text-primary">
                    {formatTokenAmount(farm.pendingRewards || BigInt(0))} CRYB
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Last Harvest</p>
                  <p className="text-base font-semibold text-primary">
                    {new Date(farm.lastHarvestTime).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-secondary">Impermanent Loss</p>
                  <p className="text-base font-semibold text-warning">
                    -{farm.impermanentLoss.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <button
              className="btn-primary"
              onClick={() => setActionModal({
                open: true,
                type: 'deposit',
                pool: farm
              })}
            >
              <PlusCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              Deposit LP
            </button>

            {farm.stakedAmount && farm.stakedAmount > BigInt(0) && (
              <>
                <button
                  className="btn-secondary"
                  onClick={() => setActionModal({
                    open: true,
                    type: 'withdraw',
                    pool: farm
                  })}
                >
                  <MinusCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  Withdraw
                </button>

                <button
                  className="btn-secondary"
                  onClick={() => handleFarmAction(farm.id, 'harvest', '0')}
                  disabled={!farm.pendingRewards || farm.pendingRewards === BigInt(0)}
                >
                  <Zap style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  Harvest
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // Action Modal Component
  const ActionModal = () => (
    <Dialog.Root open={actionModal.open} onOpenChange={(open) => setActionModal({ ...actionModal, open })}>
      <Dialog.Content className="max-w-md">
        <Dialog.Title className="text-xl font-semibold text-primary">
          {actionModal.type === 'stake' && 'Stake CRYB Tokens'}
          {actionModal.type === 'unstake' && 'Unstake CRYB Tokens'}
          {actionModal.type === 'deposit' && 'Deposit LP Tokens'}
          {actionModal.type === 'withdraw' && 'Withdraw LP Tokens'}
          {actionModal.type === 'compound' && 'Compound Rewards'}
        </Dialog.Title>

        {actionModal.pool && (
          <div className="space-y-4">
            <div className="bg-tertiary p-3 rounded-xl">
              <p className="font-medium text-primary">{actionModal.pool.name}</p>
              <p className="text-sm text-secondary">
                APY: {actionModal.pool.currentAPY?.toFixed(1) || actionModal.pool.baseAPY}%
              </p>
            </div>

            {actionModal.type !== 'compound' && (
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Amount {actionModal.type.includes('stake') ? 'CRYB' : 'LP'}
                </label>
                <input
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="input-primary"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                {actionModal.pool.minStake && actionModal.type === 'stake' && (
                  <p className="text-sm text-secondary mt-1">
                    Minimum: {formatTokenAmount(actionModal.pool.minStake)} CRYB
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setActionModal({ open: false, type: '', pool: null })}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
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
                    <RefreshCw style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    Processing...
                  </>
                ) : (
                  `Confirm ${actionModal.type}`
                )}
              </button>
            </div>
          </div>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );

  if (!walletManager.isConnected) {
    return (
      <div className="card text-center py-12">
        <TrendingUp style={{ width: "80px", height: "80px", flexShrink: 0 }} />
        <h2 className="text-2xl font-bold text-primary mb-2">Connect Wallet</h2>
        <p className="text-secondary mb-6">
          Connect your wallet to access DeFi yield farming features
        </p>
        <button className="btn-primary" onClick={() => walletManager.connect()}>
          Connect Wallet
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card text-center py-12">
        <RefreshCw style={{ width: "48px", height: "48px", flexShrink: 0 }} />
        <p className="text-secondary">Loading DeFi dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">DeFi Yield Farming</h1>
          <p className="text-secondary">Maximize your CRYB token rewards</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={loadDashboardData}>
            <RefreshCw style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            Refresh
          </button>
          <button className="btn-secondary">
            <Settings style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="overview">
            <DollarSign style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger value="staking">
            <Shield style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            Staking Pools
          </Tabs.Trigger>
          <Tabs.Trigger value="farming">
            <TrendingUp style={{ width: "24px", height: "24px", flexShrink: 0 }} />
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
