/**
 * CRYB Platform - Wallet Page
 * iOS-style design matching reference images
 * Coins and NFTs portfolio tabs
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Wallet, TrendingUp, TrendingDown, Search, Grid, List, MoreVertical } from 'lucide-react'
import nftService from '../services/nftService'
import apiService from '../services/api'

export default function WalletPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('nfts')
  const [viewMode, setViewMode] = useState('grid')
  const [loading, setLoading] = useState(true)
  const [coins, setCoins] = useState([])
  const [nfts, setNFTs] = useState([])
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [portfolioChange, setPortfolioChange] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    loadWalletData()
  }, [user])

  const loadWalletData = async () => {
    setLoading(true)
    try {
      // Fetch coins portfolio
      const coinsResponse = await apiService.get('/wallet/coins')
      if (coinsResponse.success && coinsResponse.data) {
        setCoins(coinsResponse.data.coins || [])
        setPortfolioValue(coinsResponse.data.totalValue || 0)
        setPortfolioChange(coinsResponse.data.change24h || 0)
      }

      // Fetch NFTs
      const nftsResponse = await nftService.getUserNFTs(user?.id)
      if (nftsResponse.success && nftsResponse.nfts) {
        setNFTs(nftsResponse.nfts)
      }
    } catch (error) {
      console.error('Error loading wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      paddingTop: isMobile ? '60px' : '72px',
      paddingBottom: isMobile ? '80px' : '40px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '20px 16px' : '32px 24px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: isMobile ? '28px' : '32px',
            fontWeight: '700',
            color: '#1A1A1A',
            marginBottom: '8px'
          }}>
            Your Portfolio
          </h1>
          <p style={{ color: '#666666', fontSize: '15px', margin: 0 }}>
            Manage your coins and NFT collection
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: '#FFFFFF',
          padding: '4px',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          border: '1px solid #E8EAED'
        }}>
          <button
            onClick={() => setActiveTab('coins')}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: activeTab === 'coins' ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)' : 'transparent',
              color: activeTab === 'coins' ? '#FFFFFF' : '#666666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: activeTab === 'coins' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Coins
          </button>
          <button
            onClick={() => setActiveTab('nfts')}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: activeTab === 'nfts' ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)' : 'transparent',
              color: activeTab === 'nfts' ? '#FFFFFF' : '#666666',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: activeTab === 'nfts' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            NFTs
          </button>
        </div>

        {/* Coins Tab */}
        {activeTab === 'coins' && (
          <div>
            {/* Portfolio Summary Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRadius: '20px',
              padding: '32px 24px',
              marginBottom: '24px',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(88, 166, 255, 0.2)'
            }}>
              <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
                Total Portfolio Value
              </div>
              <div style={{ fontSize: '40px', fontWeight: '700', marginBottom: '16px' }}>
                ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {portfolioChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span style={{ fontSize: '16px', fontWeight: '600' }}>
                  {portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}%
                </span>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>
                  Last 24h
                </span>
              </div>
            </div>

            {/* Coins List */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              border: '1px solid #E8EAED'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '20px'
              }}>
                Your Coins
              </h2>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666666' }}>
                  Loading...
                </div>
              ) : coins.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {coins.map((coin) => (
                    <div
                      key={coin.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: '#FAFAFA',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F0F1F2'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#FAFAFA'}
                    >
                      <img
                        src={coin.icon || '/crypto.svg'}
                        alt={coin.name}
                        style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
                          {coin.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#666666' }}>
                          {coin.balance} {coin.symbol}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1A1A1A', marginBottom: '4px' }}>
                          ${coin.value?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: coin.change24h >= 0 ? '#10B981' : '#EF4444',
                          fontWeight: '500'
                        }}>
                          {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Wallet size={48} style={{ color: '#CCCCCC', marginBottom: '16px' }} />
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#666666', marginBottom: '8px' }}>
                    No Coins Yet
                  </div>
                  <div style={{ fontSize: '14px', color: '#999999', marginBottom: '24px' }}>
                    Connect your wallet to view your crypto holdings
                  </div>
                  <button
                    onClick={() => navigate('/settings/wallet')}
                    style={{
                      padding: '12px 32px',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(88, 166, 255, 0.3)'
                    }}
                  >
                    Connect Wallet
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NFTs Tab */}
        {activeTab === 'nfts' && (
          <div>
            {loading ? (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '60px 20px',
                textAlign: 'center',
                color: '#666666',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                border: '1px solid #E8EAED'
              }}>
                Loading your NFT collection...
              </div>
            ) : nfts.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
              }}>
                {nfts.map((nft) => (
                  <div
                    key={nft.id}
                    onClick={() => navigate(`/nft/${nft.id}`)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      border: '1px solid #E8EAED'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      paddingTop: '100%',
                      position: 'relative',
                      background: '#F5F5F5'
                    }}>
                      <img
                        src={nft.image || '/images/nft-placeholder.png'}
                        alt={nft.name}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1A1A1A',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {nft.name || 'Untitled'}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle options menu
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '4px',
                            cursor: 'pointer',
                            color: '#666666'
                          }}
                        >
                          <MoreVertical size={20} />
                        </button>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666666' }}>
                        {nft.standard || 'ERC-721'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '60px 20px',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                border: '1px solid #E8EAED'
              }}>
                <Grid size={48} style={{ color: '#CCCCCC', marginBottom: '16px' }} />
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#666666', marginBottom: '8px' }}>
                  No NFTs Yet
                </div>
                <div style={{ fontSize: '14px', color: '#999999', marginBottom: '24px' }}>
                  Your NFT collection will appear here
                </div>
                <button
                  onClick={() => navigate('/nft-marketplace')}
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(88, 166, 255, 0.3)'
                  }}
                >
                  Browse NFT Marketplace
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
