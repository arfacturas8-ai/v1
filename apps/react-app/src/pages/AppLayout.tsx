import React, { useState } from 'react';
import { Home, Compass, Plus, MessageCircle, User, Search, Bell, Wallet, Coins, UserPlus } from 'lucide-react';
import { colors, spacing, radii, typography, shadows, zIndex } from '../design-system/tokens';
import { InviteFriendsModal } from '../components/InviteFriendsModal';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab?: 'home' | 'explore' | 'create' | 'crypto' | 'profile';
  onTabChange?: (tab: 'home' | 'explore' | 'create' | 'crypto' | 'profile') => void;
  onSearch?: () => void;
  onNotifications?: () => void;
  onWallet?: () => void;
  notificationCount?: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeTab = 'home',
  onTabChange,
  onSearch,
  onNotifications,
  onWallet,
  notificationCount = 0,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'create', label: 'Create', icon: Plus },
    { id: 'crypto', label: 'Crypto', icon: Coins },
    { id: 'profile', label: 'Profile', icon: User },
  ] as const;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg.primary,
        color: colors.text.primary,
        fontFamily: typography.fontFamily.sans,
        paddingBottom: '60px',
      }}
    >
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: zIndex.sticky,
          backgroundColor: scrolled ? colors.bg.secondary : colors.bg.primary,
          borderBottom: `1px solid ${colors.border.default}`,
          backdropFilter: 'blur(12px)',
          transition: 'all 150ms ease-out',
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            padding: `${spacing[2]} ${spacing[4]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing[3],
          }}
        >
          {/* Logo */}
          <div
            id="app-logo"
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              background: colors.brand.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            CRYB
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            {/* Search */}
            <button
              id="search-button"
              onClick={onSearch}
              aria-label="Search"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: radii.full,
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.text.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              <Search size={24} />
            </button>

            {/* Notifications */}
            <button
              id="notifications-button"
              onClick={onNotifications}
              aria-label="Notifications"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: radii.full,
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.text.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              <Bell size={24} />
              {notificationCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: notificationCount > 9 ? '18px' : '12px',
                    height: '12px',
                    borderRadius: radii.full,
                    backgroundColor: colors.semantic.error,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            {/* Invite Friends */}
            <button
              id="invite-button"
              onClick={() => setInviteModalOpen(true)}
              aria-label="Invite Friends"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: radii.full,
                border: 'none',
                backgroundColor: 'transparent',
                color: colors.text.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.bg.hover;
                e.currentTarget.style.color = colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.text.secondary;
              }}
            >
              <UserPlus size={24} />
            </button>

            {/* Wallet */}
            <button
              id="wallet-button"
              onClick={onWallet}
              aria-label="Wallet"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: radii.full,
                border: 'none',
                background: colors.brand.gradient,
                color: colors.text.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
                boxShadow: shadows.sm,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = shadows.md;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = shadows.sm;
              }}
            >
              <Wallet size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: `${spacing[2]} ${spacing[3]}`,
        }}
      >
        {children}
      </main>

      {/* Bottom Tab Bar */}
      <nav
        id="bottom-navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: zIndex.sticky,
          backgroundColor: colors.bg.secondary,
          borderTop: `1px solid ${colors.border.default}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: `${spacing[1]} ${spacing[3]}`,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                id={`${tab.id}-tab`}
                onClick={() => onTabChange?.(tab.id as typeof activeTab)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: spacing[1],
                  padding: `${spacing[1]} ${spacing[2]}`,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: isActive ? colors.brand.primary : colors.text.tertiary,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = colors.text.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = colors.text.tertiary;
                  }
                }}
              >
                <Icon
                  size={26}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    transition: 'transform 150ms ease-out',
                  }}
                />
                <span
                  style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.regular,
                  }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: radii.full,
                      backgroundColor: colors.brand.primary,
                      marginTop: spacing[1],
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Invite Friends Modal */}
      <InviteFriendsModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
