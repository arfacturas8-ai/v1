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
    { category: 'Community & Users', percentage: 40, color: '#58a6ff' },
    { category: 'Development Team', percentage: 20, color: '#a371f7' },
    { category: 'Ecosystem Growth', percentage: 15, color: '#10b981' },
    { category: 'Treasury Reserve', percentage: 15, color: '#f59e0b' },
    { category: 'Public Sale', percentage: 10, color: '#ec4899' }
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
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
            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 transition-all hover:border-purple-500/30">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center flex-shrink-0">
                  <Coins size={isMobile ? 20 : 24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-white/60 mb-1">Total Supply</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold truncate">{tokenStats.totalSupply} CRYB</div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 transition-all hover:border-purple-500/30">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={isMobile ? 20 : 24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-white/60 mb-1">Circulating</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold truncate">{tokenStats.circulatingSupply} CRYB</div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 transition-all hover:border-purple-500/30">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <DollarSign size={isMobile ? 20 : 24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-white/60 mb-1">Price</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold">${tokenStats.price}</div>
                  <div className="text-xs text-emerald-400 font-semibold">+5.2%</div>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 transition-all hover:border-purple-500/30">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                  <BarChart3 size={isMobile ? 20 : 24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-white/60 mb-1">Market Cap</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold truncate">${formatNumber(tokenStats.marketCap)}</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 transition-all hover:border-purple-500/50 sm:col-span-2 lg:col-span-1">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Wallet size={isMobile ? 20 : 24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-white/60 mb-1">Your Balance</div>
                  <div className="text-base sm:text-lg lg:text-xl font-bold truncate">{tokenStats.yourBalance} CRYB</div>
                  <div className="text-xs text-white/50">${(parseFloat(tokenStats.yourBalance.replace(/,/g, '')) * parseFloat(tokenStats.price)).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Distribution Chart */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8">Token Distribution</h2>
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
                        stroke="#1a1d29"
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
                  <div key={index} className="flex items-center gap-3 sm:gap-4 bg-white/[0.02] p-3 sm:p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.05] transition-colors">
                    <div
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-md flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base font-medium truncate">{item.category}</div>
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-white/90 flex-shrink-0">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staking Section */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8">Staking</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Staking Stats */}
              <div className="space-y-4">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-5 flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Lock size={isMobile ? 18 : 20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm text-white/60 mb-1">Staked</div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{stakingData.staked} CRYB</div>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-5 flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                    <TrendingUp size={isMobile ? 18 : 20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm text-white/60 mb-1">APY</div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold">{stakingData.apy}%</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-5 flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                    <Gift size={isMobile ? 18 : 20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm text-white/60 mb-1">Rewards Earned</div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{stakingData.rewards} CRYB</div>
                  </div>
                </div>
              </div>

              {/* Staking Actions */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex border-b border-white/10">
                  <button
                    className={`flex-1 py-3 px-4 text-sm sm:text-base font-semibold transition-colors ${
                      activeTab === 'stake'
                        ? 'border-b-2 border-purple-500 text-purple-400'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                    onClick={() => setActiveTab('stake')}
                  >
                    Stake
                  </button>
                  <button
                    className={`flex-1 py-3 px-4 text-sm sm:text-base font-semibold transition-colors ${
                      activeTab === 'unstake'
                        ? 'border-b-2 border-purple-500 text-purple-400'
                        : 'text-white/60 hover:text-white/80'
                    }`}
                    onClick={() => setActiveTab('unstake')}
                  >
                    Unstake
                  </button>
                </div>

                {activeTab === 'stake' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Amount to Stake</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="input-dark w-full pr-16"
                          placeholder="0.00"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                        />
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
                          onClick={() => setStakeAmount(tokenStats.yourBalance.replace(/,/g, ''))}
                        >
                          MAX
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm text-white/50 mt-2">
                        Available: {tokenStats.yourBalance} CRYB
                      </div>
                    </div>
                    <button className="btn-primary-gradient w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base" onClick={handleStake}>
                      <Lock size={18} />
                      Stake Tokens
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Amount to Unstake</label>
                      <div className="relative">
                        <input
                          type="number"
                          className="input-dark w-full pr-16"
                          placeholder="0.00"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                        />
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs sm:text-sm font-semibold transition-colors"
                          onClick={() => setUnstakeAmount(stakingData.staked.replace(/,/g, ''))}
                        >
                          MAX
                        </button>
                      </div>
                      <div className="text-xs sm:text-sm text-white/50 mt-2">
                        Staked: {stakingData.staked} CRYB
                      </div>
                    </div>
                    <button className="btn-primary-gradient w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base" onClick={handleUnstake}>
                      <ArrowUpRight size={18} />
                      Unstake Tokens
                    </button>
                  </div>
                )}

                <button className="btn-secondary-dark w-full flex items-center justify-center gap-2 py-3 text-sm sm:text-base" onClick={handleClaimRewards}>
                  <Gift size={18} />
                  Claim Rewards ({stakingData.rewards} CRYB)
                </button>
              </div>
            </div>
          </div>

          {/* Governance Proposals */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8">Governance Proposals</h2>
            <div className="space-y-4 sm:space-y-6">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className={`bg-white/[0.02] border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 transition-all ${
                    proposal.status === 'active'
                      ? 'border-purple-500/30 hover:border-purple-500/50'
                      : 'border-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold">{proposal.title}</h3>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                          proposal.status === 'active'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {proposal.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60 flex-shrink-0">
                      <Clock size={14} />
                      {proposal.timeRemaining}
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-white/70 mb-4 sm:mb-6">{proposal.description}</p>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="h-2 sm:h-3 bg-[#161b22]/60 backdrop-blur-xl rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                        style={{
                          width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 sm:p-4">
                        <div className="text-xs text-emerald-400 mb-1">For</div>
                        <div className="text-sm sm:text-base lg:text-lg font-bold text-emerald-400">{formatNumber(proposal.votesFor)}</div>
                      </div>
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4">
                        <div className="text-xs text-red-400 mb-1">Against</div>
                        <div className="text-sm sm:text-base lg:text-lg font-bold text-red-400">{formatNumber(proposal.votesAgainst)}</div>
                      </div>
                    </div>
                  </div>

                  {proposal.status === 'active' && !proposal.hasVoted && (
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
                      <button
                        className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 px-4 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                        onClick={() => handleVote(proposal.id, true)}
                      >
                        <Vote size={14} />
                        Vote For
                      </button>
                      <button
                        className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-2.5 sm:py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
                        onClick={() => handleVote(proposal.id, false)}
                      >
                        <Vote size={14} />
                        Vote Against
                      </button>
                    </div>
                  )}

                  {proposal.hasVoted && (
                    <div className="mt-4 sm:mt-6 bg-[#58a6ff]/10 border border-blue-500/30 rounded-lg px-4 py-3 text-center">
                      <span className="text-blue-400 text-sm sm:text-base font-semibold">You voted on this proposal</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8">Recent Transactions</h2>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              {transactions.length > 0 ? (
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-white/60">Type</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-white/60">Amount</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-white/60">Transaction Hash</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-white/60">Time</th>
                      <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-white/60">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const Icon = getTransactionIcon(tx.type)
                      return (
                        <tr key={tx.id} className="border-b border-white/10 hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Icon size={14} className="text-purple-400" />
                              <span className="text-sm sm:text-base capitalize">{tx.type}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm sm:text-base font-semibold">{tx.amount} CRYB</td>
                          <td className="py-4 px-4">
                            <a
                              href={`https://etherscan.io/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm sm:text-base text-purple-400 hover:text-purple-300 font-mono"
                            >
                              {tx.hash}
                            </a>
                          </td>
                          <td className="py-4 px-4 text-xs sm:text-sm text-white/60">{formatDate(tx.timestamp)}</td>
                          <td className="py-4 px-4">
                            <span className="px-2 sm:px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs sm:text-sm font-semibold capitalize">
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
                  <Activity size={isMobile ? 32 : 48} className="text-white/30 mb-4" />
                  <p className="text-white/60 text-sm sm:text-base">No transactions yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Token Claim Section */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 sm:p-8 lg:p-12">
            <div className="flex flex-col items-center text-center max-w-lg mx-auto">
              <Gift size={isMobile ? 40 : 48} className="text-purple-400 mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">Claim Your Tokens</h3>
              <p className="text-sm sm:text-base text-white/70 mb-6 sm:mb-8">
                You have unclaimed CRYB tokens from the airdrop
              </p>
              <button
                className="btn-primary-gradient flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg"
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
