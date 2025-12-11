import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Search, Filter, X, Users, Star, Calendar,
  MapPin, Hash, Loader, TrendingUp, UserPlus,
  Award, Eye, EyeOff, Zap
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import profileService from '../../services/profileService'
import { useToast } from '../ui/useToast'
import ProfileCard from './ProfileCard'

export default function UserSearch({
  variant = 'full', // 'full', 'modal', 'inline'
  onUserSelect = null,
  showRecommendations = true,
  className = ''
}) {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const searchInputRef = useRef(null)
  const debounceRef = useRef(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [recommendedUsers, setRecommendedUsers] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [trendingUsers, setTrendingUsers] = useState([])

  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [filters, setFilters] = useState({
    verified: false,
    hasAvatar: false,
    location: '',
    minKarma: '',
    minFollowers: '',
    sortBy: 'relevance',
    timeframe: 'all'
  })

  useEffect(() => {
    loadInitialData()
    loadRecentSearches()
  }, [])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchQuery.trim()) {
      debounceRef.current = setTimeout(() => {
        performSearch(searchQuery)
      }, 300)
    } else {
      setSearchResults([])
      setHasSearched(false)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery, filters])

  const loadInitialData = async () => {
    if (!showRecommendations) return

    try {
      setLoading(true)

      const recommendedResponse = await profileService.getRecommendedUsers(8)
      setRecommendedUsers(recommendedResponse.users || [])

      setTrendingUsers([
        {
          id: 'trending1',
          username: 'cryptoenthusiast',
          displayName: 'Crypto Enthusiast',
          avatar: null,
          isVerified: true,
          bio: 'Building the future of decentralized finance',
          stats: { followers: 12500, karma: 8934, posts: 234 },
          trend: '+2.5K this week'
        },
        {
          id: 'trending2',
          username: 'communityleader',
          displayName: 'Community Leader',
          avatar: null,
          isVerified: false,
          bio: 'Passionate about building amazing communities',
          stats: { followers: 8900, karma: 6543, posts: 189 },
          trend: '+1.8K this week'
        }
      ])

    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem('cryb_recent_searches')
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading recent searches:', error)
    }
  }

  const saveRecentSearch = (query) => {
    try {
      const recent = recentSearches.filter(s => s !== query)
      recent.unshift(query)
      const newRecent = recent.slice(0, 5)
      setRecentSearches(newRecent)
      localStorage.setItem('cryb_recent_searches', JSON.stringify(newRecent))
    } catch (error) {
      console.error('Error saving recent search:', error)
    }
  }

  const performSearch = async (query) => {
    try {
      setLoading(true)
      setHasSearched(true)

      const response = await profileService.searchUsers(query, {
        verified: filters.verified || undefined,
        hasAvatar: filters.hasAvatar || undefined,
        location: filters.location || undefined,
        minKarma: filters.minKarma || undefined,
        minFollowers: filters.minFollowers || undefined,
        sortBy: filters.sortBy,
        timeframe: filters.timeframe,
        limit: 20
      })

      setSearchResults(response.users || [])
      saveRecentSearch(query)

    } catch (error) {
      console.error('Error searching users:', error)
      showToast('Search failed. Please try again.', 'error')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      verified: false,
      hasAvatar: false,
      location: '',
      minKarma: '',
      minFollowers: '',
      sortBy: 'relevance',
      timeframe: 'all'
    })
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setHasSearched(false)
    searchInputRef.current?.focus()
  }

  const handleUserSelect = (user) => {
    if (onUserSelect) {
      onUserSelect(user)
    } else {
      window.location.href = `/profile/${user.username || user.id}`
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('cryb_recent_searches')
  }

  const handleRecentSearchClick = (query) => {
    setSearchQuery(query)
    searchInputRef.current?.focus()
  }

  if (variant === 'modal') {
    return (
      <div className={`bg-card rounded-2xl overflow-hidden max-w-[600px] w-full max-h-[80vh] ${className}`}>
        <div className="p-5 border-b border-border bg-input">
          <div className="relative flex items-center bg-card border-2 border-border rounded-xl px-4 transition-colors focus-within:border-accent">
            <Search size={20} className="text-secondary mr-3 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 bg-transparent border-none py-3 text-base text-primary outline-none placeholder:text-secondary"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-1 ml-2 rounded text-secondary hover:bg-hover hover:text-primary transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-[60px] px-5 gap-4 text-secondary">
              <Loader className="" size={24} />
              <span>Searching users...</span>
            </div>
          ) : hasSearched ? (
            <SearchResults
              results={searchResults}
              query={searchQuery}
              onUserSelect={handleUserSelect}
              variant="compact"
            />
          ) : (
            <SearchSuggestions
              recentSearches={recentSearches}
              recommendedUsers={recommendedUsers}
              onRecentClick={handleRecentSearchClick}
              onUserSelect={handleUserSelect}
              onClearRecent={clearRecentSearches}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-card rounded-xl overflow-hidden ${variant === 'full' ? 'border border-border shadow-sm' : ''} ${variant === 'inline' ? 'border-none shadow-none bg-transparent' : ''} ${className}`}>
      {/* Search Header */}
      <div className="flex items-center gap-3 p-5 border-b border-border bg-input md:flex-row flex-col md:items-center md:gap-3 items-stretch gap-4">
        <div className="flex-1 relative flex items-center bg-card border-2 border-border rounded-xl px-4 transition-colors focus-within:border-accent">
          <Search size={20} className="text-secondary mr-3 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for users by name, username, or interests..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 bg-transparent border-none py-3 text-base text-primary outline-none placeholder:text-secondary"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="p-1 ml-2 rounded text-secondary hover:bg-hover hover:text-primary transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            showFilters
              ? 'bg-accent text-white border-accent'
              : 'bg-input text-secondary border border-border hover:bg-hover hover:border-accent'
          }`}
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-b border-border bg-input animate-slideDown">
          <div className="p-5 flex flex-col gap-5 md:p-5 md:gap-5 p-4 gap-4">
            <div className="flex flex-wrap gap-4 items-center md:flex-row md:items-center flex-col items-stretch">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-primary select-none">
                <input
                  type="checkbox"
                  checked={filters.verified}
                  onChange={(e) => handleFilterChange('verified', e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
                <span>Verified users only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-primary select-none">
                <input
                  type="checkbox"
                  checked={filters.hasAvatar}
                  onChange={(e) => handleFilterChange('hasAvatar', e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
                <span>Has profile picture</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-4 items-center md:flex-row md:items-center flex-col items-stretch">
              <label className="flex flex-col gap-1.5 min-w-[140px] md:min-w-[140px] min-w-auto">
                <span className="text-[13px] font-medium text-secondary">Location</span>
                <input
                  type="text"
                  placeholder="City, Country"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="px-3 py-2 bg-card border border-border rounded-md text-primary text-sm transition-colors focus:outline-none focus:border-accent"
                />
              </label>

              <label className="flex flex-col gap-1.5 min-w-[140px] md:min-w-[140px] min-w-auto">
                <span className="text-[13px] font-medium text-secondary">Min Karma</span>
                <input
                  type="number"
                  placeholder="1000"
                  value={filters.minKarma}
                  onChange={(e) => handleFilterChange('minKarma', e.target.value)}
                  className="px-3 py-2 bg-card border border-border rounded-md text-primary text-sm transition-colors focus:outline-none focus:border-accent"
                />
              </label>

              <label className="flex flex-col gap-1.5 min-w-[140px] md:min-w-[140px] min-w-auto">
                <span className="text-[13px] font-medium text-secondary">Min Followers</span>
                <input
                  type="number"
                  placeholder="100"
                  value={filters.minFollowers}
                  onChange={(e) => handleFilterChange('minFollowers', e.target.value)}
                  className="px-3 py-2 bg-card border border-border rounded-md text-primary text-sm transition-colors focus:outline-none focus:border-accent"
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-4 items-center md:flex-row md:items-center flex-col items-stretch">
              <label className="flex flex-col gap-1.5 min-w-[140px] md:min-w-[140px] min-w-auto">
                <span className="text-[13px] font-medium text-secondary">Sort by</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="px-3 py-2 bg-card border border-border rounded-md text-primary text-sm cursor-pointer transition-colors focus:outline-none focus:border-accent"
                >
                  <option value="relevance">Relevance</option>
                  <option value="followers">Most Followers</option>
                  <option value="karma">Highest Karma</option>
                  <option value="recent">Recently Joined</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 min-w-[140px] md:min-w-[140px] min-w-auto">
                <span className="text-[13px] font-medium text-secondary">Time frame</span>
                <select
                  value={filters.timeframe}
                  onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                  className="px-3 py-2 bg-card border border-border rounded-md text-primary text-sm cursor-pointer transition-colors focus:outline-none focus:border-accent"
                >
                  <option value="all">All Time</option>
                  <option value="year">This Year</option>
                  <option value="month">This Month</option>
                  <option value="week">This Week</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-transparent border border-border rounded-md text-secondary text-sm transition-all hover:bg-hover hover:border-accent hover:text-primary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Content */}
      <div className="p-5 min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-[60px] px-5 gap-4 text-secondary">
            <Loader className="" size={32} />
            <span>Searching users...</span>
          </div>
        ) : hasSearched ? (
          <SearchResults
            results={searchResults}
            query={searchQuery}
            onUserSelect={handleUserSelect}
          />
        ) : (
          <div className="flex flex-col gap-8">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="m-0 text-lg font-semibold text-primary">Recent Searches</h3>
                  <button
                    onClick={clearRecentSearches}
                    className="bg-transparent border-none text-secondary text-sm font-medium transition-colors cursor-pointer hover:text-accent"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 md:flex-row md:gap-2 flex-col items-stretch">
                  {recentSearches.map((query, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRecentSearchClick(query)}
                      className="flex items-center gap-1.5 bg-input border border-border rounded-[20px] px-4 py-2 text-secondary text-sm transition-all cursor-pointer hover:bg-hover hover:border-accent hover:text-primary md:justify-start md:rounded-[20px] justify-start rounded-lg"
                    >
                      <Search size={14} />
                      <span>{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Users */}
            {trendingUsers.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="m-0 text-lg font-semibold text-primary flex items-center gap-2">
                    <TrendingUp size={18} />
                    Trending This Week
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] grid-cols-1">
                  {trendingUsers.map(user => (
                    <div key={user.id} className="relative rounded-xl overflow-hidden">
                      <ProfileCard
                        user={user}
                        variant="compact"
                        showStats={true}
                        onClick={handleUserSelect}
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-success text-white px-2 py-1 rounded-xl text-xs font-medium backdrop-blur-sm">
                        <TrendingUp size={14} />
                        <span>{user.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Users */}
            {recommendedUsers.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="m-0 text-lg font-semibold text-primary flex items-center gap-2">
                    <UserPlus size={18} />
                    Suggested for You
                  </h3>
                </div>
                <div className="grid gap-4 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] grid-cols-1">
                  {recommendedUsers.map(user => (
                    <ProfileCard
                      key={user.id}
                      user={user}
                      variant="search"
                      showStats={true}
                      onClick={handleUserSelect}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Search Results Component
function SearchResults({ results, query, onUserSelect, variant = 'default' }) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-[60px] px-5 gap-4 text-secondary text-center">
        <Users size={48} />
        <h3 className="m-0 text-xl font-semibold text-primary">No users found</h3>
        <p className="m-0 text-sm">Try adjusting your search terms or filters</p>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <div className="mb-5 pb-3 border-b border-border">
        <h3 className="m-0 text-lg font-semibold text-primary">{results.length} users found for "{query}"</h3>
      </div>

      <div className={`grid gap-4 ${variant === 'compact' ? 'grid-cols-1 gap-2' : 'md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] grid-cols-1'}`}>
        {results.map(user => (
          <ProfileCard
            key={user.id}
            user={user}
            variant={variant === 'compact' ? 'compact' : 'search'}
            showStats={true}
            onClick={onUserSelect}
          />
        ))}
      </div>
    </div>
  )
}

// Search Suggestions Component
function SearchSuggestions({
  recentSearches,
  recommendedUsers,
  onRecentClick,
  onUserSelect,
  onClearRecent
}) {
  return (
    <div className="flex flex-col gap-5">
      {recentSearches.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-primary">Recent</span>
            <button
              onClick={onClearRecent}
              className="bg-transparent border-none text-secondary text-sm font-medium transition-colors cursor-pointer hover:text-accent"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {recentSearches.map((query, idx) => (
              <button
                key={idx}
                onClick={() => onRecentClick(query)}
                className="flex items-center gap-3 bg-transparent border-none p-3 px-4 text-primary text-sm text-left w-full rounded-lg transition-all cursor-pointer hover:bg-hover"
              >
                <Search size={16} />
                <span>{query}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {recommendedUsers.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-primary">Suggested</span>
          </div>
          <div className="flex flex-col gap-1">
            {recommendedUsers.slice(0, 5).map(user => (
              <ProfileCard
                key={user.id}
                user={user}
                variant="mention"
                showActions={false}
                onClick={onUserSelect}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

