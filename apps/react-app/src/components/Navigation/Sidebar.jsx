/**
 * CRYB Platform - Desktop Sidebar v.1
 * Light theme sidebar navigation matching design spec
 */

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
        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${className}`}
        style={{
          color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
          background: isActive ? 'var(--color-info-light)' : 'transparent',
          fontWeight: isActive ? 600 : 500
        }}
        aria-label={item.description || item.label}
      >
        <Icon
          size={20}
          style={{
            color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
            strokeWidth: isActive ? 2.5 : 2
          }}
        />
        <span className="truncate">{item.label}</span>
        {isActive && (
          <div
            style={{
              width: '4px',
              height: '4px',
              background: 'var(--brand-primary)',
              borderRadius: '50%',
              marginLeft: 'auto'
            }}
          />
        )}
      </Link>
    )
  }

  const SectionHeader = ({ title, icon: IconComponent }) => (
    <div
      className="flex items-center gap-2 px-4 py-2 font-semibold"
      style={{
        color: 'var(--text-tertiary)',
        fontSize: 'var(--text-xs)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
    >
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
      <aside
        className="fixed top-0 left-0 h-screen"
        style={{
          width: '320px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--transition-normal)',
          zIndex: 'var(--z-fixed)'
        }}
      >
        <div className="h-full flex flex-col" style={{ overflowY: 'auto' }}>
          {/* Sidebar Header */}
          <div style={{ padding: 'var(--space-6)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--text-primary)'
                }}
              >
                Navigation
              </h2>
              <button
                onClick={toggleSidebar}
                className="btn-ghost p-2"
                style={{
                  borderRadius: 'var(--radius-lg)'
                }}
                aria-label="Close sidebar"
              >
                <X size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* User Quick Info */}
            {user && (
              <div
                className="card card-compact"
                style={{
                  background: 'var(--bg-gradient-subtle)',
                  border: 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="avatar avatar-md">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 'var(--font-semibold)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-base)'
                      }}
                    >
                      {user.displayName || user.username || 'User'}
                    </div>
                    <div
                      className="truncate"
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)'
                      }}
                    >
                      {user.email || 'user@cryb.com'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Content */}
          <div style={{ flex: 1, padding: 'var(--space-4)', overflowY: 'auto' }}>
            {/* Primary Navigation */}
            <section style={{ marginBottom: 'var(--space-6)' }}>
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
            <section style={{ marginBottom: 'var(--space-6)' }}>
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
            <section style={{ marginBottom: 'var(--space-6)' }}>
              <SectionHeader title="Create" icon={Plus} />
              <nav className="space-y-1">
                {navigationConfig.quickActions.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    className="border"
                    style={{
                      borderColor: 'var(--border-default)'
                    }}
                  />
                ))}
              </nav>
            </section>

            {/* User Stats */}
            {user && (
              <section style={{ marginBottom: 'var(--space-6)' }}>
                <SectionHeader title="Your Stats" icon={BarChart3} />
                <div className="grid gap-2">
                  {userStats.map((stat) => {
                    const Icon = iconMap[stat.icon]
                    return (
                      <div
                        key={stat.label}
                        className="card card-compact text-center"
                        style={{
                          background: 'var(--bg-tertiary)'
                        }}
                      >
                        <Icon
                          size={16}
                          className="mx-auto mb-1"
                          style={{ color: 'var(--brand-primary)' }}
                        />
                        <div
                          style={{
                            fontWeight: 'var(--font-bold)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {stat.value}
                        </div>
                        <div
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-tertiary)'
                          }}
                        >
                          {stat.label}
                        </div>
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
                    className="flex items-center justify-between px-4 py-2 rounded-lg transition-all"
                    style={{
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--bg-gradient-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--brand-primary)',
                          fontWeight: 'var(--font-bold)',
                          fontSize: 'var(--text-sm)'
                        }}
                      >
                        {community.name.charAt(0).toUpperCase()}
                      </div>
                      <span>c/{community.name}</span>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                      {community.members}
                    </span>
                  </Link>
                ))}
                <Link
                  to="/communities"
                  onClick={toggleSidebar}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  style={{
                    color: 'var(--brand-primary)',
                    fontWeight: 'var(--font-medium)',
                    fontSize: 'var(--text-sm)'
                  }}
                >
                  <span>View All</span>
                  <ChevronRight size={14} />
                </Link>
              </nav>
            </section>
          </div>

          {/* Sidebar Footer */}
          <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border-subtle)' }}>
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
              className="flex items-center gap-3 w-full px-4 py-3 font-medium rounded-xl transition-all"
              style={{
                color: 'var(--color-error)',
                background: 'var(--color-error-light)'
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
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-tertiary)',
            backdropFilter: 'blur(4px)',
            zIndex: 'var(--z-modal-backdrop)'
          }}
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        />
      )}
    </>
  )
}

export default Sidebar
