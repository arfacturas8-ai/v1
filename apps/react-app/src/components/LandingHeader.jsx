import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';

export default function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: isMobile ? '52px' : '64px',
        zIndex: 30,
        background: isScrolled ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
        borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        boxShadow: isScrolled ? '0 1px 3px rgba(0, 0, 0, 0.06)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1440px',
          margin: '0 auto',
          paddingLeft: isDesktop ? '80px' : isTablet ? '24px' : '16px',
          paddingRight: isDesktop ? '80px' : isTablet ? '24px' : '16px'
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none'
          }}
        >
          <span
            style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}
          >
            CRYB
          </span>
        </Link>

        {/* Desktop Nav */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', height: '100%' }}>
            <Link
              to="/tokenomics"
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                fontSize: '14px',
                fontWeight: '500',
                color: '#666666',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#1A1A1A'}
              onMouseLeave={(e) => e.target.style.color = '#666666'}
            >
              Tokenomics
            </Link>
            <Link
              to="/help"
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                fontSize: '14px',
                fontWeight: '500',
                color: '#666666',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#1A1A1A'}
              onMouseLeave={(e) => e.target.style.color = '#666666'}
            >
              Docs
            </Link>
            <Link
              to="/guidelines"
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                fontSize: '14px',
                fontWeight: '500',
                color: '#666666',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#1A1A1A'}
              onMouseLeave={(e) => e.target.style.color = '#666666'}
            >
              Community
            </Link>
          </div>
        )}

        {/* Desktop CTA */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px',
                paddingLeft: '14px',
                paddingRight: '14px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1A1A1A',
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                borderRadius: '16px',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.7)'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.5)'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
              }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px',
                paddingLeft: '14px',
                paddingRight: '14px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                border: '1px solid rgba(88, 166, 255, 0.3)',
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.background = 'linear-gradient(135deg, rgba(88, 166, 255, 1) 0%, rgba(163, 113, 247, 1) 100%)'
                e.target.style.boxShadow = '0 6px 20px rgba(88, 166, 255, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.background = 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)'
                e.target.style.boxShadow = '0 4px 16px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              Get Started
            </Link>
          </div>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'transparent',
              border: 'none',
              borderRadius: '18px',
              color: '#1A1A1A',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.04)'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
              {mobileMenuOpen ? (
                <X size={20} strokeWidth={2} />
              ) : (
                <Menu size={20} strokeWidth={2} />
              )}
            </div>
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && isMobile && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(40px) saturate(200%)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%)',
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '16px'
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <Link
              to="/tokenomics"
              style={{
                display: 'block',
                padding: '10px 0',
                fontSize: '15px',
                fontWeight: '500',
                color: '#1A1A1A',
                textDecoration: 'none'
              }}
            >
              Tokenomics
            </Link>
            <Link
              to="/help"
              style={{
                display: 'block',
                padding: '10px 0',
                fontSize: '15px',
                fontWeight: '500',
                color: '#1A1A1A',
                textDecoration: 'none'
              }}
            >
              Docs
            </Link>
            <Link
              to="/guidelines"
              style={{
                display: 'block',
                padding: '10px 0',
                fontSize: '15px',
                fontWeight: '500',
                color: '#1A1A1A',
                textDecoration: 'none'
              }}
            >
              Community
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '42px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#1A1A1A',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '21px',
                textDecoration: 'none'
              }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '42px',
                fontSize: '15px',
                fontWeight: '600',
                color: '#FFFFFF',
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                borderRadius: '21px',
                boxShadow: '0 2px 6px rgba(88, 166, 255, 0.25)',
                textDecoration: 'none'
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
