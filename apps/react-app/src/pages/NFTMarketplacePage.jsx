import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import PropTypes from 'prop-types'
import { ShoppingBag, Grid, List, DollarSign, Heart, Search, TrendingUp, Filter, ChevronDown, Wallet, Sparkles, ArrowUpDown, X, CheckCircle, Flame, Clock, Activity, Users } from 'lucide-react'
import { Button, Input } from '../components/ui'
import nftService from '../services/nftService'
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth'
import { Web3OperationSkeleton, SkeletonBox } from '../components/web3/Web3Skeletons'
import { useToast } from '../contexts/ToastContext'
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
  const { showError } = useToast()

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
    <div className="min-h-screen bg-[#0D0D0D]" role="main" aria-label="NFT Marketplace page">
      <SkipToContent targetId="main-content" />

      {/* Hero Banner with Featured Collection Carousel */}
      <div className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={currentFeatured.image}
            alt={currentFeatured.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-end pb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-full text-[#58a6ff] text-sm font-medium mb-4 w-fit backdrop-blur-xl">
            <Sparkles size={16} />
            <span>Featured Collection</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">{currentFeatured.name}</h1>
          <p className="text-xl text-[#666666] mb-8 max-w-2xl">{currentFeatured.description}</p>

          <div className="flex items-center gap-8 mb-6">
            <div>
              <div className="text-3xl font-bold text-white">{currentFeatured.floorPrice} ETH</div>
              <div className="text-sm text-[#666666]">Floor Price</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <div className="text-3xl font-bold text-white">{currentFeatured.totalVolume} ETH</div>
              <div className="text-sm text-[#666666]">Total Volume</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <div className="text-3xl font-bold text-white">{currentFeatured.items.toLocaleString()}</div>
              <div className="text-sm text-[#666666]">Items</div>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex gap-2">
            {featuredCollections.map((_, index) => (
              <button
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === featuredCarouselIndex
                    ? 'w-8 bg-[#58a6ff]'
                    : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
                onClick={() => setFeaturedCarouselIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Collection Stats Bar */}
      <div className="border-b border-white/10 bg-[#141414]/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all">
              <div className="p-2 bg-[#58a6ff]/10 rounded-xl text-[#58a6ff]">
                <Flame size={20} />
              </div>
              <div>
                <div className="text-xs text-[#666666]">Floor Price</div>
                <div className="text-lg font-bold text-white">{collectionStats.floorPrice} ETH</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all">
              <div className="p-2 bg-[#58a6ff]/10 rounded-xl text-[#58a6ff]">
                <Activity size={20} />
              </div>
              <div>
                <div className="text-xs text-[#666666]">Volume 24h</div>
                <div className="text-lg font-bold text-white">{collectionStats.volume24h} ETH</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all">
              <div className="p-2 bg-[#58a6ff]/10 rounded-xl text-[#58a6ff]">
                <Grid size={20} />
              </div>
              <div>
                <div className="text-xs text-[#666666]">Total Items</div>
                <div className="text-lg font-bold text-white">{collectionStats.totalListings}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all">
              <div className="p-2 bg-[#58a6ff]/10 rounded-xl text-[#58a6ff]">
                <Users size={20} />
              </div>
              <div>
                <div className="text-xs text-[#666666]">Owners</div>
                <div className="text-lg font-bold text-white">{collectionStats.owners}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Connection Prompt */}
      {!web3State.isConnected && (
        <div className="bg-gradient-to-r from-[#58a6ff]/10 to-[#a371f7]/10 border-b border-[#58a6ff]/20">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-center gap-4">
            <Wallet size={20} className="text-[#58a6ff]" />
            <span className="text-white font-medium">Connect your wallet to buy, bid, and list NFTs</span>
            <Button
              onClick={handleConnectWallet}
              className="px-6 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8" id="main-content">

        {/* Filter Sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} w-80 flex-shrink-0 space-y-6`}>
          <div className="sticky top-4">
            <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Filter size={20} />
                  <h2>Filters</h2>
                </div>
                <button
                  className="p-2 hover:bg-[#1A1A1A] rounded-lg text-[#666666] hover:text-white transition-colors lg:hidden"
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-[#666666] mb-2">Search</label>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                  <Input
                    type="text"
                    placeholder="Search NFTs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0D0D0D] border border-white/10 rounded-xl text-white placeholder:text-[#666666] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none transition-colors"
                    aria-label="Search NFTs"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-[#666666] mb-2">Status</label>
                <div className="space-y-2">
                  {statusOptions.map(status => (
                    <button
                      key={status.value}
                      className={`w-full px-4 py-2 rounded-xl text-left font-medium transition-all ${
                        selectedStatus === status.value
                          ? 'bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30'
                          : 'bg-[#0D0D0D]/50 text-[#A0A0A0] border border-transparent hover:bg-[#1A1A1A]'
                      }`}
                      onClick={() => setSelectedStatus(status.value)}
                      aria-pressed={selectedStatus === status.value}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-[#666666] mb-2">Price Range (ETH)</label>
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[#0D0D0D] border border-white/10 rounded-xl text-white placeholder:text-[#666666] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none transition-colors"
                    aria-label="Minimum price"
                  />
                  <span className="text-[#666666]">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="flex-1 px-3 py-2 bg-[#0D0D0D] border border-white/10 rounded-xl text-white placeholder:text-[#666666] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none transition-colors"
                    aria-label="Maximum price"
                  />
                </div>
                <button
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  onClick={loadListings}
                >
                  Apply
                </button>
              </div>

              {/* Collections Multiselect */}
              <div>
                <label className="block text-sm font-medium text-[#666666] mb-2">Collections</label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableCollections.map(collection => (
                    <button
                      key={collection.id}
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between transition-all ${
                        selectedCollections.has(collection.id)
                          ? 'bg-[#58a6ff]/10 border border-[#58a6ff]/30'
                          : 'bg-[#0D0D0D]/50 border border-transparent hover:bg-[#1A1A1A]'
                      }`}
                      onClick={() => toggleCollection(collection.id)}
                      aria-pressed={selectedCollections.has(collection.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                          selectedCollections.has(collection.id)
                            ? 'bg-[#58a6ff] border-[#58a6ff]'
                            : 'border-white/10'
                        }`}>
                          {selectedCollections.has(collection.id) && <CheckCircle size={16} className="text-white" />}
                        </div>
                        <span className="text-white font-medium">{collection.name}</span>
                        {collection.verified && (
                          <CheckCircle size={14} className="text-[#58a6ff]" />
                        )}
                      </div>
                      <span className="text-sm text-[#666666]">{collection.count.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chains */}
              <div>
                <label className="block text-sm font-medium text-[#666666] mb-2">Chains</label>
                <div className="space-y-2">
                  {chains.map(chain => (
                    <button
                      key={chain.id}
                      className={`w-full px-4 py-2 rounded-xl text-left flex items-center gap-2 font-medium transition-all ${
                        selectedChain === chain.id
                          ? 'bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30'
                          : 'bg-[#0D0D0D]/50 text-[#A0A0A0] border border-transparent hover:bg-[#1A1A1A]'
                      }`}
                      onClick={() => setSelectedChain(chain.id)}
                      aria-pressed={selectedChain === chain.id}
                    >
                      <span>{chain.icon}</span>
                      <span>{chain.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-[#666666] mb-2">Categories</label>
                <div className="space-y-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      className={`w-full px-4 py-2 rounded-xl text-left flex items-center gap-2 font-medium transition-all ${
                        selectedCategory === category.id
                          ? 'bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30'
                          : 'bg-[#0D0D0D]/50 text-[#A0A0A0] border border-transparent hover:bg-[#1A1A1A]'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                      aria-pressed={selectedCategory === category.id}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Properties - Placeholder */}
              <div>
                <label className="block text-sm font-medium text-[#666666] mb-2">Properties</label>
                <div className="flex items-center justify-center gap-2 py-8 text-[#666666]">
                  <Clock size={16} />
                  <span className="text-sm">Coming Soon</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* NFT Grid Section */}
        <main className="flex-1 min-w-0">

          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-6 bg-[#141414]/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <button
                className="flex items-center gap-2 px-4 py-2 bg-[#0D0D0D] border border-white/10 rounded-xl text-white hover:bg-[#1A1A1A] transition-colors"
                onClick={() => setShowFilters(!showFilters)}
                aria-label="Toggle filters"
              >
                <Filter size={20} />
                <span className="hidden sm:inline">{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
              <div className="text-sm text-[#666666]">
                <span className="font-semibold text-white">{filteredListings.length}</span> {filteredListings.length === 1 ? 'item' : 'items'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative flex items-center gap-2 px-4 py-2 bg-[#0D0D0D] border border-white/10 rounded-xl">
                <ArrowUpDown size={18} className="text-[#666666]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none pr-6 cursor-pointer appearance-none"
                  aria-label="Sort NFTs"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-[#141414]">
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3 text-[#666666] pointer-events-none" />
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 bg-[#0D0D0D] border border-white/10 rounded-xl">
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#58a6ff]/10 text-[#58a6ff]'
                      : 'text-[#666666] hover:text-white'
                  }`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid size={18} />
                </button>
                <button
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#58a6ff]/10 text-[#58a6ff]'
                      : 'text-[#666666] hover:text-white'
                  }`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden ">
                  <div className="aspect-square bg-[#1A1A1A]" />
                  <div className="p-4 space-y-3">
                    <SkeletonBox width="w-3/4" height="h-4" className="mb-2" />
                    <SkeletonBox width="w-1/2" height="h-3" className="mb-4" />
                    <div className="flex justify-between items-center">
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-white mb-2">Failed to Load NFTs</h3>
              <p className="text-[#666666] mb-6 max-w-md">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
              <Button
                onClick={loadListings}
                className="px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-2xl font-semibold hover:opacity-90 transition-opacity"
                aria-label="Retry loading NFTs"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredListings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag size={64} strokeWidth={1} className="text-[#666666] mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No NFTs Found</h3>
              <p className="text-[#666666] max-w-md">Try adjusting your filters or search terms</p>
            </div>
          )}

          {/* NFT Grid */}
          {!loading && !error && filteredListings.length > 0 && (
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              {filteredListings.map((nft) => {
                const isFavorited = favorites.has(nft.id)
                const hasAuction = nft.auctionEndTime
                const priceInETH = nft.price || 0
                const priceInUSD = (priceInETH * 2400).toFixed(2)
                const rarityScore = Math.floor(Math.random() * 100) + 1

                return (
                  <div
                    key={nft.id}
                    className="group bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all overflow-hidden cursor-pointer"
                  >
                    {/* NFT Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={nft.image || 'https://via.placeholder.com/400'}
                        alt={nft.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <button className="px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-colors">
                          Quick View
                        </button>
                      </div>

                      {/* Favorite Button */}
                      <button
                        className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-xl transition-all ${
                          isFavorited
                            ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                            : 'bg-[#141414]/60 border border-white/10 text-white hover:bg-[#141414]/80'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(nft.id)
                        }}
                        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                        aria-pressed={isFavorited}
                      >
                        <Heart
                          size={18}
                          fill={isFavorited ? 'currentColor' : 'none'}
                        />
                      </button>

                      {/* Rarity Badge */}
                      {rarityScore > 80 && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] rounded-xl flex items-center gap-1.5 text-white text-xs font-bold backdrop-blur-xl">
                          <Sparkles size={14} />
                          Legendary
                        </div>
                      )}
                      {rarityScore > 60 && rarityScore <= 80 && (
                        <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-[#a371f7] to-[#8b5cf6] rounded-xl text-white text-xs font-bold backdrop-blur-xl">
                          Rare
                        </div>
                      )}
                    </div>

                    {/* NFT Info */}
                    <div className="p-4 space-y-3">
                      {/* Collection Badge */}
                      <div className="flex items-center gap-1.5 text-xs text-[#666666]">
                        <span className="font-medium">
                          {nft.collection || 'Unknown Collection'}
                        </span>
                        <CheckCircle size={12} className="text-[#58a6ff]" />
                      </div>

                      <h3 className="text-white font-bold text-lg truncate">{nft.name}</h3>

                      {nft.tokenId && (
                        <p className="text-xs text-[#666666]">#{nft.tokenId}</p>
                      )}

                      {/* Price Section */}
                      <div className="flex items-end justify-between pt-2 border-t border-white/10">
                        <div>
                          <span className="text-xs text-[#666666] block mb-1">
                            {hasAuction ? 'Current Bid' : 'Price'}
                          </span>
                          <div className="space-y-0.5">
                            <div className="text-white font-bold text-base">{priceInETH} ETH</div>
                            <div className="text-[#666666] text-xs">${priceInUSD}</div>
                          </div>
                        </div>

                        {/* Rarity Score */}
                        {rarityScore && (
                          <div className="px-2 py-1 bg-[#58a6ff]/10 text-[#58a6ff] rounded-lg flex items-center gap-1 text-xs font-medium">
                            <TrendingUp size={12} />
                            <span>{rarityScore}%</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2">
                        {hasAuction ? (
                          <button
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            onClick={() => handlePlaceBid(nft)}
                          >
                            <DollarSign size={16} />
                            Place Bid
                          </button>
                        ) : (
                          <button
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            onClick={() => handlePurchase(nft)}
                          >
                            <ShoppingBag size={16} />
                            Buy Now
                          </button>
                        )}
                      </div>

                      {/* Auction Timer */}
                      {hasAuction && (
                        <div className="flex items-center gap-2 text-xs text-[#666666] pt-1">
                          <Clock size={14} />
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
