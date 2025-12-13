import React, { useState, useEffect, useCallback, useRef } from 'react'
import DOMPurify from 'dompurify'
import {
  Search, Filter, Calendar, User, Hash, MessageSquare,
  Image, Video, FileText, TrendingUp, Clock, X,
  ChevronDown, ChevronUp, Sliders, Star, ArrowRight,
  Globe, Shield, Zap, BarChart3, Eye, Heart
} from 'lucide-react'
const AdvancedSearch = ({ onClose, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery)
  const [filters, setFilters] = useState({
    type: 'all',
    community: '',
    author: '',
    dateRange: 'all',
    sortBy: 'relevance',
    hasMedia: false,
    minKarma: 0,
    verified: false
  })
  const [results, setResults] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchStats, setSearchStats] = useState({
    totalResults: 0,
    searchTime: 0,
    facets: {}
  })
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const searchInputRef = useRef(null)
  const debounceTimer = useRef(null)

  useEffect(() => {
    loadRecentSearches()
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (query.length >= 2) {
      // Debounce search suggestions
      clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(query)
      }, 300)
    } else {
      setSuggestions([])
    }
  }, [query])

  const loadRecentSearches = () => {
    const recent = localStorage.getItem('recentSearches')
    if (recent) {
      setRecentSearches(JSON.parse(recent).slice(0, 5))
    }
  }

  const saveRecentSearch = (searchQuery) => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    const updated = [searchQuery, ...recent.filter(q => q !== searchQuery)].slice(0, 10)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
    setRecentSearches(updated.slice(0, 5))
  }

  const fetchSuggestions = async (searchQuery) => {
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const performSearch = async (resetResults = true) => {
    if (!query.trim() && !Object.values(filters).some(v => v)) return

    setLoading(true)
    if (resetResults) {
      setResults([])
      setPage(1)
    }

    try {
      const params = new URLSearchParams({
        q: query,
        page: resetResults ? 1 : page,
        ...filters
      })

      const response = await fetch(`/api/search/advanced?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (resetResults) {
          setResults(data.results || [])
          saveRecentSearch(query)
        } else {
          setResults(prev => [...prev, ...(data.results || [])])
        }
        
        setSearchStats({
          totalResults: data.total || 0,
          searchTime: data.took || 0,
          facets: data.facets || {}
        })
        setHasMore(data.hasMore || false)
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    performSearch(true)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion)
    setSuggestions([])
    performSearch(true)
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      performSearch(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      type: 'all',
      community: '',
      author: '',
      dateRange: 'all',
      sortBy: 'relevance',
      hasMedia: false,
      minKarma: 0,
      verified: false
    })
  }

  const renderSearchBar = () => (
    <div className="search-bar-container">
      <form onSubmit={handleSearch} className="advanced-search-bar">
        <Search size={20} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search posts, users, communities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button
          type="button"
          className={`filter-toggle ${showFilters ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white shadow-lg' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-white/10 hover:text-[var(--text-primary)]'}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Sliders size={18} />
          Filters
          {Object.values(filters).some(v => v && v !== 'all' && v !== 'relevance' && v !== 0) && (
            <span className="filter-count">
              {Object.values(filters).filter(v => v && v !== 'all' && v !== 'relevance' && v !== 0).length}
            </span>
          )}
        </button>
        <button type="submit" className="search-submit">
          Search
        </button>
      </form>

      {suggestions.length > 0 && (
        <div className="search-suggestions">
          <div className="suggestions-header">Suggestions</div>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Search size={14} />
              <span dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(suggestion.replace(new RegExp(query, 'gi'), match => `<mark>${match}</mark>`))
              }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const renderFilters = () => (
    <div className={`search-filters ${showFilters ? 'visible' : ''}`}>
      <div className="filters-header">
        <h3>Advanced Filters</h3>
        <button className="clear-filters" onClick={clearFilters}>
          Clear All
        </button>
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label>Content Type</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="posts">Posts</option>
            <option value="comments">Comments</option>
            <option value="users">Users</option>
            <option value="communities">Communities</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
            <option value="karma">Highest Karma</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Community</label>
          <input
            type="text"
            placeholder="Filter by community"
            value={filters.community}
            onChange={(e) => handleFilterChange('community', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Author</label>
          <input
            type="text"
            placeholder="Filter by author"
            value={filters.author}
            onChange={(e) => handleFilterChange('author', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Min Karma</label>
          <input
            type="number"
            min="0"
            value={filters.minKarma}
            onChange={(e) => handleFilterChange('minKarma', parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="filter-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={filters.hasMedia}
              onChange={(e) => handleFilterChange('hasMedia', e.target.checked)}
            />
            Has Media
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.checked)}
            />
            Verified Only
          </label>
        </div>
      </div>
    </div>
  )

  const renderResultItem = (result) => {
    switch (result.type) {
      case 'post':
        return (
          <div className="result-item post">
            <div className="result-header">
              <MessageSquare size={16} />
              <span className="result-type">Post</span>
              <span className="result-community">
                <Hash size={12} />
                {result.community}
              </span>
            </div>
            <h4 className="result-title">{result.title}</h4>
            <p className="result-snippet">{result.snippet}</p>
            <div className="result-meta">
              <span className="author">
                <User size={12} />
                {result.author}
              </span>
              <span className="date">
                <Clock size={12} />
                {new Date(result.createdAt).toLocaleDateString()}
              </span>
              <span className="stats">
                <Heart size={12} />
                {result.likes}
              </span>
              <span className="stats">
                <MessageSquare size={12} />
                {result.comments}
              </span>
            </div>
          </div>
        )

      case 'user':
        return (
          <div className="result-item user">
            <div className="user-result">
              <img
                src={result.avatar || '/default-avatar.png'}
                alt={result.username}
                className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-2xl flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="user-name">
                  {result.username}
                  {result.verified && <Shield size={14} className="verified" />}
                </h4>
                <p className="user-bio">{result.bio || 'No bio available'}</p>
                <div className="user-stats">
                  <span>
                    <Star size={12} />
                    {result.karma} karma
                  </span>
                  <span>
                    <User size={12} />
                    {result.followers} followers
                  </span>
                  <span>
                    <MessageSquare size={12} />
                    {result.posts} posts
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'community':
        return (
          <div className="result-item community">
            <div className="community-result">
              <div className="community-icon">
                <Hash size={24} />
              </div>
              <div className="community-info">
                <h4 className="community-name">{result.name}</h4>
                <p className="community-description">{result.description}</p>
                <div className="community-stats">
                  <span>
                    <User size={12} />
                    {result.members} members
                  </span>
                  <span>
                    <MessageSquare size={12} />
                    {result.posts} posts
                  </span>
                  <span>
                    <TrendingUp size={12} />
                    {result.growth}% growth
                  </span>
                </div>
              </div>
              <button className="join-btn">Join</button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderResults = () => (
    <div className="p-6 border-t border-[var(--border-subtle)]">
      {searchStats.totalResults > 0 && (
        <div className="results-header">
          <h3>
            {searchStats.totalResults.toLocaleString()} results
            <span className="search-time">({searchStats.searchTime}ms)</span>
          </h3>
          
          {searchStats.facets && Object.keys(searchStats.facets).length > 0 && (
            <div className="search-facets">
              {Object.entries(searchStats.facets).map(([key, values]) => (
                <div key={key} className="facet-group">
                  <span className="facet-label">{key}:</span>
                  {values.slice(0, 3).map(value => (
                    <button 
                      key={value.name}
                      className="facet-value"
                      onClick={() => handleFilterChange(key.toLowerCase(), value.name)}
                    >
                      {value.name} ({value.count})
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="results-list">
        {results.map(result => (
          <div key={result.id}>
            {renderResultItem(result)}
          </div>
        ))}
      </div>

      {loading && (
        <div className="loading-more">
          <div className="spinner" />
          <p>Searching...</p>
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="no-results">
          <Search size={48} />
          <h3>No results found</h3>
          <p>Try adjusting your search terms or filters</p>
        </div>
      )}

      {!loading && hasMore && results.length > 0 && (
        <button className="load-more-btn" onClick={handleLoadMore}>
          Load More Results
        </button>
      )}
    </div>
  )

  const renderRecentSearches = () => (
    recentSearches.length > 0 && !query && (
      <div className="recent-searches">
        <h3>Recent Searches</h3>
        <div className="recent-list">
          {recentSearches.map((search, index) => (
            <button
              key={index}
              className="recent-item"
              onClick={() => {
                setQuery(search)
                performSearch(true)
              }}
            >
              <Clock size={14} />
              {search}
            </button>
          ))}
        </div>
      </div>
    )
  )

  const renderTrendingSearches = () => (
    !query && (
      <div className="trending-searches">
        <h3>Trending Searches</h3>
        <div className="trending-grid">
          {['Web3', 'NFTs', 'DeFi', 'Gaming', 'AI', 'Crypto'].map(term => (
            <button
              key={term}
              className="trending-item"
              onClick={() => {
                setQuery(term)
                performSearch(true)
              }}
            >
              <TrendingUp size={14} />
              {term}
            </button>
          ))}
        </div>
      </div>
    )
  )

  return (
    <div className="advanced-search-modal">
      <div className="advanced-search-container">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)] sticky top-0 bg-white z-10">
          <div className="header-title">
            <Zap size={24} />
            <h2>Advanced Search</h2>
            <span className="powered-by">Powered by Elasticsearch</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {renderSearchBar()}
        {renderFilters()}

        <div className="search-content">
          {results.length > 0 ? (
            renderResults()
          ) : (
            <>
              {renderRecentSearches()}
              {renderTrendingSearches()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}




export default AdvancedSearch
