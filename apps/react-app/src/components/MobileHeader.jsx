import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, Search, Bell, User, Settings, LogOut, Plus, X,
  Home, Users, Activity, Zap, MessageCircle, Bot,
  ShoppingBag, Hash, Wallet, Coins
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import WalletConnectButton from './web3/WalletConnectButton'
import ThemeToggle from './ui/ThemeToggle'

function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(3)

  const userMenuRef = useRef(null)
  const mobileMenuRef = useRef(null)
  const notificationRef = useRef(null)

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/communities', label: 'Communities', icon: Hash },
    { href: '/nft-marketplace', label: 'Explore', icon: ShoppingBag },
    { href: '/crypto', label: 'Stats', icon: Coins },
    { href: '/users', label: 'Users', icon: Users },
    { href: '/activity', label: 'Activity', icon: Activity },
    { href: '/chat', label: 'Chat', icon: MessageCircle },
    { href: '/bots', label: 'Bots', icon: Bot },
  ]

  const primaryNavItems = navItems.slice(0, 4)

  const mockNotifications = [
    { id: 1, type: 'bid', message: 'New bid on your NFT', time: '2m ago', read: false },
    { id: 2, type: 'follow', message: 'crypto_whale started following you', time: '1h ago', read: false },
    { id: 3, type: 'like', message: 'Your post received 10 likes', time: '3h ago', read: true }
  ]

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false)
        setIsMobileMenuOpen(false)
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleLogout = async () => {
    const result = await logout()
    if (result.success) {
      navigate('/landing', { replace: true })
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev)
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(prev => !prev)
  }

  const toggleNotifications = () => {
    setIsNotificationOpen(prev => !prev)
  }

  return (
    <>
      {/* Mobile-Optimized Header with Glassmorphism */}
      <header style={{
  position: 'fixed',
  background: 'rgba(22, 27, 34, 0.6)',
  paddingTop: 'env(safe-area-inset-top)'
}}>
        <div style={{
  paddingLeft: '16px',
  paddingRight: '16px'
}}>
          {/* Top Bar */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '64px'
}}>
            {/* Logo */}
            <Link to="/home" style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span style={{
  fontWeight: 'bold'
}}>
                CRYB
              </span>
            </Link>

            {/* Right Actions */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              {user && (
                <>
                  {/* Theme Toggle - Mobile */}
                  <ThemeToggle variant="icon" size="sm" />

                  {/* Notifications */}
                  <div style={{
  position: 'relative'
}} ref={notificationRef}>
                    <button
                      onClick={toggleNotifications}
                      style={{
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                    >
                      <Bell size={18} style={{
  color: '#c9d1d9'
}} />
                      {unreadCount > 0 && (
                        <span style={{
  position: 'absolute',
  height: '20px',
  width: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {isNotificationOpen && (
                      <div style={{
  position: 'absolute',
  width: '320px',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden'
}}>
                        <div style={{
  padding: '12px'
}}>
                          <h3 style={{
  fontWeight: 'bold',
  color: '#ffffff'
}}>Notifications</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {mockNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              style={{
  padding: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                            >
                              <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px'
}}>
                                <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}}></div>
                                <div style={{
  flex: '1'
}}>
                                  <p style={{
  color: '#ffffff'
}}>{notification.message}</p>
                                  <p style={{
  color: '#c9d1d9'
}}>{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{
  padding: '8px'
}}>
                          <button style={{
  width: '100%',
  textAlign: 'center',
  fontWeight: '600',
  paddingTop: '8px',
  paddingBottom: '8px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px'
}}>
                            View all
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Profile */}
                  <div style={{
  position: 'relative'
}} ref={userMenuRef}>
                    <button
                      onClick={toggleUserMenu}
                      style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px',
  borderRadius: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                    >
                      <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: '600'
}}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </button>

                    {isUserMenuOpen && (
                      <div style={{
  position: 'absolute',
  width: '224px',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden'
}}>
                        <div style={{
  padding: '12px'
}}>
                          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                            <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                              {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div style={{
  fontWeight: 'bold',
  color: '#ffffff'
}}>{user?.username || 'User'}</div>
                              <div style={{
  color: '#c9d1d9'
}}>{user?.email || 'user@cryb.com'}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
                          <Link
                            to="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#c9d1d9',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                          >
                            <User size={16} />
                            My Profile
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#c9d1d9',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                          >
                            <Settings size={16} />
                            Settings
                          </Link>
                          <Link
                            to="/wallet"
                            onClick={() => setIsUserMenuOpen(false)}
                            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#c9d1d9',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                          >
                            <Wallet size={16} />
                            My Wallet
                          </Link>
                        </div>
                        <div style={{
  paddingTop: '4px',
  paddingBottom: '4px'
}}>
                          <button
                            onClick={handleLogout}
                            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  width: '100%',
  textAlign: 'left'
}}
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hamburger Menu */}
                  <button
                    style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                    onClick={toggleMobileMenu}
                    aria-label="Menu"
                  >
                    {isMobileMenuOpen ? (
                      <X size={20} style={{
  color: '#c9d1d9'
}} />
                    ) : (
                      <Menu size={20} style={{
  color: '#c9d1d9'
}} />
                    )}
                  </button>
                </>
              )}

              {!user && (
                <button
                  style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px',
  fontWeight: '600'
}}
                  onClick={() => navigate('/landing')}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          {user && (
            <div className="pb-3">
              <form onSubmit={handleSearch}>
                <div style={{
  position: 'relative'
}}>
                  <Search style={{
  position: 'absolute',
  height: '16px',
  width: '16px',
  color: '#c9d1d9'
}} />
                  <input
                    type="search"
                    placeholder="Search items, collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
  width: '100%',
  height: '48px',
  background: 'rgba(22, 27, 34, 0.6)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '16px'
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
            style={{
  background: 'rgba(22, 27, 34, 0.6)'
}}
          >
            <nav style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.href
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  borderRadius: '12px',
  fontWeight: '600',
  color: '#c9d1d9',
  background: 'rgba(22, 27, 34, 0.6)'
}}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <IconComponent size={18} />
                    {item.label}
                  </Link>
                )
              })}

              {/* Wallet Connect in Menu */}
              <div className="pt-3 pb-2">
                <WalletConnectButton />
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Enhanced Mobile Bottom Navigation with Glassmorphism */}
      {user && (
        <nav
          style={{
  position: 'fixed',
  background: 'rgba(22, 27, 34, 0.6)',
  paddingBottom: 'env(safe-area-inset-bottom)'
}}
          role="navigation"
          aria-label="Bottom navigation"
        >
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  height: '80px',
  paddingLeft: '8px',
  paddingRight: '8px'
}}>
            {primaryNavItems.map((item) => {
              const isActive = location.pathname === item.href
              const IconComponent = item.icon
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  style={{
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  color: '#c9d1d9'
}}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                    <IconComponent style={{
  width: '24px',
  height: '24px'
}} />
                  </div>
                  <span style={{
  fontWeight: '600'
}}>{item.label}</span>
                  {isActive && (
                    <div style={{
  position: 'absolute',
  width: '4px',
  height: '4px',
  borderRadius: '50%'
}}></div>
                  )}
                </Link>
              )
            })}

            {/* Floating Create Button */}
            <button
              onClick={() => navigate('/submit')}
              style={{
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
}}
              aria-label="Create new post"
            >
              <div style={{
  width: '56px',
  height: '56px',
  borderRadius: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <Plus size={26} style={{
  color: '#ffffff'
}} />
              </div>
              <div style={{
  position: 'absolute',
  borderRadius: '24px'
}}></div>
            </button>
          </div>
        </nav>
      )}

      {/* Spacer for fixed header */}
      <div style={{
  height: '64px'
}}></div>
      {user && <div style={{
  height: '80px'
}}></div>}
    </>
  )
}



export default MobileHeader
