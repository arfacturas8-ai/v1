import React, { useState, useEffect } from 'react'
import { TrendingUp, Coins, Shield, Zap, PieChart, BarChart3, ArrowUpRight, Lock, Gift, Wallet, Star, DollarSign, Vote, Clock, TrendingDown, Activity, RefreshCw } from 'lucide-react'
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth'
import walletManager from '../lib/web3/WalletManager'
import { useResponsive } from '../hooks/useResponsive'

function TokenEconomicsPage() {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const compactSpacing = {
    formGap: isMobile ? 16 : isTablet ? 14 : 12,
    headerMargin: isMobile ? 20 : isTablet ? 18 : 16,
    logoMargin: isMobile ? 12 : isTablet ? 10 : 8,
    labelMargin: isMobile ? 8 : 6,
    inputPadding: isMobile ? 12 : 10,
    dividerMargin: isMobile ? 20 : isTablet ? 18 : 14,
    cardPadding: isMobile ? 20 : isTablet ? 24 : 20,
    sectionGap: isMobile ? 16 : isTablet ? 14 : 12
  }
  const web3Auth = useWeb3Auth({ autoConnect: false })
  const { state, actions } = web3Auth

  const [tokenStats, setTokenStats] = useState({
    totalSupply: '1,000,000,000',
    circulatingSupply: '450,000,000',
    price: '0.0042',
    marketCap: '4,200,000',
    yourBalance: '0'
  })

  const [stakingData, setStakingData] = useState({
    staked: '0',
    apy: '12.5',
    rewards: '0',
    isStaking: false
  })

  const [proposals, setProposals] = useState([
    {
      id: 1,
      title: 'Increase Staking Rewards',
      description: 'Proposal to increase staking APY from 12.5% to 15%',
      status: 'active',
      votesFor: 12500000,
      votesAgainst: 3200000,
      timeRemaining: '5 days',
      hasVoted: false
    },
    {
      id: 2,
      title: 'Community Marketing Fund',
      description: 'Allocate 5M CRYB tokens for community-driven marketing initiatives',
      status: 'active',
      votesFor: 8900000,
      votesAgainst: 2100000,
      timeRemaining: '3 days',
      hasVoted: false
    },
    {
      id: 3,
      title: 'New Feature: NFT Marketplace',
      description: 'Implement an integrated NFT marketplace for the platform',
      status: 'passed',
      votesFor: 15000000,
      votesAgainst: 1000000,
      timeRemaining: 'Ended',
      hasVoted: true
    }
  ])

  const [transactions, setTransactions] = useState([
    {
      id: 1,
      type: 'stake',
      amount: '1000',
      hash: '0x1234...5678',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'completed'
    },
    {
      id: 2,
      type: 'claim',
      amount: '15.5',
      hash: '0xabcd...ef12',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'completed'
    }
  ])

  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [activeTab, setActiveTab] = useState('stake')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (state.isConnected && state.account) {
      loadUserTokenData()
    }
  }, [state.isConnected, state.account])

  const loadUserTokenData = async () => {
    try {
      // Mock data - replace with actual contract calls
      setTokenStats(prev => ({
        ...prev,
        yourBalance: '5,420.50'
      }))

      setStakingData(prev => ({
        ...prev,
        staked: '1,000.00',
        rewards: '15.50'
      }))
    } catch (error) {
      console.error('Failed to load token data:', error)
    }
  }

  const handleConnectWallet = async () => {
    try {
      await actions.connect('metamask')
      showMessage('Wallet connected successfully', 'success')
    } catch (error) {
      showMessage('Failed to connect wallet', 'error')
      console.error(error)
    }
  }

  const handleDisconnectWallet = async () => {
    try {
      await actions.disconnect()
      showMessage('Wallet disconnected', 'success')
    } catch (error) {
      showMessage('Failed to disconnect wallet', 'error')
    }
  }

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      showMessage('Please enter a valid amount', 'error')
      return
    }

    try {
      // Mock staking - replace with actual contract call
      showMessage('Staking transaction submitted', 'success')
      setStakeAmount('')
      // Reload data after successful stake
      setTimeout(loadUserTokenData, 2000)
    } catch (error) {
      showMessage('Staking failed', 'error')
      console.error(error)
    }
  }

  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      showMessage('Please enter a valid amount', 'error')
      return
    }

    try {
      // Mock unstaking - replace with actual contract call
      showMessage('Unstaking transaction submitted', 'success')
      setUnstakeAmount('')
      setTimeout(loadUserTokenData, 2000)
    } catch (error) {
      showMessage('Unstaking failed', 'error')
      console.error(error)
    }
  }

  const handleClaimRewards = async () => {
    try {
      // Mock claim - replace with actual contract call
      showMessage('Claiming rewards...', 'success')
      setTimeout(loadUserTokenData, 2000)
    } catch (error) {
      showMessage('Claim failed', 'error')
      console.error(error)
    }
  }

  const handleVote = async (proposalId, vote) => {
    if (!state.isConnected) {
      showMessage('Please connect your wallet to vote', 'error')
      return
    }

    try {
      // Mock voting - replace with actual contract call
      showMessage(`Vote ${vote ? 'for' : 'against'} submitted`, 'success')
      setProposals(prev => prev.map(p =>
        p.id === proposalId ? { ...p, hasVoted: true } : p
      ))
    } catch (error) {
      showMessage('Vote failed', 'error')
      console.error(error)
    }
  }

  const handleClaimTokens = async () => {
    if (!state.isConnected) {
      showMessage('Please connect your wallet', 'error')
      return
    }

    try {
      // Mock claim - replace with actual contract call
      showMessage('Claiming tokens...', 'success')
      setTimeout(loadUserTokenData, 2000)
    } catch (error) {
      showMessage('Claim failed', 'error')
      console.error(error)
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionIcon = (type) => {
    const icons = {
      stake: Lock,
      unstake: ArrowUpRight,
      claim: Gift,
      vote: Vote
    }
    return icons[type] || Activity
  }

  const tokenDistribution = [
    { category: 'Community & Users', percentage: 40, color: 'var(--brand-primary)' },
    { category: 'Development Team', percentage: 20, color: 'var(--brand-secondary)' },
    { category: 'Ecosystem Growth', percentage: 15, color: 'var(--color-success)' },
    { category: 'Treasury Reserve', percentage: 15, color: 'var(--color-warning)' },
    { category: 'Public Sale', percentage: 10, color: '#ec4899' }
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'var(--bg-primary)' }}>
      {/* Page Header */}
      <div className="card card-elevated mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Token Economics</h1>
            <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>Manage your CRYB tokens and participate in governance</p>
          </div>
          {!state.isConnected ? (
            <button
              className="btn-primary flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base whitespace-nowrap"
              onClick={handleConnectWallet}
            >
              <Wallet size={isMobile ? 18 : 20} />
              {!isMobile && 'Connect Wallet'}
            </button>
          ) : (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="px-3 py-2 rounded-lg text-sm font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>
                {state.account?.slice(0, 6)}...{state.account?.slice(-4)}
              </div>
              <button
                className="btn-secondary px-3 py-2 sm:px-4 sm:py-2.5 text-sm whitespace-nowrap"
                onClick={handleDisconnectWallet}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className="fixed top-4 right-4 z-50 px-6 py-3 rounded-lg transition-all" style={{
          background: message.type === 'success' ? 'var(--color-success-light)' : 'var(--color-error-light)',
          border: `1px solid ${message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)'}`,
          color: message.type === 'success' ? 'var(--color-success-dark)' : 'var(--color-error-dark)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {message.text}
        </div>
      )}

      {/* Wallet Connection Required */}
      {!state.isConnected && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-24 px-4 text-center">
          <Wallet size={isMobile ? 48 : 64} style={{ color: 'var(--text-tertiary)' }} className="mb-6" />
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Connect Your Wallet</h2>
          <p className="text-sm sm:text-base mb-8 max-w-md" style={{ color: 'var(--text-secondary)' }}>
            Connect your wallet to view your balance, stake tokens, and participate in governance
          </p>
          <button
            className="btn-primary flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg"
            onClick={handleConnectWallet}
          >
            <Wallet size={20} />
            Connect Wallet
          </button>
          <div className="mt-8">
            <span className="text-sm block mb-3" style={{ color: 'var(--text-tertiary)' }}>Supported wallets:</span>
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <span className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>MetaMask</span>
              <span className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>Coinbase</span>
              <span className="px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>WalletConnect</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {state.isConnected && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="card card-interactive">
              <div className="flex items-start gap-3 sm:gap-4">
                <div style={{width: "48px", height: "48px", flexShrink: 0, background: 'var(--brand-gradient)'}}>
                  <Coins size={isMobile ? 20 : 24} style={{ color: 'var(--text-inverse)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Total Supply</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{tokenStats.totalSupply} CRYB</div>
                </div>
              </div>
            </div>

            <div className="card card-interactive">
              <div className="flex items-start gap-3 sm:gap-4">
                <div style={{width: "48px", height: "48px", flexShrink: 0, background: 'var(--color-success)', color: 'var(--text-inverse)'}}>
                  <TrendingUp size={isMobile ? 20 : 24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Circulating</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{tokenStats.circulatingSupply} CRYB</div>
                </div>
              </div>
            </div>

            <div className="card card-interactive">
              <div className="flex items-start gap-3 sm:gap-4">
                <div style={{width: "48px", height: "48px", flexShrink: 0, background: 'var(--color-warning)', color: 'var(--text-inverse)'}}>
                  <DollarSign size={isMobile ? 20 : 24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Price</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>${tokenStats.price}</div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>+5.2%</div>
                </div>
              </div>
            </div>

            <div className="card card-interactive">
              <div className="flex items-start gap-3 sm:gap-4">
                <div style={{width: "48px", height: "48px", flexShrink: 0, background: '#ec4899', color: 'var(--text-inverse)'}}>
                  <BarChart3 size={isMobile ? 20 : 24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Market Cap</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>${formatNumber(tokenStats.marketCap)}</div>
                </div>
              </div>
            </div>

            <div className="card card-elevated sm:col-span-2 lg:col-span-1" style={{ background: 'var(--bg-gradient-subtle)' }}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div style={{width: "48px", height: "48px", flexShrink: 0, background: 'var(--brand-gradient)'}}>
                  <Wallet size={isMobile ? 20 : 24} style={{ color: 'var(--text-inverse)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Your Balance</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{tokenStats.yourBalance} CRYB</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>${(parseFloat(tokenStats.yourBalance.replace(/,/g, '')) * parseFloat(tokenStats.price)).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Distribution Chart */}
          <div className="card card-elevated mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8" style={{ color: 'var(--text-primary)' }}>Token Distribution</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              <div className="flex justify-center">
                <svg viewBox="0 0 200 200" className="w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[400px] h-auto">
                  {tokenDistribution.reduce((acc, item, index) => {
                    const prevTotal = tokenDistribution.slice(0, index).reduce((sum, i) => sum + i.percentage, 0)
                    const angle = (item.percentage / 100) * 360
                    const startAngle = (prevTotal / 100) * 360 - 90
                    const endAngle = startAngle + angle

                    const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180)
                    const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180)
                    const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180)
                    const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180)

                    const largeArcFlag = angle > 180 ? 1 : 0

                    acc.push(
                      <path
                        key={index}
                        d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={item.color}
                        stroke="var(--bg-primary)"
                        strokeWidth="2"
                        className="transition-all hover:opacity-80"
                      />
                    )
                    return acc
                  }, [])}
                </svg>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {tokenDistribution.map((item, index) => (
                  <div key={index} className="card card-compact" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div style={{width: "24px", height: "24px", flexShrink: 0, backgroundColor: item.color}}></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm sm:text-base font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.category}</div>
                      </div>
                      <div className="text-base sm:text-lg lg:text-xl font-bold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staking Section */}
          <div className="card card-elevated mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8" style={{ color: 'var(--text-primary)' }}>Staking</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Staking Stats */}
              <div className="space-y-4">
                <div className="card">
                  <div className="flex items-center gap-4">
                    <div style={{width: "48px", height: "48px", flexShrink: 0, background: 'var(--brand-gradient)'}}>
                      <Lock size={isMobile ? 18 : 20} style={{ color: 'var(--text-inverse)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Staked</div>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{stakingData.staked} CRYB</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center gap-4">
                    <div style={{width: "48px", height: "48px", flexShrink: 0, background: 'var(--color-success)'}}>
                      <TrendingUp size={isMobile ? 18 : 20} style={{ color: 'var(--text-inverse)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>APY</div>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stakingData.apy}%</div>
                    </div>
                  </div>
                </div>

                <div className="card card-elevated" style={{ background: 'var(--color-warning-light)' }}>
                  <div className="flex items-center gap-4">
                    <div style={{width: "48px", height: "48px", flexShrink: 0, background: 'var(--color-warning)'}}>
                      <Gift size={isMobile ? 18 : 20} style={{ color: 'var(--text-inverse)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Rewards Earned</div>
                      <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{stakingData.rewards} CRYB</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staking Actions */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <button
                    className={`flex-1 py-3 px-4 text-sm sm:text-base font-semibold transition-colors ${
                      activeTab === 'stake'
                        ? 'border-b-2'
                        : ''
                    }`}
                    style={{
                      borderBottomColor: activeTab === 'stake' ? 'var(--brand-primary)' : 'transparent',
                      color: activeTab === 'stake' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setActiveTab('stake')}
                  >
                    Stake
                  </button>
                  <button
                    className={`flex-1 py-3 px-4 text-sm sm:text-base font-semibold transition-colors ${
                      activeTab === 'unstake'
                        ? 'border-b-2'
                        : ''
                    }`}
                    style={{
                      borderBottomColor: activeTab === 'unstake' ? 'var(--brand-primary)' : 'transparent',
                      color: activeTab === 'unstake' ? 'var(--brand-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setActiveTab('unstake')}
                  >
                    Unstake
                  </button>
                </div>

                {activeTab === 'stake' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Amount to Stake</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="input w-full pr-16"
                          placeholder="0.00"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                        />
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
                          style={{ background: 'var(--color-info-light)', color: 'var(--brand-primary)' }}
                          onClick={() => setStakeAmount(tokenStats.yourBalance.replace(/,/g, ''))}
                        >
                          MAX
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
                        Available: {tokenStats.yourBalance} CRYB
                      </div>
                    </div>
                    <button className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base" onClick={handleStake}>
                      <Lock size={18} />
                      Stake Tokens
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Amount to Unstake</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="input w-full pr-16"
                          placeholder="0.00"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                        />
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
                          style={{ background: 'var(--color-info-light)', color: 'var(--brand-primary)' }}
                          onClick={() => setUnstakeAmount(stakingData.staked.replace(/,/g, ''))}
                        >
                          MAX
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
                        Staked: {stakingData.staked} CRYB
                      </div>
                    </div>
                    <button className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base" onClick={handleUnstake}>
                      <ArrowUpRight size={18} />
                      Unstake Tokens
                    </button>
                  </div>
                )}

                <button className="btn-secondary w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base" onClick={handleClaimRewards}>
                  <Gift size={18} />
                  Claim Rewards ({stakingData.rewards} CRYB)
                </button>
              </div>
            </div>
          </div>

          {/* Governance Proposals */}
          <div className="card card-elevated mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8" style={{ color: 'var(--text-primary)' }}>Governance Proposals</h2>
            <div className="space-y-4 sm:space-y-6">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="card card-elevated"
                  style={{
                    borderColor: proposal.status === 'active' ? 'var(--brand-primary)' : 'var(--border-subtle)'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{proposal.title}</h3>
                        <span className={`badge ${
                          proposal.status === 'active'
                            ? 'badge-new'
                            : ''
                        }`} style={{
                          background: proposal.status === 'passed' ? 'var(--color-success-light)' : undefined,
                          color: proposal.status === 'passed' ? 'var(--color-success)' : undefined
                        }}>
                          {proposal.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
                      <Clock size={14} />
                      {proposal.timeRemaining}
                    </div>
                  </div>

                  <p className="text-sm sm:text-base mb-4 sm:mb-6" style={{ color: 'var(--text-secondary)' }}>{proposal.description}</p>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="h-2 sm:h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%`,
                          background: 'var(--color-success)'
                        }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="card" style={{ background: 'var(--color-success-light)', borderColor: 'var(--color-success)' }}>
                        <div className="text-xs mb-1" style={{ color: 'var(--color-success)' }}>For</div>
                        <div className="text-sm sm:text-base lg:text-lg font-bold" style={{ color: 'var(--color-success)' }}>{formatNumber(proposal.votesFor)}</div>
                      </div>
                      <div className="card" style={{ background: 'var(--color-error-light)', borderColor: 'var(--color-error)' }}>
                        <div className="text-xs mb-1" style={{ color: 'var(--color-error)' }}>Against</div>
                        <div className="text-sm sm:text-base lg:text-lg font-bold" style={{ color: 'var(--color-error)' }}>{formatNumber(proposal.votesAgainst)}</div>
                      </div>
                    </div>
                  </div>

                  {proposal.status === 'active' && !proposal.hasVoted && (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                      <button
                        className="btn-success px-4 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                        onClick={() => handleVote(proposal.id, true)}
                      >
                        <Vote size={14} />
                        Vote For
                      </button>
                      <button
                        className="px-4 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                        style={{ background: 'var(--color-error-light)', border: '1px solid var(--color-error)', color: 'var(--color-error)' }}
                        onClick={() => handleVote(proposal.id, false)}
                      >
                        <Vote size={14} />
                        Vote Against
                      </button>
                    </div>
                  )}

                  {proposal.hasVoted && (
                    <div className="mt-4 sm:mt-6 card text-center" style={{ background: 'var(--color-info-light)', borderColor: 'var(--brand-primary)' }}>
                      <span className="text-sm sm:text-base font-semibold" style={{ color: 'var(--brand-primary)' }}>You voted on this proposal</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card card-elevated mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8" style={{ color: 'var(--text-primary)' }}>Recent Transactions</h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              {transactions.length > 0 ? (
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Type</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Transaction Hash</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Time</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const Icon = getTransactionIcon(tx.type)
                      return (
                        <tr key={tx.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Icon size={14} style={{ color: 'var(--brand-primary)' }} />
                              <span className="text-sm sm:text-base capitalize" style={{ color: 'var(--text-primary)' }}>{tx.type}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm sm:text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{tx.amount} CRYB</td>
                          <td className="py-4 px-4">
                            <a
                              href={`https://etherscan.io/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm sm:text-base font-mono"
                              style={{ color: 'var(--brand-primary)' }}
                            >
                              {tx.hash}
                            </a>
                          </td>
                          <td className="py-4 px-4 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(tx.timestamp)}</td>
                          <td className="py-4 px-4">
                            <span className="badge" style={{ background: 'var(--color-success-light)', color: 'var(--color-success)' }}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <Activity size={isMobile ? 32 : 48} style={{ color: 'var(--text-tertiary)' }} className="mb-4" />
                  <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>No transactions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Token Claim Section */}
          <div className="card card-elevated text-center" style={{ background: 'var(--bg-gradient-subtle)' }}>
            <div className="flex flex-col items-center max-w-lg mx-auto">
              <Gift size={isMobile ? 40 : 48} style={{ color: 'var(--brand-primary)' }} className="mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4" style={{ color: 'var(--text-primary)' }}>Claim Your Tokens</h3>
              <p className="text-sm sm:text-base mb-6 sm:mb-8" style={{ color: 'var(--text-secondary)' }}>
                You have unclaimed CRYB tokens from the airdrop
              </p>
              <button
                className="btn-primary flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg"
                onClick={handleClaimTokens}
              >
                <Gift size={20} />
                Claim Tokens
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default TokenEconomicsPage
