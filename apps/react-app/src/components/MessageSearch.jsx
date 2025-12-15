import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Filter, ArrowUp, ArrowDown, MessageCircle, ChevronLeft } from 'lucide-react'

function MessageSearch({ 
  isOpen, 
  onClose, 
  messages = [], 
  onMessageSelect,
  currentChannelId,
  channels = [],
  isMobile = false
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [currentResultIndex, setCurrentResultIndex] = useState(-1)
  const [filters, setFilters] = useState({
    user: '',
    dateFrom: '',
    dateTo: '',
    channel: currentChannelId || ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  
  const searchInputRef = useRef(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim() || Object.values(filters).some(v => v)) {
      performSearch()
    } else {
      setSearchResults([])
      setCurrentResultIndex(-1)
    }
  }, [searchQuery, filters, messages])

  const performSearch = useCallback(async () => {
    setIsSearching(true)
    
    // Add small delay for mobile to show loading state
    if (isMobile) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    let filteredMessages = messages

    // Filter by channel
    if (filters.channel) {
      filteredMessages = filteredMessages.filter(msg => msg.channelId === filters.channel)
    }

    // Filter by user
    if (filters.user) {
      filteredMessages = filteredMessages.filter(msg => 
        msg.username.toLowerCase().includes(filters.user.toLowerCase())
      )
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.timestamp) >= fromDate
      )
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.timestamp) <= toDate
      )
    }

    // Text search with better mobile performance
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredMessages = filteredMessages.filter(msg =>
        msg.content.toLowerCase().includes(query)
      )
    }

    // Sort by timestamp (newest first)
    const sorted = filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    // Limit results on mobile for better performance
    const limitedResults = isMobile ? sorted.slice(0, 50) : sorted
    
    setSearchResults(limitedResults)
    setCurrentResultIndex(limitedResults.length > 0 ? 0 : -1)
    setIsSearching(false)
  }, [messages, filters, searchQuery, isMobile])

  const navigateResults = (direction) => {
    if (searchResults.length === 0) return

    let newIndex
    if (direction === 'up') {
      newIndex = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1
    } else {
      newIndex = currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0
    }
    
    setCurrentResultIndex(newIndex)
    if (searchResults[newIndex]) {
      onMessageSelect(searchResults[newIndex])
    }
  }

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      if (searchResults.length > 0 && currentResultIndex >= 0) {
        onMessageSelect(searchResults[currentResultIndex])
        onClose()
      }
    } else if (!isMobile) {
      // Desktop keyboard navigation
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        navigateResults('up')
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        navigateResults('down')
      }
    }
  }, [searchResults, currentResultIndex, onMessageSelect, onClose, isMobile, navigateResults])

  const clearFilters = useCallback(() => {
    setFilters({
      user: '',
      dateFrom: '',
      dateTo: '',
      channel: currentChannelId || ''
    })
    setSearchQuery('')
  }, [currentChannelId])

  const formatTime = useCallback((timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    
    if (diffHours < 24) {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } else if (diffDays < 7) {
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
      }).format(date)
    }
  }, [])

  const highlightText = useCallback((text, query) => {
    if (!query.trim()) {
      // Truncate text on mobile for better performance
      return isMobile && text.length > 120 ? text.slice(0, 120) + '...' : text
    }
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    let displayText = text
    
    // Truncate on mobile but keep highlighted parts
    if (isMobile && text.length > 120) {
      const match = text.toLowerCase().indexOf(query.toLowerCase())
      if (match !== -1) {
        const start = Math.max(0, match - 40)
        const end = Math.min(text.length, match + query.length + 40)
        displayText = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '')
      } else {
        displayText = text.slice(0, 120) + '...'
      }
    }
    
    const parts = displayText.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} style={{
  borderRadius: '4px',
  paddingLeft: '4px',
  paddingRight: '4px'
}} style={{
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          color: 'var(--accent-primary)'
        }}>
          {part}
        </mark>
      ) : part
    )
  }, [isMobile])

  if (!isOpen) return null

  if (!isOpen) return null

  const containerStyles = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-primary)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  }

  return (
    <div style={{
  position: 'fixed',
  display: 'flex'
}} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
      {isMobile ? (
        /* Mobile full-screen search */
        <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}} style={containerStyles}>
          {/* Mobile header */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  padding: '16px'
}} style={{ borderColor: 'var(--border-primary)' }}>
            <button
              onClick={onClose}
              style={{
  padding: '8px',
  borderRadius: '12px'
}}
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.target.style.color = 'var(--text-primary)'; e.target.style.backgroundColor = 'var(--hover-bg)' }}
              onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.backgroundColor = 'transparent' }}
            >
              <ChevronLeft size={20} />
            </button>
            <h2 style={{
  fontWeight: '600'
}} style={{ color: 'var(--text-primary)' }}>Search Messages</h2>
          </div>
          
          {/* Mobile search input */}
          <div style={{
  padding: '16px'
}} style={{ borderColor: 'var(--border-primary)' }}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  padding: '12px',
  borderRadius: '12px'
}} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <Search size={20} style={{ color: 'var(--accent-primary)' }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search messages..."
                style={{
  flex: '1',
  background: 'transparent'
}}
                style={{ color: 'var(--text-primary)' }}
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
  padding: '8px',
  borderRadius: '12px'
}}
                style={{
                  color: showFilters ? 'var(--accent-primary)' : 'var(--text-muted)',
                  backgroundColor: showFilters ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
                }}
              >
                <Filter size={18} />
              </button>
            </div>
            
            {/* Mobile filters */}
            {showFilters && (
              <div style={{
  padding: '12px',
  borderRadius: '12px'
}} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div>
                  <label style={{
  display: 'block'
}} style={{ color: 'var(--text-muted)' }}>User</label>
                  <input
                    type="text"
                    value={filters.user}
                    onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="Username..."
                    style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)'
}}
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{
  display: 'block'
}} style={{ color: 'var(--text-muted)' }}>Channel</label>
                  <select
                    value={filters.channel}
                    onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
                    style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)'
}}
                    style={{
                      backgroundColor: 'var(--bg-primary)',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">All channels</option>
                    {channels.map(channel => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{
  display: 'grid',
  gap: '12px'
}}>
                  <div>
                    <label style={{
  display: 'block'
}} style={{ color: 'var(--text-muted)' }}>From</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)'
}}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
  display: 'block'
}} style={{ color: 'var(--text-muted)' }}>To</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      style={{
  width: '100%',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)'
}}
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>
                
                <button
                  onClick={clearFilters}
                  style={{
  width: '100%',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          
          {/* Mobile results */}
          <div style={{
  flex: '1'
}} ref={resultsRef}>
            {isSearching ? (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px'
}}>
                <div style={{
  borderRadius: '50%',
  height: '32px',
  width: '32px'
}} style={{ borderColor: 'var(--accent-primary)' }}></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div style={{
  padding: '16px'
}}>
                <div className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
                {searchResults.map((message, index) => (
                  <button
                    key={message.id}
                    onClick={() => {
                      onMessageSelect(message)
                      onClose()
                    }}
                    style={{
  width: '100%',
  textAlign: 'left',
  padding: '16px',
  borderRadius: '12px'
}}
                    style={{
                      backgroundColor: index === currentResultIndex ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-tertiary)',
                      border: index === currentResultIndex ? '1px solid var(--accent-primary)' : '1px solid transparent'
                    }}
                  >
                    <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                      <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}} 
                           style={{ backgroundColor: 'var(--accent-primary)' }}>
                        {message.avatar}
                      </div>
                      <div style={{
  flex: '1'
}}>
                        <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                          <span style={{
  fontWeight: '500'
}} style={{ color: 'var(--text-primary)' }}>
                            {message.username}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {formatTime(message.timestamp)}
                          </span>
                          {message.channelId && (
                            <span className="text-xs" style={{ color: 'var(--accent-primary)' }}>
                              #{channels.find(c => c.id === message.channelId)?.name || 'Unknown'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {highlightText(message.content, searchQuery)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() || Object.values(filters).some(v => v) ? (
              <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px',
  textAlign: 'center'
}}>
                <MessageCircle style={{
  width: '64px',
  height: '64px'
}} style={{ color: 'var(--text-muted)' }} />
                <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No messages found</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div style={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px',
  textAlign: 'center'
}}>
                <Search style={{
  width: '64px',
  height: '64px'
}} style={{ color: 'var(--text-muted)' }} />
                <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>Search Messages</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Start typing to find messages across all channels</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Desktop modal */
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingLeft: '16px',
  paddingRight: '16px',
  width: '100%'
}}>
          <div style={{
  borderRadius: '12px',
  width: '100%',
  overflow: 'hidden'
}} style={containerStyles}>
            {/* Desktop Header */}
            <div style={{
  padding: '16px'
}} style={{ borderColor: 'var(--border-primary)' }}>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <Search size={20} style={{ color: 'var(--accent-primary)' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search messages..."
                  style={{
  flex: '1',
  background: 'transparent'
}}
                  style={{ color: 'var(--text-primary)' }}
                />
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
  padding: '4px',
  borderRadius: '4px'
}}
                    style={{
                      color: showFilters ? 'var(--accent-primary)' : 'var(--text-muted)',
                      backgroundColor: showFilters ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
                    }}
                    title="Filters"
                    onMouseEnter={(e) => !showFilters && (e.target.style.color = 'var(--accent-primary)')}
                    onMouseLeave={(e) => !showFilters && (e.target.style.color = 'var(--text-muted)')}
                  >
                    <Filter size={16} />
                  </button>
                  <button
                    onClick={onClose}
                    style={{
  padding: '4px'
}}
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Desktop Filters */}
              {showFilters && (
                <div style={{
  padding: '12px',
  borderRadius: '12px'
}} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div style={{
  display: 'grid',
  gap: '12px'
}}>
                    <div>
                      <label style={{
  display: 'block'
}} style={{ color: 'var(--text-muted)' }}>User</label>
                      <input
                        type="text"
                        value={filters.user}
                        onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                        placeholder="Username..."
                        style={{
  width: '100%',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
  display: 'block'
}} style={{ color: 'var(--text-muted)' }}>Channel</label>
                      <select
                        value={filters.channel}
                        onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
                        style={{
  width: '100%',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <option value="">All channels</option>
                        {channels.map(channel => (
                          <option key={channel.id} value={channel.id}>
                            #{channel.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{
  display: 'grid',
  gap: '12px'
}}>
                    <div>
                      <label style={{
  display: 'block'
}} style={{ color: 'var(--text-muted)' }}>From Date</label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        style={{
  width: '100%',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
  display: 'block'
}} style={{ color: 'var(--text-muted)' }}>To Date</label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        style={{
  width: '100%',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '4px'
}}
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  </div>
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
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                      onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                    >
                      Clear filters
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop Results Info */}
              {searchResults.length > 0 && (
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    {currentResultIndex >= 0 && ` (${currentResultIndex + 1} of ${searchResults.length})`}
                  </span>
                  <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                    <button
                      onClick={() => navigateResults('up')}
                      disabled={searchResults.length === 0}
                      style={{
  padding: '4px'
}}
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => !e.target.disabled && (e.target.style.color = 'var(--accent-primary)')}
                      onMouseLeave={(e) => !e.target.disabled && (e.target.style.color = 'var(--text-muted)')}
                      title="Previous result"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => navigateResults('down')}
                      disabled={searchResults.length === 0}
                      style={{
  padding: '4px'
}}
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => !e.target.disabled && (e.target.style.color = 'var(--accent-primary)')}
                      onMouseLeave={(e) => !e.target.disabled && (e.target.style.color = 'var(--text-muted)')}
                      title="Next result"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Results */}
            <div className="max-h-96 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div style={{
  padding: '8px'
}}>
                  {searchResults.map((message, index) => (
                    <button
                      key={message.id}
                      onClick={() => {
                        onMessageSelect(message)
                        onClose()
                      }}
                      style={{
  width: '100%',
  textAlign: 'left',
  padding: '12px',
  borderRadius: '12px'
}}
                      style={{
                        backgroundColor: index === currentResultIndex ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-tertiary)',
                        border: index === currentResultIndex ? '1px solid var(--accent-primary)' : '1px solid transparent'
                      }}
                      onMouseEnter={(e) => index !== currentResultIndex && (e.target.style.backgroundColor = 'var(--hover-bg)')}
                      onMouseLeave={(e) => index !== currentResultIndex && (e.target.style.backgroundColor = 'var(--bg-tertiary)')}
                    >
                      <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                        <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}
                             style={{ backgroundColor: 'var(--accent-primary)' }}>
                          {message.avatar}
                        </div>
                        <div style={{
  flex: '1'
}}>
                          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                            <span style={{
  fontWeight: '500'
}} style={{ color: 'var(--text-primary)' }}>{message.username}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatTime(message.timestamp)}</span>
                            {message.channelId && (
                              <span className="text-xs" style={{ color: 'var(--accent-primary)' }}>
                                #{channels.find(c => c.id === message.channelId)?.name || 'Unknown'}
                              </span>
                            )}
                          </div>
                          <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                            {highlightText(message.content, searchQuery)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() || Object.values(filters).some(v => v) ? (
                <div style={{
  padding: '32px',
  textAlign: 'center'
}}>
                  <MessageCircle style={{
  width: '48px',
  height: '48px'
}} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-primary)' }}>No messages found</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your search terms or filters</p>
                </div>
              ) : (
                <div style={{
  padding: '32px',
  textAlign: 'center'
}}>
                  <Search style={{
  width: '48px',
  height: '48px'
}} style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-primary)' }}>Start typing to search messages</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    Use filters to narrow down your search
                  </p>
                </div>
              )}
            </div>

            {/* Desktop Keyboard Shortcuts */}
            <div style={{
  padding: '12px'
}} style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}} style={{ color: 'var(--text-muted)' }}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <span><kbd style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  borderRadius: '4px'
}} style={{ backgroundColor: 'var(--bg-primary)' }}>↑↓</kbd> Navigate</span>
                  <span><kbd style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  borderRadius: '4px'
}} style={{ backgroundColor: 'var(--bg-primary)' }}>Enter</kbd> Select</span>
                  <span><kbd style={{
  paddingLeft: '4px',
  paddingRight: '4px',
  borderRadius: '4px'
}} style={{ backgroundColor: 'var(--bg-primary)' }}>Esc</kbd> Close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
        
        input::placeholder, textarea::placeholder {
          color: var(--text-muted) !important;
        }
        
        select option {
          background-color: var(--bg-primary);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  )
}



export default MessageSearch