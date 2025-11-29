import { Link, useLocation } from 'react-router-dom'
import { 
  X, Home, Hash, MessageCircle, Coins, Activity, Users, Search, User, Settings,
  Plus, Bell, Bookmark, Award, TrendingUp, BarChart3, LogOut, ChevronRight
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
  Bell: Bell,
  Bookmark: Bookmark,
  Award: Award,
  TrendingUp: TrendingUp,
  BarChart3: BarChart3,
  LogOut: LogOut
}

function MobileMenu() {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { 
    isMobileMenuOpen, 
    toggleMobileMenu, 
    navigationConfig,
    notifications
  } = useNavigation()

  const handleLogout = () => {
    logout()
    toggleMobileMenu()
  }

  const NavItem = ({ item, isActive = false, className = "" }) => {
    const Icon = iconMap[item.icon]
    
    return (
      <Link
        to={item.path}
        onClick={toggleMobileMenu}
        style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '16px',
  paddingBottom: '16px'
}}
      >
        <Icon 
          size={22} 
          className={`flex-shrink-0 ${
            isActive ? 'text-primary-trust' : 'text-tertiary'
          }`}
        />
        <div style={{
  flex: '1'
}}>
          <div style={{
  fontWeight: '500'
}}>{item.label}</div>
          {item.description && (
            <div className="text-xs text-tertiary mt-0.5">{item.description}</div>
          )}
        </div>
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
  paddingTop: '12px',
  paddingBottom: '12px'
}}>
      {IconComponent && <IconComponent size={16} className="text-primary" />}
      <span style={{
  fontWeight: '600'
}}>{title}</span>
    </div>
  )

  if (!isMobileMenuOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        style={{
  position: 'fixed'
}}
        onClick={toggleMobileMenu}
      />

      {/* Mobile Menu Drawer */}
      <div style={{
  position: 'fixed',
  width: '320px'
}}>
        <div style={{
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}}>
          {/* Header */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
              <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                C
              </div>
              <span style={{
  fontWeight: 'bold'
}}>
                CRYB
              </span>
            </div>
            <button
              onClick={toggleMobileMenu}
              style={{
  padding: '8px',
  borderRadius: '12px'
}}
              aria-label="Close menu"
            >
              <X size={20} className="text-secondary" />
            </button>
          </div>

          {/* User Info */}
          {user && (
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
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{
  flex: '1'
}}>
                  <div style={{
  fontWeight: '600'
}}>
                    {user.displayName || user.username || 'User'}
                  </div>
                  <div className="text-xs text-tertiary truncate">
                    {user.email || 'user@cryb.com'}
                  </div>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div style={{
  display: 'grid',
  gap: '12px'
}}>
                <div style={{
  textAlign: 'center',
  padding: '8px',
  borderRadius: '12px'
}}>
                  <div style={{
  fontWeight: 'bold'
}}>24</div>
                  <div className="text-xs text-tertiary">Posts</div>
                </div>
                <div style={{
  textAlign: 'center',
  padding: '8px',
  borderRadius: '12px'
}}>
                  <div style={{
  fontWeight: 'bold'
}}>1.2k</div>
                  <div className="text-xs text-tertiary">Karma</div>
                </div>
                <div style={{
  textAlign: 'center',
  padding: '8px',
  borderRadius: '12px'
}}>
                  <div style={{
  fontWeight: 'bold'
}}>8</div>
                  <div className="text-xs text-tertiary">Awards</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Content */}
          <div style={{
  flex: '1'
}}>
            {/* Primary Navigation */}
            <div>
              <SectionHeader title="Main Navigation" icon={Home} />
              <nav>
                {navigationConfig.primary.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={location.pathname === item.path}
                  />
                ))}
              </nav>
            </div>

            {/* Secondary Navigation */}
            <div className="mt-2">
              <SectionHeader title="Discover" icon={Search} />
              <nav>
                {navigationConfig.secondary.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={location.pathname === item.path}
                  />
                ))}
              </nav>
            </div>

            {/* Quick Actions */}
            <div className="mt-2">
              <SectionHeader title="Quick Actions" icon={Plus} />
              <nav>
                {navigationConfig.quickActions.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    className="border-l-4 border-transparent hover:border-accent-cyan"
                  />
                ))}
              </nav>
            </div>

            {/* Recent Communities */}
            <div className="mt-2">
              <SectionHeader title="Recent Communities" icon={Hash} />
              <nav>
                {[
                  { name: 'technology', path: '/c/technology', members: '125k', active: true },
                  { name: 'gaming', path: '/c/gaming', members: '89k', active: false },
                  { name: 'crypto', path: '/c/crypto', members: '67k', active: true },
                  { name: 'defi', path: '/c/defi', members: '43k', active: false }
                ].map((community) => (
                  <Link
                    key={community.name}
                    to={community.path}
                    onClick={toggleMobileMenu}
                    style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px'
}}
                  >
                    <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontWeight: 'bold'
}}>
                      {community.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{
  flex: '1'
}}>
                      <div style={{
  fontWeight: '500'
}}>
                        c/{community.name}
                      </div>
                      <div className="text-xs text-tertiary">
                        {community.members} members
                      </div>
                    </div>
                    {community.active && (
                      <div style={{
  width: '8px',
  height: '8px',
  borderRadius: '50%'
}} />
                    )}
                  </Link>
                ))}
                
                <Link
                  to="/communities"
                  onClick={toggleMobileMenu}
                  style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px'
}}
                >
                  <Search size={20} />
                  <span style={{
  fontWeight: '500'
}}>Browse All Communities</span>
                  <ChevronRight size={16} className="ml-auto" />
                </Link>
              </nav>
            </div>

            {/* Notifications Section */}
            <div className="mt-2">
              <SectionHeader title="Notifications" icon={Bell} />
              <div style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '12px',
  paddingBottom: '12px'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <span className="text-sm text-secondary">Unread notifications</span>
                  <span style={{
  fontWeight: 'bold'
}}>
                    {notifications.unread}
                  </span>
                </div>
                <Link
                  to="/notifications"
                  onClick={toggleMobileMenu}
                  className="text-xs text-primary-trust hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-secondary">
            {/* Account Navigation */}
            <nav>
              {navigationConfig.account.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={location.pathname === item.path}
                />
              ))}
            </nav>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  width: '100%',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '16px',
  paddingBottom: '16px'
}}
            >
              <LogOut size={22} />
              <span style={{
  fontWeight: '500'
}}>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}



export default MobileMenu