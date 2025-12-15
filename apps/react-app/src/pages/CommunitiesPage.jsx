import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, TrendingUp, Search, Filter, Plus, Star, Sparkles, ChevronDown, Hash, Loader } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'
import { formatNumber, getInitials } from '../lib/utils'
import communityService from '../services/communityService'
import { useAuth } from '../contexts/AuthContext'

function CommunitiesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isMobile, isTablet } = useResponsive()

  const [communities, setCommunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('members')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedTab, setSelectedTab] = useState('all')
  const [error, setError] = useState(null)

  // Fetch communities
  useEffect(() => {
    const loadCommunities = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await communityService.getCommunities({
          search: searchTerm,
          category: filterCategory !== 'all' ? filterCategory : undefined,
          sort: sortBy,
          limit: 50
        })

        if (result.success && result.communities) {
          setCommunities(result.communities)
        } else {
          setCommunities([])
        }
      } catch (err) {
        console.error('Error loading communities:', err)
        setError(err.message || 'Failed to load communities')
        setCommunities([])
      } finally {
        setLoading(false)
      }
    }

    loadCommunities()
  }, [searchTerm, sortBy, filterCategory])

  const handleJoin = useCallback(async (communityId, communityName) => {
    try {
      setCommunities(prev => prev.map(c =>
        c.id === communityId || c.name === communityName
          ? { ...c, isJoined: true, members: (c.members || 0) + 1 }
          : c
      ))
      await communityService.joinCommunity(communityId || communityName)
    } catch (err) {
      setCommunities(prev => prev.map(c =>
        c.id === communityId || c.name === communityName
          ? { ...c, isJoined: false, members: (c.members || 0) - 1 }
          : c
      ))
      console.error('Failed to join:', err)
    }
  }, [])

  const handleLeave = useCallback(async (communityId, communityName) => {
    try {
      setCommunities(prev => prev.map(c =>
        c.id === communityId || c.name === communityName
          ? { ...c, isJoined: false, members: (c.members || 0) - 1 }
          : c
      ))
      await communityService.leaveCommunity(communityId || communityName)
    } catch (err) {
      setCommunities(prev => prev.map(c =>
        c.id === communityId || c.name === communityName
          ? { ...c, isJoined: true, members: (c.members || 0) + 1 }
          : c
      ))
      console.error('Failed to leave:', err)
    }
  }, [])

  const filteredCommunities = useMemo(() => {
    return communities
      .filter(community => {
        const matchesSearch = !searchTerm ||
          community.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          community.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          community.description?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCategory = filterCategory === 'all' || community.category === filterCategory

        const matchesTab =
          selectedTab === 'all' ||
          (selectedTab === 'trending' && community.trending) ||
          (selectedTab === 'featured' && community.featured) ||
          (selectedTab === 'new' && community.isNew)

        return matchesSearch && matchesCategory && matchesTab
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'trending': return (b.growthRate || 0) - (a.growthRate || 0)
          case 'members': return (b.members || 0) - (a.members || 0)
          case 'name': return (a.name || '').localeCompare(b.name || '')
          case 'newest': return new Date(b.createdAt) - new Date(a.createdAt)
          default: return 0
        }
      })
  }, [communities, searchTerm, filterCategory, selectedTab, sortBy])

  const categories = ['all', 'technology', 'gaming', 'science', 'entertainment', 'finance', 'creative', 'general']

  const tabs = [
    { id: 'all', label: 'All', icon: Users },
    { id: 'featured', label: 'Featured', icon: Star },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Sparkles }
  ]

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
            Discover Communities
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-base">Explore and join communities that match your interests</p>
        </div>

        {/* Search and Filters */}
        <div className=" rounded-2xl p-4 sm:p-5 mb-6" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-base outline-none focus:shadow-[0_0_0_3px_rgba(88,166,255,0.1)] transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="relative min-w-full sm:min-w-[160px]">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 pr-10 py-3 rounded-xl text-base appearance-none cursor-pointer outline-none focus:border-[#58a6ff]/50 transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
            </div>

            <div className="relative min-w-full sm:min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 pr-10 py-3 rounded-xl text-base appearance-none cursor-pointer outline-none focus:border-[#58a6ff]/50 transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              >
                <option value="members">Most Members</option>
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="name">Name</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = selectedTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] shadow-lg'
                      : 'hover:bg-opacity-80'
                  }`}
                  style={isActive ? { color: 'var(--text-inverse)' } : { background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {user && (
            <button
              onClick={() => navigate('/communities/create')}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl text-sm font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all"
              style={{ color: 'var(--text-inverse)' }}
            >
              <Plus size={18} />
              Create
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-500 text-center">
            {typeof error === 'string' ? error : 'An error occurred'}
          </div>
        )}

        {/* Communities Grid */}
        {filteredCommunities.length === 0 ? (
          <div className=" rounded-2xl p-12 sm:p-16 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}>
            <Hash size={56} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-tertiary)' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No communities found</h3>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              {searchTerm ? 'Try a different search term' : 'Be the first to create a community!'}
            </p>
            {user && (
              <button
                onClick={() => navigate('/communities/create')}
                className="px-8 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all"
                style={{ color: 'var(--text-inverse)' }}
              >
                Create Community
              </button>
            )}
          </div>
        ) : (
          <div className={`grid gap-5 ${isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {filteredCommunities.map(community => (
              <div
                key={community.id || community.name}
                onClick={() => navigate(`/community/${community.name || community.id}`)}
                className=" rounded-2xl p-5 cursor-pointer transition-all hover:border-[#58a6ff]/30 hover:shadow-[0_12px_48px_rgba(88,166,255,0.15)] group"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-md)' }}
              >
                <div className="flex items-start gap-4 mb-4">
                  {community.icon ? (
                    <img
                      src={community.icon}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover"
                      style={{ border: '1px solid var(--border-subtle)' }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-xl font-bold shadow-lg" style={{ color: 'var(--text-inverse)' }}>
                      {getInitials(community.displayName || community.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-bold mb-1 truncate group-hover:text-[#58a6ff] transition-colors" style={{ color: 'var(--text-primary)' }}>
                      {community.displayName || community.name}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#58a6ff]/15 rounded-lg text-xs text-[#58a6ff] font-medium">
                      <Hash size={12} />
                      {community.category || 'general'}
                    </div>
                    {(community.featured || community.trending) && (
                      <div className="flex gap-2 mt-2">
                        {community.featured && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 rounded-md text-[10px] text-yellow-500 font-semibold">
                            <Star size={10} /> Featured
                          </span>
                        )}
                        {community.trending && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded-md text-[10px] text-green-500 font-semibold">
                            <TrendingUp size={10} /> Trending
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {community.description || 'No description available'}
                </p>

                <div className="flex gap-4 mb-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-1.5">
                    <Users size={14} />
                    {formatNumber(community.members || community.memberCount || 0)} members
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} />
                    {formatNumber(community.postCount || 0)} posts
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (community.isJoined) {
                      handleLeave(community.id, community.name)
                    } else {
                      handleJoin(community.id, community.name)
                    }
                  }}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    community.isJoined
                      ? 'hover:opacity-80'
                      : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:shadow-[0_0_20px_rgba(88,166,255,0.4)]'
                  }`}
                  style={community.isJoined ? { background: 'var(--bg-hover)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' } : { color: 'var(--text-inverse)' }}
                >
                  {community.isJoined ? 'Joined' : 'Join Community'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunitiesPage
