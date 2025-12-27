import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import PropTypes from 'prop-types'
import { ShoppingBag, Grid, List, DollarSign, Heart, Search, TrendingUp, Filter, ChevronDown, Wallet, Sparkles, ArrowUpDown, X, CheckCircle, Flame, Clock, Activity, Users } from 'lucide-react'
import { Button, Input } from '../components/ui'
import nftService from '../services/nftService'
import useWeb3Auth from '../lib/hooks/useWeb3Auth'
import { Web3OperationSkeleton, SkeletonBox } from '../components/web3/Web3Skeletons'
import { useToast } from '../contexts/ToastContext'
import {
  SkipToContent,
  announce,
  useLoadingAnnouncement,
  useErrorAnnouncement
} from '../utils/accessibility.jsx'
import { useResponsive } from '../hooks/useResponsive'

const NFTMarketplacePage = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedChain, setSelectedChain] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('recently-listed')
  const [searchTerm, setSearchTerm] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(true)
  const [favorites, setFavorites] = useState(new Set())
  const [selectedCollections, setSelectedCollections] = useState(new Set())
  const [featuredCarouselIndex, setFeaturedCarouselIndex] = useState(0)

  // Web3 Integration
  const { state: web3State, actions: web3Actions } = useWeb3Auth()
  const { showError } = useToast()

  // Accessibility: Announce loading and error states to screen readers
  useLoadingAnnouncement(loading, 'Loading NFT marketplace')
  useErrorAnnouncement(error)

  // Featured Collections for Hero Carousel
  const featuredCollections = useMemo(() => [
    {
      id: 2,
      name: 'Crypto Legends',
      description: 'Legendary digital art by renowned creators',
      image: 'https://via.placeholder.com/1200x400/764ba2/ffffff?text=Crypto+Legends',
      floorPrice: '1.2',
      totalVolume: '450.3',
      items: 5000,
      verified: true
    },
    {
      id: 3,
      name: 'Meta Worlds',
      description: 'Virtual land and metaverse assets',
      image: 'https://via.placeholder.com/1200x400/f093fb/ffffff?text=Meta+Worlds',
      floorPrice: '2.8',
      totalVolume: '890.5',
      items: 3000,
      verified: true
    }
  ], [])

  // Auto-rotate featured carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedCarouselIndex((prev) =>
        (prev + 1) % featuredCollections.length
      )
    }, 5000)
    return () => clearInterval(interval)
  }, [featuredCollections.length])

  // Memoize categories
  const categories = useMemo(() => [
    { id: 'all', name: 'All NFTs', icon: '🎨' },
    ...nftService.getCategories()
  ], [])

  // Available Collections
  const availableCollections = useMemo(() => [
    { id: 'crypto-legends', name: 'Crypto Legends', verified: true, count: 5000 },
    { id: 'meta-worlds', name: 'Meta Worlds', verified: true, count: 3000 },
    { id: 'pixel-punks', name: 'Pixel Punks', verified: false, count: 8000 },
    { id: 'abstract-dreams', name: 'Abstract Dreams', verified: true, count: 2500 }
  ], [])

  // Supported chains (Sepolia testnet included)
  const chains = useMemo(() => [
    { id: 'all', name: 'All Chains', icon: '🌐' },
    { id: '1', name: 'Ethereum', icon: '⟠' },
    { id: '11155111', name: 'Sepolia Testnet', icon: '🧪' },
    { id: '137', name: 'Polygon', icon: '🔷' },
    { id: '8453', name: 'Base', icon: '🔵' },
    { id: '42161', name: 'Arbitrum', icon: '🔷' }
  ], [])

  // Status filters
  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All Items' },
    { value: 'buy-now', label: 'Buy Now' },
    { value: 'on-auction', label: 'On Auction' }
  ], [])

  // Sort options
  const sortOptions = [
    { value: 'recently-listed', label: 'Recently Listed' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'most-favorited', label: 'Most Favorited' },
    { value: 'oldest', label: 'Oldest' }
  ]

  useEffect(() => {
    loadListings()
  }, [selectedCategory, selectedChain, sortBy, selectedStatus])

  const loadListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const filters = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        chain: selectedChain !== 'all' ? selectedChain : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        sortBy,
        priceMin: priceRange.min || undefined,
        priceMax: priceRange.max || undefined,
        collections: selectedCollections.size > 0 ? Array.from(selectedCollections) : undefined
      }
      const response = await nftService.getListings(filters)
      if (response.success) {
        setListings(response.data.items || [])
      }
    } catch (err) {
      console.error('Failed to load NFT listings:', err)
      const errorMsg = 'Failed to load NFT listings. Please try again.'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedChain, selectedStatus, sortBy, priceRange, selectedCollections, showError])

  const handlePurchase = useCallback(async (listing) => {
    if (!web3State.isConnected) {
      showError('Please connect your wallet to purchase NFTs')
      return
    }

    try {
      // This would integrate with Web3 wallet for actual purchase
      alert(`Purchase flow for NFT: ${listing.name}\nPrice: ${listing.price} ${listing.currency}`)
      // await web3Actions.sendTransaction({ ... })
    } catch (err) {
      console.error('Purchase failed:', err)
      showError('Purchase failed. Please try again.')
    }
  }, [web3State.isConnected, web3Actions, showError])

  const handlePlaceBid = useCallback(async (listing) => {
    if (!web3State.isConnected) {
      showError('Please connect your wallet to place bids')
      return
    }

    try {
      alert(`Place bid flow for NFT: ${listing.name}\nCurrent Price: ${listing.price} ${listing.currency}`)
    } catch (err) {
      console.error('Bid failed:', err)
      showError('Failed to place bid. Please try again.')
    }
  }, [web3State.isConnected, showError])

  const toggleFavorite = useCallback((nftId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(nftId)) {
        newFavorites.delete(nftId)
      } else {
        newFavorites.add(nftId)
      }
      return newFavorites
    })
  }, [])

  const toggleCollection = useCallback((collectionId) => {
    setSelectedCollections(prev => {
      const newCollections = new Set(prev)
      if (newCollections.has(collectionId)) {
        newCollections.delete(collectionId)
      } else {
        newCollections.add(collectionId)
      }
      return newCollections
    })
  }, [])

  // Memoize filtered listings
  const filteredListings = useMemo(() =>
    listings.filter(nft =>
      !searchTerm || nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.collection?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [listings, searchTerm]
  )

  // Memoize collection stats
  const collectionStats = useMemo(() => {
    const prices = filteredListings.map(n => parseFloat(n.price) || 0).filter(p => p > 0)
    const floorPrice = prices.length > 0 ? Math.min(...prices) : 0
    const totalVolume = prices.reduce((sum, price) => sum + price, 0)
    const uniqueOwners = new Set(filteredListings.map(n => n.owner)).size

    return {
      totalListings: filteredListings.length,
      uniqueCollections: new Set(filteredListings.map(n => n.collection)).size,
      floorPrice: floorPrice.toFixed(4),
      totalVolume: totalVolume.toFixed(2),
      volume24h: (totalVolume * 0.15).toFixed(2),
      owners: uniqueOwners
    }
  }, [filteredListings])

  // Connect wallet handler
  const handleConnectWallet = useCallback(async () => {
    try {
      await web3Actions.connect()
    } catch (err) {
      console.error('Failed to connect wallet:', err)
      showError('Failed to connect wallet. Please try again.')
    }
  }, [web3Actions, showError])

  const currentFeatured = featuredCollections[featuredCarouselIndex]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      paddingTop: isMobile ? '56px' : '72px'
    }} role="main" aria-label="NFT Marketplace page">
      <SkipToContent targetId="main-content" />

      {/* Hero Banner with Featured Collection Carousel */}
      <div style={{
        position: 'relative',
        height: isMobile ? '400px' : '500px',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src={currentFeatured.image}
            alt={currentFeatured.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, #FAFAFA, rgba(250, 250, 250, 0.6), transparent)'
          }} />
        </div>
        <div style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '1280px',
          margin: '0 auto',
          padding: isMobile ? '24px 16px' : '0 24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          paddingBottom: isMobile ? '32px' : '48px'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(88, 166, 255, 0.1)',
            border: '1px solid rgba(88, 166, 255, 0.3)',
            borderRadius: '9999px',
            color: '#1A1A1A',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '16px',
            width: 'fit-content'
          }}>
            <Sparkles style={{ width: '20px', height: '20px' }} />
            <span>Featured Collection</span>
          </div>
          <h1 style={{
            fontSize: isMobile ? '32px' : '48px',
            fontWeight: '700',
            color: '#1A1A1A',
            marginBottom: '12px'
          }}>{currentFeatured.name}</h1>
          <p style={{
            fontSize: isMobile ? '16px' : '20px',
            color: '#666666',
            marginBottom: isMobile ? '24px' : '32px',
            maxWidth: '720px'
          }}>{currentFeatured.description}</p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '16px' : '32px',
            marginBottom: '24px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: '700',
                color: '#1A1A1A'
              }}>{currentFeatured.floorPrice} ETH</div>
              <div style={{
                fontSize: '14px',
                color: '#666666'
              }}>Floor Price</div>
            </div>
            <div style={{
              width: '1px',
              height: '48px',
              background: '#E8EAED',
              display: isMobile ? 'none' : 'block'
            }} />
            <div>
              <div style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: '700',
                color: '#1A1A1A'
              }}>{currentFeatured.totalVolume} ETH</div>
              <div style={{
                fontSize: '14px',
                color: '#666666'
              }}>Total Volume</div>
            </div>
            <div style={{
              width: '1px',
              height: '48px',
              background: '#E8EAED',
              display: isMobile ? 'none' : 'block'
            }} />
            <div>
              <div style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: '700',
                color: '#1A1A1A'
              }}>{currentFeatured.items.toLocaleString()}</div>
              <div style={{
                fontSize: '14px',
                color: '#666666'
              }}>Items</div>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {featuredCollections.map((_, index) => (
              <button
                key={index}
                style={{
                  height: '6px',
                  borderRadius: '9999px',
                  width: index === featuredCarouselIndex ? '32px' : '6px',
                  background: index === featuredCarouselIndex ? '#58a6ff' : '#E8EAED',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (index !== featuredCarouselIndex) {
                    e.currentTarget.style.background = '#666666'
                  }
                }}
                onMouseLeave={(e) => {
                  if (index !== featuredCarouselIndex) {
                    e.currentTarget.style.background = '#E8EAED'
                  }
                }}
                onClick={() => setFeaturedCarouselIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Collection Stats Bar */}
      <div style={{
        borderBottom: '1px solid #E8EAED',
        background: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: isMobile ? '16px' : '24px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '12px' : '16px'
          }}>
            {[
              { icon: Flame, label: 'Floor Price', value: `${collectionStats.floorPrice} ETH` },
              { icon: Activity, label: 'Volume 24h', value: `${collectionStats.volume24h} ETH` },
              { icon: Grid, label: 'Total Items', value: collectionStats.totalListings },
              { icon: Users, label: 'Owners', value: collectionStats.owners }
            ].map((stat, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: isMobile ? '16px' : '20px',
                background: '#FFFFFF',
                border: '1px solid #E8EAED',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  padding: '10px',
                  background: 'rgba(88, 166, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#58a6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <stat.icon style={{ width: '24px', height: '24px' }} />
                </div>
                <div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666666',
                    marginBottom: '4px'
                  }}>{stat.label}</div>
                  <div style={{
                    fontSize: isMobile ? '16px' : '18px',
                    fontWeight: '700',
                    color: '#1A1A1A'
                  }}>{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wallet Connection Prompt */}
      {!web3State.isConnected && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(88, 166, 255, 0.1) 0%, rgba(163, 113, 247, 0.1) 100%)',
          borderBottom: '1px solid rgba(88, 166, 255, 0.2)'
        }}>
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: isMobile ? '16px' : '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <Wallet style={{ width: '24px', height: '24px', color: '#58a6ff' }} />
            <span style={{
              color: '#1A1A1A',
              fontWeight: '600',
              fontSize: '15px',
              textAlign: isMobile ? 'center' : 'left'
            }}>Connect your wallet to buy, bid, and list NFTs</span>
            <button
              onClick={handleConnectWallet}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Connect Wallet
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: isMobile ? '16px' : '24px 24px 48px',
        display: 'flex',
        gap: '24px'
      }} id="main-content">

        {/* Filter Sidebar */}
        <aside style={{
          display: showFilters ? 'block' : 'none',
          width: isDesktop ? '320px' : '100%',
          flexShrink: 0,
          position: isDesktop ? 'sticky' : 'relative',
          top: isDesktop ? '88px' : 'auto',
          height: 'fit-content'
        }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E8EAED',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            padding: isMobile ? '20px' : '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#1A1A1A',
                fontWeight: '600',
                fontSize: '18px'
              }}>
                <Filter style={{ width: '24px', height: '24px' }} />
                <h2>Filters</h2>
              </div>
              {!isDesktop && (
                <button
                  style={{
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#666666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filters"
                >
                  <X style={{ width: '24px', height: '24px' }} />
                </button>
              )}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#666666',
                marginBottom: '8px'
              }}>Search</label>
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#666666',
                  width: '20px',
                  height: '20px'
                }} />
                <input
                  type="text"
                  placeholder="Search NFTs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    background: '#F5F5F5',
                    border: '1px solid #E8EAED',
                    borderRadius: '12px',
                    color: '#1A1A1A',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#58a6ff'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E8EAED'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  aria-label="Search NFTs"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#666666',
                marginBottom: '8px'
              }}>Status</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {statusOptions.map(status => (
                  <button
                    key={status.value}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '15px',
                      background: selectedStatus === status.value
                        ? 'rgba(88, 166, 255, 0.1)'
                        : '#F5F5F5',
                      color: selectedStatus === status.value ? '#58a6ff' : '#666666',
                      border: selectedStatus === status.value
                        ? '1px solid rgba(88, 166, 255, 0.3)'
                        : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedStatus !== status.value) {
                        e.currentTarget.style.background = '#E8EAED'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedStatus !== status.value) {
                        e.currentTarget.style.background = '#F5F5F5'
                      }
                    }}
                    onClick={() => setSelectedStatus(status.value)}
                    aria-pressed={selectedStatus === status.value}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#666666',
                marginBottom: '8px'
              }}>Price Range (ETH)</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: '#F5F5F5',
                    border: '1px solid #E8EAED',
                    borderRadius: '12px',
                    color: '#1A1A1A',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                  aria-label="Minimum price"
                />
                <span style={{ color: '#666666', fontSize: '14px' }}>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: '#F5F5F5',
                    border: '1px solid #E8EAED',
                    borderRadius: '12px',
                    color: '#1A1A1A',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                  aria-label="Maximum price"
                />
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                onClick={loadListings}
              >
                Apply
              </button>
            </div>

            {/* Chains */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#666666',
                marginBottom: '8px'
              }}>Chains</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {chains.slice(0, 4).map(chain => (
                  <button
                    key={chain.id}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      textAlign: 'left',
                      fontWeight: '600',
                      fontSize: '15px',
                      background: selectedChain === chain.id
                        ? 'rgba(88, 166, 255, 0.1)'
                        : '#F5F5F5',
                      color: selectedChain === chain.id ? '#58a6ff' : '#666666',
                      border: selectedChain === chain.id
                        ? '1px solid rgba(88, 166, 255, 0.3)'
                        : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onClick={() => setSelectedChain(chain.id)}
                    aria-pressed={selectedChain === chain.id}
                  >
                    <span>{chain.icon}</span>
                    <span>{chain.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* NFT Grid Section */}
        <main style={{
          flex: 1,
          minWidth: 0
        }}>

          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            background: '#FFFFFF',
            border: '1px solid #E8EAED',
            borderRadius: '16px',
            padding: isMobile ? '12px' : '16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              width: isMobile ? '100%' : 'auto'
            }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: '#F5F5F5',
                  border: '1px solid #E8EAED',
                  borderRadius: '12px',
                  color: '#1A1A1A',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#E8EAED'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#F5F5F5'}
                onClick={() => setShowFilters(!showFilters)}
                aria-label="Toggle filters"
              >
                <Filter style={{ width: '20px', height: '20px' }} />
                <span style={{ display: isMobile ? 'none' : 'inline' }}>
                  {showFilters ? 'Hide' : 'Show'} Filters
                </span>
              </button>
              <div style={{
                fontSize: '14px',
                color: '#666666'
              }}>
                <span style={{ fontWeight: '600', color: '#1A1A1A' }}>
                  {filteredListings.length}
                </span> {filteredListings.length === 1 ? 'item' : 'items'}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: isMobile ? '100%' : 'auto'
            }}>
              {/* Sort Dropdown */}
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#F5F5F5',
                border: '1px solid #E8EAED',
                borderRadius: '12px',
                flex: isMobile ? 1 : 'initial'
              }}>
                <ArrowUpDown style={{ width: '20px', height: '20px', color: '#666666' }} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    background: 'transparent',
                    color: '#1A1A1A',
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none',
                    border: 'none',
                    paddingRight: '24px',
                    cursor: 'pointer',
                    appearance: 'none'
                  }}
                  aria-label="Sort NFTs"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown style={{
                  position: 'absolute',
                  right: '12px',
                  width: '16px',
                  height: '16px',
                  color: '#666666',
                  pointerEvents: 'none'
                }} />
              </div>

              {/* View Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px',
                background: '#F5F5F5',
                border: '1px solid #E8EAED',
                borderRadius: '12px'
              }}>
                <button
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: viewMode === 'grid' ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                    color: viewMode === 'grid' ? '#58a6ff' : '#666666',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid style={{ width: '20px', height: '20px' }} />
                </button>
                <button
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: viewMode === 'list' ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                    color: viewMode === 'list' ? '#58a6ff' : '#666666',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <List style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '20px'
            }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E8EAED',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
                }}>
                  <div style={{
                    aspectRatio: '1',
                    background: '#F5F5F5'
                  }} />
                  <div style={{ padding: '16px' }}>
                    <div style={{
                      height: '16px',
                      background: '#F5F5F5',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      width: '75%'
                    }} />
                    <div style={{
                      height: '12px',
                      background: '#F5F5F5',
                      borderRadius: '4px',
                      marginBottom: '16px',
                      width: '50%'
                    }} />
                    <div style={{
                      height: '32px',
                      background: '#F5F5F5',
                      borderRadius: '8px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '8px'
              }}>Failed to Load NFTs</h3>
              <p style={{
                fontSize: '16px',
                color: '#666666',
                marginBottom: '24px',
                maxWidth: '480px'
              }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
              <button
                onClick={loadListings}
                style={{
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                aria-label="Retry loading NFTs"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredListings.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              textAlign: 'center'
            }}>
              <ShoppingBag size={64} strokeWidth={1} style={{ color: '#666666', marginBottom: '16px' }} />
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1A1A1A',
                marginBottom: '8px'
              }}>No NFTs Found</h3>
              <p style={{
                fontSize: '16px',
                color: '#666666',
                maxWidth: '480px'
              }}>Try adjusting your filters or search terms</p>
            </div>
          )}

          {/* NFT Grid */}
          {!loading && !error && filteredListings.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid'
                ? (isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)')
                : '1fr',
              gap: '20px'
            }}>
              {filteredListings.map((nft) => {
                const isFavorited = favorites.has(nft.id)
                const hasAuction = nft.auctionEndTime
                const priceInETH = nft.price || 0
                const priceInUSD = (priceInETH * 2400).toFixed(2)

                return (
                  <div
                    key={nft.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E8EAED',
                      borderRadius: '16px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.3)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E8EAED'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.06)'
                    }}
                  >
                    {/* NFT Image */}
                    <div style={{
                      position: 'relative',
                      aspectRatio: '1',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={nft.image || 'https://via.placeholder.com/400'}
                        alt={nft.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease'
                        }}
                        loading="lazy"
                      />

                      {/* Favorite Button */}
                      <button
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          padding: '10px',
                          borderRadius: '12px',
                          background: isFavorited
                            ? 'rgba(255, 107, 157, 0.2)'
                            : 'rgba(255, 255, 255, 0.9)',
                          border: isFavorited
                            ? '1px solid rgba(255, 107, 157, 0.5)'
                            : '1px solid #E8EAED',
                          color: isFavorited ? '#FF6B9D' : '#1A1A1A',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(nft.id)
                        }}
                        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        aria-pressed={isFavorited}
                      >
                        <Heart
                          size={20}
                          fill={isFavorited ? 'currentColor' : 'none'}
                        />
                      </button>
                    </div>

                    {/* NFT Info */}
                    <div style={{ padding: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: '#666666',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontWeight: '600' }}>
                          {nft.collection || 'Unknown Collection'}
                        </span>
                        <CheckCircle size={14} style={{ color: '#58a6ff' }} />
                      </div>

                      <h3 style={{
                        color: '#1A1A1A',
                        fontWeight: '700',
                        fontSize: '18px',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{nft.name}</h3>

                      {nft.tokenId && (
                        <p style={{
                          fontSize: '12px',
                          color: '#666666',
                          marginBottom: '12px'
                        }}>#{nft.tokenId}</p>
                      )}

                      {/* Price Section */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid #E8EAED',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <span style={{
                            fontSize: '12px',
                            color: '#666666',
                            display: 'block',
                            marginBottom: '4px'
                          }}>
                            {hasAuction ? 'Current Bid' : 'Price'}
                          </span>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#1A1A1A',
                            marginBottom: '2px'
                          }}>{priceInETH} ETH</div>
                          <div style={{
                            fontSize: '12px',
                            color: '#666666'
                          }}>${priceInUSD}</div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '15px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        onClick={() => hasAuction ? handlePlaceBid(nft) : handlePurchase(nft)}
                      >
                        {hasAuction ? (
                          <>
                            <DollarSign size={20} />
                            Place Bid
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={20} />
                            Buy Now
                          </>
                        )}
                      </button>

                      {/* Auction Timer */}
                      {hasAuction && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: '#666666',
                          marginTop: '8px'
                        }}>
                          <Clock style={{ width: '16px', height: '16px' }} />
                          <span>Ends in 2h 34m</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

NFTMarketplacePage.propTypes = {}

export default NFTMarketplacePage
