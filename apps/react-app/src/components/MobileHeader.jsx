import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, Bell, User, Settings, LogOut, Plus, X,
  Home, Users, Activity, MessageCircle, Bot,
  ShoppingBag, Hash, Wallet, Coins
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import apiService from '../services/api'

function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const userMenuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // Mobile burger menu - complementary to bottom nav (Community, Discover, Wallet, Profile)
  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return

    const fetchUnread = async () => {
      try {
        const response = await apiService.get('/notifications?limit=1&unread=true')
        if (response.success && response.data) {
          setUnreadNotifications(response.data.total || response.data.notifications?.length || 0)
        }
      } catch (err) {
        // Silently fail
      }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && !event.target.closest('button[aria-label="Menu"]')) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Mobile Header - iOS Glassy Design */}
      <header
        className="fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] md:hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 1px 8px rgba(0, 0, 0, 0.03)'
        }}
      >
        <div className="px-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/home" className="flex items-center" style={{ flexShrink: 0 }}>
              <span
                className="text-xl font-black bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent"
                style={{ letterSpacing: '-0.5px' }}
              >
                CRYB
              </span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
              {user ? (
                <>
                  {/* Notifications */}
                  <Link
                    to="/notifications"
                    className="flex items-center justify-center relative"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: 'transparent',
                      color: '#666666',
                      transition: 'all 0.2s ease'
                    }}
                    aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                      e.currentTarget.style.color = '#1A1A1A'
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#666666'
                    }}
                  >
                    <Bell size={19} strokeWidth={2} />
                    {unreadNotifications > 0 && (
                      <span
                        className="absolute flex items-center justify-center"
                        style={{
                          top: '4px',
                          right: '4px',
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
                        }}
                      >
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center justify-center"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(88, 166, 255, 0.2)',
                        transition: 'all 0.2s ease',
                        flexShrink: 0
                      }}
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56  border rounded-xl shadow-lg overflow-hidden" style={{ background: 'white', borderColor: 'var(--border-subtle)' }}>
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                          <div className="flex items-center gap-3">
                            <div style={{color: "var(--text-primary)", width: "48px", height: "48px", flexShrink: 0}}>
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
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <User size={16} />
                            <span className="text-sm">Profile</span>
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Settings size={16} />
                            <span className="text-sm">Settings</span>
                          </Link>
                          <Link
                            to="/wallet"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors"
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

                  {/* Hamburger Menu */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Menu"
                    className="flex items-center justify-center"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: isMobileMenuOpen ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                      color: isMobileMenuOpen ? '#1A1A1A' : '#666666',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                      e.currentTarget.style.color = '#1A1A1A'
                    }}
                    onTouchEnd={(e) => {
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
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-2 text-sm font-medium transition-all rounded-lg"
                    style={{
                      color: '#666666',
                      backgroundColor: 'transparent'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                      e.currentTarget.style.color = '#1A1A1A'
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#666666'
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      color: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(88, 166, 255, 0.25)'
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown - Glassy Design */}
        {isMobileMenuOpen && user && (
          <div
            ref={mobileMenuRef}
            className="absolute top-full left-0 right-0 border-t max-h-[70vh] overflow-y-auto"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderColor: 'rgba(0, 0, 0, 0.06)'
            }}
          >
            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                    style={{
                      color: isActive ? '#1A1A1A' : '#666666',
                      backgroundColor: isActive ? 'rgba(88, 166, 255, 0.12)' : 'transparent',
                      fontWeight: isActive ? '600' : '500'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    onTouchStart={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
                    }}
                    onTouchEnd={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <IconComponent size={21} strokeWidth={isActive ? 2.5 : 2} />
                    {item.label}
                  </Link>
                )
              })}

              <div className="pt-3 mt-3 border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}>
                <button
                  onClick={() => {
                    navigate('/submit')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(88, 166, 255, 0.3)'
                  }}
                >
                  <Plus size={19} strokeWidth={2.5} />
                  <span>Create Post</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Header Spacer */}
      <div className="h-[calc(56px+env(safe-area-inset-top))] md:hidden" />
    </>
  )
}

export default MobileHeader
