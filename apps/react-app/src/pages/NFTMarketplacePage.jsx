import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ShoppingBag, Grid, List, DollarSign, Heart, Search, TrendingUp, Filter, ChevronDown, Wallet, Sparkles, ArrowUpDown, X, CheckCircle, Flame, Clock, Activity, Users } from 'lucide-react'
import { Button, Input } from '../components/ui'
import nftService from '../services/nftService'
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth'
import { Web3OperationSkeleton, SkeletonBox } from '../components/web3/Web3Skeletons'
import {
  SkipToContent,
  announce,
  useLoadingAnnouncement,
  useErrorAnnouncement
} from '../utils/accessibility.jsx'

const NFTMarketplacePage = () => {
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

  // Accessibility: Announce loading and error states to screen readers
  useLoadingAnnouncement(loading, 'Loading NFT marketplace')
  useErrorAnnouncement(error)

  // Featured Collections for Hero Carousel
  const featuredCollections = useMemo(() => [
    {
      id: 1,
      name: 'Cryb.ai Genesis Collection',
      description: 'Exclusive NFTs for early platform adopters',
      image: 'https://via.placeholder.com/1200x400/667eea/ffffff?text=Cryb.ai+Genesis',
      floorPrice: '0.5',
      totalVolume: '125.8',
      items: 10000,
      verified: true
    },
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
    { id: 'cryb-genesis', name: 'Cryb.ai Genesis', verified: true, count: 10000 },
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
      setError('Failed to load NFT listings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedChain, selectedStatus, sortBy, priceRange, selectedCollections])

  const handlePurchase = useCallback(async (listing) => {
    if (!web3State.isConnected) {
      alert('Please connect your wallet to purchase NFTs')
      return
    }

    try {
      // This would integrate with Web3 wallet for actual purchase
      alert(`Purchase flow for NFT: ${listing.name}\nPrice: ${listing.price} ${listing.currency}`)
      // await web3Actions.sendTransaction({ ... })
    } catch (err) {
      console.error('Purchase failed:', err)
    }
  }, [web3State.isConnected, web3Actions])

  const handlePlaceBid = useCallback(async (listing) => {
    if (!web3State.isConnected) {
      alert('Please connect your wallet to place bids')
      return
    }

    try {
      alert(`Place bid flow for NFT: ${listing.name}\nCurrent Price: ${listing.price} ${listing.currency}`)
    } catch (err) {
      console.error('Bid failed:', err)
    }
  }, [web3State.isConnected])

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
    }
  }, [web3Actions])

  const currentFeatured = featuredCollections[featuredCarouselIndex]

  return (
    <div className="nft-marketplace-page" role="main" aria-label="NFT Marketplace page">
      <SkipToContent targetId="main-content" />

      {/* Hero Banner with Featured Collection Carousel */}
      <div className="marketplace-hero">
        <div className="hero-carousel">
          <img
            src={currentFeatured.image}
            alt={currentFeatured.name}
            className="hero-carousel-image"
          />
          <div className="hero-carousel-overlay" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Featured Collection</span>
          </div>
          <h1 className="hero-title">{currentFeatured.name}</h1>
          <p className="hero-subtitle">{currentFeatured.description}</p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-value">{currentFeatured.floorPrice} ETH</div>
              <div className="stat-label">Floor Price</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-value">{currentFeatured.totalVolume} ETH</div>
              <div className="stat-label">Total Volume</div>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <div className="stat-value">{currentFeatured.items.toLocaleString()}</div>
              <div className="stat-label">Items</div>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="carousel-indicators">
            {featuredCollections.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === featuredCarouselIndex ? 'active' : ''}`}
                onClick={() => setFeaturedCarouselIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Collection Stats Bar */}
      <div className="collection-stats-bar">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">
              <Flame size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Floor Price</div>
              <div className="stat-value">{collectionStats.floorPrice} ETH</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Activity size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Volume 24h</div>
              <div className="stat-value">{collectionStats.volume24h} ETH</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Grid size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Items</div>
              <div className="stat-value">{collectionStats.totalListings}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Users size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Owners</div>
              <div className="stat-value">{collectionStats.owners}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Connection Prompt */}
      {!web3State.isConnected && (
        <div className="wallet-prompt">
          <Wallet size={20} />
          <span>Connect your wallet to buy, bid, and list NFTs</span>
          <Button onClick={handleConnectWallet} className="btn-connect-wallet">
            Connect Wallet
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="marketplace-container" id="main-content">

        {/* Filter Sidebar */}
        <aside className={`filter-sidebar ${showFilters ? 'visible' : 'hidden'}`}>
          <div className="sidebar-header">
            <div className="sidebar-title">
              <Filter size={20} />
              <h2>Filters</h2>
            </div>
            <button
              className="btn-icon btn-close-filters"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="filter-section">
            <label className="filter-label">Search</label>
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <Input
                type="text"
                placeholder="Search NFTs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                aria-label="Search NFTs"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-section">
            <label className="filter-label">Status</label>
            <div className="filter-options">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  className={`filter-option ${selectedStatus === status.value ? 'active' : ''}`}
                  onClick={() => setSelectedStatus(status.value)}
                  aria-pressed={selectedStatus === status.value}
                >
                  <span className="option-name">{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-section">
            <label className="filter-label">Price Range (ETH)</label>
            <div className="price-range-inputs">
              <Input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="price-input"
                aria-label="Minimum price"
              />
              <span className="price-separator">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="price-input"
                aria-label="Maximum price"
              />
            </div>
            <button
              className="btn-apply-filter"
              onClick={loadListings}
            >
              Apply
            </button>
          </div>

          {/* Collections Multiselect */}
          <div className="filter-section">
            <label className="filter-label">Collections</label>
            <div className="filter-options-multiselect">
              {availableCollections.map(collection => (
                <button
                  key={collection.id}
                  className={`filter-option-checkbox ${selectedCollections.has(collection.id) ? 'selected' : ''}`}
                  onClick={() => toggleCollection(collection.id)}
                  aria-pressed={selectedCollections.has(collection.id)}
                >
                  <div className="checkbox-wrapper">
                    <div className="checkbox">
                      {selectedCollections.has(collection.id) && <CheckCircle size={16} />}
                    </div>
                    <span className="option-name">{collection.name}</span>
                    {collection.verified && (
                      <CheckCircle size={14} className="verified-badge" />
                    )}
                  </div>
                  <span className="collection-count">{collection.count.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chains */}
          <div className="filter-section">
            <label className="filter-label">Chains</label>
            <div className="filter-options">
              {chains.map(chain => (
                <button
                  key={chain.id}
                  className={`filter-option ${selectedChain === chain.id ? 'active' : ''}`}
                  onClick={() => setSelectedChain(chain.id)}
                  aria-pressed={selectedChain === chain.id}
                >
                  <span className="option-icon">{chain.icon}</span>
                  <span className="option-name">{chain.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="filter-section">
            <label className="filter-label">Categories</label>
            <div className="filter-options">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`filter-option ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={selectedCategory === category.id}
                >
                  <span className="option-icon">{category.icon}</span>
                  <span className="option-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Properties - Placeholder */}
          <div className="filter-section">
            <label className="filter-label">Properties</label>
            <div className="filter-coming-soon">
              <Clock size={16} />
              <span>Coming Soon</span>
            </div>
          </div>
        </aside>

        {/* NFT Grid Section */}
        <main className="nft-grid-section">

          {/* Controls Bar */}
          <div className="controls-bar">
            <div className="controls-left">
              <button
                className="btn-toggle-filters"
                onClick={() => setShowFilters(!showFilters)}
                aria-label="Toggle filters"
              >
                <Filter size={20} />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
              <div className="results-count">
                {filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'}
              </div>
            </div>

            <div className="controls-right">
              {/* Sort Dropdown */}
              <div className="sort-dropdown">
                <ArrowUpDown size={18} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                  aria-label="Sort NFTs"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="dropdown-icon" />
              </div>

              {/* View Toggle */}
              <div className="view-toggle-group">
                <button
                  className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid size={18} />
                </button>
                <button
                  className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State with Skeletons */}
          {loading && (
            <div className="loading-grid">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="nft-card-skeleton">
                  <div className="skeleton-image" />
                  <div className="skeleton-content">
                    <SkeletonBox width="w-3/4" height="h-4" className="mb-2" />
                    <SkeletonBox width="w-1/2" height="h-3" className="mb-4" />
                    <div className="skeleton-footer">
                      <SkeletonBox width="w-20" height="h-5" />
                      <SkeletonBox width="w-16" height="h-8" className="rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <h3>Failed to Load NFTs</h3>
              <p>{error}</p>
              <Button onClick={loadListings} className="btn-retry">
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredListings.length === 0 && (
            <div className="empty-state">
              <ShoppingBag size={64} strokeWidth={1} />
              <h3>No NFTs Found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          )}

          {/* NFT Grid */}
          {!loading && !error && filteredListings.length > 0 && (
            <div className={`nft-grid ${viewMode}`}>
              {filteredListings.map((nft) => {
                const isFavorited = favorites.has(nft.id)
                const hasAuction = nft.auctionEndTime
                const priceInETH = nft.price || 0
                const priceInUSD = (priceInETH * 2400).toFixed(2)
                const rarityScore = Math.floor(Math.random() * 100) + 1

                return (
                  <div key={nft.id} className="nft-card-wrapper">
                    <div className="nft-card">
                      {/* NFT Image */}
                      <div className="nft-image-container">
                        <img
                          src={nft.image || 'https://via.placeholder.com/400'}
                          alt={nft.name}
                          className="nft-image"
                          loading="lazy"
                        />
                        <div className="nft-overlay">
                          <button className="btn-quick-view">Quick View</button>
                        </div>

                        {/* Favorite Button */}
                        <button
                          className={`btn-favorite ${isFavorited ? 'favorited' : ''}`}
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
                          {isFavorited && (
                            <span className="favorite-count">
                              {Math.floor(Math.random() * 50) + 1}
                            </span>
                          )}
                        </button>

                        {/* Rarity Badge */}
                        {rarityScore > 80 && (
                          <div className="rarity-badge legendary">
                            <Sparkles size={14} />
                            Legendary
                          </div>
                        )}
                        {rarityScore > 60 && rarityScore <= 80 && (
                          <div className="rarity-badge rare">
                            Rare
                          </div>
                        )}
                      </div>

                      {/* NFT Info */}
                      <div className="nft-info">
                        {/* Collection Badge */}
                        <div className="nft-collection-badge">
                          <span className="collection-name">
                            {nft.collection || 'Unknown Collection'}
                          </span>
                          <CheckCircle size={14} className="verified-icon" />
                        </div>

                        <h3 className="nft-name">{nft.name}</h3>

                        {nft.tokenId && (
                          <p className="nft-token-id">#{nft.tokenId}</p>
                        )}

                        {/* Price Section */}
                        <div className="nft-price-section">
                          <div className="price-info">
                            <span className="price-label">
                              {hasAuction ? 'Current Bid' : 'Price'}
                            </span>
                            <div className="price-value">
                              <span className="price-eth">{priceInETH} ETH</span>
                              <span className="price-usd">${priceInUSD}</span>
                            </div>
                          </div>

                          {/* Rarity Score */}
                          {rarityScore && (
                            <div className="rarity-score">
                              <TrendingUp size={14} />
                              <span>{rarityScore}% Rarity</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="nft-actions">
                          {hasAuction ? (
                            <button
                              className="btn-action btn-bid"
                              onClick={() => handlePlaceBid(nft)}
                            >
                              <DollarSign size={16} />
                              Place Bid
                            </button>
                          ) : (
                            <button
                              className="btn-action btn-buy"
                              onClick={() => handlePurchase(nft)}
                            >
                              <ShoppingBag size={16} />
                              Buy Now
                            </button>
                          )}
                        </div>

                        {/* Auction Timer */}
                        {hasAuction && (
                          <div className="auction-timer">
                            <Clock size={14} />
                            <span>Ends in 2h 34m</span>
                          </div>
                        )}
                      </div>
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

export default NFTMarketplacePage
