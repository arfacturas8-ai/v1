import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Card, Button, Input, Badge, Progress, Dialog, Tabs } from '@radix-ui/themes';
import { Coins, TrendingUp, Shield, Timer, AlertTriangle, CheckCircle } from 'lucide-react';
import { getCRYBTokenContract, ACCESS_LEVELS } from '../../lib/contracts/cryb-contracts.js';
import { walletManager } from '../../lib/web3/WalletManager.js';
import { transactionManager } from '../../lib/web3/TransactionManager.js';

const StakingDashboard = () => {
  const [stakingData, setStakingData] = useState({
    balance: BigInt(0),
    stakedAmount: BigInt(0),
    pendingRewards: BigInt(0),
    accessLevel: 0,
    stakingStart: null,
    apr: 12.5,
    totalStaked: BigInt(0),
    loading: true
  });

  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showStakeDialog, setShowStakeDialog] = useState(false);
  const [showUnstakeDialog, setShowUnstakeDialog] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const cryb = getCRYBTokenContract(walletManager.currentChainId || 1);

  // Load staking data
  const loadStakingData = useCallback(async () => {
    if (!walletManager.isConnected) return;

    try {
      setStakingData(prev => ({ ...prev, loading: true }));

      const [balance, stakingInfo, tokenInfo] = await Promise.all([
        cryb.getBalance(walletManager.account),
        cryb.getStakingInfo(walletManager.account),
        cryb.getTokenInfo()
      ]);

      setStakingData({
        balance,
        stakedAmount: stakingInfo.stakedAmount,
        pendingRewards: stakingInfo.pendingRewards,
        accessLevel: stakingInfo.accessLevel,
        stakingStart: stakingInfo.stakingStart,
        apr: 12.5, // Mock APR
        totalStaked: BigInt('50000000') * BigInt(10 ** 18), // Mock total staked
        loading: false
      });
    } catch (error) {
      console.error('Failed to load staking data:', error);
      setStakingData(prev => ({ ...prev, loading: false }));
    }
  }, [walletManager.isConnected, walletManager.account]);

  // Stake tokens
  const handleStake = async () => {
    if (!stakeAmount || !walletManager.isConnected) return;

    try {
      setIsStaking(true);
      
      const amount = cryb.parseTokenAmount(stakeAmount);
      
      // Check balance
      if (amount > stakingData.balance) {
        throw new Error('Insufficient balance');
      }

      // Execute staking transaction
      const txResult = await transactionManager.executeTransaction({
        to: cryb.address,
        data: cryb.abi.find(f => f.name === 'stake'),
        value: 0
      }, {
        priority: 'standard',
        gasStrategy: 'moderate'
      });

      // Add to transaction history
      setTransactions(prev => [{
        id: txResult.hash,
        type: 'stake',
        amount: amount,
        timestamp: Date.now(),
        status: 'pending'
      }, ...prev]);

      // Reset form
      setStakeAmount('');
      setShowStakeDialog(false);
      
      // Reload data
      await loadStakingData();
      
    } catch (error) {
      console.error('Staking failed:', error);
      // Handle error (show notification, etc.)
    } finally {
      setIsStaking(false);
    }
  };

  // Unstake tokens
  const handleUnstake = async () => {
    if (!unstakeAmount || !walletManager.isConnected) return;

    try {
      setIsUnstaking(true);
      
      const amount = cryb.parseTokenAmount(unstakeAmount);
      
      // Check staked balance
      if (amount > stakingData.stakedAmount) {
        throw new Error('Insufficient staked balance');
      }

      // Execute unstaking transaction
      const txResult = await transactionManager.executeTransaction({
        to: cryb.address,
        data: cryb.abi.find(f => f.name === 'unstake'),
        value: 0
      }, {
        priority: 'standard',
        gasStrategy: 'moderate'
      });

      // Add to transaction history
      setTransactions(prev => [{
        id: txResult.hash,
        type: 'unstake',
        amount: amount,
        timestamp: Date.now(),
        status: 'pending'
      }, ...prev]);

      // Reset form
      setUnstakeAmount('');
      setShowUnstakeDialog(false);
      
      // Reload data
      await loadStakingData();
      
    } catch (error) {
      console.error('Unstaking failed:', error);
    } finally {
      setIsUnstaking(false);
    }
  };

  // Claim rewards
  const handleClaimRewards = async () => {
    if (!walletManager.isConnected || stakingData.pendingRewards === BigInt(0)) return;

    try {
      setIsClaiming(true);
      
      // Execute claim transaction
      const txResult = await transactionManager.executeTransaction({
        to: cryb.address,
        data: cryb.abi.find(f => f.name === 'claimRewards'),
        value: 0
      }, {
        priority: 'standard',
        gasStrategy: 'moderate'
      });

      // Add to transaction history
      setTransactions(prev => [{
        id: txResult.hash,
        type: 'claim',
        amount: stakingData.pendingRewards,
        timestamp: Date.now(),
        status: 'pending'
      }, ...prev]);
      
      // Reload data
      await loadStakingData();
      
    } catch (error) {
      console.error('Claiming rewards failed:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  // Calculate staking duration
  const getStakingDuration = () => {
    if (!stakingData.stakingStart) return 'Not staking';
    
    const duration = Date.now() - stakingData.stakingStart;
    const days = Math.floor(duration / (24 * 60 * 60 * 1000));
    
    if (days === 0) return 'Less than 1 day';
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  };

  // Calculate annual yield
  const calculateAnnualYield = () => {
    if (stakingData.stakedAmount === BigInt(0)) return 0;
    return (Number(stakingData.stakedAmount) / (10 ** 18)) * (stakingData.apr / 100);
  };

  // Get access level info
  const getAccessLevelInfo = (level) => {
    const levelInfo = {
      0: { name: 'None', color: 'gray', icon: '🔒' },
      1: { name: 'Bronze', color: 'brown', icon: '🥉' },
      2: { name: 'Silver', color: 'silver', icon: '🥈' },
      3: { name: 'Gold', color: 'yellow', icon: '🥇' },
      4: { name: 'Platinum', color: 'blue', icon: '💎' },
      5: { name: 'Diamond', color: 'purple', icon: '👑' }
    };
    return levelInfo[level] || levelInfo[0];
  };

  useEffect(() => {
    loadStakingData();
  }, [loadStakingData]);

  useEffect(() => {
    // Setup wallet event listeners
    const handleAccountChanged = () => loadStakingData();
    const handleChainChanged = () => loadStakingData();
    
    walletManager.on('accountChanged', handleAccountChanged);
    walletManager.on('chainChanged', handleChainChanged);
    
    return () => {
      walletManager.off('accountChanged', handleAccountChanged);
      walletManager.off('chainChanged', handleChainChanged);
    };
  }, [loadStakingData]);

  if (!walletManager.isConnected) {
    return (
      <Card style={{
  padding: '24px',
  textAlign: 'center'
}}>
        <div className="mb-4">
          <Shield style={{
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
          Connect your wallet to start staking CRYB tokens
        </p>
        <Button onClick={() => walletManager.connect()}>
          Connect Wallet
        </Button>
      </Card>
    );
  }

  if (stakingData.loading) {
    return (
      <Card style={{
  padding: '24px'
}}>
        <div className="animate-pulse space-y-4">
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
  height: '96px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '4px'
}}></div>
        </div>
      </Card>
    );
  }

  const accessLevelInfo = getAccessLevelInfo(stakingData.accessLevel);

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
              <Coins style={{
  width: '20px',
  height: '20px'
}} />
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Total Balance</p>
              <p style={{
  fontWeight: '600'
}}>
                {cryb.formatTokenAmount(stakingData.balance)} CRYB
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
}}>Staked</p>
              <p style={{
  fontWeight: '600'
}}>
                {cryb.formatTokenAmount(stakingData.stakedAmount)} CRYB
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
  color: '#A0A0A0'
}}>Rewards</p>
              <p style={{
  fontWeight: '600'
}}>
                {cryb.formatTokenAmount(stakingData.pendingRewards)} CRYB
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
              <span className="text-lg">{accessLevelInfo.icon}</span>
            </div>
            <div>
              <p style={{
  color: '#A0A0A0'
}}>Access Level</p>
              <Badge color={accessLevelInfo.color}>
                {accessLevelInfo.name}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Staking Interface */}
      <div style={{
  display: 'grid',
  gap: '24px'
}}>
        {/* Staking Panel */}
        <Card style={{
  padding: '24px'
}}>
          <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
            <Shield style={{
  width: '20px',
  height: '20px'
}} />
            <span>Staking</span>
          </h3>

          <div className="space-y-4">
            <div style={{
  background: 'rgba(20, 20, 20, 0.6)',
  padding: '16px',
  borderRadius: '12px'
}}>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
                <span style={{
  color: '#A0A0A0'
}}>Current APR</span>
                <span style={{
  fontWeight: '600'
}}>
                  {stakingData.apr}%
                </span>
              </div>
              
              <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
                <span style={{
  color: '#A0A0A0'
}}>Staking Duration</span>
                <span style={{
  fontWeight: '600'
}}>
                  {getStakingDuration()}
                </span>
              </div>
              
              <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
                <span style={{
  color: '#A0A0A0'
}}>Annual Yield</span>
                <span style={{
  fontWeight: '600'
}}>
                  {calculateAnnualYield().toFixed(2)} CRYB
                </span>
              </div>
            </div>

            <div style={{
  display: 'flex'
}}>
              <Button 
                style={{
  flex: '1'
}} 
                onClick={() => setShowStakeDialog(true)}
                disabled={stakingData.balance === BigInt(0)}
              >
                <Coins style={{
  width: '16px',
  height: '16px'
}} />
                Stake
              </Button>
              
              <Button 
                variant="outline" 
                style={{
  flex: '1'
}}
                onClick={() => setShowUnstakeDialog(true)}
                disabled={stakingData.stakedAmount === BigInt(0)}
              >
                Unstake
              </Button>
            </div>

            {stakingData.pendingRewards > BigInt(0) && (
              <Button
                variant="solid"
                color="green"
                style={{
  width: '100%'
}}
                onClick={handleClaimRewards}
                disabled={isClaiming}
              >
                {isClaiming ? (
                  <>
                    <div style={{
  borderRadius: '50%',
  height: '16px',
  width: '16px'
}} />
                    Claiming...
                  </>
                ) : (
                  <>
                    <CheckCircle style={{
  width: '16px',
  height: '16px'
}} />
                    Claim {cryb.formatTokenAmount(stakingData.pendingRewards)} CRYB
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        {/* Staking Progress */}
        <Card style={{
  padding: '24px'
}}>
          <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
            <TrendingUp style={{
  width: '20px',
  height: '20px'
}} />
            <span>Staking Progress</span>
          </h3>

          <div className="space-y-4">
            {/* Access Level Progress */}
            <div>
              <div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}}>
                <span style={{
  color: '#A0A0A0'
}}>
                  Access Level Progress
                </span>
                <span style={{
  fontWeight: '600'
}}>
                  Level {stakingData.accessLevel}/5
                </span>
              </div>
              
              <Progress 
                value={(stakingData.accessLevel / 5) * 100} 
                style={{
  height: '8px'
}}
              />
              
              <p style={{
  color: '#A0A0A0'
}}>
                Stake more CRYB to unlock higher access levels and exclusive features
              </p>
            </div>

            {/* Staking Distribution */}
            <div>
              <h4 style={{
  fontWeight: '600'
}}>Global Staking Stats</h4>
              
              <div className="space-y-2">
                <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                  <span style={{
  color: '#A0A0A0'
}}>Total Staked</span>
                  <span style={{
  fontWeight: '600'
}}>
                    {cryb.formatTokenAmount(stakingData.totalStaked)} CRYB
                  </span>
                </div>
                
                <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                  <span style={{
  color: '#A0A0A0'
}}>Your Share</span>
                  <span style={{
  fontWeight: '600'
}}>
                    {stakingData.totalStaked > BigInt(0) 
                      ? ((Number(stakingData.stakedAmount) / Number(stakingData.totalStaked)) * 100).toFixed(4)
                      : '0'
                    }%
                  </span>
                </div>
                
                <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                  <span style={{
  color: '#A0A0A0'
}}>Network Participation</span>
                  <span style={{
  fontWeight: '600'
}}>65.2%</span>
                </div>
              </div>
            </div>

            {/* Next Level Requirements */}
            {stakingData.accessLevel < 5 && (
              <div style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
                <h4 style={{
  fontWeight: '600'
}}>
                  Next Level: {ACCESS_LEVELS[stakingData.accessLevel + 1]}
                </h4>
                <p className="text-xs text-blue-600">
                  Stake additional CRYB tokens to unlock premium features
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <Card style={{
  padding: '24px'
}}>
          <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
            <Timer style={{
  width: '20px',
  height: '20px'
}} />
            <span>Recent Transactions</span>
          </h3>

          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div 
                key={tx.id} 
                style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '12px'
}}
              >
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <div style={{
  padding: '8px',
  borderRadius: '50%'
}}>
                    {tx.type === 'stake' ? <Coins style={{
  width: '16px',
  height: '16px'
}} /> :
                     tx.type === 'unstake' ? <Shield style={{
  width: '16px',
  height: '16px'
}} /> :
                     <CheckCircle style={{
  width: '16px',
  height: '16px'
}} />}
                  </div>
                  
                  <div>
                    <p style={{
  fontWeight: '600'
}}>
                      {tx.type} {cryb.formatTokenAmount(tx.amount)} CRYB
                    </p>
                    <p style={{
  color: '#A0A0A0'
}}>
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <Badge 
                  color={tx.status === 'confirmed' ? 'green' : 
                         tx.status === 'failed' ? 'red' : 'yellow'}
                >
                  {tx.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stake Dialog */}
      <Dialog open={showStakeDialog} onOpenChange={setShowStakeDialog}>
        <Dialog.Content maxWidth="400px">
          <Dialog.Title>Stake CRYB Tokens</Dialog.Title>
          
          <div className="space-y-4 mt-4">
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                Amount to Stake
              </label>
              <Input
                type="number"
                placeholder="0.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
              <p style={{
  color: '#A0A0A0'
}}>
                Available: {cryb.formatTokenAmount(stakingData.balance)} CRYB
              </p>
            </div>

            <div style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                <AlertTriangle style={{
  width: '16px',
  height: '16px'
}} />
                <div>
                  <p className="text-sm text-yellow-800">
                    Staked tokens cannot be withdrawn immediately. There may be an unstaking period.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
  display: 'flex'
}}>
              <Button
                variant="outline"
                style={{
  flex: '1'
}}
                onClick={() => setShowStakeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                style={{
  flex: '1'
}}
                onClick={handleStake}
                disabled={!stakeAmount || isStaking || Number(stakeAmount) <= 0}
              >
                {isStaking ? 'Staking...' : 'Stake'}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>

      {/* Unstake Dialog */}
      <Dialog open={showUnstakeDialog} onOpenChange={setShowUnstakeDialog}>
        <Dialog.Content maxWidth="400px">
          <Dialog.Title>Unstake CRYB Tokens</Dialog.Title>
          
          <div className="space-y-4 mt-4">
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500'
}}>
                Amount to Unstake
              </label>
              <Input
                type="number"
                placeholder="0.0"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
              />
              <p style={{
  color: '#A0A0A0'
}}>
                Staked: {cryb.formatTokenAmount(stakingData.stakedAmount)} CRYB
              </p>
            </div>

            <div style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
              <p className="text-sm text-blue-800">
                Unstaking will also claim any pending rewards.
              </p>
            </div>

            <div style={{
  display: 'flex'
}}>
              <Button
                variant="outline"
                style={{
  flex: '1'
}}
                onClick={() => setShowUnstakeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                color="red"
                style={{
  flex: '1'
}}
                onClick={handleUnstake}
                disabled={!unstakeAmount || isUnstaking || Number(unstakeAmount) <= 0}
              >
                {isUnstaking ? 'Unstaking...' : 'Unstake'}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    </div>
  );
};



export default StakingDashboard;