import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, User, Settings, LogOut, Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

/**
 * Header Component - iOS-style clean navigation
 * - Light theme only (no dark mode)
 * - 72px height on desktop, 56px on mobile
 * - Clean shadows and spacing
 * - Proper responsive breakpoints
 */
export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Responsive breakpoints
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const isActiveRoute = (path) => {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: isMobile ? '56px' : '72px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E8EAED',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        zIndex: 30
      }}
    >
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: isMobile ? '16px' : isTablet ? '24px' : '80px',
        paddingRight: isMobile ? '16px' : isTablet ? '24px' : '80px',
        gap: '24px'
      }}>

        {/* Left Section: Logo + Desktop Nav */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isDesktop ? '48px' : '16px',
          flex: '0 0 auto'
        }}>

          {/* Mobile Menu Toggle */}
          {isMobile && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle menu"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#F0F2F5'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {showMobileMenu ? (
                <X style={{ width: '24px', height: '24px', color: '#1A1A1A', flexShrink: 0 }} />
              ) : (
                <Menu style={{ width: '24px', height: '24px', color: '#1A1A1A', flexShrink: 0 }} />
              )}
            </button>
          )}

          {/* Logo */}
          <Link
            to="/home"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              gap: '8px'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{
                color: '#FFFFFF',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>C</span>
            </div>
            <span style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1A1A1A',
              letterSpacing: '-0.5px'
            }}>
              cryb
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {isDesktop && (
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              aria-label="Main navigation"
            >
              {[
                { path: '/home', label: 'Home' },
                { path: '/communities', label: 'Communities' },
                { path: '/learn', label: 'Learn' },
                { path: '/discover', label: 'Discover' }
              ].map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: isActiveRoute(path) ? '#FFFFFF' : '#666666',
                    background: isActiveRoute(path)
                      ? 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)'
                      : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActiveRoute(path)) {
                      e.target.style.background = '#F0F2F5';
                      e.target.style.color = '#1A1A1A';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActiveRoute(path)) {
                      e.target.style.background = 'transparent';
                      e.target.style.color = '#666666';
                    }
                  }}
                  aria-current={isActiveRoute(path) ? 'page' : undefined}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Center Section: Search (Desktop Only) */}
        {isDesktop && (
          <div style={{
            flex: '1 1 auto',
            maxWidth: '480px',
            margin: '0 auto'
          }}>
            <form
              onSubmit={handleSearch}
              role="search"
              aria-label="Site search"
              style={{
                position: 'relative',
                width: '100%'
              }}
            >
              <div style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                pointerEvents: 'none',
                flexShrink: 0
              }}>
                <Search
                  style={{
                    width: '20px',
                    height: '20px',
                    color: '#999999',
                    flexShrink: 0
                  }}
                  aria-hidden="true"
                />
              </div>
              <input
                type="search"
                placeholder="Search communities, NFTs, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search"
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '44px',
                  paddingRight: '16px',
                  fontSize: '15px',
                  color: '#1A1A1A',
                  background: '#F8F9FA',
                  border: '1px solid #E8EAED',
                  borderRadius: '12px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#58a6ff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)';
                  e.target.style.background = '#FFFFFF';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E8EAED';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#F8F9FA';
                }}
              />
            </form>
          </div>
        )}

        {/* Right Section: Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: '0 0 auto'
        }}>

          {/* Mobile Search Icon */}
          {isMobile && (
            <button
              onClick={() => navigate('/search')}
              aria-label="Search"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#F0F2F5'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <Search style={{ width: '20px', height: '20px', color: '#666666', flexShrink: 0 }} />
            </button>
          )}

          {/* Create Button (Desktop + Tablet, Logged In) */}
          {user && !isMobile && (
            <button
              onClick={() => navigate('/create')}
              aria-label="Create new post"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '40px',
                paddingLeft: '16px',
                paddingRight: '16px',
                background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              <Plus style={{ width: '18px', height: '18px', flexShrink: 0 }} />
              Create
            </button>
          )}

          {/* Notifications (Logged In) */}
          {user && (
            <button
              onClick={() => navigate('/notifications')}
              aria-label="Notifications"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'background 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => e.target.style.background = '#F0F2F5'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <Bell style={{ width: '20px', height: '20px', color: '#666666', flexShrink: 0 }} />
            </button>
          )}

          {/* User Menu or Auth Buttons */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label={`User menu for ${user.username || 'user'}`}
                aria-haspopup="true"
                aria-expanded={showUserMenu}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <span style={{
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 39
                    }}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <nav
                    style={{
                      position: 'absolute',
                      top: '52px',
                      right: 0,
                      width: '220px',
                      background: '#FFFFFF',
                      border: '1px solid #E8EAED',
                      borderRadius: '12px',
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                      overflow: 'hidden',
                      zIndex: 40
                    }}
                    aria-label="User account menu"
                    role="menu"
                  >
                    <div style={{
                      padding: '16px',
                      borderBottom: '1px solid #E8EAED'
                    }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#1A1A1A',
                        marginBottom: '4px'
                      }}>
                        {user.username || 'User'}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#999999'
                      }}>
                        {user.email || ''}
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        fontSize: '15px',
                        color: '#1A1A1A',
                        textDecoration: 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#F8F9FA'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      role="menuitem"
                    >
                      <User style={{ width: '18px', height: '18px', color: '#666666', flexShrink: 0 }} aria-hidden="true" />
                      Profile
                    </Link>

                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        fontSize: '15px',
                        color: '#1A1A1A',
                        textDecoration: 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#F8F9FA'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                      role="menuitem"
                    >
                      <Settings style={{ width: '18px', height: '18px', color: '#666666', flexShrink: 0 }} aria-hidden="true" />
                      Settings
                    </Link>

                    <div style={{
                      borderTop: '1px solid #E8EAED',
                      marginTop: '4px',
                      paddingTop: '4px'
                    }}>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate('/');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          fontSize: '15px',
                          color: '#FF3B3B',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#FFF5F5'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        role="menuitem"
                      >
                        <LogOut style={{ width: '18px', height: '18px', flexShrink: 0 }} aria-hidden="true" />
                        Logout
                      </button>
                    </div>
                  </nav>
                </>
              )}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Link to="/login">
                <button
                  style={{
                    height: '40px',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    background: 'transparent',
                    color: '#666666',
                    border: 'none',
                    borderRadius: '9999px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#F0F2F5';
                    e.target.style.color = '#1A1A1A';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#666666';
                  }}
                >
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button
                  style={{
                    height: '40px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    background: 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.target.style.opacity = '1'}
                >
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && isMobile && (
        <div style={{
          position: 'absolute',
          top: '56px',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderBottom: '1px solid #E8EAED',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
          zIndex: 29
        }}>
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '16px'
            }}
            aria-label="Mobile navigation"
          >
            {[
              { path: '/home', label: 'Home' },
              { path: '/communities', label: 'Communities' },
              { path: '/learn', label: 'Learn' },
              { path: '/discover', label: 'Discover' },
              { path: '/wallet', label: 'Wallet' }
            ].map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  color: isActiveRoute(path) ? '#FFFFFF' : '#1A1A1A',
                  background: isActiveRoute(path)
                    ? 'linear-gradient(90deg, #58a6ff 0%, #a371f7 100%)'
                    : 'transparent',
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isActiveRoute(path)) e.target.style.background = '#F0F2F5';
                }}
                onMouseLeave={(e) => {
                  if (!isActiveRoute(path)) e.target.style.background = 'transparent';
                }}
                aria-current={isActiveRoute(path) ? 'page' : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
