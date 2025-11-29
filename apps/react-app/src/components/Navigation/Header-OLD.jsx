import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Menu, Search, Bell, User, Settings, LogOut, Plus, X, Hash, Home, Users, 
  Activity, MessageCircle, Coins, Sidebar, ChevronDown, Zap, Moon, Sun
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useNavigation } from '../../contexts/NavigationContext'
import { useTheme } from '../ui/ThemeProvider'
import { Button, Input, InputGroup, InputLeftElement, Avatar, AvatarFallback, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '../ui'
import { cn } from '../../lib/utils'

const iconMap = {
  Home: Home,
  Users: Users,
  User: User,
  Activity: Activity,
  Zap: Zap,
  MessageCircle: MessageCircle,
  Hash: Hash,
  Coins: Coins,
  Search: Search,
  Settings: Settings,
  Plus: Plus
}

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const { theme, setTheme } = useTheme()
  const { 
    navigationConfig, 
    toggleSidebar, 
    toggleMobileMenu, 
    notifications
  } = useNavigation()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  
  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <>
      {/* Main Header with Glass Morphism */}
      <header style={{
  position: 'fixed',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
        <div style={{
  paddingLeft: '24px',
  paddingRight: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '64px'
}}>
            
            {/* Left Section - Logo & Navigation */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '24px'
}}>
              
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden"
                aria-label="Toggle menu"
              >
                <Menu style={{
  width: '20px',
  height: '20px'
}} />
              </Button>

              {/* Logo */}
              <Link to="/home" style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                <div style={{
  position: 'relative'
}}>
                  <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                    <span style={{
  color: '#ffffff',
  fontWeight: 'bold'
}}>C</span>
                  </div>
                  <div style={{
  position: 'absolute',
  borderRadius: '12px'
}}></div>
                </div>
                <span style={{
  fontWeight: 'bold',
  display: 'none'
}}>
                  CRYB
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav style={{
  display: 'none',
  alignItems: 'center',
  gap: '4px'
}}>
                {navigationConfig.primary?.map((item) => {
                  const Icon = iconMap[item.icon]
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105",
                        isActive 
                          ? 'bg-blue-9 text-white shadow-lg shadow-blue-9/25' 
                          : 'text-gray-11 hover:text-gray-12 hover:bg-gray-3'
                      )}
                      title={item.description}
                    >
                      <Icon style={{
  width: '16px',
  height: '16px'
}} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Center Search - Desktop */}
            <div style={{
  display: 'none',
  flex: '1',
  marginLeft: '24px',
  marginRight: '24px'
}}>
              <form onSubmit={handleSearch} style={{
  position: 'relative'
}}>
                <InputGroup>
                  <InputLeftElement>
                    <Search className={cn(
                      "w-4 h-4 transition-colors",
                      isSearchFocused ? "text-blue-9" : "text-gray-9"
                    )} />
                  </InputLeftElement>
                  <Input
                    variant="glass"
                    placeholder="Search communities, users, posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    style={{
  height: '40px'
}}
                  />
                </InputGroup>
              </form>
            </div>

            {/* Right Section - Actions & User */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                style={{
  position: 'relative',
  overflow: 'hidden'
}}
                aria-label="Toggle theme"
              >
                <Sun className={cn(
                  "h-4 w-4 transition-all duration-300",
                  theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
                )} />
                <Moon className={cn(
                  "absolute h-4 w-4 transition-all duration-300",
                  theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
                )} />
              </Button>

              {user ? (
                <>
                  {/* Create Button - Desktop */}
                  <Button 
                    variant="gradient"
                    size="sm"
                    style={{
  display: 'none',
  gap: '8px'
}}
                    onClick={() => navigate('/submit')}
                  >
                    <Plus style={{
  width: '16px',
  height: '16px'
}} />
                    Create
                  </Button>
                  
                  {/* Notifications */}
                  <Button variant="ghost" size="icon" style={{
  position: 'relative'
}}>
                    <Bell style={{
  width: '20px',
  height: '20px'
}} />
                    {notifications?.unread > 0 && (
                      <Badge 
                        variant="destructive" 
                        style={{
  position: 'absolute',
  height: '20px',
  width: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0px'
}}
                      >
                        {notifications.unread > 9 ? '9+' : notifications.unread}
                      </Badge>
                    )}
                  </Button>

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" style={{
  position: 'relative',
  height: '40px',
  paddingLeft: '8px',
  paddingRight: '8px',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
                        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                          <Avatar size="sm">
                            <AvatarFallback style={{
  color: '#ffffff'
}}>
                              {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span style={{
  display: 'none',
  fontWeight: '500'
}}>
                            {user?.username || 'User'}
                          </span>
                          <ChevronDown style={{
  display: 'none',
  width: '16px',
  height: '16px',
  color: '#c9d1d9'
}} />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" style={{
  width: '256px'
}}>
                      
                      {/* User Info */}
                      <div style={{
  padding: '16px'
}}>
                        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                          <Avatar>
                            <AvatarFallback style={{
  color: '#ffffff'
}}>
                              {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div style={{
  flex: '1'
}}>
                            <p style={{
  fontWeight: '500',
  color: '#c9d1d9'
}}>
                              {user?.displayName || user?.username || 'User'}
                            </p>
                            <p style={{
  color: '#c9d1d9'
}}>
                              {user?.email || 'user@cryb.com'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Quick Stats */}
                        <div style={{
  display: 'flex',
  gap: '16px'
}}>
                          <div style={{
  textAlign: 'center'
}}>
                            <div style={{
  fontWeight: 'bold',
  color: '#c9d1d9'
}}>24</div>
                            <div style={{
  color: '#c9d1d9'
}}>Posts</div>
                          </div>
                          <div style={{
  textAlign: 'center'
}}>
                            <div style={{
  fontWeight: 'bold',
  color: '#c9d1d9'
}}>1.2k</div>
                            <div style={{
  color: '#c9d1d9'
}}>Karma</div>
                          </div>
                          <div style={{
  textAlign: 'center'
}}>
                            <div style={{
  fontWeight: 'bold',
  color: '#c9d1d9'
}}>8</div>
                            <div style={{
  color: '#c9d1d9'
}}>Awards</div>
                          </div>
                        </div>
                      </div>

                      {/* Navigation Items */}
                      {navigationConfig.account?.map((item) => {
                        const Icon = iconMap[item.icon]
                        return (
                          <DropdownMenuItem key={item.id} asChild>
                            <Link to={item.path} className="cursor-pointer">
                              <Icon style={{
  width: '16px',
  height: '16px'
}} />
                              <div>
                                <div style={{
  fontWeight: '500'
}}>{item.label}</div>
                                <div style={{
  color: '#c9d1d9'
}}>{item.description}</div>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                      
                      <DropdownMenuItem asChild>
                        <Link to="/activity" className="cursor-pointer">
                          <Activity style={{
  width: '16px',
  height: '16px'
}} />
                          <div>
                            <div style={{
  fontWeight: '500'
}}>Activity</div>
                            <div style={{
  color: '#c9d1d9'
}}>Your activity timeline</div>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={handleLogout}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        <LogOut style={{
  width: '16px',
  height: '16px'
}} />
                        <span style={{
  fontWeight: '500'
}}>Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
                  <Button variant="ghost" onClick={() => navigate('/')}>
                    Sign In
                  </Button>
                  <Button variant="gradient" onClick={() => navigate('/')}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Bar */}
      <div style={{
  position: 'fixed',
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '16px'
}}>
        <form onSubmit={handleSearch}>
          <InputGroup>
            <InputLeftElement>
              <Search style={{
  width: '16px',
  height: '16px',
  color: '#c9d1d9'
}} />
            </InputLeftElement>
            <Input
              variant="glass"
              placeholder="Search communities, users, posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
  height: '48px'
}}
            />
          </InputGroup>
        </form>
      </div>

      {/* Mobile Bottom Navigation */}
      {user && (
        <nav style={{
  position: 'fixed',
  background: 'rgba(22, 27, 34, 0.6)'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  height: '64px',
  paddingLeft: '8px',
  paddingRight: '8px'
}}>
            {navigationConfig.primary?.map((item) => {
              const Icon = iconMap[item.icon]
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg transition-all duration-200",
                    isActive 
                      ? 'text-blue-9 bg-blue-1' 
                      : 'text-gray-11 hover:text-gray-12 hover:bg-gray-3'
                  )}
                >
                  <Icon style={{
  width: '20px',
  height: '20px'
}} />
                  <span style={{
  fontWeight: '500'
}}>{item.label}</span>
                </Link>
              )
            })}
            
            {/* Mobile Create Button */}
            <Button
              variant="gradient"
              size="icon"
              onClick={() => navigate('/submit')}
              style={{
  width: '48px',
  height: '48px',
  borderRadius: '12px'
}}
            >
              <Plus style={{
  width: '20px',
  height: '20px'
}} />
            </Button>
          </div>
        </nav>
      )}
    </>
  )
}



export default Header