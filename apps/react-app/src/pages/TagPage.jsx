/**
 * TagPage.jsx
 * iOS-inspired modern design with clean aesthetics
 * Updated: 2025-12-19
 */

import React, { useState, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { Hash, TrendingUp, Star, Grid, List } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const TagPage = () => {
  const { isMobile } = useResponsive()
  const { tag } = useParams()
  const navigate = useNavigate()
  const [isFollowing, setIsFollowing] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('recent')
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
    <div style={{ minHeight: '100vh', background: '#FAFAFA', paddingTop: '64px' }} role="main" aria-label="Tag page">
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        color: 'white'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? '32px 16px' : '48px 24px'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Hash style={{ width: isMobile ? '32px' : '48px', height: isMobile ? '32px' : '48px' }} />
              <h1 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '700' }}>{tag}</h1>
              {tagStats.trending && (
                <span style={{
                  padding: '8px 12px',
                  background: '#FDE047',
                  color: '#854D0E',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '600'
                }}>
                  <TrendingUp size={16} />
                  Trending
                </span>
              )}
            </div>

            {/* Stats */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '16px' : '32px',
              marginBottom: '24px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700' }}>{tagStats.postCount.toLocaleString()}</div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', opacity: 0.9 }}>Posts</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700' }}>{tagStats.followers.toLocaleString()}</div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', opacity: 0.9 }}>Followers</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700' }}>{tagStats.views.toLocaleString()}</div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', opacity: 0.9 }}>Views</div>
              </div>
            </div>

            {/* Follow Button */}
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              style={{
                padding: isMobile ? '14px 24px' : '16px 32px',
                borderRadius: '16px',
                fontWeight: '600',
                transition: 'all 0.2s',
                cursor: 'pointer',
                border: 'none',
                background: isFollowing ? 'rgba(255,255,255,0.2)' : 'white',
                color: isFollowing ? 'white' : '#6366F1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Star size={20} />
              {isFollowing ? 'Following' : 'Follow Tag'}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E5E5E5'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '12px' : '16px'
        }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: isMobile ? '10px 16px' : '12px 16px',
              fontSize: isMobile ? '14px' : '16px',
              background: 'white',
              border: '1px solid #E5E5E5',
              borderRadius: '12px',
              outline: 'none',
              color: '#000'
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="trending">Trending</option>
          </select>

          <div style={{
            display: 'flex',
            gap: '4px',
            background: '#F5F5F5',
            borderRadius: '12px',
            padding: '4px'
          }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: viewMode === 'grid' ? 'white' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: viewMode === 'grid' ? '#6366F1' : '#666'
              }}
              aria-label="Grid view"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: viewMode === 'list' ? 'white' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: viewMode === 'list' ? '#6366F1' : '#666'
              }}
              aria-label="List view"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid/List */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: isMobile ? '16px' : '32px'
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: '48px', height: '48px' }}></div>
          </div>
        ) : (
          <div style={viewMode === 'grid' ? {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          } : {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/post/${post.id}`)}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ aspectRatio: '16/9', background: '#F5F5F5' }}>
                  <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: isMobile ? '16px' : '20px' }}>
                  <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>{post.title}</h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '4px' : '0',
                    justifyContent: 'space-between',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <span>by @{post.author}</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
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
