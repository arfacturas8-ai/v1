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
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d1117]/95 backdrop-blur-xl border-b border-white/10 pt-[env(safe-area-inset-top)] md:hidden">
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
                    className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#161b22]/60 border border-white/10 text-[#8b949e] hover:text-white transition-colors"
                    aria-label={`Notifications${unreadNotifications > 0 ? ` (${unreadNotifications} unread)` : ''}`}
                  >
                    <Bell size={18} />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#58a6ff] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white text-sm font-semibold"
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </button>

                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-[#0d1117]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
                        <div className="p-4 border-b border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center text-white font-semibold">
                              {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-white text-sm truncate">{user?.username || 'User'}</div>
                              <div className="text-xs text-[#8b949e] truncate">{user?.email || ''}</div>
                            </div>
                          </div>
                        </div>
                        <div className="py-2">
                          <Link
                            to={`/profile/${user?.username}`}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[#c9d1d9] hover:bg-[#161b22]/60 hover:text-white transition-colors"
                          >
                            <User size={16} />
                            <span className="text-sm">Profile</span>
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[#c9d1d9] hover:bg-[#161b22]/60 hover:text-white transition-colors"
                          >
                            <Settings size={16} />
                            <span className="text-sm">Settings</span>
                          </Link>
                          <Link
                            to="/wallet"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-[#c9d1d9] hover:bg-[#161b22]/60 hover:text-white transition-colors"
                          >
                            <Wallet size={16} />
                            <span className="text-sm">Wallet</span>
                          </Link>
                        </div>
                        <div className="py-2 border-t border-white/10">
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
                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#161b22]/60 border border-white/10 text-[#8b949e] hover:text-white transition-colors"
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
                    className="px-4 py-2 text-[#c9d1d9] hover:text-white text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-[#58a6ff] hover:bg-[#4a8fd7] text-white rounded-lg text-sm font-semibold transition-all"
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
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b949e]" />
                  <input
                    type="search"
                    placeholder="Search CRYB..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 bg-[#161b22]/60 border border-white/10 rounded-lg text-white text-sm placeholder-[#8b949e] outline-none focus:border-[#58a6ff]/50"
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
            className="absolute top-full left-0 right-0 bg-[#0d1117]/95 backdrop-blur-xl border-t border-white/10 max-h-[70vh] overflow-y-auto"
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
                        ? 'text-white bg-[#58a6ff]/10'
                        : 'text-[#c9d1d9] hover:bg-[#161b22]/60 hover:text-white'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconComponent size={20} />
                    {item.label}
                  </Link>
                )
              })}

              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    navigate('/submit')
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white rounded-lg text-sm font-semibold transition-all hover:shadow-[0_0_16px_rgba(88,166,255,0.4)]"
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
