import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, Search, Bell, User, Settings, LogOut, Plus, X,
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
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const userMenuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  // Standardized navigation - matches Header.jsx
  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/communities', label: 'Communities', icon: Hash },
    { href: '/nft-marketplace', label: 'Explore', icon: ShoppingBag },
    { href: '/crypto', label: 'Stats', icon: Coins },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
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

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-50  pt-[env(safe-area-inset-top)] md:hidden" style={{ background: 'white', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/home" className="flex items-center">
              <span className="text-xl font-black bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                CRYB
              </span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Notifications */}
                  <Link
                    to="/notifications"
                    style={{width: "48px", height: "48px", flexShrink: 0, background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)'}}
                    aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
                  >
                    <Bell size={18} />
                    {unreadNotifications > 0 && (
                      <span style={{color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0}}>
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      style={{color: "var(--text-primary)", width: "48px", height: "48px", flexShrink: 0}}
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
                    style={{width: "48px", height: "48px", flexShrink: 0, background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)'}}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Menu"
                  >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    style={{color: "var(--text-primary)"}} className="px-4 py-2 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-lg text-sm font-semibold transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {user && (
            <div className="pb-3">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search style={{width: "24px", height: "24px", flexShrink: 0, color: 'var(--text-secondary)'}} />
                  <input
                    type="search"
                    placeholder="Search CRYB..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 border rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && user && (
          <div
            ref={mobileMenuRef}
            className="absolute top-full left-0 right-0  border-t max-h-[70vh] overflow-y-auto"
            style={{ background: 'white', borderColor: 'var(--border-subtle)' }}
          >
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#58a6ff]/10'
                        : ''
                    }`}
                    style={{
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconComponent size={20} />
                    {item.label}
                  </Link>
                )
              })}

              <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => {
                    navigate('/submit')
                    setIsMobileMenuOpen(false)
                  }}
                  style={{color: "var(--text-primary)"}} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-lg text-sm font-semibold transition-all hover:shadow-[0_0_16px_rgba(88,166,255,0.4)]"
                >
                  <Plus size={18} />
                  <span>Create Post</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Header Spacer */}
      <div className="h-[calc(56px+env(safe-area-inset-top))] md:hidden" />
      {user && <div className="h-3 md:hidden" />}
    </>
  )
}

export default MobileHeader
