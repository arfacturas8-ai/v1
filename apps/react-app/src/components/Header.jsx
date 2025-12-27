import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, Search, Bell, User, Settings, LogOut, Plus, X,
  Home, Users, Activity, Zap, MessageCircle, Hash,
  Wallet, Coins, Bot, ShoppingBag, ChevronDown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'
import { useResponsive } from '../hooks/useResponsive'

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
  const { isMobile, isTablet, isDesktop } = useResponsive()
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
    { path: '/discover', label: 'Discover', icon: 'ShoppingBag' },
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
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: isScrolled ? '0 2px 16px rgba(0, 0, 0, 0.04)' : 'none',
        transition: 'all 0.2s ease'
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: isMobile ? '0 12px' : '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: isMobile ? '56px' : '64px',
          gap: isMobile ? '8px' : '16px'
        }}>
            {/* Logo */}
            <Link to="/home" style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexShrink: 0
            }}>
              <span style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: '900',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px'
              }}>
                CRYB
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav style={{
              display: !isMobile ? 'flex' : 'none',
              alignItems: 'center',
              gap: '2px',
              flexShrink: 0
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
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '500',
                      textDecoration: 'none',
                      color: isActive ? '#1A1A1A' : '#666666',
                      backgroundColor: isActive ? 'rgba(88, 166, 255, 0.12)' : 'transparent',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                        e.currentTarget.style.color = '#1A1A1A'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#666666'
                      }
                    }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    {!isTablet && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </nav>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} style={{
              display: !isMobile && !isTablet ? 'flex' : 'none',
              flex: '1 1 auto',
              maxWidth: '420px',
              margin: '0 auto',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                <Search size={17} style={{color: '#999999'}} />
              </div>
              <input
                type="search"
                placeholder="Search communities, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '42px',
                  paddingRight: '16px',
                  backgroundColor: 'rgba(0, 0, 0, 0.03)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  color: '#1A1A1A',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontWeight: '400'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(88, 166, 255, 0.4)'
                  e.target.style.backgroundColor = '#FFFFFF'
                  e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.03)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </form>

            {/* Right Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '4px' : '6px',
              flexShrink: 0
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
                        width: isMobile ? '36px' : '38px',
                        height: isMobile ? '36px' : '38px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: isNotificationOpen ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                        color: isNotificationOpen ? '#1A1A1A' : '#666666',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                        e.currentTarget.style.color = '#1A1A1A'
                      }}
                      onMouseLeave={(e) => {
                        if (!isNotificationOpen) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#666666'
                        }
                      }}
                    >
                      <Bell size={19} strokeWidth={2} />
                      {unreadCount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: '16px',
                          height: '16px',
                          padding: '0 4px',
                          fontSize: '10px',
                          fontWeight: '700',
                          color: '#FFFFFF',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          borderRadius: '9999px',
                          border: '2px solid rgba(255, 255, 255, 0.9)',
                          boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                        }}>
                          {unreadCount > 9 ? '9+' : unreadCount}
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
                      display: !isMobile ? 'flex' : 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      height: '38px',
                      padding: '0 14px',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                      backdropFilter: 'blur(40px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(88, 166, 255, 0.3)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(88, 166, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <Plus size={17} strokeWidth={2.5} />
                    {!isTablet && <span>Create</span>}
                  </button>

                  {/* User Menu */}
                  <div style={{position: 'relative'}} ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      aria-label="User menu"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '0' : '6px',
                        height: isMobile ? '36px' : '38px',
                        padding: isMobile ? '0' : '3px 10px 3px 3px',
                        backgroundColor: isUserMenuOpen ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                        border: isMobile ? 'none' : '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.25)'
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.03)'
                      }}
                      onMouseLeave={(e) => {
                        if (!isUserMenuOpen) {
                          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: isMobile ? '36px' : '32px',
                        height: isMobile ? '36px' : '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: '700',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(88, 166, 255, 0.2)'
                      }}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      {!isMobile && (
                        <ChevronDown
                          size={15}
                          strokeWidth={2.5}
                          style={{
                            color: '#666666',
                            transition: 'transform 0.2s ease',
                            transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                          }}
                        />
                      )}
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
                    aria-label="Menu"
                    style={{
                      display: isMobile ? 'flex' : 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: isMobileMenuOpen ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                      color: isMobileMenuOpen ? '#1A1A1A' : '#666666',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                      e.currentTarget.style.color = '#1A1A1A'
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobileMenuOpen) {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = '#666666'
                      }
                    }}
                  >
                    {isMobileMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
                  </button>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '6px' : '8px'
                }}>
                  <Link
                    to="/login"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      height: '38px',
                      padding: isMobile ? '0 12px' : '0 14px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#666666',
                      textDecoration: 'none',
                      borderRadius: '10px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#1A1A1A'
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#666666'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      padding: isMobile ? '0 14px' : '0 18px',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                      backdropFilter: 'blur(40px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(88, 166, 255, 0.3)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(88, 166, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {isMobile ? 'Sign Up' : 'Get Started'}
                  </Link>
                </div>
              )}
            </div>
          </div>

        {/* Mobile Menu - Removed redundant search bar */}
        {isMobileMenuOpen && user && (
          <div style={{
            display: isMobile ? 'block' : 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '12px'
          }}>
            {/* Mobile Nav Items */}
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px'}}>
              {navItems.map((item) => {
                const Icon = iconMap[item.icon]
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: isActive ? '600' : '500',
                      textDecoration: 'none',
                      color: isActive ? '#1A1A1A' : '#666666',
                      backgroundColor: isActive ? 'rgba(88, 166, 255, 0.12)' : 'transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onTouchStart={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                    }}
                    onTouchEnd={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Create Post Button */}
            <button
              onClick={() => {
                navigate('/submit')
                setIsMobileMenuOpen(false)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 16px',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                color: '#FFFFFF',
                border: '1px solid rgba(88, 166, 255, 0.3)',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              <Plus size={19} strokeWidth={2.5} />
              <span>Create Post</span>
            </button>
          </div>
        )}
      </header>

      {/* Header Spacer */}
      <div style={{height: isMobile ? '56px' : '64px'}}></div>
    </>
  )
}

export default Header
