import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Hash, Plus, MessageCircle, User, Bell } from 'lucide-react';
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
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/communities', icon: Hash, label: 'Communities' },
    { path: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadMessages },
    { path: `/profile/${user?.username}`, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {/* First two nav items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px] ${
                isActive
                  ? 'text-[#58a6ff]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
              aria-label={item.label}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[#58a6ff] rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Center Create Button */}
        <button
          onClick={() => navigate('/submit')}
          className="flex flex-col items-center justify-center"
          aria-label="Create post"
        >
          <div className="w-14 h-14 -mt-6 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center shadow-[0_4px_20px_rgba(88,166,255,0.5)] border-4 border-[#0d1117] hover:scale-105 transition-transform">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* Last two nav items */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px] ${
                isActive
                  ? 'text-[#58a6ff]'
                  : 'text-[#8b949e] hover:text-white'
              }`}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-[#58a6ff] text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[#58a6ff] rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
