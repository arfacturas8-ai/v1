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
    <div role="main" aria-label="NFT gallery page" style={{background: "var(--bg-primary)"}} className="min-h-screen  pt-20">
      <div className="max-w-7xl mx-auto px-3 md:px-5 py-6 md:py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 md:mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2 md:mb-3">
              My NFT Gallery
            </h1>
            <p style={{color: "var(--text-secondary)"}} className="text-sm md:text-base  leading-relaxed">
              View and manage your digital collectibles
            </p>
          </div>

          <Link
            to="/nft-marketplace"
            style={{color: "var(--text-primary)"}} className="inline-flex items-center gap-2 px-4 py-2.5 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl text-sm md:text-base font-semibold shadow-lg shadow-[#58a6ff]/40 hover:-translate-y-0.5 transition-transform"
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
              style={{color: "var(--text-secondary)"}} className="absolute left-3.5 top-1/2 -translate-y-1/2 "
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search NFTs..."
              style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="card w-full pl-11 pr-3 md:pr-4 py-2.5 md:py-3 text-sm md:text-base border  rounded-2xl    focus:border-[#58a6ff] focus:outline-none transition-colors"
              aria-label="Search NFTs"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2 items-center">
            <Filter size={18} style={{color: "var(--text-secondary)"}} className="" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              style={{color: "var(--text-primary)"}} style={{borderColor: "var(--border-subtle)"}} className="card px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base border  rounded-2xl    font-medium cursor-pointer focus:outline-none"
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
          <div style={{borderColor: "var(--border-subtle)"}} className="flex gap-1 bg-[#21262d]/60 rounded-2xl  p-1 border ">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 md:p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e] hover:bg-[#161b22]/60 '}`}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 md:p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e] hover:bg-[#161b22]/60 '}`}
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
              style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  p-4 md:p-5"
            >
              <div style={{color: "var(--text-secondary)"}} className="text-sm  mb-2 font-medium">
                {stat.label}
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        {!isLoading && filteredNFTs.length === 0 ? (
          <div style={{borderColor: "var(--border-subtle)"}} className="card text-center py-16 md:py-20 px-5   border  rounded-2xl ">
            <Image size={64} style={{color: "var(--text-secondary)"}} className=" mx-auto mb-5" />
            <h3 style={{color: "var(--text-primary)"}} className="text-lg md:text-xl font-semibold  mb-3">
              No NFTs Found
            </h3>
            <p style={{color: "var(--text-secondary)"}} className="text-sm md:text-base  mb-6 leading-relaxed">
              {searchQuery ? 'Try adjusting your search or filters' : 'Start collecting NFTs to see them here'}
            </p>
            <Link
              to="/nft-marketplace"
              style={{color: "var(--text-primary)"}} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl text-sm md:text-base font-semibold shadow-lg shadow-[#58a6ff]/40"
            >
              Browse Marketplace
            </Link>
          </div>
        ) : !isLoading ? (
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
        ) : null}
      </div>
    </div>
  )
}


