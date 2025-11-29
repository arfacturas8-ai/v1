import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, Hash, MessageCircle, Coins, Activity, Users, Search, User, Settings, 
  Plus, Star, Award, Bookmark, TrendingUp, BarChart3, Bell, ChevronRight,
  LogOut, X
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useNavigation } from '../../contexts/NavigationContext'

const iconMap = {
  Home: Home,
  Hash: Hash,
  MessageCircle: MessageCircle,
  Coins: Coins,
  Activity: Activity,
  Users: Users,
  Search: Search,
  User: User,
  Settings: Settings,
  Plus: Plus,
  Star: Star,
  Award: Award,
  Bookmark: Bookmark,
  TrendingUp: TrendingUp,
  BarChart3: BarChart3,
  Bell: Bell,
  LogOut: LogOut
}

function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { isSidebarOpen, toggleSidebar, navigationConfig } = useNavigation()

  const handleLogout = () => {
    logout()
    toggleSidebar()
  }

  const NavItem = ({ item, isActive = false, className = "" }) => {
    const Icon = iconMap[item.icon]
    
    return (
      <Link
        to={item.path}
        onClick={toggleSidebar}
        style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  borderRadius: '12px',
  fontWeight: '500',
  color: '#ffffff'
}}
        aria-label={item.description || item.label}
      >
        <Icon 
          size={20} 
          style={{
  color: '#ffffff'
}}
        />
        <span className="truncate">{item.label}</span>
        {isActive && (
          <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
        )}
      </Link>
    )
  }

  const SectionHeader = ({ title, icon: IconComponent }) => (
    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  fontWeight: '600'
}}>
      {IconComponent && <IconComponent size={14} />}
      <span>{title}</span>
    </div>
  )

  // User stats for sidebar
  const userStats = [
    { label: 'Posts', value: '24', icon: 'TrendingUp' },
    { label: 'Karma', value: '1,247', icon: 'Star' },
    { label: 'Awards', value: '8', icon: 'Award' }
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside style={{
  position: 'fixed',
  width: '320px'
}}>
        <div style={{
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}}>
          {/* Sidebar Header */}
          <div style={{
  padding: '24px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
              <h2 style={{
  fontWeight: 'bold'
}}>Navigation</h2>
              <button
                onClick={toggleSidebar}
                style={{
  padding: '8px',
  borderRadius: '12px'
}}
                aria-label="Close sidebar"
              >
                <X size={20} className="text-secondary" />
              </button>
            </div>
            
            {/* User Quick Info */}
            {user && (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  borderRadius: '12px'
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
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{
  flex: '1'
}}>
                  <div style={{
  fontWeight: '500'
}}>
                    {user.displayName || user.username || 'User'}
                  </div>
                  <div className="text-xs text-tertiary truncate">
                    {user.email || 'user@cryb.com'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Content */}
          <div style={{
  flex: '1',
  padding: '16px'
}}>
            {/* Primary Navigation */}
            <section>
              <SectionHeader title="Main" icon={Home} />
              <nav className="space-y-1">
                {navigationConfig.primary.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={location.pathname === item.path}
                  />
                ))}
              </nav>
            </section>

            {/* Secondary Navigation */}
            <section>
              <SectionHeader title="Discover" icon={Search} />
              <nav className="space-y-1">
                {navigationConfig.secondary.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={location.pathname === item.path}
                  />
                ))}
              </nav>
            </section>

            {/* Quick Actions */}
            <section>
              <SectionHeader title="Create" icon={Plus} />
              <nav className="space-y-1">
                {navigationConfig.quickActions.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    style={{
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
                  />
                ))}
              </nav>
            </section>

            {/* User Stats */}
            {user && (
              <section>
                <SectionHeader title="Your Stats" icon={BarChart3} />
                <div style={{
  display: 'grid',
  gap: '8px'
}}>
                  {userStats.map((stat) => {
                    const Icon = iconMap[stat.icon]
                    return (
                      <div
                        key={stat.label}
                        style={{
  padding: '12px',
  borderRadius: '12px',
  textAlign: 'center'
}}
                      >
                        <Icon size={16} className="mx-auto mb-1 text-primary-trust" />
                        <div style={{
  fontWeight: 'bold'
}}>{stat.value}</div>
                        <div className="text-xs text-tertiary">{stat.label}</div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Recent Communities */}
            <section>
              <SectionHeader title="Recent Communities" icon={Hash} />
              <nav className="space-y-1">
                {[
                  { name: 'technology', path: '/c/technology', members: '125k' },
                  { name: 'gaming', path: '/c/gaming', members: '89k' },
                  { name: 'crypto', path: '/c/crypto', members: '67k' }
                ].map((community) => (
                  <Link
                    key={community.name}
                    to={community.path}
                    onClick={toggleSidebar}
                    style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
                  >
                    <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                      <div style={{
  width: '24px',
  height: '24px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-secondary group-hover:text-primary">
                        c/{community.name}
                      </span>
                    </div>
                    <span className="text-xs text-tertiary">{community.members}</span>
                  </Link>
                ))}
                <Link
                  to="/communities"
                  onClick={toggleSidebar}
                  style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px'
}}
                >
                  <span>View All</span>
                  <ChevronRight size={14} />
                </Link>
              </nav>
            </section>
          </div>

          {/* Sidebar Footer */}
          <div style={{
  padding: '16px'
}}>
            {/* Account Navigation */}
            <nav className="space-y-1 mb-4">
              {navigationConfig.account.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={location.pathname === item.path}
                />
              ))}
            </nav>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  width: '100%',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px',
  fontWeight: '500',
  borderRadius: '12px'
}}
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          style={{
  position: 'fixed'
}}
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        />
      )}
    </>
  )
}



export default Sidebar