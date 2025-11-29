import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, Search, Bell, User, Settings, LogOut, Plus, X,
  Home, Users, Activity, Zap, MessageCircle, Hash,
  Wallet, Coins, Bot, ShoppingBag, ChevronDown
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import WalletConnectButton from './web3/WalletConnectButton'
import ThemeToggle from './ui/ThemeToggle'

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
  const [searchSuggestions, setSearchSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(3)

  const searchRef = useRef(null)
  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
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

  useEffect(() => {
    if (searchQuery.trim()) {
      const suggestions = [
        { type: 'community', name: 'CryptoPunks', members: '12.5K' },
        { type: 'user', name: 'crypto_whale', verified: true },
        { type: 'nft', name: 'Bored Ape #1234' },
        { type: 'collection', name: 'Azuki Collection' }
      ].filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setSearchSuggestions(suggestions)
    } else {
      setSearchSuggestions([])
    }
  }, [searchQuery])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setShowSuggestions(false)
      setIsMobileMenuOpen(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/landing')
  }

  const navItems = [
    { path: '/home', label: 'Home', icon: 'Home', primary: true },
    { path: '/communities', label: 'Communities', icon: 'Hash', primary: true },
    { path: '/nft-marketplace', label: 'Explore', icon: 'ShoppingBag', primary: true },
    { path: '/crypto', label: 'Stats', icon: 'Coins', primary: true },
    { path: '/activity', label: 'Activity', icon: 'Activity', primary: false },
    { path: '/users', label: 'Users', icon: 'Users', primary: false },
    { path: '/chat', label: 'Chat', icon: 'MessageCircle', primary: false },
    { path: '/bots', label: 'Bots', icon: 'Bot', primary: false }
  ]

  const primaryNavItems = navItems.filter(item => item.primary)

  const mockNotifications = [
    { id: 1, type: 'bid', message: 'New bid on your NFT', time: '2m ago', read: false },
    { id: 2, type: 'follow', message: 'crypto_whale started following you', time: '1h ago', read: false },
    { id: 3, type: 'like', message: 'Your post received 10 likes', time: '3h ago', read: true }
  ]

  return (
    <>
      {/* Modern Header with Glassmorphism */}
      <header style={{
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  background: isScrolled ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.08) 0%, rgba(163, 113, 247, 0.08) 100%)' : 'transparent',
  backdropFilter: isScrolled ? 'blur(16px)' : 'none',
  WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
  borderBottom: isScrolled ? '1px solid rgba(163, 113, 247, 0.15)' : '1px solid transparent',
  transition: 'all 0.3s ease'
}}>
        <div style={{
  paddingLeft: '32px',
  paddingRight: '32px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '80px'
}}>
            {/* Left Section */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '32px'
}}>
              {/* Logo */}
              <Link to="/" style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <span style={{
  fontWeight: 'bold'
}}>
                  CRYB
                </span>
              </Link>

              {/* Desktop Navigation with Hover Effects */}
              <nav style={{
  display: 'none',
  alignItems: 'center',
  gap: '4px'
}}>
                {primaryNavItems.map((item) => {
                  const Icon = iconMap[item.icon]
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      style={{
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  fontWeight: '600',
  color: '#ffffff'
}}
                    >
                      <Icon size={18} className="transition-transform group-hover:scale-110" />
                      <span>{item.label}</span>
                      {isActive && (
                        <div style={{
  position: 'absolute',
  borderRadius: '50%'
}}></div>
                      )}
                      {!isActive && (
                        <div style={{
  position: 'absolute',
  borderRadius: '12px',
  background: 'rgba(22, 27, 34, 0.6)'
}}></div>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Center Search Bar with Autocomplete */}
            <div style={{
  display: 'none',
  flex: '1',
  marginLeft: '32px',
  marginRight: '32px'
}} ref={searchRef}>
              <form onSubmit={handleSearch} style={{
  position: 'relative'
}}>
                <div style={{
  position: 'relative'
}}>
                  <Search style={{
  position: 'absolute',
  width: '20px',
  height: '20px',
  color: '#c9d1d9'
}} />
                  <input
                    type="search"
                    placeholder="Search items, collections, and accounts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    style={{
  width: '100%',
  height: '56px',
  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(163, 113, 247, 0.1) 100%)',
  border: '1px solid rgba(163, 113, 247, 0.2)',
  borderRadius: '24px',
  color: '#ffffff',
  paddingLeft: '48px',
  paddingRight: '16px'
}}
                  />

                  {/* Search Suggestions Dropdown */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div style={{
  position: 'absolute',
  top: '100%',
  marginTop: '8px',
  width: '100%',
  background: 'rgba(10, 10, 11, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
}}>
                      {searchSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchQuery(suggestion.name)
                            setShowSuggestions(false)
                          }}
                          style={{
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s ease'
}}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                            <span style={{
  color: '#ffffff',
  fontWeight: 'bold'
}}>{suggestion.name[0]}</span>
                          </div>
                          <div style={{
  flex: '1',
  textAlign: 'left'
}}>
                            <div style={{
  fontWeight: '600',
  color: '#ffffff'
}}>{suggestion.name}</div>
                            <div style={{
  color: '#c9d1d9'
}}>{suggestion.type}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Right Section */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              {user ? (
                <>
                  {/* Theme Toggle */}
                  <div style={{
  display: 'none'
}}>
                    <ThemeToggle variant="icon" size="md" />
                  </div>

                  {/* Wallet Connect Button */}
                  <div style={{
  display: 'none'
}}>
                    <WalletConnectButton />
                  </div>

                  {/* Notifications Bell */}
                  <div style={{
  position: 'relative'
}} ref={notificationRef}>
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      style={{
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(163, 113, 247, 0.1) 100%)',
  border: '1px solid rgba(163, 113, 247, 0.2)',
  transition: 'all 0.2s ease'
}}
                      aria-label="Notifications"
                    >
                      <Bell size={20} style={{
  color: '#c9d1d9'
}} />
                      {unreadNotifications > 0 && (
                        <div style={{
  position: 'absolute',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                          <span style={{
  color: '#ffffff',
  fontWeight: 'bold'
}}>{unreadNotifications}</span>
                        </div>
                      )}
                    </button>

                    {/* Notifications Dropdown */}
                    {isNotificationOpen && (
                      <div style={{
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '8px',
  width: '384px',
  background: 'rgba(10, 10, 11, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
}}>
                        <div style={{
  padding: '16px'
}}>
                          <h3 style={{
  fontWeight: 'bold',
  color: '#ffffff'
}}>Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {mockNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              style={{
  padding: '16px',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'background 0.2s ease'
}}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
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
  padding: '12px'
}}>
                          <button style={{
  width: '100%',
  textAlign: 'center',
  fontWeight: '600'
}}>
                            View all notifications
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Create Button */}
                  <button
                    style={{
  display: 'none',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px',
  fontWeight: '600'
}}
                    onClick={() => navigate('/submit')}
                  >
                    <Plus size={18} />
                    Create
                  </button>

                  {/* User Menu */}
                  <div style={{
  position: 'relative'
}} ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(163, 113, 247, 0.1) 100%)',
  border: '1px solid rgba(163, 113, 247, 0.2)',
  borderRadius: '12px',
  padding: '4px',
  transition: 'all 0.2s ease'
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
                      <ChevronDown size={16} style={{
  display: 'none',
  color: '#c9d1d9'
}} />
                    </button>

                    {isUserMenuOpen && (
                      <div style={{
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '8px',
  width: '256px',
  background: 'rgba(10, 10, 11, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
}}>
                        <div style={{
  padding: '16px'
}}>
                          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                            <div style={{
  width: '48px',
  height: '48px',
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
  paddingTop: '8px',
  paddingBottom: '8px'
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
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#c9d1d9',
  background: 'transparent',
  textDecoration: 'none',
  transition: 'background 0.2s ease'
}}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <User size={18} />
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
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#c9d1d9',
  background: 'transparent',
  textDecoration: 'none',
  transition: 'background 0.2s ease'
}}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Settings size={18} />
                            Settings
                          </Link>
                          <Link
                            to="/activity"
                            onClick={() => setIsUserMenuOpen(false)}
                            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#c9d1d9',
  background: 'transparent',
  textDecoration: 'none',
  transition: 'background 0.2s ease'
}}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Activity size={18} />
                            Activity
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
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#c9d1d9',
  background: 'transparent',
  textDecoration: 'none',
  transition: 'background 0.2s ease'
}}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Wallet size={18} />
                            My Wallet
                          </Link>
                        </div>
                        <div style={{
  paddingTop: '8px',
  paddingBottom: '8px'
}}>
                          <button
                            onClick={handleLogout}
                            style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  width: '100%',
  textAlign: 'left'
}}
                          >
                            <LogOut size={18} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(163, 113, 247, 0.1) 100%)',
  border: '1px solid rgba(163, 113, 247, 0.2)',
  transition: 'all 0.2s ease'
}}
                  >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </>
              ) : (
                <button
                  style={{
  paddingLeft: '24px',
  paddingRight: '24px',
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
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && user && (
          <div style={{
  background: 'rgba(10, 10, 11, 0.95)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
}}>
            <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '24px',
  paddingBottom: '24px'
}}>
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
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  borderRadius: '12px',
  fontWeight: '600',
  color: isActive ? '#ffffff' : '#c9d1d9',
  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.2s ease'
}}
                  >
                    <Icon size={20} />
                    {item.label}
                  </Link>
                )
              })}

              {/* Mobile Search */}
              <div className="pt-4">
                <form onSubmit={handleSearch}>
                  <div style={{
  position: 'relative'
}}>
                    <Search style={{
  position: 'absolute',
  width: '20px',
  height: '20px',
  color: '#c9d1d9'
}} />
                    <input
                      type="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
  width: '100%',
  height: '48px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#ffffff',
  paddingLeft: '48px',
  paddingRight: '16px'
}}
                    />
                  </div>
                </form>
              </div>

              {/* Mobile Actions */}
              <div className="pt-4 space-y-2">
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
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#ffffff',
  borderRadius: '12px',
  fontWeight: '600'
}}
                >
                  <Plus size={18} />
                  Create
                </button>

                <ThemeToggle variant="full" size="md" style={{
  width: '100%'
}} />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav style={{
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  background: 'rgba(10, 10, 11, 0.9)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  height: '80px',
  paddingLeft: '8px',
  paddingRight: '8px'
}}>
            {primaryNavItems.map((item) => {
              const Icon = iconMap[item.icon]
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
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
                >
                  <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                    <Icon size={24} />
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

            {/* Mobile Create Button */}
            <button
              onClick={() => navigate('/submit')}
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
  paddingBottom: '8px'
}}
            >
              <div style={{
  width: '48px',
  height: '48px',
  borderRadius: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                <Plus size={24} style={{
  color: '#ffffff'
}} />
              </div>
            </button>
          </div>
        </nav>
      )}

      {/* Spacer for fixed header */}
      <div style={{
  height: '80px'
}}></div>
    </>
  )
}



export default Header
