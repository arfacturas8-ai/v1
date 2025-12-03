import React, { useState, useEffect, memo } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Heart, Share2, ShoppingCart, Tag, Eye,
  Clock, TrendingUp, Users, ExternalLink, MoreVertical
} from 'lucide-react'
import nftService from '../services/nftService'
import { useToast } from '../contexts/ToastContext'

/**
 * NFTDetailPage Component
 * Detailed view of an NFT with metadata, history, and purchase options
 */
const NFTDetailPage = () => {
  const { nftId } = useParams()
  const navigate = useNavigate()
  const { showSuccess, showError } = useToast()
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState('details') // details, history, offers
  const [nftData, setNftData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadNFTData()
  }, [nftId])

  const loadNFTData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await nftService.getNFTDetails(nftId)
      if (response.success && response.data) {
        setNftData(response.data)
      } else {
        throw new Error(response.error || 'Failed to load NFT details')
      }
    } catch (err) {
      console.error('Failed to load NFT:', err)
      const errorMsg = err.message || 'Failed to load NFT details. Please try again.'
      setError(errorMsg)
      showError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = async () => {
    try {
      // In a real app, this would integrate with Web3
      showSuccess('Purchase flow initiated')
      // await nftService.purchaseNFT(nftId)
    } catch (err) {
      console.error('Purchase failed:', err)
      showError('Purchase failed. Please try again.')
    }
  }

  const handleMakeOffer = async () => {
    try {
      // In a real app, this would open a modal for offer details
      showSuccess('Make offer modal would open')
      // Open offer modal
    } catch (err) {
      console.error('Make offer failed:', err)
      showError('Failed to make offer. Please try again.')
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: nftData?.name || 'NFT',
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        showSuccess('Link copied to clipboard')
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err)
        showError('Failed to share')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center" role="status" aria-live="polite">
        <div className="w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
        <span className="sr-only">Loading NFT details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-white">Failed to Load NFT</h2>
          <p className="text-[#666666] mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={loadNFTData}
              className="px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold hover:opacity-90 transition-opacity"
              aria-label="Retry loading NFT"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/nft-marketplace')}
              className="px-6 py-3 bg-[#141414]/60 backdrop-blur-xl text-[#58a6ff] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold hover:bg-[#141414]/80 transition-colors"
              aria-label="Back to marketplace"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!nftData) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2 text-white">NFT Not Found</h2>
          <p className="text-[#666666] mb-6">The NFT you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/nft-marketplace')}
            className="px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold hover:opacity-90 transition-opacity"
            aria-label="Back to marketplace"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D]" role="main" aria-label="NFT detail page">
      {/* Header */}
      <div className="bg-[#141414]/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#1A1A1A] rounded-lg text-[#A0A0A0] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{nftData.name}</h1>
            <p className="text-sm text-[#666666]">{nftData.collection}</p>
          </div>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-[#1A1A1A] rounded-lg text-[#A0A0A0] transition-colors"
            aria-label="Share NFT"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            className="p-2 hover:bg-[#1A1A1A] rounded-lg text-[#A0A0A0] transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="aspect-square bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all">
              <img src={nftData.image} alt={nftData.name} className="w-full h-full object-cover" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all text-center">
                <Eye className="w-5 h-5 mx-auto mb-2 text-[#666666]" />
                <div className="text-xl font-bold text-white">{nftData.stats.views}</div>
                <div className="text-sm text-[#666666]">Views</div>
              </div>
              <div className="p-4 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all text-center">
                <Heart className="w-5 h-5 mx-auto mb-2 text-red-400" />
                <div className="text-xl font-bold text-white">{nftData.stats.likes}</div>
                <div className="text-sm text-[#666666]">Likes</div>
              </div>
              <div className="p-4 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all text-center">
                <Tag className="w-5 h-5 mx-auto mb-2 text-[#58a6ff]" />
                <div className="text-xl font-bold text-white">{nftData.stats.offers}</div>
                <div className="text-sm text-[#666666]">Offers</div>
              </div>
            </div>
          </motion.div>

          {/* Right: Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Price Card */}
            <div className="p-6 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-[#666666] mb-2">Current Price</div>
                  <div className="text-4xl font-bold text-white mb-1">{nftData.price}</div>
                  <div className="text-base text-[#666666]">{nftData.priceUSD}</div>
                </div>
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-3 rounded-xl transition-all ${
                    isLiked
                      ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                      : 'bg-[#0D0D0D] border border-white/10 text-white hover:bg-[#1A1A1A]'
                  }`}
                  aria-label={isLiked ? 'Unlike NFT' : 'Like NFT'}
                  aria-pressed={isLiked}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePurchase}
                  className="py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white rounded-xl font-semibold transition-opacity flex items-center justify-center gap-2"
                  aria-label="Buy this NFT now"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Buy Now
                </button>
                <button
                  onClick={handleMakeOffer}
                  className="py-3 bg-[#0D0D0D] border border-white/10 hover:bg-[#1A1A1A] text-white rounded-xl font-semibold transition-colors"
                  aria-label="Make an offer for this NFT"
                >
                  Make Offer
                </button>
              </div>
            </div>

            {/* Owner Info */}
            <div className="p-6 bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-[#666666] mb-2">Creator</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full" />
                    <div className="font-semibold text-white">{nftData.creator}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#666666] mb-2">Owner</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#a371f7] to-[#58a6ff] rounded-full" />
                    <div className="font-semibold text-white">{nftData.owner}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="flex border-b border-white/10">
                {['details', 'attributes', 'history'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-[#58a6ff]/10 text-[#58a6ff] border-b-2 border-[#58a6ff]'
                        : 'text-[#666666] hover:bg-[#1A1A1A]'
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`${tab}-panel`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <p className="text-[#A0A0A0]">{nftData.description}</p>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <div className="text-sm text-[#666666] mb-1">Contract</div>
                        <div className="font-mono text-sm text-white flex items-center gap-2">
                          {nftData.contract}
                          <ExternalLink className="w-4 h-4 text-[#58a6ff]" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#666666] mb-1">Token ID</div>
                        <div className="font-mono text-sm text-white">{nftData.tokenId}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#666666] mb-1">Blockchain</div>
                        <div className="text-sm text-white">{nftData.blockchain}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#666666] mb-1">Royalty</div>
                        <div className="text-sm text-white">{nftData.royalty}</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attributes' && (
                  <div className="grid grid-cols-2 gap-4">
                    {nftData.attributes.map((attr, index) => (
                      <div key={index} className="p-4 bg-[#0D0D0D] border border-white/10 rounded-xl hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] transition-all">
                        <div className="text-xs text-[#666666] mb-2 uppercase tracking-wide">{attr.trait_type}</div>
                        <div className="font-bold text-white mb-2 text-base">{attr.value}</div>
                        <div className="text-xs text-[#58a6ff] bg-[#58a6ff]/10 px-2 py-1 rounded inline-block">{attr.rarity} have this trait</div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-3">
                    {[
                      { event: 'Sale', from: 'bob.eth', to: 'alice.eth', price: '2.5 ETH', time: '2 hours ago' },
                      { event: 'Transfer', from: 'charlie.eth', to: 'bob.eth', price: '-', time: '1 day ago' },
                      { event: 'Minted', from: 'Creator', to: 'charlie.eth', price: '0.5 ETH', time: '7 days ago' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-[#0D0D0D] border border-white/10 rounded-xl hover:border-[#58a6ff]/30 hover:bg-[#141414]/40 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full ${
                            item.event === 'Sale' ? 'bg-green-400' :
                            item.event === 'Transfer' ? 'bg-[#58a6ff]' : 'bg-[#a371f7]'
                          }`} />
                          <div>
                            <div className="font-semibold text-white mb-1">{item.event}</div>
                            <div className="text-sm text-[#666666]">
                              {item.from} → {item.to}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-white mb-1">{item.price}</div>
                          <div className="text-xs text-[#666666]">{item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

NFTDetailPage.propTypes = {}

export default memo(NFTDetailPage)

