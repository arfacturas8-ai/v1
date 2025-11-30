import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Home,
  Compass,
  Hash,
  Mail,
  Bell,
  User,
  Settings,
  Search,
  Plus,
  TrendingUp,
  Users,
  Wallet,
  Phone,
  Video,
  MessageCircle,
  Heart,
  Share2,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  Flame,
  Clock,
  ChevronRight,
  WifiOff,
  Loader,
  Image as ImageIcon,
  Coins
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useResponsive } from '../hooks/useResponsive'
import { formatNumber, getInitials } from '../lib/utils'
import communityService from '../services/communityService'
import postsService from '../services/postsService'
import apiService from '../services/api'
import socketService from '../services/socket'
import { useWeb3Auth } from '../lib/hooks/useWeb3Auth'
import EnhancedWalletConnectButton from '../components/web3/EnhancedWalletConnectButton'

function HomePage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { isMobile, isTablet } = useResponsive()
  const { state: web3State } = useWeb3Auth()

  // State
  const [posts, setPosts] = useState([])
  const [trendingCommunities, setTrendingCommunities] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [conversations, setConversations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeFilter, setActiveFilter] = useState('hot')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch posts
  const fetchPosts = useCallback(async (filter, pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      const result = await postsService.getPosts({
        sort: filter,
        limit: 15,
        page: pageNum
      })

      if (result.success) {
        const newPosts = result.posts || []
        if (append) {
          setPosts(prev => [...prev, ...newPosts])
        } else {
          setPosts(newPosts)
        }
        setHasMore(newPosts.length === 15)
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // Fetch trending communities
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const result = await communityService.getCommunities({ sort: 'trending', limit: 5 })
        if (result.success) {
          setTrendingCommunities(result.communities || [])
        }
      } catch (err) {
        console.error('Failed to fetch trending:', err)
      }
    }
    fetchTrending()
  }, [])

  // Fetch suggested users
  useEffect(() => {
    const fetchSuggested = async () => {
      if (!user) return
      try {
        const response = await apiService.get('/users/suggestions?limit=3')
        if (response.success && response.data) {
          setSuggestedUsers(response.data.users || [])
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err)
      }
    }
    fetchSuggested()
  }, [user])

  // Fetch recent conversations for DM preview
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return
      try {
        const response = await apiService.get('/messages/conversations?limit=3')
        if (response.success && response.data) {
          setConversations(response.data.conversations || [])
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err)
      }
    }
    fetchConversations()
  }, [user])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return
      try {
        const response = await apiService.get('/notifications?limit=5&unread=true')
        if (response.success && response.data) {
          setNotifications(response.data.notifications || [])
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err)
      }
    }
    fetchNotifications()
  }, [user])

  // Initial fetch
  useEffect(() => {
    setPage(1)
    setHasMore(true)
    fetchPosts(activeFilter, 1, false)
  }, [activeFilter, fetchPosts])

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Socket listeners for real-time
  useEffect(() => {
    if (!user) return

    const handleNewPost = (data) => {
      if (activeFilter === 'new') {
        setPosts(prev => [data.post, ...prev])
      }
    }

    const handleNewMessage = (data) => {
      setConversations(prev => {
        const exists = prev.find(c => c.id === data.conversationId)
        if (exists) {
          return prev.map(c => c.id === data.conversationId ? { ...c, lastMessage: data.message, unreadCount: (c.unreadCount || 0) + 1 } : c)
        }
        return prev
      })
    }

    const handleNewNotification = (data) => {
      setNotifications(prev => [data.notification, ...prev.slice(0, 4)])
    }

    socketService.on('new_post', handleNewPost)
    socketService.on('dm_received', handleNewMessage)
    socketService.on('notification', handleNewNotification)

    return () => {
      socketService.off('new_post', handleNewPost)
      socketService.off('dm_received', handleNewMessage)
      socketService.off('notification', handleNewNotification)
    }
  }, [user, activeFilter])

  // Handlers
  const handleVote = useCallback(async (postId, voteType) => {
    try {
      const result = await postsService.votePost(postId, voteType)
      if (result.success) {
        setPosts(prev => prev.map(post =>
          post.id === postId ? { ...post, score: result.score, userVote: voteType } : post
        ))
      }
    } catch (err) {
      console.error('Vote failed:', err)
    }
  }, [])

  const handleSave = useCallback(async (postId) => {
    try {
      const result = await postsService.savePost(postId)
      if (result.success) {
        setPosts(prev => prev.map(post =>
          post.id === postId ? { ...post, saved: !post.saved } : post
        ))
      }
    } catch (err) {
      console.error('Save failed:', err)
    }
  }, [])

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPosts(activeFilter, nextPage, true)
    }
  }, [page, activeFilter, loadingMore, hasMore, fetchPosts])

  const handleSearch = useCallback((e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }, [searchQuery, navigate])

  const feedFilters = useMemo(() => [
    { id: 'hot', label: 'Hot', icon: Flame },
    { id: 'new', label: 'New', icon: Sparkles },
    { id: 'top', label: 'Top', icon: TrendingUp }
  ], [])

  const navItems = useMemo(() => [
    { id: 'home', label: 'Home', icon: Home, path: '/', active: true },
    { id: 'explore', label: 'Explore', icon: Compass, path: '/communities' },
    { id: 'communities', label: 'Communities', icon: Hash, path: '/communities' },
    { id: 'messages', label: 'Messages', icon: Mail, path: '/messages', badge: conversations.filter(c => c.unreadCount > 0).length || null },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications', badge: notifications.length || null },
    { id: 'profile', label: 'Profile', icon: User, path: user ? `/profile/${user.username}` : '/login' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ], [user, conversations, notifications])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
        <Loader size={40} className="animate-spin text-[#58a6ff]" />
      </div>
    )
  }

  return (
    <div className="flex justify-center min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      {isOffline && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-500/90 backdrop-blur-lg text-white text-center z-40 flex items-center justify-center gap-2 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
          <WifiOff size={16} />
          <span className="font-medium text-sm">Offline mode</span>
        </div>
      )}

      <div className="flex w-full max-w-[1400px] gap-0">
        {/* Left Sidebar - OpenSea Style */}
        <aside className={`w-[280px] sticky top-0 h-screen border-r border-white/10 px-4 py-6 flex-col gap-4 ${isMobile ? 'hidden' : 'flex'}`}>
          <Link to="/" className="flex items-center gap-3 px-3 py-2 mb-4 no-underline group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center shadow-lg">
              <Sparkles size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">CRYB</span>
          </Link>

          <nav className="flex flex-col gap-1 flex-1">
            {navItems.map(item => {
              const Icon = item.icon
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-[#c9d1d9] no-underline text-base font-medium transition-all group hover:bg-[#161b22]/60 backdrop-blur-xl ${
                    item.active ? 'bg-[#58a6ff]/10 text-white font-semibold border-l-2 border-[#58a6ff]' : ''
                  }`}
                >
                  <Icon size={22} className={item.active ? 'text-[#58a6ff]' : 'text-[#8b949e] group-hover:text-white'} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-[#58a6ff] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <button
            className="w-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] border-none rounded-xl text-white py-4 text-base font-bold cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] hover:scale-[1.02] min-h-[48px]"
            onClick={() => navigate('/submit')}
          >
            <Plus size={20} className="inline mr-2" />
            Create Post
          </button>

          {user && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer transition-all hover:bg-[#161b22]/60 backdrop-blur-xl border border-white/10 bg-[#161b22]/40"
              onClick={() => navigate(`/profile/${user.username}`)}
            >
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-[#58a6ff]/30" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-bold shadow-lg">
                  {getInitials(user.username)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate">{user.displayName || user.username}</div>
                <div className="text-[#8b949e] text-xs truncate">@{user.username}</div>
              </div>
              <MoreHorizontal size={18} className="text-[#8b949e]" />
            </div>
          )}
        </aside>

        {/* Center Feed - OpenSea Cards */}
        <main className={`flex-1 max-w-[680px] min-h-screen ${isMobile ? '' : 'border-r border-white/10'}`}>
          <div className="sticky top-0 z-20 bg-[#0d1117]/80 backdrop-blur-xl border-b border-white/10 shadow-lg">
            <div className="px-6 py-5">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                Home Feed
              </h1>
            </div>
            <div className="flex border-b border-white/10 px-2">
              {feedFilters.map(filter => {
                const Icon = filter.icon
                const isActive = activeFilter === filter.id
                return (
                  <button
                    key={filter.id}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-none border-none text-sm font-medium cursor-pointer transition-all relative ${
                      isActive ? 'text-white font-semibold' : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]/60 backdrop-blur-xl'
                    }`}
                    onClick={() => setActiveFilter(filter.id)}
                  >
                    <Icon size={16} className={isActive ? 'text-[#58a6ff]' : ''} />
                    <span>{filter.label}</span>
                    {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80px] h-[3px] bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-full" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Posts */}
          <div className="p-4 space-y-4">
            {loading && posts.length === 0 ? (
              <div className="flex justify-center p-12">
                <Loader size={36} className="animate-spin text-[#58a6ff]" />
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <MessageCircle size={56} className="mb-4 opacity-40 mx-auto text-[#8b949e]" />
                <h3 className="text-white text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-[#8b949e] mb-6">Be the first to share something with the community!</p>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] border-none rounded-xl text-white font-semibold cursor-pointer hover:shadow-[0_0_20px_rgba(88,166,255,0.4)] transition-all min-h-[48px]"
                  onClick={() => navigate('/submit')}
                >
                  Create First Post
                </button>
              </div>
            ) : (
              <>
                {posts.map(post => (
                  <div
                    key={post.id}
                    className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all hover:border-[#58a6ff]/30 hover:shadow-[0_8px_32px_rgba(88,166,255,0.1)] cursor-pointer group"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {post.author?.avatar ? (
                        <img src={post.author.avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[#58a6ff]/20" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold shadow-lg">
                          {getInitials(post.author?.username || 'U')}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white">{post.author?.displayName || post.author?.username}</span>
                          {post.community && (
                            <>
                              <span className="text-[#8b949e]">•</span>
                              <span className="text-[#58a6ff] text-sm font-medium hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/community/${post.community.name}`) }}>
                                c/{post.community.name}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="text-[#8b949e] text-sm flex items-center gap-1">
                          <Clock size={12} />
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      {post.title && <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-[#58a6ff] transition-colors">{post.title}</h3>}
                      {post.content && (
                        <p className="text-[#c9d1d9] leading-relaxed text-sm sm:text-base">
                          {post.content.length > 280 ? `${post.content.slice(0, 280)}...` : post.content}
                        </p>
                      )}
                      {post.media && post.media.length > 0 && (
                        <div className="mt-4 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden border border-white/10">
                          <img
                            src={post.media[0]}
                            alt=""
                            className="w-full max-h-[420px] object-cover"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                      <button
                        className={`flex items-center gap-2 px-4 py-2.5 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-[#161b22]/60 backdrop-blur-xl hover:border-[#58a6ff]/30 min-h-[40px] ${
                          post.userVote === 'up' ? 'text-[#58a6ff] bg-[#58a6ff]/10 border-[#58a6ff]/30' : 'text-[#8b949e]'
                        }`}
                        onClick={() => handleVote(post.id, post.userVote === 'up' ? 'remove' : 'up')}
                      >
                        <Heart size={16} fill={post.userVote === 'up' ? '#58a6ff' : 'none'} />
                        <span>{formatNumber(post.score || 0)}</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-[#8b949e] text-sm font-medium cursor-pointer transition-all hover:bg-[#161b22]/60 backdrop-blur-xl hover:border-[#58a6ff]/30 hover:text-white min-h-[40px]" onClick={() => navigate(`/post/${post.id}`)}>
                        <MessageCircle size={16} />
                        <span>{formatNumber(post.commentCount || 0)}</span>
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-[#8b949e] text-sm font-medium cursor-pointer transition-all hover:bg-[#161b22]/60 backdrop-blur-xl hover:border-[#58a6ff]/30 hover:text-white min-h-[40px]">
                        <Share2 size={16} />
                      </button>
                      <button
                        className={`flex items-center gap-2 px-4 py-2.5 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-sm font-medium cursor-pointer transition-all hover:bg-[#161b22]/60 backdrop-blur-xl hover:border-[#a371f7]/30 min-h-[40px] ${
                          post.saved ? 'text-[#a371f7] bg-[#a371f7]/10 border-[#a371f7]/30' : 'text-[#8b949e]'
                        }`}
                        onClick={() => handleSave(post.id)}
                      >
                        <Bookmark size={16} fill={post.saved ? '#a371f7' : 'none'} />
                      </button>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="text-center py-6">
                    <button
                      className="px-8 py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl text-[#58a6ff] text-sm font-semibold cursor-pointer hover:bg-[#161b22]/60 backdrop-blur-xl hover:border-[#58a6ff]/30 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.2)] min-h-[48px] disabled:opacity-50"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* Right Sidebar - OpenSea Style Cards */}
        <aside className={`w-[360px] p-5 ${isTablet || isMobile ? 'hidden' : 'block'}`}>
          <div className="sticky top-4 flex flex-col gap-5">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b949e]" />
              <input
                type="text"
                placeholder="Search CRYB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 pl-12 py-3.5 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl text-white text-base placeholder-[#8b949e] outline-none transition-all focus:border-[#58a6ff]/50 focus:shadow-[0_0_0_3px_rgba(88,166,255,0.1)] shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
              />
            </form>

            {/* Wallet Card */}
            {user && (
              <div className="bg-[#161b22]/60 backdrop-blur-xl border border-[#a371f7]/30 rounded-2xl p-5 shadow-[0_8px_32px_rgba(163,113,247,0.15)]">
                <div className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                  <Wallet size={22} className="text-[#a371f7]" />
                  <span>Web3 Wallet</span>
                </div>
                {web3State?.isConnected ? (
                  <>
                    <div className="flex justify-between items-center mb-4 p-3 bg-[#161b22]/60 backdrop-blur-xl rounded-lg">
                      <span className="text-[#8b949e] text-sm font-medium">Balance</span>
                      <span className="text-white font-bold text-base">
                        {web3State.balance ? `${(Number(web3State.balance) / 1e18).toFixed(4)} ETH` : '0 ETH'}
                      </span>
                    </div>
                    <EnhancedWalletConnectButton size="sm" />
                  </>
                ) : (
                  <>
                    <p className="text-[#8b949e] text-sm mb-4 leading-relaxed">
                      Connect your wallet to access Web3 features, token gating, and NFT memberships.
                    </p>
                    <EnhancedWalletConnectButton size="sm" />
                  </>
                )}
              </div>
            )}

            {/* Trending Communities */}
            <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                <TrendingUp size={22} className="text-[#58a6ff]" />
                <span>Trending Communities</span>
              </div>
              {trendingCommunities.length > 0 ? (
                <div className="space-y-2">
                  {trendingCommunities.map(community => (
                    <div
                      key={community.id}
                      className="flex items-center gap-3 py-2.5 px-3 cursor-pointer transition-all hover:bg-[#161b22]/60 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] group"
                      onClick={() => navigate(`/community/${community.name || community.id}`)}
                    >
                      {community.icon ? (
                        <img src={community.icon} alt="" className="w-11 h-11 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] object-cover border border-white/10" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-bold text-xs shadow-lg">
                          {getInitials(community.name)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm group-hover:text-[#58a6ff] transition-colors">c/{community.name}</div>
                        <div className="text-[#8b949e] text-xs">{formatNumber(community.members || 0)} members</div>
                      </div>
                      <ChevronRight size={16} className="text-[#8b949e] group-hover:text-white transition-colors" />
                    </div>
                  ))}
                  <button className="block w-full py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 text-[#58a6ff] text-sm font-semibold cursor-pointer text-center rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-[#161b22]/60 backdrop-blur-xl hover:border-[#58a6ff]/30 transition-all min-h-[40px]" onClick={() => navigate('/communities')}>
                    Explore All Communities
                  </button>
                </div>
              ) : (
                <p className="text-[#8b949e] text-sm">No trending communities right now.</p>
              )}
            </div>

            {/* Messages Preview */}
            {user && conversations.length > 0 && (
              <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                  <Mail size={22} className="text-[#58a6ff]" />
                  <span>Recent Messages</span>
                </div>
                <div className="space-y-2">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      className="flex items-center gap-3 py-2.5 px-3 cursor-pointer hover:bg-[#161b22]/60 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all group"
                      onClick={() => navigate(`/messages/${conv.id}`)}
                    >
                      {conv.user?.avatar ? (
                        <img src={conv.user.avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white/10" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold shadow-lg">
                          {getInitials(conv.user?.displayName || 'U')}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-sm group-hover:text-[#58a6ff] transition-colors">{conv.user?.displayName}</div>
                        {conv.lastMessage && (
                          <div className="text-[#8b949e] text-xs truncate">{conv.lastMessage.content}</div>
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[#58a6ff] text-white text-[10px] font-bold px-2 py-1 rounded-full min-w-[20px] text-center">{conv.unreadCount}</span>
                      )}
                    </div>
                  ))}
                  <button className="block w-full py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 text-[#58a6ff] text-sm font-semibold cursor-pointer text-center rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-[#161b22]/60 backdrop-blur-xl hover:border-[#58a6ff]/30 transition-all min-h-[40px]" onClick={() => navigate('/messages')}>
                    View All Messages
                  </button>
                </div>
              </div>
            )}

            {/* Who to Follow */}
            {user && suggestedUsers.length > 0 && (
              <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <div className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                  <Users size={22} className="text-[#58a6ff]" />
                  <span>Who to Follow</span>
                </div>
                <div className="space-y-2">
                  {suggestedUsers.map(suggestedUser => (
                    <div
                      key={suggestedUser.id}
                      className="flex items-center gap-3 py-2.5 px-3 cursor-pointer hover:bg-[#161b22]/60 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all group"
                      onClick={() => navigate(`/profile/${suggestedUser.username}`)}
                    >
                      {suggestedUser.avatar ? (
                        <img src={suggestedUser.avatar} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-white/10" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold shadow-lg">
                          {getInitials(suggestedUser.username)}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm group-hover:text-[#58a6ff] transition-colors">{suggestedUser.displayName || suggestedUser.username}</div>
                        <div className="text-[#8b949e] text-xs">@{suggestedUser.username}</div>
                      </div>
                    </div>
                  ))}
                  <button className="block w-full py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 text-[#58a6ff] text-sm font-semibold cursor-pointer text-center rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-[#161b22]/60 backdrop-blur-xl hover:border-[#58a6ff]/30 transition-all min-h-[40px]" onClick={() => navigate('/users')}>
                    Discover More Users
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default HomePage
