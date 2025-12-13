import React, { useState, useEffect } from 'react'
import { Bookmark, Search, X, Calendar, User, Heart, MessageSquare, Hash, Trash2 } from 'lucide-react'
const BookmarksPanel = ({ user, onClose }) => {
  const [bookmarks, setBookmarks] = useState([])
  const [filteredBookmarks, setFilteredBookmarks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookmarks()
  }, [])

  useEffect(() => {
    filterBookmarks()
  }, [searchQuery, filterType, bookmarks])

  const fetchBookmarks = async () => {
    setLoading(true)
    try {
      // Simulated data - replace with actual API call
      const mockBookmarks = [
        {
          id: '1',
          type: 'post',
          title: 'Understanding Web3 Architecture',
          author: 'CryptoExpert',
          community: 'Web3Development',
          content: 'A comprehensive guide to Web3 architecture...',
          savedAt: new Date('2024-01-15'),
          likes: 234,
          comments: 45
        },
        {
          id: '2',
          type: 'post',
          title: 'Best NFT Marketplaces 2024',
          author: 'NFTCollector',
          community: 'NFTs',
          content: 'Detailed comparison of top NFT marketplaces...',
          savedAt: new Date('2024-01-14'),
          likes: 189,
          comments: 32
        },
        {
          id: '3',
          type: 'comment',
          title: 'Re: DeFi Strategies',
          author: 'DeFiMaster',
          community: 'CryptoTrading',
          content: 'Great point about yield farming risks...',
          savedAt: new Date('2024-01-13'),
          likes: 45,
          comments: 8
        }
      ]
      setBookmarks(mockBookmarks)
      setFilteredBookmarks(mockBookmarks)
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterBookmarks = () => {
    let filtered = [...bookmarks]
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(b => b.type === filterType)
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(b => 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.community.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    setFilteredBookmarks(filtered)
  }

  const removeBookmark = async (bookmarkId) => {
    try {
      // API call to remove bookmark
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
    }
  }

  const formatDate = (date) => {
    const diff = Date.now() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white border-l z-50 flex flex-col" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="header-title flex items-center gap-2">
          <Bookmark size={24} style={{ color: 'var(--text-primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Saved Posts</h2>
          <span className="bookmark-count px-2 py-1 rounded-lg text-sm font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>{bookmarks.length}</span>
        </div>
        <button className="close-btn p-2 rounded-lg hover:bg-[#F8F9FA] transition-colors" onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
          <X size={20} />
        </button>
      </div>

      <div className="bookmarks-toolbar p-4 space-y-3">
        <div className="search-box relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search saved posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm outline-none focus:border-[#58a6ff]/50"
            style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
          />
        </div>

        <div className="filter-buttons flex gap-2">
          <button
            className={`filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'all' ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white shadow-lg' : 'hover:bg-[#F8F9FA]'}`}
            style={filterType !== 'all' ? { background: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button
            className={`filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'post' ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white shadow-lg' : 'hover:bg-[#F8F9FA]'}`}
            style={filterType !== 'post' ? { background: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}}
            onClick={() => setFilterType('post')}
          >
            Posts
          </button>
          <button
            className={`filter-btn px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterType === 'comment' ? 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white shadow-lg' : 'hover:bg-[#F8F9FA]'}`}
            style={filterType !== 'comment' ? { background: 'var(--bg-secondary)', color: 'var(--text-secondary)' } : {}}
            onClick={() => setFilterType('comment')}
          >
            Comments
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="loading-state text-center py-12">
            <div className="spinner w-12 h-12 border-4 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p style={{ color: 'var(--text-secondary)' }}>Loading saved posts...</p>
          </div>
        ) : filteredBookmarks.length > 0 ? (
          <div className="bookmarks-list space-y-3">
            {filteredBookmarks.map(bookmark => (
              <div key={bookmark.id} className="p-4 bg-white border rounded-xl mb-3 hover:shadow-md transition-all" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="bookmark-header flex items-start justify-between mb-2">
                  <div className="bookmark-meta flex items-center gap-2 flex-wrap text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="bookmark-type px-2 py-1 rounded-md" style={{ background: 'var(--bg-secondary)' }}>{bookmark.type}</span>
                    <span className="bookmark-community flex items-center gap-1">
                      <Hash size={12} />
                      {bookmark.community}
                    </span>
                    <span className="bookmark-date flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(bookmark.savedAt)}
                    </span>
                  </div>
                  <button
                    className="remove-btn p-1.5 rounded-lg hover:bg-[#F8F9FA] transition-colors"
                    onClick={() => removeBookmark(bookmark.id)}
                    title="Remove bookmark"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h3 className="bookmark-title font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{bookmark.title}</h3>

                <p className="bookmark-content text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{bookmark.content}</p>

                <div className="bookmark-footer flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <div className="bookmark-author flex items-center gap-1">
                    <User size={12} />
                    {bookmark.author}
                  </div>
                  <div className="bookmark-stats flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart size={12} />
                      {bookmark.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      {bookmark.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state text-center py-12">
            <Bookmark size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No saved posts</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {searchQuery || filterType !== 'all'
                ? 'No posts match your filters'
                : 'Posts you save will appear here'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}



export default BookmarksPanel