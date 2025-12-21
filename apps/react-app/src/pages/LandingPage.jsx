/**
 * Landing Page - CRYB Platform
 * Modern iOS Aesthetic - Ultra Clean & Minimal
 * LIGHT THEME ONLY - NO DARK MODE
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Image,
  CheckCircle,
  Shield,
  TrendingUp,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Responsive breakpoints
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: 'True Ownership',
      desc: 'Your communities, your data, your keys. On-chain forever.',
      icon: Lock,
      color: '#58a6ff'
    },
    {
      title: 'NFT Membership',
      desc: 'Tokenized access. Tradeable invites. Programmable permissions.',
      icon: Image,
      color: '#a371f7'
    },
    {
      title: 'DAO Governance',
      desc: 'Communities vote on everything. No centralized control.',
      icon: CheckCircle,
      color: '#00D26A'
    },
    {
      title: 'Crypto-Native',
      desc: 'Built-in wallets, token gates, airdrops, and DeFi integrations.',
      icon: TrendingUp,
      color: '#FFB800'
    },
    {
      title: 'E2E Encrypted',
      desc: 'Zero-knowledge proofs. Messages only you can read.',
      icon: Shield,
      color: '#58a6ff'
    },
    {
      title: 'Earn While You Vibe',
      desc: 'Creator rewards, staking, yield farming on your social graph.',
      icon: TrendingUp,
      color: '#a371f7'
    }
  ];

  const stats = [
    { value: '100K+', label: 'Active Users' },
    { value: '5K+', label: 'Communities' },
    { value: '10M+', label: 'Messages/Day' },
    { value: '99.99%', label: 'Uptime' }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#F8F9FA',
        color: '#1A1A1A'
      }}
    >
      {/* Subtle Background Effects - iOS Style */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
            opacity: 0.03,
            filter: 'blur(80px)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '-5%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00D26A 0%, #58a6ff 100%)',
            opacity: 0.02,
            filter: 'blur(80px)'
          }}
        />
      </div>

      {/* Modern iOS Header */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: isMobile ? '56px' : '72px',
          zIndex: 30,
          background: isScrolled ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
          borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
          backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
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
                fontSize: isMobile ? '22px' : '26px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <Link
                to="/tokenomics"
                style={{
                  fontSize: '15px',
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
                  fontSize: '15px',
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
                  fontSize: '15px',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '44px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1A1A1A',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '22px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(0, 0, 0, 0.04)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
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
                  height: '44px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                  border: 'none',
                  borderRadius: '9999px',
                  boxShadow: '0 4px 8px rgba(88, 166, 255, 0.25)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 8px 16px rgba(88, 166, 255, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 8px rgba(88, 166, 255, 0.25)'
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
                width: '44px',
                height: '44px',
                background: 'transparent',
                border: 'none',
                borderRadius: '22px',
                color: '#1A1A1A',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(0, 0, 0, 0.04)'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                {mobileMenuOpen ? (
                  <X size={24} strokeWidth={2} />
                ) : (
                  <Menu size={24} strokeWidth={2} />
                )}
              </div>
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && isMobile && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              padding: '20px'
            }}
          >
            <div style={{ marginBottom: '20px' }}>
              <Link
                to="/tokenomics"
                style={{
                  display: 'block',
                  padding: '12px 0',
                  fontSize: '17px',
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
                  padding: '12px 0',
                  fontSize: '17px',
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
                  padding: '12px 0',
                  fontSize: '17px',
                  fontWeight: '500',
                  color: '#1A1A1A',
                  textDecoration: 'none'
                }}
              >
                Community
              </Link>
            </div>
            <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.06)', paddingTop: '20px' }}>
              <Link
                to="/login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  height: '48px',
                  lineHeight: '48px',
                  marginBottom: '12px',
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#58a6ff',
                  background: '#FFFFFF',
                  border: '2px solid #58a6ff',
                  borderRadius: '9999px',
                  textDecoration: 'none'
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  height: '48px',
                  lineHeight: '48px',
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                  borderRadius: '9999px',
                  boxShadow: '0 4px 8px rgba(88, 166, 255, 0.25)',
                  textDecoration: 'none'
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div style={{ paddingTop: isMobile ? '56px' : '72px' }}>
        {/* Hero Section */}
        <section
          style={{
            paddingTop: isDesktop ? '120px' : isTablet ? '80px' : '60px',
            paddingBottom: isDesktop ? '120px' : isTablet ? '80px' : '60px',
            paddingLeft: isDesktop ? '80px' : isTablet ? '24px' : '16px',
            paddingRight: isDesktop ? '80px' : isTablet ? '24px' : '16px'
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '32px',
                padding: '6px 16px',
                background: 'rgba(88, 166, 255, 0.08)',
                border: '1px solid rgba(88, 166, 255, 0.12)',
                borderRadius: '9999px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#58a6ff'
                }}
              />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#58a6ff',
                  letterSpacing: '0.01em'
                }}
              >
                Decentralized Social, Reimagined
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: isDesktop ? '64px' : isTablet ? '52px' : '40px',
                fontWeight: '700',
                lineHeight: '1.1',
                marginBottom: '24px',
                letterSpacing: '-0.02em'
              }}
            >
              <span style={{ color: '#1A1A1A' }}>Where Communities</span>
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Own Themselves
              </span>
            </h1>

            {/* Subheadline */}
            <p
              style={{
                maxWidth: '720px',
                margin: '0 auto',
                fontSize: isDesktop ? '20px' : isTablet ? '18px' : '17px',
                lineHeight: '1.6',
                marginBottom: '48px',
                color: '#666666',
                fontWeight: '400'
              }}
            >
              The first truly decentralized social platform. Crypto-native communities with{' '}
              <span style={{ color: '#58a6ff', fontWeight: '600' }}>NFT membership</span>,{' '}
              <span style={{ color: '#a371f7', fontWeight: '600' }}>DAO governance</span>, and{' '}
              <span style={{ color: '#1A1A1A', fontWeight: '600' }}>real ownership</span>.
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'center',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <Link
                to="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '56px',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                  border: 'none',
                  borderRadius: '9999px',
                  boxShadow: '0 4px 16px rgba(88, 166, 255, 0.3)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 24px rgba(88, 166, 255, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 16px rgba(88, 166, 255, 0.3)'
                }}
              >
                Get Started Free
                <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                  <ArrowRight size={20} strokeWidth={2.5} />
                </div>
              </Link>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '56px',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  fontSize: '17px',
                  fontWeight: '600',
                  color: '#1A1A1A',
                  background: '#FFFFFF',
                  border: '2px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '9999px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(0, 0, 0, 0.02)'
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#FFFFFF'
                  e.target.style.borderColor = 'rgba(0, 0, 0, 0.08)'
                }}
              >
                Explore Platform
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          style={{
            paddingTop: '60px',
            paddingBottom: '60px',
            paddingLeft: isDesktop ? '80px' : isTablet ? '24px' : '16px',
            paddingRight: isDesktop ? '80px' : isTablet ? '24px' : '16px',
            background: '#FFFFFF',
            borderTop: '1px solid #E8EAED',
            borderBottom: '1px solid #E8EAED'
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: '32px'
              }}
            >
              {stats.map((stat, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: 'center',
                    padding: '20px'
                  }}
                >
                  <div
                    style={{
                      fontSize: isDesktop ? '48px' : isTablet ? '40px' : '32px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '8px',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#666666'
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          style={{
            paddingTop: isDesktop ? '120px' : isTablet ? '80px' : '60px',
            paddingBottom: isDesktop ? '120px' : isTablet ? '80px' : '60px',
            paddingLeft: isDesktop ? '80px' : isTablet ? '24px' : '16px',
            paddingRight: isDesktop ? '80px' : isTablet ? '24px' : '16px'
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Section Header */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: isDesktop ? '80px' : isTablet ? '60px' : '48px'
              }}
            >
              <h2
                style={{
                  fontSize: isDesktop ? '52px' : isTablet ? '44px' : '36px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  letterSpacing: '-0.02em'
                }}
              >
                <span
                  style={{
                    background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Built Different
                </span>
              </h2>
              <p
                style={{
                  maxWidth: '640px',
                  margin: '0 auto',
                  fontSize: isDesktop ? '20px' : '18px',
                  color: '#666666',
                  lineHeight: '1.6'
                }}
              >
                Not your average social platform. Web3-native from the ground up.
              </p>
            </div>

            {/* Features Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                gap: '24px'
              }}
            >
              {features.map((feature, i) => (
                <div
                  key={i}
                  style={{
                    padding: '32px',
                    background: '#FFFFFF',
                    border: '1px solid #E8EAED',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)'
                    e.currentTarget.style.borderColor = '#D1D5DB'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)'
                    e.currentTarget.style.borderColor = '#E8EAED'
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '56px',
                      height: '56px',
                      marginBottom: '20px',
                      background: `${feature.color}10`,
                      borderRadius: '16px'
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', flexShrink: 0, color: feature.color }}>
                      <feature.icon size={28} strokeWidth={2} />
                    </div>
                  </div>
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: '#1A1A1A',
                      letterSpacing: '-0.01em'
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: '#666666',
                      margin: 0
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          style={{
            paddingTop: isDesktop ? '100px' : isTablet ? '80px' : '60px',
            paddingBottom: isDesktop ? '100px' : isTablet ? '80px' : '60px',
            paddingLeft: isDesktop ? '80px' : isTablet ? '24px' : '16px',
            paddingRight: isDesktop ? '80px' : isTablet ? '24px' : '16px'
          }}
        >
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: isDesktop ? '80px 60px' : isTablet ? '60px 40px' : '48px 28px',
                background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(88, 166, 255, 0.3)',
                textAlign: 'center'
              }}
            >
              {/* Subtle Pattern Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                  pointerEvents: 'none'
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2
                  style={{
                    fontSize: isDesktop ? '48px' : isTablet ? '40px' : '32px',
                    fontWeight: '700',
                    marginBottom: '20px',
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em'
                  }}
                >
                  Ready to Own Your Space?
                </h2>
                <p
                  style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    fontSize: isDesktop ? '20px' : '18px',
                    marginBottom: '40px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    lineHeight: '1.6'
                  }}
                >
                  Join thousands of communities building the future of social. Your keys, your community, your rules.
                </p>
                <Link
                  to="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    height: '56px',
                    paddingLeft: '32px',
                    paddingRight: '32px',
                    fontSize: '17px',
                    fontWeight: '600',
                    color: '#58a6ff',
                    background: '#FFFFFF',
                    border: 'none',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'
                  }}
                >
                  Get Started Free
                  <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                    <ArrowRight size={20} strokeWidth={2.5} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            paddingTop: '60px',
            paddingBottom: '40px',
            paddingLeft: isDesktop ? '80px' : isTablet ? '24px' : '16px',
            paddingRight: isDesktop ? '80px' : isTablet ? '24px' : '16px',
            background: '#FFFFFF',
            borderTop: '1px solid #E8EAED'
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                gap: '48px',
                marginBottom: '48px'
              }}
            >
              {/* Brand */}
              <div>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  CRYB
                </span>
                <p
                  style={{
                    fontSize: '15px',
                    marginTop: '12px',
                    lineHeight: '1.6',
                    color: '#666666',
                    margin: '12px 0 0 0'
                  }}
                >
                  Building the decentralized future of social.
                </p>
              </div>

              {/* Platform Links */}
              <div>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: '#1A1A1A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Platform
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link to="/communities" style={{ fontSize: '15px', color: '#666666', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} onMouseLeave={(e) => e.target.style.color = '#666666'}>Communities</Link>
                  <Link to="/nft-marketplace" style={{ fontSize: '15px', color: '#666666', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} onMouseLeave={(e) => e.target.style.color = '#666666'}>NFT Marketplace</Link>
                  <Link to="/governance" style={{ fontSize: '15px', color: '#666666', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} onMouseLeave={(e) => e.target.style.color = '#666666'}>Governance</Link>
                  <Link to="/tokenomics" style={{ fontSize: '15px', color: '#666666', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} onMouseLeave={(e) => e.target.style.color = '#666666'}>Tokenomics</Link>
                </div>
              </div>

              {/* Resources Links */}
              <div>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: '#1A1A1A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Resources
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link to="/help" style={{ fontSize: '15px', color: '#666666', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} onMouseLeave={(e) => e.target.style.color = '#666666'}>Help Center</Link>
                  <Link to="/guidelines" style={{ fontSize: '15px', color: '#666666', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} onMouseLeave={(e) => e.target.style.color = '#666666'}>Guidelines</Link>
                  <Link to="/contact" style={{ fontSize: '15px', color: '#666666', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} onMouseLeave={(e) => e.target.style.color = '#666666'}>Contact</Link>
                </div>
              </div>

              {/* Legal Links */}
              <div>
                <h4
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    color: '#1A1A1A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Legal
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link to="/privacy" style={{ fontSize: '15px', color: '#666666', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} onMouseLeave={(e) => e.target.style.color = '#666666'}>Privacy Policy</Link>
                  <Link to="/terms" style={{ fontSize: '15px', color: '#666666', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#1A1A1A'} onMouseLeave={(e) => e.target.style.color = '#666666'}>Terms of Service</Link>
                </div>
              </div>
            </div>

            {/* Bottom */}
            <div
              style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                paddingTop: '32px',
                borderTop: '1px solid #E8EAED'
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: '#666666',
                  margin: 0
                }}
              >
                2025 Cryb.ai. All rights reserved.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#666666', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#1A1A1A'}
                  onMouseLeave={(e) => e.target.style.color = '#666666'}
                >
                  <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                    <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                </a>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#666666', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#1A1A1A'}
                  onMouseLeave={(e) => e.target.style.color = '#666666'}
                >
                  <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                    <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                    </svg>
                  </div>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#666666', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.target.style.color = '#1A1A1A'}
                  onMouseLeave={(e) => e.target.style.color = '#666666'}
                >
                  <div style={{ width: '20px', height: '20px', flexShrink: 0 }}>
                    <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
