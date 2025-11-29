import React, { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { Hash, TrendingUp, Users, Eye, Star, Filter, Grid, List } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

/**
 * TagPage Component
 * Display posts and content for a specific hashtag/tag
 */
const TagPage = () => {
  const { isMobile, isTablet, spacing, fontSize, padding, containerMaxWidth } = useResponsive()

  const compactSpacing = {
    formGap: isMobile ? 16 : isTablet ? 14 : 12,
    headerMargin: isMobile ? 20 : isTablet ? 18 : 16,
    logoMargin: isMobile ? 12 : isTablet ? 10 : 8,
    labelMargin: isMobile ? 8 : 6,
    inputPadding: isMobile ? 12 : 10,
    dividerMargin: isMobile ? 20 : isTablet ? 18 : 14,
    cardPadding: isMobile ? 20 : isTablet ? 24 : 20,
    sectionGap: isMobile ? 16 : isTablet ? 14 : 12
  }
  const { tag } = useParams()
  const navigate = useNavigate()
  const [isFollowing, setIsFollowing] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('recent') // recent, popular, trending
  const [isLoading, setIsLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const [tagStats, setTagStats] = useState({
    postCount: 0,
    followers: 0,
    views: 0,
    trending: false
  })

  useEffect(() => {
    loadTagData()
  }, [tag, sortBy])

  const loadTagData = async () => {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setTagStats({
        postCount: 1247,
        followers: 8392,
        views: 45821,
        trending: true
      })
      setPosts([
        { id: 1, title: 'Amazing discovery!', author: 'alice', likes: 234, comments: 45, image: 'https://picsum.photos/400/300?random=1' },
        { id: 2, title: 'Check this out', author: 'bob', likes: 189, comments: 32, image: 'https://picsum.photos/400/300?random=2' },
        { id: 3, title: 'New update', author: 'charlie', likes: 567, comments: 89, image: 'https://picsum.photos/400/300?random=3' },
        { id: 4, title: 'Trending topic', author: 'diana', likes: 423, comments: 67, image: 'https://picsum.photos/400/300?random=4' }
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] pt-16" role="main" aria-label="Tag page">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'py-6 px-4' : 'py-12 px-6'}`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <Hash className={isMobile ? 'w-8 h-8' : 'w-12 h-12'} />
              <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold`}>{tag}</h1>
              {tagStats.trending && (
                <span className={`px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'} font-semibold`}>
                  <TrendingUp className="w-4 h-4" />
                  Trending
                </span>
              )}
            </div>

            {/* Stats */}
            <div className={`flex items-center justify-center ${isMobile ? 'gap-4' : 'gap-8'} mb-6`}>
              <div className="text-center">
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{tagStats.postCount.toLocaleString()}</div>
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>Posts</div>
              </div>
              <div className="text-center">
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{tagStats.followers.toLocaleString()}</div>
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>Followers</div>
              </div>
              <div className="text-center">
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>{tagStats.views.toLocaleString()}</div>
                <div className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-90`}>Views</div>
              </div>
            </div>

            {/* Follow Button */}
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`${isMobile ? 'py-3 px-6' : 'py-3 px-8'} rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold transition-all ${
                isFollowing
                  ? 'bg-[#161b22]/60 backdrop-blur-xl hover:bg-[#161b22]/60 backdrop-blur-xl backdrop-blur-sm text-white'
                  : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:opacity-90'
              }`}
            >
              {isFollowing ? (
                <>
                  <Star className="inline w-5 h-5 mr-2 fill-current" />
                  Following
                </>
              ) : (
                <>
                  <Star className="inline w-5 h-5 mr-2" />
                  Follow Tag
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#161b22]/60 backdrop-blur-xl border-b border-white/10">
        <div className={`max-w-7xl mx-auto flex items-center justify-between ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`${isMobile ? 'py-2 px-3 text-xs' : 'py-2 px-4 text-sm'} bg-[#21262d] border border-white/10 rounded-lg focus:outline-none focus:border-[#58a6ff] text-[#c9d1d9]`}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="trending">Trending</option>
            </select>

            {!isMobile && (
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#21262d] rounded-lg transition-colors text-[#8b949e]">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            )}
          </div>

          <div className="flex gap-1 bg-[#21262d] border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e]'}`}
              aria-label="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e]'}`}
              aria-label="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid/List */}
      <div className={`max-w-7xl mx-auto ${isMobile ? 'p-4' : 'p-8'}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/post/${post.id}`)}
                className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden hover:border-[#58a6ff]/30 transition-all cursor-pointer"
              >
                <div className="aspect-video bg-[#21262d]">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                </div>
                <div className={`${isMobile ? 'p-3' : 'p-4'}`}>
                  <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-white mb-2`}>{post.title}</h3>
                  <div className={`flex ${isMobile ? 'flex-col gap-1' : 'items-center justify-between'} text-[#8b949e] text-xs`}>
                    <span>by @{post.author}</span>
                    <div className="flex items-center gap-3">
                      <span>{post.likes} likes</span>
                      <span>{post.comments} comments</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(TagPage)

