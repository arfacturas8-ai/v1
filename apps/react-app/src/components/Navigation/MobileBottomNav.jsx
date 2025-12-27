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
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.04)'
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
              className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[64px]"
              style={{
                color: isActive ? '#58a6ff' : '#666666',
              }}
              aria-label={item.label}
              onTouchStart={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)'
              }}
              onTouchEnd={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div className="relative">
                <Icon
                  style={{
                    width: "24px",
                    height: "24px",
                    flexShrink: 0,
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    strokeWidth: isActive ? 2.5 : 2,
                    transition: 'all 0.2s ease'
                  }}
                />
                {item.badge > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '16px',
                      height: '16px',
                      padding: '0 4px',
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#FFFFFF',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '9999px',
                      border: '2px solid rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all 0.2s ease'
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '4px',
                    height: '4px',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px rgba(88, 166, 255, 0.5)'
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
