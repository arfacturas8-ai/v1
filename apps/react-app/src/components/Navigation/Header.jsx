import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, User, Settings, LogOut, Plus, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../ui/ThemeProvider';
import { Button, IconButton } from '../ui/Button';
import { cn } from '../../lib/utils';



export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <header style={{
  position: 'sticky',
  width: '100%'
}} role="banner">
      <div style={{
  display: 'flex',
  height: '64px',
  alignItems: 'center',
  paddingLeft: '16px',
  paddingRight: '16px'
}}>

        {/* Mobile Menu Toggle */}
        <IconButton
          variant="ghost"
          size="sm"
          className="mr-2 lg:hidden"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          aria-label="Toggle menu"
        >
          <Menu style={{
  height: '20px',
  width: '20px'
}} />
        </IconButton>

        {/* Logo */}
        <Link to="/home" style={{
  display: 'flex',
  alignItems: 'center'
}}>
          <span style={{
  fontWeight: 'bold'
}}>
            CRYB
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{
  display: 'none',
  alignItems: 'center',
  gap: '8px'
}} aria-label="Main navigation">
          <Link to="/home">
            <Button variant={location.pathname === '/home' ? 'secondary' : 'ghost'} size="sm" aria-current={location.pathname === '/home' ? 'page' : undefined}>
              Home
            </Button>
          </Link>
          <Link to="/explore">
            <Button variant={location.pathname === '/explore' ? 'secondary' : 'ghost'} size="sm" aria-current={location.pathname === '/explore' ? 'page' : undefined}>
              Explore
            </Button>
          </Link>
          <Link to="/communities">
            <Button variant={location.pathname.startsWith('/communities') ? 'secondary' : 'ghost'} size="sm" aria-current={location.pathname.startsWith('/communities') ? 'page' : undefined}>
              Communities
            </Button>
          </Link>
          <Link to="/chat">
            <Button variant={location.pathname === '/chat' ? 'secondary' : 'ghost'} size="sm" aria-current={location.pathname === '/chat' ? 'page' : undefined}>
              Chat
            </Button>
          </Link>
        </nav>

        {/* Search - Center */}
        <div style={{
  display: 'none',
  flex: '1'
}}>
          <form onSubmit={handleSearch} style={{
  position: 'relative',
  width: '100%'
}} role="search" aria-label="Site search">
            <Search style={{
  position: 'absolute',
  height: '16px',
  width: '16px'
}} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search communities, NFTs, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
  width: '100%',
  height: '40px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
              aria-label="Search communities, NFTs, users"
            />
          </form>
        </div>

        {/* Right Actions */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>

          {/* Mobile Search */}
          <IconButton variant="ghost" size="sm" className="md:hidden" aria-label="Search">
            <Search style={{
  height: '20px',
  width: '20px'
}} />
          </IconButton>

          {/* Create Button */}
          {user && (
            <Button variant="primary" size="sm" leftIcon={<Plus style={{
  height: '16px',
  width: '16px'
}} />} style={{
  display: 'none'
}} aria-label="Create new post">
              Create
            </Button>
          )}

          {/* Notifications */}
          {user && (
            <IconButton variant="ghost" size="sm" aria-label="Notifications">
              <Bell style={{
  height: '20px',
  width: '20px'
}} />
            </IconButton>
          )}

          {/* Theme Toggle */}
          <IconButton variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon style={{
  height: '20px',
  width: '20px'
}} /> : <Sun style={{
  height: '20px',
  width: '20px'
}} />}
          </IconButton>

          {/* User Menu */}
          {user ? (
            <div style={{
  position: 'relative'
}}>
              <button
                style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px'
}}
                aria-label={`User menu for ${user.username || 'user'}`}
                aria-haspopup="true"
                aria-expanded="false"
              >
                <div style={{
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <span style={{
  color: '#ffffff',
  fontWeight: '500'
}} aria-hidden="true">
                    {user.username?.[0]?.toUpperCase()}
                  </span>
                </div>
              </button>

              {/* Dropdown */}
              <nav
                style={{
  position: 'absolute',
  width: '192px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}
                aria-label="User account menu"
                role="menu"
              >
                <Link to="/profile" style={{
  display: 'block',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}} role="menuitem">
                  <User style={{
  height: '16px',
  width: '16px'
}} aria-hidden="true" />
                  Profile
                </Link>
                <Link to="/settings" style={{
  display: 'block',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}} role="menuitem">
                  <Settings style={{
  height: '16px',
  width: '16px'
}} aria-hidden="true" />
                  Settings
                </Link>
                <hr className="border-border" role="separator" />
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  style={{
  width: '100%',
  textAlign: 'left',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px'
}}
                  role="menuitem"
                >
                  <LogOut style={{
  height: '16px',
  width: '16px'
}} aria-hidden="true" />
                  Logout
                </button>
              </nav>
            </div>
          ) : (
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {showMobileMenu && (
        <div style={{
  padding: '16px'
}}>
          <nav style={{
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
}} aria-label="Mobile navigation">
            <Link to="/home" onClick={() => setShowMobileMenu(false)}>
              <Button variant={location.pathname === '/home' ? 'secondary' : 'ghost'} fullWidth aria-current={location.pathname === '/home' ? 'page' : undefined}>
                Home
              </Button>
            </Link>
            <Link to="/communities" onClick={() => setShowMobileMenu(false)}>
              <Button variant={location.pathname.startsWith('/communities') ? 'secondary' : 'ghost'} fullWidth aria-current={location.pathname.startsWith('/communities') ? 'page' : undefined}>
                Communities
              </Button>
            </Link>
            <Link to="/nft" onClick={() => setShowMobileMenu(false)}>
              <Button variant={location.pathname === '/nft' ? 'secondary' : 'ghost'} fullWidth aria-current={location.pathname === '/nft' ? 'page' : undefined}>
                NFTs
              </Button>
            </Link>
            <Link to="/chat" onClick={() => setShowMobileMenu(false)}>
              <Button variant={location.pathname === '/chat' ? 'secondary' : 'ghost'} fullWidth aria-current={location.pathname === '/chat' ? 'page' : undefined}>
                Chat
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

