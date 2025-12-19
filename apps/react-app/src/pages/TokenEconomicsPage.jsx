/**
 * TokenEconomicsPage Component
 * Displays token economics, staking, and governance with iOS aesthetic
 * Features: Token stats, distribution chart, staking interface, governance proposals
 */

import React, { useState, useEffect } from 'react'
import { TrendingUp, Coins, Shield, Zap, PieChart, BarChart3, ArrowUpRight, Lock, Gift, Wallet, Star, DollarSign, Vote, Clock, TrendingDown, Activity, RefreshCw } from 'lucide-react'
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth'
import walletManager from '../lib/web3/WalletManager'
import { useResponsive } from '../hooks/useResponsive'

function TokenEconomicsPage() {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

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
      showMessage('Staking transaction submitted', 'success')
      setStakeAmount('')
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
    { category: 'Community & Users', percentage: 40, color: '#6366F1' },
    { category: 'Development Team', percentage: 20, color: '#8B5CF6' },
    { category: 'Ecosystem Growth', percentage: 15, color: '#10B981' },
    { category: 'Treasury Reserve', percentage: 15, color: '#F59E0B' },
    { category: 'Public Sale', percentage: 10, color: '#EC4899' }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      padding: isMobile ? '16px' : isTablet ? '24px' : '32px',
      background: '#FAFAFA'
    }}>
      {/* Page Header */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        padding: isMobile ? '24px' : '32px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: isMobile ? '24px' : '32px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
              fontWeight: '700',
              marginBottom: '8px',
              color: '#000000'
            }}>
              Token Economics
            </h1>
            <p style={{
              fontSize: isMobile ? '14px' : '16px',
              color: '#666666'
            }}>
              Manage your CRYB tokens and participate in governance
            </p>
          </div>
          {!state.isConnected ? (
            <button
              onClick={handleConnectWallet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '12px 20px' : '14px 24px',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <Wallet size={20} />
              {!isMobile && 'Connect Wallet'}
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: isMobile ? '100%' : 'auto' }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'monospace',
                background: '#F9FAFB',
                color: '#000000',
                border: '1px solid #E5E7EB'
              }}>
                {state.account?.slice(0, 6)}...{state.account?.slice(-4)}
              </div>
              <button
                onClick={handleDisconnectWallet}
                style={{
                  padding: isMobile ? '12px 16px' : '12px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: '#FFFFFF',
                  color: '#666666',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  cursor: 'pointer'
                }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 50,
          padding: '16px 24px',
          borderRadius: '16px',
          transition: 'all 0.3s',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.type === 'success' ? '#10B981' : '#EF4444'}`,
          color: message.type === 'success' ? '#059669' : '#DC2626',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          {message.text}
        </div>
      )}

      {/* Wallet Connection Required */}
      {!state.isConnected && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '48px 16px' : isTablet ? '64px 24px' : '96px 24px',
          textAlign: 'center'
        }}>
          <Wallet size={isMobile ? 48 : 64} style={{ color: '#999999', marginBottom: '24px' }} />
          <h2 style={{
            fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
            fontWeight: '700',
            marginBottom: '16px',
            color: '#000000'
          }}>
            Connect Your Wallet
          </h2>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            marginBottom: '32px',
            maxWidth: '448px',
            color: '#666666'
          }}>
            Connect your wallet to view your balance, stake tokens, and participate in governance
          </p>
          <button
            onClick={handleConnectWallet}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: isMobile ? '16px 32px' : '18px 40px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: '#FFFFFF',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Wallet size={20} />
            Connect Wallet
          </button>
          <div style={{ marginTop: '32px' }}>
            <span style={{
              fontSize: '14px',
              display: 'block',
              marginBottom: '12px',
              color: '#999999'
            }}>
              Supported wallets:
            </span>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              {['MetaMask', 'Coinbase', 'WalletConnect'].map(wallet => (
                <span key={wallet} style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: '#F9FAFB',
                  color: '#000000',
                  border: '1px solid #E5E7EB'
                }}>
                  {wallet}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {state.isConnected && (
        <>
          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
            gap: isMobile ? '16px' : '24px',
            marginBottom: isMobile ? '24px' : '32px'
          }}>
            {[
              { icon: Coins, label: 'Total Supply', value: `${tokenStats.totalSupply} CRYB`, color: '#6366F1' },
              { icon: TrendingUp, label: 'Circulating', value: `${tokenStats.circulatingSupply} CRYB`, color: '#10B981' },
              { icon: DollarSign, label: 'Price', value: `$${tokenStats.price}`, change: '+5.2%', color: '#F59E0B' },
              { icon: BarChart3, label: 'Market Cap', value: `$${formatNumber(tokenStats.marketCap)}`, color: '#EC4899' },
              { icon: Wallet, label: 'Your Balance', value: `${tokenStats.yourBalance} CRYB`, color: '#8B5CF6' }
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} style={{
                  background: index === 4 ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)' : '#FFFFFF',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      flexShrink: 0,
                      background: `${stat.color}15`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={24} style={{ color: stat.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '12px',
                        marginBottom: '4px',
                        color: '#666666'
                      }}>
                        {stat.label}
                      </div>
                      <div style={{
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: '700',
                        color: '#000000',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {stat.value}
                      </div>
                      {stat.change && (
                        <div style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#10B981'
                        }}>
                          {stat.change}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Token Distribution Chart */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: isMobile ? '24px' : '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: isMobile ? '24px' : '32px'
          }}>
            <h2 style={{
              fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
              fontWeight: '700',
              marginBottom: isMobile ? '24px' : '32px',
              color: '#000000'
            }}>
              Token Distribution
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '24px' : '48px',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <svg viewBox="0 0 200 200" style={{
                  width: '100%',
                  maxWidth: isMobile ? '280px' : isTablet ? '320px' : '400px',
                  height: 'auto'
                }}>
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
                        stroke="#FAFAFA"
                        strokeWidth="2"
                        style={{ transition: 'opacity 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      />
                    )
                    return acc
                  }, [])}
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tokenDistribution.map((item, index) => (
                  <div key={index} style={{
                    background: '#F9FAFB',
                    borderRadius: '16px',
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        flexShrink: 0,
                        backgroundColor: item.color,
                        borderRadius: '6px'
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: isMobile ? '14px' : '16px',
                          fontWeight: '500',
                          color: '#000000',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.category}
                        </div>
                      </div>
                      <div style={{
                        fontSize: isMobile ? '16px' : '20px',
                        fontWeight: '700',
                        color: '#000000',
                        flexShrink: 0
                      }}>
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staking Section */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: isMobile ? '24px' : '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: isMobile ? '24px' : '32px'
          }}>
            <h2 style={{
              fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
              fontWeight: '700',
              marginBottom: isMobile ? '24px' : '32px',
              color: '#000000'
            }}>
              Staking
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: isMobile ? '24px' : '32px'
            }}>
              {/* Staking Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { icon: Lock, label: 'Staked', value: `${stakingData.staked} CRYB`, color: '#6366F1' },
                  { icon: TrendingUp, label: 'APY', value: `${stakingData.apy}%`, color: '#10B981' },
                  { icon: Gift, label: 'Rewards Earned', value: `${stakingData.rewards} CRYB`, color: '#F59E0B' }
                ].map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={index} style={{
                      background: index === 2 ? 'rgba(245, 158, 11, 0.1)' : '#FFFFFF',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          flexShrink: 0,
                          background: `${stat.color}15`,
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon size={20} style={{ color: stat.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '12px',
                            marginBottom: '4px',
                            color: '#666666'
                          }}>
                            {stat.label}
                          </div>
                          <div style={{
                            fontSize: isMobile ? '18px' : '22px',
                            fontWeight: '700',
                            color: '#000000',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {stat.value}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Staking Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                  {['stake', 'unstake'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: '600',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === tab ? '2px solid #6366F1' : '2px solid transparent',
                        color: activeTab === tab ? '#6366F1' : '#666666',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {activeTab === 'stake' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px',
                        color: '#000000'
                      }}>
                        Amount to Stake
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={stakeAmount}
                          onChange={(e) => setStakeAmount(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '16px',
                            paddingRight: '80px',
                            fontSize: '16px',
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            color: '#000000',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => setStakeAmount(tokenStats.yourBalance.replace(/,/g, ''))}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366F1',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          MAX
                        </button>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        marginTop: '8px',
                        color: '#999999'
                      }}>
                        Available: {tokenStats.yourBalance} CRYB
                      </div>
                    </div>
                    <button
                      onClick={handleStake}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '16px',
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Lock size={18} />
                      Stake Tokens
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '8px',
                        color: '#000000'
                      }}>
                        Amount to Unstake
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={unstakeAmount}
                          onChange={(e) => setUnstakeAmount(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '16px',
                            paddingRight: '80px',
                            fontSize: '16px',
                            background: '#F9FAFB',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            color: '#000000',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => setUnstakeAmount(stakingData.staked.replace(/,/g, ''))}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: '#6366F1',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          MAX
                        </button>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        marginTop: '8px',
                        color: '#999999'
                      }}>
                        Staked: {stakingData.staked} CRYB
                      </div>
                    </div>
                    <button
                      onClick={handleUnstake}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '16px',
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <ArrowUpRight size={18} />
                      Unstake Tokens
                    </button>
                  </div>
                )}

                <button
                  onClick={handleClaimRewards}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '16px',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '600',
                    background: '#FFFFFF',
                    color: '#6366F1',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <Gift size={18} />
                  Claim Rewards ({stakingData.rewards} CRYB)
                </button>
              </div>
            </div>
          </div>

          {/* Governance Proposals */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: isMobile ? '24px' : '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: isMobile ? '24px' : '32px'
          }}>
            <h2 style={{
              fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
              fontWeight: '700',
              marginBottom: isMobile ? '24px' : '32px',
              color: '#000000'
            }}>
              Governance Proposals
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    padding: isMobile ? '20px' : '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    border: proposal.status === 'active' ? '1px solid #6366F1' : '1px solid #E5E7EB'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <h3 style={{
                          fontSize: isMobile ? '16px' : '18px',
                          fontWeight: '700',
                          color: '#000000'
                        }}>
                          {proposal.title}
                        </h3>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: proposal.status === 'active' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: proposal.status === 'active' ? '#6366F1' : '#10B981'
                        }}>
                          {proposal.status}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#666666',
                      flexShrink: 0
                    }}>
                      <Clock size={14} />
                      {proposal.timeRemaining}
                    </div>
                  </div>

                  <p style={{
                    fontSize: isMobile ? '14px' : '16px',
                    marginBottom: isMobile ? '16px' : '24px',
                    color: '#666666'
                  }}>
                    {proposal.description}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      height: isMobile ? '8px' : '12px',
                      borderRadius: '99px',
                      overflow: 'hidden',
                      background: '#F3F4F6'
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}%`,
                          background: '#10B981',
                          transition: 'width 0.3s'
                        }}
                      />
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px'
                    }}>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '12px',
                        padding: '12px',
                        border: '1px solid #10B981'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          marginBottom: '4px',
                          color: '#10B981'
                        }}>
                          For
                        </div>
                        <div style={{
                          fontSize: isMobile ? '14px' : '16px',
                          fontWeight: '700',
                          color: '#10B981'
                        }}>
                          {formatNumber(proposal.votesFor)}
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '12px',
                        padding: '12px',
                        border: '1px solid #EF4444'
                      }}>
                        <div style={{
                          fontSize: '12px',
                          marginBottom: '4px',
                          color: '#EF4444'
                        }}>
                          Against
                        </div>
                        <div style={{
                          fontSize: isMobile ? '14px' : '16px',
                          fontWeight: '700',
                          color: '#EF4444'
                        }}>
                          {formatNumber(proposal.votesAgainst)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {proposal.status === 'active' && !proposal.hasVoted && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px',
                      marginTop: isMobile ? '16px' : '24px'
                    }}>
                      <button
                        onClick={() => handleVote(proposal.id, true)}
                        style={{
                          padding: isMobile ? '12px' : '14px',
                          borderRadius: '12px',
                          fontSize: isMobile ? '14px' : '16px',
                          fontWeight: '600',
                          background: '#10B981',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Vote size={14} />
                        Vote For
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, false)}
                        style={{
                          padding: isMobile ? '12px' : '14px',
                          borderRadius: '12px',
                          fontSize: isMobile ? '14px' : '16px',
                          fontWeight: '600',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#EF4444',
                          border: '1px solid #EF4444',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <Vote size={14} />
                        Vote Against
                      </button>
                    </div>
                  )}

                  {proposal.hasVoted && (
                    <div style={{
                      marginTop: isMobile ? '16px' : '24px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '12px',
                      padding: '12px',
                      textAlign: 'center',
                      border: '1px solid #6366F1'
                    }}>
                      <span style={{
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: '600',
                        color: '#6366F1'
                      }}>
                        You voted on this proposal
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Token Claim Section */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: '24px',
            padding: isMobile ? '32px 24px' : '48px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: '512px',
              margin: '0 auto'
            }}>
              <Gift size={isMobile ? 40 : 48} style={{ color: '#6366F1', marginBottom: isMobile ? '16px' : '24px' }} />
              <h3 style={{
                fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
                fontWeight: '700',
                marginBottom: '12px',
                color: '#000000'
              }}>
                Claim Your Tokens
              </h3>
              <p style={{
                fontSize: isMobile ? '14px' : '16px',
                marginBottom: isMobile ? '24px' : '32px',
                color: '#666666'
              }}>
                You have unclaimed CRYB tokens from the airdrop
              </p>
              <button
                onClick={handleClaimTokens}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: isMobile ? '16px 32px' : '18px 40px',
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: '#FFFFFF',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
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
