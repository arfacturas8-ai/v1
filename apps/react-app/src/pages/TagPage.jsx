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
    <div style={{background: "var(--bg-primary)"}} className="min-h-screen  pt-16" role="main" aria-label="Tag page">
      {/* Hero Section */}
      <div style={{color: "var(--text-primary)"}} className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] ">
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
                  <TrendingUp style={{ width: "24px", height: "24px", flexShrink: 0 }} />
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
              className={`${isMobile ? 'py-3 px-6' : 'py-3 px-8'} rounded-2xl  font-semibold transition-all ${
                isFollowing
                  ? 'bg-[#161b22]/60  hover:bg-[#161b22]/60  backdrop-blur-sm text-white'
                  : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:opacity-90'
              }`}
            >
              {isFollowing ? (
                <>
                  <Star style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  Following
                </>
              ) : (
                <>
                  <Star style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  Follow Tag
                </>
              )}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div style={{borderColor: "var(--border-subtle)"}} className="card   border-b ">
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
              <button style={{color: "var(--text-secondary)"}} className="flex items-center gap-2 px-4 py-2 hover:bg-[#21262d] rounded-lg transition-colors ">
                <Filter style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                Filters
              </button>
            )}
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="flex gap-1 bg-[#21262d] border  rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e]'}`}
              aria-label="Grid view"
            >
              <Grid style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#58a6ff]/20 text-[#58a6ff]' : 'text-[#8b949e]'}`}
              aria-label="List view"
            >
              <List style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid/List */}
      <div className={`max-w-7xl mx-auto ${isMobile ? 'p-4' : 'p-8'}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div style={{ width: "64px", height: "64px", flexShrink: 0 }} />
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
                style={{borderColor: "var(--border-subtle)"}} className="card   border  rounded-2xl  overflow-hidden hover:border-[#58a6ff]/30 transition-all cursor-pointer"
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

