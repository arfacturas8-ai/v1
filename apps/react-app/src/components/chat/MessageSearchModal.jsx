import React, { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { X, Search, Calendar, User, Hash, Filter } from 'lucide-react'
import { useResponsive } from '../../hooks/useResponsive'

const MessageSearchModal = ({ isOpen, onClose, messages, onJumpToMessage }) => {
  const { isMobile, isTablet } = useResponsive()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchFilters, setSearchFilters] = useState({
    user: '',
    channel: '',
    dateRange: 'all'
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const filtered = messages.filter(message => {
      const matchesQuery = message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          message.username.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesUser = !searchFilters.user || 
                         message.username.toLowerCase().includes(searchFilters.user.toLowerCase())
      
      const matchesChannel = !searchFilters.channel || 
                            message.channelId === searchFilters.channel

      let matchesDate = true
      if (searchFilters.dateRange !== 'all') {
        const messageDate = new Date(message.timestamp)
        const now = new Date()
        
        switch (searchFilters.dateRange) {
          case 'today':
            matchesDate = messageDate.toDateString() === now.toDateString()
            break
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            matchesDate = messageDate >= weekAgo
            break
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            matchesDate = messageDate >= monthAgo
            break
        }
      }

      return matchesQuery && matchesUser && matchesChannel && matchesDate
    }).slice(0, 50)

    setSearchResults(filtered)
  }, [searchQuery, messages, searchFilters])

  const highlightText = (text, query) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-accent-cyan/30 text-accent-cyan rounded px-1">$1</mark>')
  }

  const clearFilters = () => {
    setSearchFilters({
      user: '',
      channel: '',
      dateRange: 'all'
    })
  }

  if (!isOpen) return null

  return (
    <div style={{background: "var(--bg-primary)"}} className="fixed inset-0 flex items-center justify-center p-4 z-50 /70 backdrop-blur-sm" onClick={onClose}>
      <div
        style={{borderColor: "var(--border-subtle)"}} className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-[rgba(22,27,34,0.6)]  rounded-2xl border  shadow-[0_20px_60px_rgba(0,0,0,0.4),0_8px_32px_rgba(0,82,255,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{borderColor: "var(--border-subtle)"}} className="px-4 sm:px-6 py-4 flex items-center justify-between border-b ">
          <div className="flex items-center gap-3">
            <Search style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <h3 className="font-semibold text-base sm:text-lg">Search Messages</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} className="text-tertiary group-hover:text-primary" />
          </button>
        </div>
        
        {/* Search Input */}
        <div className="px-4 sm:px-6 py-4">
          <div className="relative">
            <Search style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search messages, users, or content..."
              style={{borderColor: "var(--border-subtle)"}} className="w-full h-12 pl-10 pr-12 bg-white/5 border  rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Filters"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div style={{borderColor: "var(--border-subtle)"}} className="px-4 sm:px-6 py-4 bg-white/5 border-y ">
            <div className="space-y-4">
              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <User size={14} className="inline mr-2" />
                  From User
                </label>
                <input
                  type="text"
                  placeholder="Username..."
                  style={{borderColor: "var(--border-subtle)"}} className="w-full px-3 py-2 bg-white/5 border  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  value={searchFilters.user}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, user: e.target.value }))}
                />
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar size={14} className="inline mr-2" />
                  Date Range
                </label>
                <select
                  style={{borderColor: "var(--border-subtle)"}} className="w-full px-3 py-2 bg-white/5 border  rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  value={searchFilters.dateRange}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium min-h-[44px]"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Results */}
        <div className="flex-1 overflow-hidden px-4 sm:px-6 py-4">
          {searchQuery && (
            <div className="text-sm text-secondary mb-3">
              {searchResults.length} results for "{searchQuery}"
              {(searchFilters.user || searchFilters.dateRange !== 'all') && ' (filtered)'}
            </div>
          )}

          <div className="h-[300px] sm:h-[400px] overflow-y-auto scrollbar-thin">
            {searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((message) => (
                  <div
                    key={message.id}
                    style={{borderColor: "var(--border-subtle)"}} className="p-3 sm:p-4 rounded-xl border  hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => {
                      onJumpToMessage(message)
                      onClose()
                    }}
                  >
                    {/* Message Header */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <div style={{color: "var(--text-primary)", width: "48px", height: "48px", flexShrink: 0}}>
                        {message.username?.[0] || '?'}
                      </div>
                      <span className="font-medium text-sm sm:text-base">
                        {message.username}
                      </span>
                      <span className="text-xs text-tertiary">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                      {message.channelId && (
                        <div className="flex items-center gap-1 text-xs">
                          <Hash size={12} />
                          <span>{message.channelId}</span>
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className="text-secondary text-sm line-clamp-3 mt-2 hover:text-primary transition-colors"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(highlightText(message.content, searchQuery))
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Search size={48} className="text-tertiary mb-4" />
                <h4 className="font-medium text-base sm:text-lg mb-2">No messages found</h4>
                <p className="text-tertiary text-sm">
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Search size={48} className="text-tertiary mb-4" />
                <h4 className="font-medium text-base sm:text-lg mb-2">Search Messages</h4>
                <p className="text-tertiary text-sm">
                  Search through all messages in this server
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Search Tips */}
        {!searchQuery && (
          <div style={{borderColor: "var(--border-subtle)"}} className="px-4 sm:px-6 py-4 border-t ">
            <div style={{borderColor: "var(--border-subtle)"}} className="p-3 rounded-xl bg-white/5 border ">
              <h5 className="font-medium text-sm mb-2">Search Tips:</h5>
              <div className="text-xs text-tertiary space-y-1">
                <div>• Use quotes for exact phrases: "hello world"</div>
                <div>• Search by user with @ prefix: @username</div>
                <div>• Filter by date range using the filters above</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: var(--bg-tertiary);
          border-radius: 2px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: var(--border-primary);
        }
      `}</style>
    </div>
  )
}



export default MessageSearchModal