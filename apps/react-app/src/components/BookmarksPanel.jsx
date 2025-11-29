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
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-gray-900/95 border-l border-gray-700/50 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="header-title">
          <Bookmark size={24} />
          <h2>Saved Posts</h2>
          <span className="bookmark-count">{bookmarks.length}</span>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="bookmarks-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search saved posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterType === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setFilterType('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterType === 'post' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setFilterType('post')}
          >
            Posts
          </button>
          <button
            className={`filter-btn ${filterType === 'comment' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setFilterType('comment')}
          >
            Comments
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading saved posts...</p>
          </div>
        ) : filteredBookmarks.length > 0 ? (
          <div className="bookmarks-list">
            {filteredBookmarks.map(bookmark => (
              <div key={bookmark.id} className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl mb-3 hover:bg-gray-800/60 transition-all">
                <div className="bookmark-header">
                  <div className="bookmark-meta">
                    <span className="bookmark-type">{bookmark.type}</span>
                    <span className="bookmark-community">
                      <Hash size={12} />
                      {bookmark.community}
                    </span>
                    <span className="bookmark-date">
                      <Calendar size={12} />
                      {formatDate(bookmark.savedAt)}
                    </span>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeBookmark(bookmark.id)}
                    title="Remove bookmark"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <h3 className="bookmark-title">{bookmark.title}</h3>
                
                <p className="bookmark-content">{bookmark.content}</p>
                
                <div className="bookmark-footer">
                  <div className="bookmark-author">
                    <User size={12} />
                    {bookmark.author}
                  </div>
                  <div className="bookmark-stats">
                    <span>
                      <Heart size={12} />
                      {bookmark.likes}
                    </span>
                    <span>
                      <MessageSquare size={12} />
                      {bookmark.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Bookmark size={48} />
            <h3>No saved posts</h3>
            <p>
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