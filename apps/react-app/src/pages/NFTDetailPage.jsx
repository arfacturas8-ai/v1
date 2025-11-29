import React, { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Heart, Share2, ShoppingCart, Tag, Eye,
  Clock, TrendingUp, Users, ExternalLink, MoreVertical
} from 'lucide-react'

/**
 * NFTDetailPage Component
 * Detailed view of an NFT with metadata, history, and purchase options
 */
const NFTDetailPage = () => {
  const { nftId } = useParams()
  const navigate = useNavigate()
  const [isLiked, setIsLiked] = useState(false)
  const [activeTab, setActiveTab] = useState('details') // details, history, offers
  const [nftData, setNftData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadNFTData()
  }, [nftId])

  const loadNFTData = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setNftData({
        id: nftId,
        name: 'Cosmic Explorer #4721',
        collection: 'Cosmic Explorers',
        creator: 'ArtistDAO',
        owner: 'alice.eth',
        price: '2.5 ETH',
        priceUSD: '$4,250',
        image: 'https://picsum.photos/800/800?random=1',
        description: 'A unique digital collectible from the Cosmic Explorers collection. This NFT represents ownership of a one-of-a-kind piece of digital art.',
        attributes: [
          { trait_type: 'Background', value: 'Nebula', rarity: '12%' },
          { trait_type: 'Body', value: 'Cosmic', rarity: '8%' },
          { trait_type: 'Eyes', value: 'Laser', rarity: '5%' },
          { trait_type: 'Accessory', value: 'Crown', rarity: '3%' }
        ],
        stats: {
          views: 1234,
          likes: 456,
          offers: 12
        },
        contract: '0x1234...5678',
        tokenId: '4721',
        blockchain: 'Ethereum',
        royalty: '10%'
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = () => {
    alert('Purchase flow would start here')
  }

  const handleMakeOffer = () => {
    alert('Make offer modal would open here')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!nftData) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-white">NFT Not Found</h2>
          <button onClick={() => navigate('/nft-marketplace')} className="text-[#58a6ff] hover:underline">
            Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117]" role="main" aria-label="NFT detail page">
      {/* Header */}
      <div className="bg-[#161b22]/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[#21262d] rounded-lg text-[#c9d1d9] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{nftData.name}</h1>
            <p className="text-sm text-[#8b949e]">{nftData.collection}</p>
          </div>
          <button className="p-2 hover:bg-[#21262d] rounded-lg text-[#c9d1d9] transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-[#21262d] rounded-lg text-[#c9d1d9] transition-colors">
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
            <div className="aspect-square bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
              <img src={nftData.image} alt={nftData.name} className="w-full h-full object-cover" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-center">
                <Eye className="w-5 h-5 mx-auto mb-2 text-[#8b949e]" />
                <div className="text-xl font-bold text-white">{nftData.stats.views}</div>
                <div className="text-sm text-[#8b949e]">Views</div>
              </div>
              <div className="p-4 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-center">
                <Heart className="w-5 h-5 mx-auto mb-2 text-red-400" />
                <div className="text-xl font-bold text-white">{nftData.stats.likes}</div>
                <div className="text-sm text-[#8b949e]">Likes</div>
              </div>
              <div className="p-4 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-center">
                <Tag className="w-5 h-5 mx-auto mb-2 text-[#58a6ff]" />
                <div className="text-xl font-bold text-white">{nftData.stats.offers}</div>
                <div className="text-sm text-[#8b949e]">Offers</div>
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
            <div className="p-6 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm opacity-90">Current Price</div>
                  <div className="text-4xl font-bold">{nftData.price}</div>
                  <div className="text-sm opacity-90">{nftData.priceUSD}</div>
                </div>
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className="p-3 bg-[#161b22]/60 backdrop-blur-xl hover:bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-colors"
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handlePurchase}
                  className="py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Buy Now
                </button>
                <button
                  onClick={handleMakeOffer}
                  className="py-3 bg-[#161b22]/60 backdrop-blur-xl hover:bg-[#161b22]/60 backdrop-blur-xl backdrop-blur-sm rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold transition-colors"
                >
                  Make Offer
                </button>
              </div>
            </div>

            {/* Owner Info */}
            <div className="p-6 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-[#8b949e] mb-2">Creator</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-full" />
                    <div className="font-semibold text-white">{nftData.creator}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-[#8b949e] mb-2">Owner</div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#a371f7] to-[#58a6ff] rounded-full" />
                    <div className="font-semibold text-white">{nftData.owner}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="flex border-b border-white/10">
                {['details', 'attributes', 'history'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? 'bg-[#58a6ff]/10 text-[#58a6ff] border-b-2 border-[#58a6ff]'
                        : 'text-[#8b949e] hover:bg-[#21262d]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <p className="text-[#c9d1d9]">{nftData.description}</p>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <div className="text-sm text-[#8b949e] mb-1">Contract</div>
                        <div className="font-mono text-sm text-white flex items-center gap-2">
                          {nftData.contract}
                          <ExternalLink className="w-4 h-4 text-[#58a6ff]" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-[#8b949e] mb-1">Token ID</div>
                        <div className="font-mono text-sm text-white">{nftData.tokenId}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#8b949e] mb-1">Blockchain</div>
                        <div className="text-sm text-white">{nftData.blockchain}</div>
                      </div>
                      <div>
                        <div className="text-sm text-[#8b949e] mb-1">Royalty</div>
                        <div className="text-sm text-white">{nftData.royalty}</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attributes' && (
                  <div className="grid grid-cols-2 gap-4">
                    {nftData.attributes.map((attr, index) => (
                      <div key={index} className="p-4 bg-[#21262d]/50 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                        <div className="text-sm text-[#8b949e] mb-1">{attr.trait_type}</div>
                        <div className="font-semibold text-white mb-1">{attr.value}</div>
                        <div className="text-xs text-[#58a6ff]">{attr.rarity} have this trait</div>
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
                      <div key={index} className="flex items-center justify-between p-3 bg-[#21262d]/50 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            item.event === 'Sale' ? 'bg-green-400' :
                            item.event === 'Transfer' ? 'bg-[#58a6ff]' : 'bg-[#a371f7]'
                          }`} />
                          <div>
                            <div className="font-medium text-white">{item.event}</div>
                            <div className="text-sm text-[#8b949e]">
                              {item.from} → {item.to}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">{item.price}</div>
                          <div className="text-xs text-[#8b949e]">{item.time}</div>
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

export default memo(NFTDetailPage)

