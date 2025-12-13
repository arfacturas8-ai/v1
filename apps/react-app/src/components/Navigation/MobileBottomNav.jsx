/**
 * CRYB Platform - Mobile Bottom Navigation v.1
 * Light theme bottom navigation matching design screenshots
 * 4 items: Community, Discover, Wallet, Profile
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, Compass, Wallet, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Fetch unread message count
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const response = await apiService.get('/messages/unread-count');
        if (response.success && response.data) {
          setUnreadMessages(response.data.count || 0);
        }
      } catch (err) {
        // Silently fail - notifications not critical
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const navItems = [
    { path: '/communities', icon: Users, label: 'Community' },
    { path: '/discover', icon: Compass, label: 'Discover' },
    { path: '/wallet', icon: Wallet, label: 'Wallet', badge: 0 },
    { path: `/profile/${user?.username}`, icon: User, label: 'Profile' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px]"
              style={{
                color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
              }}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon
                  className="w-6 h-6 transition-transform"
                  style={{
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    strokeWidth: isActive ? 2.5 : 2
                  }}
                />
                {item.badge > 0 && (
                  <span
                    className="badge-count"
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-8px'
                    }}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  fontWeight: isActive ? 600 : 500
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '4px',
                    height: '4px',
                    background: 'var(--brand-primary)',
                    borderRadius: '50%'
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
