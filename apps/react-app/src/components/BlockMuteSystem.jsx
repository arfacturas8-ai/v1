import React, { useState, useEffect } from 'react'
import { 
  Shield, VolumeX, UserX, Clock, Search, 
  Trash2, AlertCircle, Check, X, Info,
  Eye, EyeOff, MessageSquareOff, Ban
} from 'lucide-react'
const BlockMuteSystem = ({ currentUser, onClose }) => {
  const [activeTab, setActiveTab] = useState('blocked')
  const [searchQuery, setSearchQuery] = useState('')
  const [blockedUsers, setBlockedUsers] = useState([])
  const [mutedUsers, setMutedUsers] = useState([])
  const [keywords, setKeywords] = useState([])
  const [newKeyword, setNewKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(null)

  useEffect(() => {
    loadBlockMuteData()
  }, [])

  const loadBlockMuteData = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API calls
      const mockBlockedUsers = [
        {
          id: '1',
          username: 'ToxicUser123',
          displayName: 'Toxic User',
          avatar: '🚫',
          blockedDate: new Date('2024-01-10'),
          reason: 'Harassment and spam',
          postsHidden: 45,
          commentsHidden: 127
        },
        {
          id: '2',
          username: 'SpamBot99',
          displayName: 'Spam Bot',
          avatar: '🤖',
          blockedDate: new Date('2024-01-08'),
          reason: 'Automated spam',
          postsHidden: 231,
          commentsHidden: 0
        }
      ]

      const mockMutedUsers = [
        {
          id: '3',
          username: 'LoudPoster',
          displayName: 'Loud Poster',
          avatar: '📢',
          mutedDate: new Date('2024-01-12'),
          muteDuration: 'permanent',
          reason: 'Too many posts',
          hideOptions: {
            posts: true,
            comments: false,
            messages: true
          }
        },
        {
          id: '4',
          username: 'Advertiser22',
          displayName: 'Ad Account',
          avatar: '📣',
          mutedDate: new Date('2024-01-11'),
          muteDuration: '7 days',
          muteExpiry: new Date('2024-01-18'),
          reason: 'Promotional content',
          hideOptions: {
            posts: true,
            comments: true,
            messages: false
          }
        }
      ]

      const mockKeywords = [
        { id: '1', keyword: 'crypto scam', addedDate: new Date('2024-01-05'), matchCount: 23 },
        { id: '2', keyword: 'fake giveaway', addedDate: new Date('2024-01-03'), matchCount: 15 },
        { id: '3', keyword: 'spam link', addedDate: new Date('2024-01-01'), matchCount: 67 }
      ]

      setBlockedUsers(mockBlockedUsers)
      setMutedUsers(mockMutedUsers)
      setKeywords(mockKeywords)
    } catch (error) {
      console.error('Failed to load block/mute data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (userId) => {
    try {
      // API call to unblock user
      setBlockedUsers(prev => prev.filter(u => u.id !== userId))
      setShowConfirmModal(null)
    } catch (error) {
      console.error('Failed to unblock user:', error)
    }
  }

  const handleUnmute = async (userId) => {
    try {
      // API call to unmute user
      setMutedUsers(prev => prev.filter(u => u.id !== userId))
      setShowConfirmModal(null)
    } catch (error) {
      console.error('Failed to unmute user:', error)
    }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return

    try {
      // API call to add keyword
      const keyword = {
        id: Date.now().toString(),
        keyword: newKeyword.toLowerCase(),
        addedDate: new Date(),
        matchCount: 0
      }
      setKeywords(prev => [...prev, keyword])
      setNewKeyword('')
    } catch (error) {
      console.error('Failed to add keyword:', error)
    }
  }

  const handleRemoveKeyword = async (keywordId) => {
    try {
      // API call to remove keyword
      setKeywords(prev => prev.filter(k => k.id !== keywordId))
    } catch (error) {
      console.error('Failed to remove keyword:', error)
    }
  }

  const updateMuteOptions = async (userId, option, value) => {
    try {
      // API call to update mute options
      setMutedUsers(prev => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              hideOptions: { 
                ...user.hideOptions, 
                [option]: value 
              }
            }
          : user
      ))
    } catch (error) {
      console.error('Failed to update mute options:', error)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Unknown'
    const diff = Date.now() - date.getTime()
    if (diff < 86400000) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`
    return date.toLocaleDateString()
  }

  const getRemainingTime = (expiryDate) => {
    if (!expiryDate) return null
    const diff = expiryDate.getTime() - Date.now()
    if (diff <= 0) return 'Expired'
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h remaining`
    return `${Math.floor(diff / 86400000)}d remaining`
  }

  const filteredData = () => {
    let data = []
    if (activeTab === 'blocked') data = blockedUsers
    else if (activeTab === 'muted') data = mutedUsers
    else return keywords.filter(k => 
      k.keyword.includes(searchQuery.toLowerCase())
    )

    if (!searchQuery) return data

    return data.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[10000] p-5">
      <div className="bg-gray-900/95 border border-gray-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-700/50 bg-gray-900">
          <div className="flex items-center gap-3">
            <Shield size={24} />
            <h2>Privacy & Safety</h2>
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 p-4 bg-gray-900/50 border-b border-gray-700/50">
          <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'blocked' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setActiveTab('blocked')}
          >
            <UserX size={16} />
            Blocked Users
            <span className="ml-auto px-2 py-0.5 bg-gray-700 rounded-full text-xs font-semibold">{blockedUsers.length}</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'muted' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setActiveTab('muted')}
          >
            <VolumeX size={16} />
            Muted Users
            <span className="ml-auto px-2 py-0.5 bg-gray-700 rounded-full text-xs font-semibold">{mutedUsers.length}</span>
          </button>
          <button 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${activeTab === 'keywords' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            onClick={() => setActiveTab('keywords')}
          >
            <MessageSquareOff size={16} />
            Filtered Keywords
            <span className="ml-auto px-2 py-0.5 bg-gray-700 rounded-full text-xs font-semibold">{keywords.length}</span>
          </button>
        </div>

        {activeTab !== 'keywords' && (
          <div className="p-4 bg-gray-900/30 border-b border-gray-700/50">
            <div className="relative flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg">
              <Search size={16} />
              <input
                type="text"
                placeholder={`Search ${activeTab} users...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="p-4 bg-gray-900/30 border-b border-gray-700/50 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a keyword to filter..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
              />
              <button 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-all"
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
              >
                Add
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <Info size={14} />
              <span>Posts and comments containing these keywords will be hidden</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-10 h-10 border-3 border-gray-600 border-t-blue-500 rounded-full  mb-4" />
              <p></p>
            </div>
          ) : activeTab === 'keywords' ? (
            keywords.length > 0 ? (
              <div className="flex flex-col gap-3">
                {filteredData().map(keyword => (
                  <div key={keyword.id} className="flex items-center justify-between p-4 bg-gray-800/40 border border-gray-700/50 rounded-lg hover:bg-gray-800/60 transition-all">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-white block">{keyword.keyword}</span>
                      <div className="flex gap-4 text-xs text-gray-500 mt-1">
                        <span>{keyword.matchCount} matches</span>
                        <span>Added {formatDate(keyword.addedDate)}</span>
                      </div>
                    </div>
                    <button 
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg font-medium text-sm transition-all"
                      onClick={() => handleRemoveKeyword(keyword.id)}
                      title="Remove keyword"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
                <MessageSquareOff size={48} />
                <h3>No filtered keywords</h3>
                <p>Add keywords to automatically hide content</p>
              </div>
            )
          ) : filteredData().length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredData().map(user => (
                <div key={user.id} className="flex items-start gap-4 p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl hover:bg-gray-800/60 transition-all">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
                    <span className="text-2xl">{user.avatar}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3>{user.displayName}</h3>
                      <span className="username">@{user.username}</span>
                    </div>
                    
                    <p className="text-sm text-gray-400 mb-2">{user.reason}</p>
                    
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {activeTab === 'blocked' ? 'Blocked' : 'Muted'} {formatDate(user.blockedDate || user.mutedDate)}
                      </span>
                      
                      {user.muteExpiry && (
                        <span className="meta-item expiry">
                          <Clock size={12} />
                          {getRemainingTime(user.muteExpiry)}
                        </span>
                      )}
                      
                      {user.postsHidden !== undefined && (
                        <span className="flex items-center gap-1">
                          <EyeOff size={12} />
                          {user.postsHidden} posts, {user.commentsHidden} comments hidden
                        </span>
                      )}
                    </div>

                    {user.hideOptions && (
                      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-700/50">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.hideOptions.posts}
                            onChange={(e) => updateMuteOptions(user.id, 'posts', e.target.checked)}
                          />
                          <span>Hide posts</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.hideOptions.comments}
                            onChange={(e) => updateMuteOptions(user.id, 'comments', e.target.checked)}
                          />
                          <span>Hide comments</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.hideOptions.messages}
                            onChange={(e) => updateMuteOptions(user.id, 'messages', e.target.checked)}
                          />
                          <span>Hide messages</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg font-medium text-sm transition-all"
                      onClick={() => setShowConfirmModal({ 
                        type: activeTab, 
                        user 
                      })}
                    >
                      {activeTab === 'blocked' ? 'Unblock' : 'Unmute'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-center">
              {activeTab === 'blocked' ? (
                <>
                  <UserX size={48} />
                  <h3>No blocked users</h3>
                  <p>Users you block will appear here</p>
                </>
              ) : (
                <>
                  <VolumeX size={48} />
                  <h3>No muted users</h3>
                  <p>Users you mute will appear here</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Privacy Info */}
        <div className="p-4 bg-gray-900/50 border-t border-gray-700/50 flex flex-col sm:flex-row gap-3">
          <div className="flex items-start gap-3 p-3 bg-gray-800/40 border border-gray-700/50 rounded-lg flex-1">
            <Ban size={16} />
            <div>
              <strong>Blocking</strong> prevents users from seeing your posts, commenting, or messaging you
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-800/40 border border-gray-700/50 rounded-lg flex-1">
            <VolumeX size={16} />
            <div>
              <strong>Muting</strong> hides content from users without them knowing
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[10001] p-5">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full text-center">
            <AlertCircle size={32} />
            <h3>
              {showConfirmModal.type === 'blocked' ? 'Unblock' : 'Unmute'} {showConfirmModal.user.displayName}?
            </h3>
            <p>
              {showConfirmModal.type === 'blocked' 
                ? 'This user will be able to see your content and interact with you again.'
                : 'You will start seeing content from this user again.'}
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg font-medium transition-all"
                onClick={() => setShowConfirmModal(null)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
                onClick={() => {
                  if (showConfirmModal.type === 'blocked') {
                    handleUnblock(showConfirmModal.user.id)
                  } else {
                    handleUnmute(showConfirmModal.user.id)
                  }
                }}
              >
                {showConfirmModal.type === 'blocked' ? 'Unblock' : 'Unmute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



export default BlockMuteSystem