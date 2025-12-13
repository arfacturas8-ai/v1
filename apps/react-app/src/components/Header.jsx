import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, Search, Bell, User, Settings, LogOut, Plus, X,
  Home, Users, Activity, Zap, MessageCircle, Hash,
  Wallet, Coins, Bot, ShoppingBag, ChevronDown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'

const iconMap = {
  Home: Home,
  Users: Users,
  User: User,
  Activity: Activity,
  Zap: Zap,
  MessageCircle: MessageCircle,
  Hash: Hash,
  Wallet: Wallet,
  Coins: Coins,
  Bot: Bot,
  ShoppingBag: ShoppingBag
}

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setIsMobileMenuOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Fetch notifications
  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      setLoadingNotifications(true)
      try {
        const response = await apiService.get('/notifications?limit=5')
        if (response.success && response.data) {
          setNotifications(response.data.notifications || [])
        }
      } catch (err) {
        // Silently fail
      } finally {
        setLoadingNotifications(false)
      }
    }

    fetchNotifications()
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [user])

  const navItems = [
    { path: '/home', label: 'Home', icon: 'Home' },
    { path: '/communities', label: 'Communities', icon: 'Hash' },
    { path: '/nft-marketplace', label: 'Explore', icon: 'ShoppingBag' },
    { path: '/crypto', label: 'Stats', icon: 'Coins' },
    { path: '/messages', label: 'Messages', icon: 'MessageCircle' }
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'backdrop-blur-xl border-b'
          : 'bg-transparent'
      }`} style={isScrolled ? { background: 'rgba(248, 249, 250, 0.8)', borderColor: 'var(--border-subtle)' } : {}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/home" className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                CRYB
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = iconMap[item.icon]
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#58a6ff]/10'
                        : 'hover:bg-white'
                    }`}
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="hidden lg:block flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <input
                  type="search"
                  placeholder="Search CRYB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-11 pr-4 bg-white border rounded-lg text-sm outline-none focus:border-[#58a6ff]/50 transition-all"
                  style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                />
              </div>
            </form>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {user ? (
                <>
                  {/* Notifications */}
                  <div className="relative" ref={notificationRef}>
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-white border hover:border-[#58a6ff]/30 transition-all"
                      style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
                      aria-label="Notifications"
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#58a6ff] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-32px)] bg-white backdrop-blur-xl border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-subtle)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                              No notifications yet
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className="px-4 py-3 hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                                onClick={() => {
                                  setIsNotificationOpen(false)
                                  navigate('/notifications')
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  {!notification.read && (
                                    <span className="w-2 h-2 mt-2 bg-[#58a6ff] rounded-full flex-shrink-0"></span>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{notification.message || notification.content}</p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                      {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : ''}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                          <Link
                            to="/notifications"
                            onClick={() => setIsNotificationOpen(false)}
                            className="block w-full text-center text-sm text-[#58a6ff] font-medium hover:underline"
                          >
                            View all notifications
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Create Button - Desktop */}
                  <button
                    onClick={() => navigate('/submit')}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-all hover:shadow-[0_0_16px_rgba(88,166,255,0.4)]"
                  >
                    <Plus size={16} />
                    <span>Create</span>
                  </button>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1 pr-2 bg-white border rounded-lg hover:border-[#58a6ff]/30 transition-all"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white text-sm font-semibold">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <ChevronDown size={14} className="hidden sm:block" style={{ color: 'var(--text-secondary)' }} />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white backdrop-blur-xl border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-subtle)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold">
                              {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user?.username || 'User'}</div>
                              <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email || ''}</div>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          <Link
                            to={`/profile/${user?.username}`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FA] transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <User size={16} />
                            <span className="text-sm">Profile</span>
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FA] transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Settings size={16} />
                            <span className="text-sm">Settings</span>
                          </Link>
                          <Link
                            to="/wallet"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F9FA] transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Wallet size={16} />
                            <span className="text-sm">Wallet</span>
                          </Link>
                        </div>
                        <div className="py-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 w-full text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                          >
                            <LogOut size={16} />
                            <span className="text-sm">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white border transition-colors"
                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && user && (
          <div className="md:hidden bg-white backdrop-blur-xl border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="p-4 space-y-2">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <input
                    type="search"
                    placeholder="Search CRYB..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-white border rounded-lg text-sm outline-none focus:border-[#58a6ff]/50"
                    style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </form>

              {/* Mobile Nav Items */}
              {navItems.map((item) => {
                const Icon = iconMap[item.icon]
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#58a6ff]/10'
                        : 'hover:bg-[#F8F9FA]'
                    }`}
                    style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => {
                    navigate('/submit')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90 text-white rounded-lg text-sm font-semibold transition-all"
                >
                  <Plus size={18} />
                  <span>Create Post</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Header Spacer */}
      <div className="h-16"></div>
    </>
  )
}

export default Header
