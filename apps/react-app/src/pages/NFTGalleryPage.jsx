import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Image, Grid, List, Filter, Search, ExternalLink, Heart } from 'lucide-react'
import { PageSkeleton } from '../components/LoadingSkeleton'

export default function NFTGalleryPage() {
  const [nfts, setNfts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [filterBy, setFilterBy] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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
  return (
    <div role="main" aria-label="NFT gallery page" className="min-h-screen bg-[#0d1117] pt-20">
      <div className="max-w-7xl mx-auto px-3 md:px-5 py-6 md:py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 md:mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2 md:mb-3">
              My NFT Gallery
            </h1>
            <p className="text-sm md:text-base text-[#8b949e] leading-relaxed">
              View and manage your digital collectibles
            </p>
          </div>

          <Link
            to="/nft-marketplace"
            className="inline-flex items-center gap-2 px-4 py-2.5 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-xl text-sm md:text-base font-semibold shadow-lg shadow-[#58a6ff]/40 hover:-translate-y-0.5 transition-transform"
            aria-label="Browse marketplace"
          >
            Browse Marketplace
            <ExternalLink size={18} />
          </Link>
        </div>

        {/* Controls */}
        <div className="flex gap-3 md:gap-4 mb-6 md:mb-8 flex-wrap items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px] md:min-w-[300px] relative">
            <Search
              size={20}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b949e]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NFTs..."
              className="w-full pl-11 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-[#161b22]/60 text-[#c9d1d9] focus:border-[#58a6ff] focus:outline-none transition-colors"
              aria-label="Search NFTs"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2 items-center">
            <Filter size={18} className="text-[#8b949e]" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-[#161b22]/60 text-[#c9d1d9] font-medium cursor-pointer focus:outline-none"
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
          <div className="flex gap-1 bg-[#21262d]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-1 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 md:p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e] hover:bg-[#161b22]/60 backdrop-blur-xl'}`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 md:p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e] hover:bg-[#161b22]/60 backdrop-blur-xl'}`}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-8 md:mb-10">
          {[
            { label: 'Total NFTs', value: filteredNFTs.length, color: 'text-[#58a6ff]' },
            { label: 'Collections', value: new Set(filteredNFTs.map(n => n.collection)).size, color: 'text-[#a371f7]' },
            { label: 'Total Value', value: '$12,450', color: 'text-emerald-500' }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-5"
            >
              <div className="text-sm text-[#8b949e] mb-2 font-medium">
                {stat.label}
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <PageSkeleton type="grid" />
        ) : filteredNFTs.length === 0 ? (
          <div className="text-center py-16 md:py-20 px-5 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <Image size={64} className="text-[#8b949e] mx-auto mb-5" />
            <h3 className="text-lg md:text-xl font-semibold text-white mb-3">
              No NFTs Found
            </h3>
            <p className="text-sm md:text-base text-[#8b949e] mb-6 leading-relaxed">
              {searchQuery ? 'Try adjusting your search or filters' : 'Start collecting NFTs to see them here'}
            </p>
            <Link
              to="/nft-marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-xl text-sm md:text-base font-semibold shadow-lg shadow-[#58a6ff]/40"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredNFTs.map((nft, index) => (
                  <NFTCard key={nft.id || index} nft={nft} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
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


