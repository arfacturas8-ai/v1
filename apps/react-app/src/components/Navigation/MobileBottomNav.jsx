import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';
import { cn } from '../../lib/utils';



export default function MobileBottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/home', icon: Home, label: 'Home' },
    { path: '/communities', icon: Search, label: 'Explore' },
    { path: '/create', icon: Plus, label: 'Create' },
    { path: '/chat', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav style={{
  position: 'fixed',
  paddingBottom: 'env(safe-area-inset-bottom)'
}}>
      <div style={{
  display: 'grid',
  height: '64px'
}}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-text-tertiary hover:text-text-primary'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-all',
                  isActive && 'scale-110'
                )}
              />
              <span style={{
  fontWeight: '500'
}}>{item.label}</span>
              {isActive && (
                <div style={{
  position: 'absolute',
  width: '48px',
  height: '4px'
}} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

