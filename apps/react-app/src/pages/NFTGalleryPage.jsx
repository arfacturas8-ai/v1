import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Image, Grid, List, Filter, Search, ExternalLink, Heart } from 'lucide-react'
import { PageSkeleton } from '../components/LoadingSkeleton'

// NFT Card Component
const NFTCard = ({ nft }) => {
  const [liked, setLiked] = useState(false)

  return (
    <Link
      to={`/nft/${nft.id}`}
      className="group block"
      style={{ textDecoration: 'none' }}
    >
      <div
        className="overflow-hidden transition-all rounded-2xl border"
        style={{
          borderColor: 'var(--border-primary)',
          backgroundColor: 'var(--bg-secondary)',
          minHeight: '280px'
        }}
      >
        {/* Image */}
        <div className="relative overflow-hidden aspect-square bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          {nft.image ? (
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image size={48} style={{ color: 'var(--text-tertiary)' }} />
            </div>
          )}
          {/* Like Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setLiked(!liked)
            }}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-all"
            style={{
              backgroundColor: liked ? 'rgba(239, 68, 68, 0.9)' : 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={24}
              fill={liked ? 'white' : 'none'}
              style={{ color: liked ? 'white' : 'white' }}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3
            className="font-semibold mb-1 truncate"
            style={{ color: 'var(--text-primary)', fontSize: '16px' }}
          >
            {nft.name}
          </h3>
          <p
            className="text-sm mb-3 truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {nft.collection}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Price</div>
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {nft.price || '—'}
              </div>
            </div>
            {nft.rarity && (
              <div
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(88, 166, 255, 0.1)',
                  color: '#58a6ff'
                }}
              >
                {nft.rarity}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// NFT List Item Component
const NFTListItem = ({ nft }) => {
  const [liked, setLiked] = useState(false)

  return (
    <Link
      to={`/nft/${nft.id}`}
      className="group block"
      style={{ textDecoration: 'none' }}
    >
      <div
        className="flex gap-4 p-4 rounded-2xl border transition-all hover:shadow-lg"
        style={{
          borderColor: 'var(--border-primary)',
          backgroundColor: 'var(--bg-secondary)',
          minHeight: '100px'
        }}
      >
        {/* Image */}
        <div
          className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"
          style={{ flexShrink: 0 }}
        >
          {nft.image ? (
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image size={48} style={{ color: 'var(--text-tertiary)' }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold mb-1 truncate"
            style={{ color: 'var(--text-primary)', fontSize: '16px' }}
          >
            {nft.name}
          </h3>
          <p
            className="text-sm mb-2 truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {nft.collection}
          </p>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Price</div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {nft.price || '—'}
              </div>
            </div>
            {nft.rarity && (
              <div
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: 'rgba(88, 166, 255, 0.1)',
                  color: '#58a6ff'
                }}
              >
                {nft.rarity}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault()
              setLiked(!liked)
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all flex-shrink-0"
            style={{
              backgroundColor: liked ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              flexShrink: 0
            }}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <Heart
              size={24}
              fill={liked ? '#ef4444' : 'none'}
              style={{ color: liked ? '#ef4444' : 'var(--text-secondary)' }}
            />
          </button>
        </div>
      </div>
    </Link>
  )
}

export default function NFTGalleryPage() {
  const [nfts, setNfts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [filterBy, setFilterBy] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Standard responsive values
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  const pagePadding = isDesktop ? '80px' : isTablet ? '24px' : '16px'
  const headerPaddingTop = isDesktop || isTablet ? '72px' : '56px'

  useEffect(() => {
    fetchNFTs()
  }, [filterBy])

  const fetchNFTs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/nfts/gallery?filter=${filterBy}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setNfts(data.nfts || [])
      }
    } catch (error) {
      console.error('NFT fetch error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredNFTs = nfts.filter(nft =>
    nft.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    nft.collection?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return <PageSkeleton />
  }

  return (
    <div
      role="main"
      aria-label="NFT gallery page"
      style={{
        background: 'var(--bg-primary)',
        paddingTop: headerPaddingTop,
        paddingLeft: pagePadding,
        paddingRight: pagePadding,
        paddingBottom: '48px',
        minHeight: '100vh'
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="flex justify-between items-start flex-wrap gap-4" style={{ marginBottom: '48px' }}>
          <div>
            <h1
              className="font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent"
              style={{ fontSize: isMobile ? '28px' : '32px', marginBottom: '16px' }}
            >
              My NFT Gallery
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              View and manage your digital collectibles
            </p>
          </div>

          <Link
            to="/nft-marketplace"
            className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-lg transition-transform hover:-translate-y-0.5"
            style={{
              height: '48px',
              paddingLeft: '24px',
              paddingRight: '24px',
              background: 'linear-gradient(to right, #58a6ff, #a371f7)',
              color: 'var(--text-inverse)',
              fontSize: '16px',
              textDecoration: 'none',
              boxShadow: '0 0 20px rgba(88, 166, 255, 0.4)'
            }}
            aria-label="Browse marketplace"
          >
            Browse Marketplace
            <div style={{ width: '24px', height: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ExternalLink size={24} />
            </div>
          </Link>
        </div>

        {/* Controls */}
        <div className="flex gap-4 flex-wrap items-center" style={{ marginBottom: '32px' }}>
          {/* Search */}
          <div className="flex-1" style={{ minWidth: isMobile ? '200px' : '300px', position: 'relative' }}>
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                flexShrink: 0,
                pointerEvents: 'none'
              }}
            >
              <Search size={24} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NFTs..."
              className="w-full outline-none transition-all"
              style={{
                height: '48px',
                paddingLeft: '48px',
                paddingRight: '16px',
                fontSize: '16px',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(88, 166, 255, 0.5)'
                e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)'
                e.target.style.boxShadow = 'none'
              }}
              aria-label="Search NFTs"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2 items-center">
            <div style={{ width: '24px', height: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Filter size={24} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="outline-none cursor-pointer"
              style={{
                height: '48px',
                paddingLeft: '16px',
                paddingRight: '16px',
                fontSize: '16px',
                fontWeight: '500',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              aria-label="Filter NFTs"
            >
              <option value="all">All NFTs</option>
              <option value="art">Art</option>
              <option value="collectibles">Collectibles</option>
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
              <option value="photography">Photography</option>
            </select>
          </div>

          {/* View mode */}
          <div
            className="flex gap-1 rounded-2xl p-1"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)'
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className="transition-all rounded-lg"
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: viewMode === 'grid' ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
                color: viewMode === 'grid' ? '#58a6ff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid size={24} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="transition-all rounded-lg"
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: viewMode === 'list' ? 'rgba(88, 166, 255, 0.2)' : 'transparent',
                color: viewMode === 'list' ? '#58a6ff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List size={24} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: '24px', marginBottom: '48px' }}
        >
          {[
            { label: 'Total NFTs', value: filteredNFTs.length, color: '#58a6ff' },
            { label: 'Collections', value: new Set(filteredNFTs.map(n => n.collection)).size, color: '#a371f7' },
            { label: 'Total Value', value: '$12,450', color: '#10b981' }
          ].map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl"
              style={{
                border: '1px solid var(--border-primary)',
                backgroundColor: 'var(--bg-secondary)',
                padding: '24px',
                minHeight: '100px'
              }}
            >
              <div
                className="mb-2 font-medium"
                style={{ color: 'var(--text-secondary)', fontSize: '14px' }}
              >
                {stat.label}
              </div>
              <div
                className="font-bold"
                style={{ fontSize: isMobile ? '24px' : '28px', color: stat.color }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        {filteredNFTs.length === 0 ? (
          <div
            className="text-center rounded-2xl"
            style={{
              border: '1px solid var(--border-primary)',
              backgroundColor: 'var(--bg-secondary)',
              padding: isMobile ? '64px 24px' : '80px 24px'
            }}
          >
            <div
              className="mx-auto flex items-center justify-center"
              style={{ width: '64px', height: '64px', marginBottom: '24px' }}
            >
              <Image size={48} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h3
              className="font-semibold mb-3"
              style={{ fontSize: isMobile ? '18px' : '20px', color: 'var(--text-primary)' }}
            >
              No NFTs Found
            </h3>
            <p
              className="mb-6"
              style={{ fontSize: '16px', color: 'var(--text-secondary)' }}
            >
              {searchQuery ? 'Try adjusting your search or filters' : 'Start collecting NFTs to see them here'}
            </p>
            <Link
              to="/nft-marketplace"
              className="inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-lg"
              style={{
                height: '48px',
                paddingLeft: '24px',
                paddingRight: '24px',
                background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                color: 'var(--text-inverse)',
                fontSize: '16px',
                textDecoration: 'none',
                boxShadow: '0 0 20px rgba(88, 166, 255, 0.4)'
              }}
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                style={{ gap: '24px' }}
              >
                {filteredNFTs.map((nft, index) => (
                  <NFTCard key={nft.id || index} nft={nft} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col" style={{ gap: '24px' }}>
                {filteredNFTs.map((nft, index) => (
                  <NFTListItem key={nft.id || index} nft={nft} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
