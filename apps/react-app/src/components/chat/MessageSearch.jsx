import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import DOMPurify from 'dompurify'
import {
  Search, X, Filter, Calendar, User, Hash, FileText, Image,
  Video, Mic, Link, Code, ArrowDown, ArrowUp, Clock, MapPin,
  ChevronDown, ChevronRight, Star, Pin, MessageSquare
} from 'lucide-react'

/**
 * MessageSearch - Advanced Discord-style message search
 * Features: Full-text search, filters, date ranges, file types, user filtering, search history
 */
function MessageSearch({
  onSearch,
  onResultSelect,
  onClose,
  channelId,
  serverId,
  user,
  isMobile = false,
  className = ''
}) {
  // Search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    users: [],
    channels: [],
    dateRange: {
      from: null,
      to: null,
      preset: 'all' // all, today, week, month, year
    },
    messageTypes: {
      text: true,
      files: true,
      images: true,
      videos: true,
      audio: true,
      links: true,
      code: true
    },
    sortBy: 'relevance', // relevance, newest, oldest
    hasReactions: false,
    isPinned: false,
    hasThreads: false,
    mentions: false
  })
  
  // UI state
  const [searchHistory, setSearchHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [expandedResults, setExpandedResults] = useState(new Set())
  const [previewMessage, setPreviewMessage] = useState(null)
  
  // Refs
  const searchInputRef = useRef(null)
  const resultsRef = useRef(null)
  const debounceRef = useRef(null)

  // Mock data - replace with actual API
  const availableUsers = [
    { id: '1', username: 'alice', displayName: 'Alice Cooper', avatar: null },
    { id: '2', username: 'bob', displayName: 'Bob Wilson', avatar: null },
    { id: '3', username: 'charlie', displayName: 'Charlie Brown', avatar: null }
  ]

  const availableChannels = [
    { id: '1', name: 'general', type: 'text' },
    { id: '2', name: 'random', type: 'text' },
    { id: '3', name: 'voice-chat', type: 'voice' }
  ]

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
    
    // Load search history
    const savedHistory = localStorage.getItem('cryb-search-history')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        performSearch(query)
      }, 300)
    } else {
      setResults([])
      setSelectedResultIndex(-1)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, filters])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedResultIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedResultIndex(prev => prev > 0 ? prev - 1 : -1)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedResultIndex >= 0 && results[selectedResultIndex]) {
          handleResultSelect(results[selectedResultIndex])
        }
      } else if (e.key === 'Escape') {
        onClose && onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [results, selectedResultIndex, onClose])

  // Perform search
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      // Build search parameters
      const searchParams = {
        query: searchQuery,
        channelId,
        serverId,
        filters,
        limit: 20
      }

      // Mock API call - replace with actual implementation
      const response = await fetch('/api/search/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      })
      
      const data = await response.json()
      
      setResults(data.results || [])
      setHasMore(data.hasMore || false)
      setSelectedResultIndex(-1)
      
      // Add to search history
      addToSearchHistory(searchQuery)
      
      onSearch && onSearch(searchQuery)
    } catch (error) {
      console.error('Search failed:', error)
      // Mock results for demo
      setResults(generateMockResults(searchQuery))
    } finally {
      setLoading(false)
    }
  }

  // Generate mock results for demo
  const generateMockResults = (searchQuery) => {
    return [
      {
        id: '1',
        content: `This message contains ${searchQuery} and was sent yesterday`,
        author: { id: '1', username: 'alice', avatar: null },
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        channelId: '1',
        channelName: 'general',
        messageType: 'text',
        reactions: [{ emoji: '👍', count: 3, userReacted: false }],
        hasThread: true,
        threadCount: 5,
        isPinned: false,
        mentions: ['@bob'],
        highlights: [`This message contains <mark>${searchQuery}</mark> and was sent yesterday`]
      },
      {
        id: '2',
        content: `Another message with ${searchQuery} that includes an attachment`,
        author: { id: '2', username: 'bob', avatar: null },
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        channelId: '2',
        channelName: 'random',
        messageType: 'file',
        attachments: [{ type: 'image', name: 'screenshot.png' }],
        reactions: [],
        hasThread: false,
        isPinned: true,
        mentions: [],
        highlights: [`Another message with <mark>${searchQuery}</mark> that includes an attachment`]
      }
    ]
  }

  // Add to search history
  const addToSearchHistory = (query) => {
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('cryb-search-history', JSON.stringify(newHistory))
  }

  // Handle result selection
  const handleResultSelect = (result) => {
    onResultSelect && onResultSelect(result)
    setPreviewMessage(result)
  }

  // Filter handlers
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateNestedFilter = (key, subKey, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [subKey]: value
      }
    }))
  }

  const clearFilters = () => {
    setFilters({
      users: [],
      channels: [],
      dateRange: { from: null, to: null, preset: 'all' },
      messageTypes: {
        text: true,
        files: true,
        images: true,
        videos: true,
        audio: true,
        links: true,
        code: true
      },
      sortBy: 'relevance',
      hasReactions: false,
      isPinned: false,
      hasThreads: false,
      mentions: false
    })
  }

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.users.length > 0) count++
    if (filters.channels.length > 0) count++
    if (filters.dateRange.preset !== 'all' || filters.dateRange.from || filters.dateRange.to) count++
    if (!Object.values(filters.messageTypes).every(v => v)) count++
    if (filters.hasReactions) count++
    if (filters.isPinned) count++
    if (filters.hasThreads) count++
    if (filters.mentions) count++
    return count
  }, [filters])

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 86400000) { // Less than 24 hours
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diff < 604800000) { // Less than 7 days
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  // Get message type icon
  const getMessageTypeIcon = (type, attachments = []) => {
    if (type === 'file' && attachments.length > 0) {
      const attachment = attachments[0]
      if (attachment.type.startsWith('image/')) return Image
      if (attachment.type.startsWith('video/')) return Video
      if (attachment.type.startsWith('audio/')) return Mic
      return FileText
    }
    
    switch (type) {
      case 'code': return Code
      case 'link': return Link
      default: return MessageSquare
    }
  }

  return (
    <div style={{
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
      {/* Search Header */}
      <div style={{
  padding: '16px'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <Search style={{
  width: '20px',
  height: '20px',
  color: '#c9d1d9'
}} />
          <h3 style={{
  fontWeight: '600',
  color: '#ffffff'
}}>Search Messages</h3>
          <button
            onClick={onClose}
            style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
          >
            <X style={{
  width: '16px',
  height: '16px'
}} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{
  position: 'relative'
}}>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder="Search messages..."
            style={{
  width: '100%',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}
          />
          <Search style={{
  position: 'absolute',
  width: '16px',
  height: '16px',
  color: '#c9d1d9'
}} />
          
          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
  position: 'absolute',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#c9d1d9'
}}
          >
            <Filter style={{
  width: '16px',
  height: '16px'
}} />
            {activeFilterCount > 0 && (
              <span style={{
  position: 'absolute',
  color: '#ffffff',
  borderRadius: '50%',
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search History */}
          {showHistory && searchHistory.length > 0 && !query && (
            <div style={{
  position: 'absolute',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px'
}}>
              <div style={{
  padding: '8px'
}}>
                <div style={{
  fontWeight: '500',
  color: '#c9d1d9'
}}>Recent searches</div>
                {searchHistory.map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(historyQuery)}
                    style={{
  width: '100%',
  textAlign: 'left',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                  >
                    <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                      <Clock style={{
  width: '16px',
  height: '16px',
  color: '#c9d1d9'
}} />
                      <span>{historyQuery}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '16px'
}}>
          <div style={{
  display: 'grid',
  gap: '16px'
}}>
            {/* Users Filter */}
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
                From Users
              </label>
              <select
                multiple
                value={filters.users}
                onChange={(e) => updateFilter('users', Array.from(e.target.selectedOptions, option => option.value))}
                style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
}}
              >
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    @{user.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Channels Filter */}
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
                In Channels
              </label>
              <select
                multiple
                value={filters.channels}
                onChange={(e) => updateFilter('channels', Array.from(e.target.selectedOptions, option => option.value))}
                style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
}}
              >
                {availableChannels.map(channel => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
                Date Range
              </label>
              <select
                value={filters.dateRange.preset}
                onChange={(e) => updateNestedFilter('dateRange', 'preset', e.target.value)}
                style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
}}
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
}}
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          {/* Message Type Checkboxes */}
          <div className="mt-4">
            <label style={{
  display: 'block',
  fontWeight: '500',
  color: '#c9d1d9'
}}>
              Message Types
            </label>
            <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
              {Object.entries(filters.messageTypes).map(([type, enabled]) => (
                <label key={type} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => updateNestedFilter('messageTypes', type, e.target.checked)}
                    style={{
  borderRadius: '4px'
}}
                  />
                  <span className="text-sm capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px'
}}>
            <label style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <input
                type="checkbox"
                checked={filters.hasReactions}
                onChange={(e) => updateFilter('hasReactions', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
              <span className="text-sm">Has reactions</span>
            </label>
            
            <label style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <input
                type="checkbox"
                checked={filters.isPinned}
                onChange={(e) => updateFilter('isPinned', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
              <span className="text-sm">Pinned messages</span>
            </label>
            
            <label style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <input
                type="checkbox"
                checked={filters.hasThreads}
                onChange={(e) => updateFilter('hasThreads', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
              <span className="text-sm">Has threads</span>
            </label>
            
            <label style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <input
                type="checkbox"
                checked={filters.mentions}
                onChange={(e) => updateFilter('mentions', e.target.checked)}
                style={{
  borderRadius: '4px'
}}
              />
              <span className="text-sm">Mentions me</span>
            </label>
          </div>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <div style={{
  display: 'flex',
  justifyContent: 'flex-end'
}}>
              <button
                onClick={clearFilters}
                style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      <div style={{
  flex: '1'
}}>
        {loading && (
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
            <div style={{
  borderRadius: '50%',
  height: '32px',
  width: '32px'
}}></div>
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
            <Search style={{
  width: '48px',
  height: '48px',
  color: '#c9d1d9'
}} />
            <h3 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>No results found</h3>
            <p style={{
  color: '#c9d1d9'
}}>
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((result, index) => {
              const Icon = getMessageTypeIcon(result.messageType, result.attachments)
              const isSelected = index === selectedResultIndex
              const isExpanded = expandedResults.has(result.id)
              
              return (
                <div
                  key={result.id}
                  style={{
  padding: '16px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                  onClick={() => handleResultSelect(result)}
                >
                  <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                    <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                      {result.author.avatar ? (
                        <img 
                          src={result.author.avatar} 
                          alt={result.author.username}
                          style={{
  width: '100%',
  height: '100%',
  borderRadius: '50%'
}}
                        />
                      ) : (
                        <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                          {result.author.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div style={{
  flex: '1'
}}>
                      <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <span style={{
  fontWeight: '500',
  color: '#ffffff'
}}>
                          {result.author.username}
                        </span>
                        <span style={{
  color: '#c9d1d9'
}}>
                          in #{result.channelName}
                        </span>
                        <span style={{
  color: '#c9d1d9'
}}>
                          {formatTimestamp(result.timestamp)}
                        </span>
                        
                        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                          <Icon style={{
  width: '16px',
  height: '16px',
  color: '#c9d1d9'
}} />
                          {result.isPinned && <Pin style={{
  width: '16px',
  height: '16px'
}} />}
                          {result.hasThread && (
                            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                              <MessageSquare style={{
  width: '16px',
  height: '16px'
}} />
                              <span className="text-xs text-blue-500">{result.threadCount}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{
  color: '#c9d1d9'
}}>
                        {result.highlights && result.highlights.length > 0 ? (
                          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result.highlights[0]) }} />
                        ) : (
                          <div>{result.content}</div>
                        )}
                      </div>
                      
                      {result.attachments && result.attachments.length > 0 && (
                        <div style={{
  display: 'flex',
  alignItems: 'center',
  color: '#c9d1d9'
}}>
                          <FileText style={{
  width: '16px',
  height: '16px'
}} />
                          <span>{result.attachments[0].name}</span>
                        </div>
                      )}
                      
                      {result.reactions && result.reactions.length > 0 && (
                        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                          {result.reactions.map((reaction, i) => (
                            <div key={i} style={{
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
                              <span>{reaction.emoji}</span>
                              <span className="text-xs">{reaction.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedResults(prev => {
                          const newSet = new Set(prev)
                          if (newSet.has(result.id)) {
                            newSet.delete(result.id)
                          } else {
                            newSet.add(result.id)
                          }
                          return newSet
                        })
                      }}
                      style={{
  padding: '4px',
  borderRadius: '4px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                    >
                      {isExpanded ? (
                        <ChevronDown style={{
  width: '16px',
  height: '16px'
}} />
                      ) : (
                        <ChevronRight style={{
  width: '16px',
  height: '16px'
}} />
                      )}
                    </button>
                  </div>
                  
                  {/* Expanded context */}
                  {isExpanded && (
                    <div style={{
  padding: '12px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '4px'
}}>
                      <div style={{
  color: '#c9d1d9'
}}>
                        Message context and surrounding messages would appear here...
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!query && (
          <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
            <Search style={{
  width: '48px',
  height: '48px',
  color: '#c9d1d9'
}} />
            <h3 style={{
  fontWeight: '500',
  color: '#ffffff'
}}>Search Messages</h3>
            <p style={{
  color: '#c9d1d9'
}}>
              Find messages, files, and conversations across all channels
            </p>
          </div>
        )}
      </div>

      {/* Result count */}
      {results.length > 0 && (
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#c9d1d9'
}}>
            <span>{results.length} results found</span>
            {hasMore && (
              <button className="text-blue-600 dark:text-blue-400 hover:underline">
                Load more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



export default MessageSearch