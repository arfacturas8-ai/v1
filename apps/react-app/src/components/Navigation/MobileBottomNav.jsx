import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Hash, Plus, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/communities', icon: Hash, label: 'Explore' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: `/profile/${user?.username}`, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
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
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-[#58a6ff] rounded-full" />
              )}
            </Link>
          );
        })}

        {/* Create Button */}
        <button
          onClick={() => navigate('/submit')}
          className="relative flex flex-col items-center justify-center -mt-4"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] flex items-center justify-center shadow-[0_4px_16px_rgba(88,166,255,0.4)]">
            <Plus className="w-6 h-6 text-white" />
          </div>
        </button>
      </div>
    </nav>
  );
}
