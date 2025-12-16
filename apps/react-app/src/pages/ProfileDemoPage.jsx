import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, MessageSquare, Star, Trophy, Calendar, MapPin,
  Link as LinkIcon, Mail, UserPlus, Image,
  Wallet, Copy, CheckCircle, ExternalLink, Grid3x3, Activity, X,
  ArrowRight, Palette, Sparkles, Zap, Crown, Shield
} from 'lucide-react'
import { Button, Input } from '../components/ui'

export default function ProfileDemoPage() {
  const [activeProfile, setActiveProfile] = useState('web3')
  const [activeTab, setActiveTab] = useState('nfts')

  // Demo user profiles
  const profiles = {
    web3: {
      id: 'web3_creator',
      username: 'web3creator',
      displayName: 'Web3 Creator',
      bio: 'NFT artist and blockchain enthusiast. Creating the future of digital art one piece at a time.',
      avatar: null,
      banner: null,
      location: 'Metaverse',
      website: 'https://nftgallery.example.com',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      ensName: 'web3creator.eth',
      joinedAt: '2023-01-15T00:00:00Z',
      karma: 85420,
      followerCount: 5840,
      followingCount: 1230,
      nftCount: 42,
      stats: {
        totalPosts: 287,
        totalComments: 1542,
        totalAwards: 68
      },
      badges: [
        { id: 'verified', name: 'Verified Creator', icon: 'shield' },
        { id: 'premium', name: 'Premium Member', icon: 'crown' },
        { id: 'artist', name: 'NFT Artist', icon: 'star' }
      ],
      nfts: [
        { id: '1', name: 'Cosmic Dream #001', collection: 'Cosmic Dreams', price: '5.5 ETH', rarity: 'legendary', color: 'from-purple-500 to-pink-500' },
        { id: '2', name: 'Digital Sunset #042', collection: 'Digital Landscapes', price: '3.2 ETH', rarity: 'epic', color: 'from-orange-500 to-red-500' },
        { id: '3', name: 'Abstract Mind #123', collection: 'Abstract Collection', price: '2.8 ETH', rarity: 'rare', color: 'from-[#58a6ff] to-cyan-500' },
        { id: '4', name: 'Neon City #056', collection: 'Cyberpunk Series', price: '4.1 ETH', rarity: 'epic', color: 'from-pink-500 to-[#a371f7]' },
        { id: '5', name: 'Ocean Depths #089', collection: 'Nature NFTs', price: '2.5 ETH', rarity: 'rare', color: 'from-teal-500 to-blue-500' },
        { id: '6', name: 'Galaxy Portal #007', collection: 'Space Odyssey', price: '6.8 ETH', rarity: 'legendary', color: 'from-[#58a6ff] to-[#a371f7]' }
      ]
    },
    influencer: {
      id: 'crypto_influencer',
      username: 'cryptoinfluencer',
      displayName: 'Crypto Influencer',
      bio: 'Sharing insights about DeFi, NFTs, and the future of finance. Join me on this decentralized journey!',
      avatar: null,
      banner: null,
      location: 'San Francisco, CA',
      website: 'https://cryptoblog.example.com',
      walletAddress: '0x9Bda14829a832C47c9f8e73Bc9c84E9a25f3D7c',
      ensName: 'cryptoinfluencer.eth',
      joinedAt: '2022-06-10T00:00:00Z',
      karma: 124580,
      followerCount: 12450,
      followingCount: 890,
      nftCount: 28,
      stats: {
        totalPosts: 542,
        totalComments: 3280,
        totalAwards: 156
      },
      badges: [
        { id: 'verified', name: 'Verified User', icon: 'shield' },
        { id: 'influencer', name: 'Top Influencer', icon: 'star' },
        { id: 'mentor', name: 'Community Mentor', icon: 'users' }
      ],
      nfts: [
        { id: '1', name: 'CryptoPunk #7804', collection: 'CryptoPunks', price: '4500 ETH', rarity: 'legendary', color: 'from-purple-500 to-pink-500' },
        { id: '2', name: 'Bored Ape #3749', collection: 'BAYC', price: '89 ETH', rarity: 'rare', color: 'from-yellow-500 to-orange-500' },
        { id: '3', name: 'Azuki #9045', collection: 'Azuki', price: '12 ETH', rarity: 'epic', color: 'from-red-500 to-pink-500' }
      ]
    },
    collector: {
      id: 'nft_collector',
      username: 'nftcollector',
      displayName: 'NFT Collector',
      bio: 'Passionate NFT collector and community builder. Curating the finest digital art collection in the metaverse.',
      avatar: null,
      banner: null,
      location: 'Dubai, UAE',
      website: 'https://collection.example.com',
      walletAddress: '0x3f8C1E42b6E891A4c9a742D8F5e3B9c7A28f6E1',
      ensName: 'collector.eth',
      joinedAt: '2023-03-20T00:00:00Z',
      karma: 67230,
      followerCount: 8920,
      followingCount: 2150,
      nftCount: 156,
      stats: {
        totalPosts: 198,
        totalComments: 956,
        totalAwards: 42
      },
      badges: [
        { id: 'collector', name: 'Master Collector', icon: 'crown' },
        { id: 'whale', name: 'Crypto Whale', icon: 'star' },
        { id: 'verified', name: 'Verified User', icon: 'shield' }
      ],
      nfts: [
        { id: '1', name: 'Doodle #2847', collection: 'Doodles', price: '8.5 ETH', rarity: 'rare', color: 'from-[#58a6ff] to-cyan-500' },
        { id: '2', name: 'Clone X #1523', collection: 'Clone X', price: '15 ETH', rarity: 'epic', color: 'from-green-500 to-teal-500' },
        { id: '3', name: 'Moonbird #4821', collection: 'Moonbirds', price: '11 ETH', rarity: 'rare', color: 'from-[#58a6ff] to-[#a371f7]' },
        { id: '4', name: 'Art Blocks #892', collection: 'Art Blocks', price: '7.2 ETH', rarity: 'epic', color: 'from-pink-500 to-red-500' },
        { id: '5', name: 'Pudgy #5621', collection: 'Pudgy Penguins', price: '4.8 ETH', rarity: 'rare', color: 'from-cyan-500 to-blue-500' },
        { id: '6', name: 'MAYC #3892', collection: 'MAYC', price: '22 ETH', rarity: 'epic', color: 'from-yellow-500 to-orange-500' }
      ]
    }
  }

  const currentProfile = profiles[activeProfile]

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 via-orange-500 to-red-500'
      case 'epic': return 'from-purple-400 via-pink-500 to-red-500'
      case 'rare': return 'from-blue-400 via-cyan-500 to-teal-500'
      default: return 'from-gray-400 via-gray-500 to-gray-600'
    }
  }

  const getBadgeIcon = (iconName) => {
    switch (iconName) {
      case 'shield': return Shield
      case 'crown': return Crown
      case 'star': return Star
      case 'users': return Users
      default: return Trophy
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" role="main" aria-label="Profile demo page">
      {/* Profile Switcher */}
      <div className="card /50 backdrop-blur border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center gap-3 overflow-x-auto">
            <span className="text-slate-400 text-sm font-medium whitespace-nowrap">View Profile:</span>
            <button
              onClick={() => setActiveProfile('web3')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeProfile === 'web3'
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                  : 'bg-[#21262d]/50 text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              Web3 Creator
            </button>
            <button
              onClick={() => setActiveProfile('influencer')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeProfile === 'influencer'
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                  : 'bg-[#21262d]/50 text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              Crypto Influencer
            </button>
            <button
              onClick={() => setActiveProfile('collector')}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeProfile === 'collector'
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                  : 'bg-[#21262d]/50 text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              NFT Collector
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Profile Header */}
        <div className="card /50 backdrop-blur border border-slate-800/50 rounded-2xl  overflow-hidden mb-8">
          {/* Banner */}
          <div className="h-48 bg-gradient-to-r from-[#58a6ff] via-purple-600 to-pink-600 relative">
            <div style={{background: "var(--bg-primary)"}} className="absolute inset-0 /20"></div>
          </div>

          {/* Profile Info */}
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 -mt-20 md:-mt-16">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div style={{color: "var(--text-primary)"}} className="w-32 h-32 bg-gradient-to-br from-[#58a6ff] via-purple-600 to-pink-600 rounded-2xl border-4 border-slate-900 flex items-center justify-center  font-bold text-4xl shadow-2xl">
                  {currentProfile.displayName[0]}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 mt-16 md:mt-0">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div>
                    <h1 style={{color: "var(--text-primary)"}} className="text-3xl font-bold  mb-2">{currentProfile.displayName}</h1>
                    <p className="text-slate-400">@{currentProfile.username}</p>
                  </div>
                  <Button style={{color: "var(--text-primary)"}} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  hover:shadow-lg hover:shadow-blue-500/25">
                    <UserPlus style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    Follow
                  </Button>
                </div>

                <p className="text-slate-300 mb-4">{currentProfile.bio}</p>

                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  {currentProfile.location && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      <span>{currentProfile.location}</span>
                    </div>
                  )}
                  {currentProfile.website && (
                    <a href={currentProfile.website} className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
                      <LinkIcon style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      <span>{currentProfile.website}</span>
                    </a>
                  )}
                  {currentProfile.ensName && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Wallet style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      <span>{currentProfile.ensName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    <span>Joined {new Date(currentProfile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">{currentProfile.followerCount.toLocaleString()}</span>
                    <span className="text-slate-400">Followers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">{currentProfile.followingCount.toLocaleString()}</span>
                    <span className="text-slate-400">Following</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">{currentProfile.karma.toLocaleString()}</span>
                    <span className="text-slate-400">Karma</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    <span style={{color: "var(--text-primary)"}} className=" font-semibold">{currentProfile.nftCount}</span>
                    <span className="text-slate-400">NFTs</span>
                  </div>
                </div>

                {/* Badges */}
                {currentProfile.badges && currentProfile.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {currentProfile.badges.map((badge) => {
                      const BadgeIcon = getBadgeIcon(badge.icon)
                      return (
                        <div
                          key={badge.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700/50 rounded-lg text-sm"
                        >
                          <BadgeIcon style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                          <span className="text-blue-300">{badge.name}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card /50 backdrop-blur border border-slate-800/50 rounded-2xl  p-4 mb-8">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('nfts')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'nfts'
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                  : 'bg-[#21262d]/50 text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Grid3x3 style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              NFT Collection
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'activity'
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                  : 'bg-[#21262d]/50 text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Activity style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              Activity
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'wallet'
                  ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white'
                  : 'bg-[#21262d]/50 text-slate-400 hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Wallet style={{ width: "24px", height: "24px", flexShrink: 0 }} />
              Wallet
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'nfts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProfile.nfts.map((nft) => (
              <div
                key={nft.id}
                className="card /50 backdrop-blur border border-slate-800/50 rounded-2xl  overflow-hidden hover:border-slate-700/50 transition-all group cursor-pointer"
              >
                <div className={`aspect-square bg-gradient-to-br ${nft.color} relative`}>
                  <div style={{background: "var(--bg-primary)"}} className="absolute inset-0 bg-black/30 group-hover:/10 transition-all"></div>
                  <div className="absolute top-3 right-3">
                    <div className={`px-2 py-1 text-xs rounded-lg font-medium backdrop-blur ${
                      nft.rarity === 'legendary' ? 'bg-yellow-900/80 text-yellow-300 border border-yellow-700/50' :
                      nft.rarity === 'epic' ? 'bg-purple-900/80 text-purple-300 border border-purple-700/50' :
                      'bg-blue-900/80 text-blue-300 border border-blue-700/50'
                    }`}>
                      {nft.rarity}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 style={{color: "var(--text-primary)"}} className=" font-semibold mb-1 group-hover:text-blue-400 transition-colors">{nft.name}</h3>
                  <p className="text-slate-400 text-sm mb-3">{nft.collection}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                      <span style={{color: "var(--text-primary)"}} className=" font-semibold">{nft.price}</span>
                    </div>
                    <button className="p-2 hover:bg-[#21262d] rounded-lg transition-colors">
                      <ExternalLink style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="card /50 backdrop-blur border border-slate-800/50 rounded-2xl  p-8">
            <div className="space-y-6">
              {[
                { type: 'post', action: 'Created a new post', time: '2 hours ago', icon: MessageSquare },
                { type: 'like', action: 'Liked a community post', time: '5 hours ago', icon: Star },
                { type: 'nft', action: 'Purchased new NFT', time: '1 day ago', icon: Image },
                { type: 'comment', action: 'Commented on discussion', time: '2 days ago', icon: MessageSquare },
                { type: 'follow', action: 'Started following @creator', time: '3 days ago', icon: Users }
              ].map((activity, index) => {
                const ActivityIcon = activity.icon
                return (
                  <div key={index} className="flex items-start gap-4 pb-6 border-b border-slate-800/50 last:border-0">
                    <div style={{ width: "48px", height: "48px", flexShrink: 0 }}>
                      <ActivityIcon style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} />
                    </div>
                    <div className="flex-1">
                      <p style={{color: "var(--text-primary)"}} className=" mb-1">{activity.action}</p>
                      <p className="text-slate-400 text-sm">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card /50 backdrop-blur border border-slate-800/50 rounded-2xl  p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 style={{color: "var(--text-primary)"}} className="text-xl font-bold ">Wallet Address</h3>
                <button className="p-2 hover:bg-[#21262d] rounded-lg transition-colors">
                  <Copy style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                </button>
              </div>
              <div className="bg-[#21262d]/50 border border-slate-700/50 rounded-lg p-4 mb-4">
                <p className="text-slate-300 text-sm font-mono break-all">{currentProfile.walletAddress}</p>
              </div>
              {currentProfile.ensName && (
                <div className="flex items-center gap-2 text-blue-400">
                  <CheckCircle style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  <span className="font-medium">{currentProfile.ensName}</span>
                </div>
              )}
            </div>

            <div className="card /50 backdrop-blur border border-slate-800/50 rounded-2xl  p-6">
              <h3 style={{color: "var(--text-primary)"}} className="text-xl font-bold  mb-6">Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Posts</span>
                  <span style={{color: "var(--text-primary)"}} className=" font-semibold">{currentProfile.stats.totalPosts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Comments</span>
                  <span style={{color: "var(--text-primary)"}} className=" font-semibold">{currentProfile.stats.totalComments.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Awards Received</span>
                  <span style={{color: "var(--text-primary)"}} className=" font-semibold">{currentProfile.stats.totalAwards}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


