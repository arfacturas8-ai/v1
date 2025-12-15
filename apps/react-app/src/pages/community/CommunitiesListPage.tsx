import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Users,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Star,
  Sparkles,
  ChevronDown,
  Hash,
  Loader,
  Clock,
  BarChart3,
  Grid3x3,
  List,
  X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import communityService from '../../services/communityService'

interface Community {
  id: string
  name: string
  displayName: string
  description: string
  icon?: string
  banner?: string
  category: string
  members: number
  memberCount?: number
  postCount?: number
  onlineCount?: number
  isJoined?: boolean
  isMember?: boolean
  trending?: boolean
  featured?: boolean
  isNew?: boolean
  createdAt: string
  growthRate?: number
}

const CommunitiesListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()

  const [communities, setCommunities] = useState<Community[]>([])
  const [yourCommunities, setYourCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'members')
  const [filterCategory, setFilterCategory] = useState(searchParams.get('category') || 'all')
  const [selectedTab, setSelectedTab] = useState(searchParams.get('tab') || 'all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [error, setError] = useState<string | null>(null)

  const categories = [
    'all',
    'gaming',
    'technology',
    'art',
    'music',
    'sports',
    'education',
    'business',
    'entertainment',
    'science',
    'lifestyle',
    'finance',
    'creative',
    'general'
  ]

  const tabs = [
    { id: 'all', label: 'All Communities', icon: Users },
    { id: 'your', label: 'Your Communities', icon: Star },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Sparkles },
    { id: 'featured', label: 'Featured', icon: BarChart3 }
  ]

  const sortOptions = [
    { value: 'members', label: 'Most Members' },
    { value: 'trending', label: 'Trending' },
    { value: 'activity', label: 'Most Active' },
    { value: 'newest', label: 'Newest' },
    { value: 'name', label: 'Name (A-Z)' }
  ]

  // Fetch communities
  useEffect(() => {
    loadCommunities()
  }, [searchTerm, sortBy, filterCategory, selectedTab])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (sortBy !== 'members') params.set('sort', sortBy)
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (selectedTab !== 'all') params.set('tab', selectedTab)
    setSearchParams(params)
  }, [searchTerm, sortBy, filterCategory, selectedTab])

  const loadCommunities = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        search: searchTerm || undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        sort: sortBy,
        limit: 50
      }

      const result = await communityService.getCommunities(params)

      if (result.success && result.communities) {
        const allCommunities = result.communities
        setCommunities(allCommunities)

        // Filter your communities if logged in
        if (user) {
          const joined = allCommunities.filter((c: Community) => c.isJoined || c.isMember)
          setYourCommunities(joined)
        }
      } else {
        setCommunities([])
        setYourCommunities([])
      }
    } catch (err: any) {
      console.error('Error loading communities:', err)
      setError(getErrorMessage(err, 'Failed to load communities'))
      setCommunities([])
      setYourCommunities([])
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = useCallback(async (communityId: string, communityName: string) => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId || c.name === communityName
            ? { ...c, isJoined: true, isMember: true, members: (c.members || 0) + 1 }
            : c
        )
      )
      await communityService.joinCommunity(communityId || communityName)
      loadCommunities()
    } catch (err) {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId || c.name === communityName
            ? { ...c, isJoined: false, isMember: false, members: (c.members || 0) - 1 }
            : c
        )
      )
      console.error('Failed to join:', err)
    }
  }, [user, navigate])

  const handleLeave = useCallback(async (communityId: string, communityName: string) => {
    try {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId || c.name === communityName
            ? { ...c, isJoined: false, isMember: false, members: Math.max(0, (c.members || 1) - 1) }
            : c
        )
      )
      await communityService.leaveCommunity(communityId || communityName)
      loadCommunities()
    } catch (err) {
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === communityId || c.name === communityName
            ? { ...c, isJoined: true, isMember: true, members: (c.members || 0) + 1 }
            : c
        )
      )
      console.error('Failed to leave:', err)
    }
  }, [])

  const filteredCommunities = useMemo(() => {
    let filtered = communities

    // Tab filtering
    if (selectedTab === 'your') {
      filtered = yourCommunities
    } else if (selectedTab === 'trending') {
      filtered = filtered.filter((c) => c.trending)
    } else if (selectedTab === 'featured') {
      filtered = filtered.filter((c) => c.featured)
    } else if (selectedTab === 'new') {
      filtered = filtered.filter((c) => c.isNew)
    }

    // Category filtering
    if (filterCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === filterCategory)
    }

    // Search filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.displayName?.toLowerCase().includes(term) ||
          c.description?.toLowerCase().includes(term)
      )
    }

    // Sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'trending':
          return (b.growthRate || 0) - (a.growthRate || 0)
        case 'members':
          return (b.members || b.memberCount || 0) - (a.members || a.memberCount || 0)
        case 'activity':
          return (b.postCount || 0) - (a.postCount || 0)
        case 'name':
          return (a.displayName || a.name || '').localeCompare(b.displayName || b.name || '')
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
  }, [communities, yourCommunities, searchTerm, filterCategory, selectedTab, sortBy])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)]">
        <div className="max-w-7xl mx-auto p-4 sm:p-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Loader className="w-12 h-12 text-[#58a6ff]  mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Loading communities...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
            Discover Communities
          </h1>
          <p className="text-[var(--text-secondary)] text-base">
            Explore and join communities that match your interests
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-base placeholder-[var(--text-secondary)] outline-none focus:border-[#58a6ff]/50 focus:shadow-[0_0_0_3px_rgba(88,166,255,0.1)] transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="relative min-w-full sm:min-w-[160px]">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 pr-10 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-base appearance-none cursor-pointer outline-none focus:border-[#58a6ff]/50 transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
            </div>

            <div className="relative min-w-full sm:min-w-[160px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 pr-10 py-3 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-base appearance-none cursor-pointer outline-none focus:border-[#58a6ff]/50 transition-all"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tabs and Actions */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = selectedTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white shadow-lg'
                      : 'bg-white border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-gray-50 hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white border border-[var(--border-subtle)] rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-[#58a6ff] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-[#58a6ff] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <List size={18} />
              </button>
            </div>

            {user && (
              <button
                onClick={() => navigate('/community/create')}
                style={{color: "var(--text-primary)"}} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl  text-sm font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all"
              >
                <Plus size={18} />
                Create
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-500 text-center">
            {typeof error === 'string' ? error : 'An error occurred'}
          </div>
        )}

        {/* Communities Grid/List */}
        {filteredCommunities.length === 0 ? (
          <div className="bg-white border border-[var(--border-subtle)] rounded-2xl p-12 sm:p-16 text-center shadow-sm">
            <Hash size={56} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No communities found</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {searchTerm ? 'Try a different search term' : 'Be the first to create a community!'}
            </p>
            {user && (
              <button
                onClick={() => navigate('/community/create')}
                style={{color: "var(--text-primary)"}} className="px-8 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-xl  font-semibold hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all"
              >
                Create Community
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : 'space-y-4'
            }
          >
            {filteredCommunities.map((community) => (
              <div
                key={community.id || community.name}
                onClick={() => navigate(`/community/${community.name || community.id}`)}
                className={`bg-white border border-[var(--border-subtle)] rounded-2xl shadow-sm cursor-pointer transition-all hover:border-[#58a6ff]/30 hover:shadow-md group ${
                  viewMode === 'list' ? 'flex items-center gap-4 p-4' : 'p-5'
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="flex items-start gap-4 mb-4">
                      {community.icon ? (
                        <img
                          src={community.icon}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover border border-[var(--border-subtle)]"
                        />
                      ) : (
                        <div style={{color: "var(--text-primary)"}} className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  text-xl font-bold shadow-lg">
                          {getInitials(community.displayName || community.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold text-[var(--text-primary)] mb-1 truncate group-hover:text-[#58a6ff] transition-colors">
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

                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4 line-clamp-2">
                      {community.description || 'No description available'}
                    </p>

                    <div className="flex gap-4 mb-4 text-[var(--text-secondary)] text-sm">
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
                        if (community.isJoined || community.isMember) {
                          handleLeave(community.id, community.name)
                        } else {
                          handleJoin(community.id, community.name)
                        }
                      }}
                      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                        community.isJoined || community.isMember
                          ? 'bg-gray-100 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-gray-200'
                          : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:shadow-[0_0_20px_rgba(88,166,255,0.4)]'
                      }`}
                    >
                      {community.isJoined || community.isMember ? 'Joined' : 'Join Community'}
                    </button>
                  </>
                ) : (
                  <>
                    {community.icon ? (
                      <img
                        src={community.icon}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover border border-[var(--border-subtle)] flex-shrink-0"
                      />
                    ) : (
                      <div style={{color: "var(--text-primary)"}} className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center  text-xl font-bold shadow-lg flex-shrink-0">
                        {getInitials(community.displayName || community.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div>
                          <div className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[#58a6ff] transition-colors">
                            {community.displayName || community.name}
                          </div>
                          <p className="text-[var(--text-secondary)] text-sm line-clamp-1">
                            {community.description || 'No description available'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (community.isJoined || community.isMember) {
                              handleLeave(community.id, community.name)
                            } else {
                              handleJoin(community.id, community.name)
                            }
                          }}
                          className={`px-6 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                            community.isJoined || community.isMember
                              ? 'bg-gray-100 border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-gray-200'
                              : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:shadow-[0_0_20px_rgba(88,166,255,0.4)]'
                          }`}
                        >
                          {community.isJoined || community.isMember ? 'Joined' : 'Join'}
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-[var(--text-secondary)] text-sm">
                        <div className="flex items-center gap-1.5">
                          <Users size={14} />
                          {formatNumber(community.members || community.memberCount || 0)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={14} />
                          {formatNumber(community.postCount || 0)}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#58a6ff]/15 rounded-lg text-xs text-[#58a6ff] font-medium">
                          <Hash size={12} />
                          {community.category || 'general'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommunitiesListPage
