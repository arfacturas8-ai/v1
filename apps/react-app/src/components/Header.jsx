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
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: isScrolled ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>
            {/* Logo */}
            <Link to="/home" style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              gap: '8px'
            }}>
              <span style={{
                fontSize: '24px',
                fontWeight: '900',
                background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                CRYB
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav style={{
              display: window.innerWidth >= 768 ? 'flex' : 'none',
              alignItems: 'center',
              gap: '4px'
            }}>
              {navItems.map((item) => {
                const Icon = iconMap[item.icon]
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      color: isActive ? '#1A1A1A' : '#666666',
                      backgroundColor: isActive ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = '#F8F9FA'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} style={{
              display: window.innerWidth >= 1024 ? 'flex' : 'none',
              flex: '1 1 auto',
              maxWidth: '480px',
              margin: '0 32px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}>
                <Search size={18} style={{color: '#999999'}} />
              </div>
              <input
                type="search"
                placeholder="Search CRYB..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  paddingLeft: '40px',
                  paddingRight: '16px',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #E8EAED',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#58a6ff'
                  e.target.style.backgroundColor = '#FFFFFF'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E8EAED'
                  e.target.style.backgroundColor = '#F8F9FA'
                }}
              />
            </form>

            {/* Right Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {user ? (
                <>
                  {/* Notifications */}
                  <div style={{position: 'relative'}} ref={notificationRef}>
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      aria-label="Notifications"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#666666',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8F9FA'
                        e.currentTarget.style.color = '#1A1A1A'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#666666'
                      }}
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '18px',
                          height: '18px',
                          padding: '0 4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#FFFFFF',
                          backgroundColor: '#ef4444',
                          borderRadius: '9999px'
                        }}>
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-32px)] bg-white  border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-subtle)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
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
                    style={{
                      display: window.innerWidth >= 640 ? 'flex' : 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      height: '40px',
                      padding: '0 16px',
                      background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <Plus size={18} />
                    <span>Create</span>
                  </button>

                  {/* User Menu */}
                  <div style={{position: 'relative'}} ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '40px',
                        padding: '4px 12px 4px 4px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E8EAED',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E8EAED'}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <ChevronDown size={16} style={{
                        color: '#666666',
                        display: window.innerWidth >= 640 ? 'block' : 'none'
                      }} />
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white  border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-subtle)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white font-semibold flex-shrink-0">
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
                    style={{
                      display: window.innerWidth < 768 ? 'flex' : 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#666666',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F8F9FA'
                      e.currentTarget.style.color = '#1A1A1A'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#666666'
                    }}
                  >
                    {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                  </button>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Link
                    to="/login"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '40px',
                      padding: '0 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#666666',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#1A1A1A'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '40px',
                      padding: '0 20px',
                      background: 'linear-gradient(to right, #58a6ff, #a371f7)',
                      color: '#FFFFFF',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && user && (
          <div className="md:hidden bg-white  border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="p-4 space-y-2">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center justify-center pointer-events-none">
                    <Search style={{width: "18px", height: "18px", flexShrink: 0, color: 'var(--text-secondary)'}} />
                  </div>
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
                  style={{color: "var(--text-primary)"}} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] hover:opacity-90  rounded-lg text-sm font-semibold transition-all"
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
      <div style={{height: '64px'}}></div>
    </>
  )
}

export default Header
