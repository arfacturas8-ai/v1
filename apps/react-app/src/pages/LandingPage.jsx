/**
 * Landing Page - CRYB Platform
 * Built according to Master Frontend Specification
 *
 * STANDARDS APPLIED:
 * - Header: Fixed 72px (web) / 56px (mobile), z-index 30
 * - Spacing scale: 4, 8, 16, 24, 32, 48, 64px ONLY
 * - Page padding: 16px mobile, 24px tablet, 80px desktop
 * - Section gaps: 48px
 * - Icons: All exactly 24px in fixed containers
 * - Buttons: 40px (sm), 48px (md), 56px (lg)
 * - Z-index: Strict scale (header = 30)
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: 'True Ownership',
      desc: 'Your communities, your data, your keys. On-chain forever.',
      icon: Lock
    },
    {
      title: 'NFT Membership',
      desc: 'Tokenized access. Tradeable invites. Programmable permissions.',
      icon: Image
    },
    {
      title: 'DAO Governance',
      desc: 'Communities vote on everything. No centralized control.',
      icon: CheckCircle
    },
    {
      title: 'Crypto-Native',
      desc: 'Built-in wallets, token gates, airdrops, and DeFi integrations.',
      icon: TrendingUp
    },
    {
      title: 'E2E Encrypted',
      desc: 'Zero-knowledge proofs. Messages only you can read.',
      icon: Shield
    },
    {
      title: 'Earn While You Vibe',
      desc: 'Creator rewards, staking, yield farming on your social graph.',
      icon: TrendingUp
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
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute -top-40 -right-40 rounded-full opacity-[0.05] blur-3xl"
          style={{
            width: '600px',
            height: '600px',
            background: '#58a6ff'
          }}
        ></div>
        <div
          className="absolute rounded-full opacity-[0.05] blur-3xl"
          style={{
            width: '800px',
            height: '800px',
            background: '#a371f7',
            top: '33.333%',
            left: '-160px'
          }}
        ></div>
        <div
          className="absolute bottom-0 rounded-full opacity-[0.04] blur-3xl"
          style={{
            width: '600px',
            height: '600px',
            background: '#58a6ff',
            right: '25%'
          }}
        ></div>
      </div>

      {/* CRITICAL: Fixed Header with exact specifications */}
      <nav
        className="fixed top-0 left-0 right-0 transition-all duration-300"
        style={{
          height: window.innerWidth >= 768 ? '72px' : '56px',
          zIndex: 30,
          background: isScrolled ? 'rgba(248, 249, 250, 0.95)' : 'transparent',
          borderBottom: isScrolled ? '1px solid var(--border-subtle)' : 'none',
          backdropFilter: isScrolled ? 'blur(8px)' : 'none'
        }}
      >
        <div
          className="h-full flex items-center justify-between mx-auto"
          style={{
            paddingLeft: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
            paddingRight: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
            maxWidth: '1440px'
          }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center" style={{ gap: '8px' }}>
            <span
              className="font-black bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent"
              style={{
                fontSize: window.innerWidth >= 768 ? '28px' : '24px'
              }}
            >
              CRYB
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center" style={{ gap: '32px' }}>
            <Link
              to="/tokenomics"
              className="font-medium transition-colors"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Tokenomics
            </Link>
            <Link
              to="/help"
              className="font-medium transition-colors"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Docs
            </Link>
            <Link
              to="/guidelines"
              className="font-medium transition-colors"
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              Community
            </Link>
          </div>

          {/* Desktop Auth Buttons - EXACT HEIGHTS */}
          <div className="hidden md:flex items-center" style={{ gap: '16px' }}>
            <Link
              to="/login"
              className="inline-flex items-center justify-center font-semibold transition-all"
              style={{
                height: '48px',
                paddingLeft: '32px',
                paddingRight: '32px',
                fontSize: '16px',
                color: 'var(--text-secondary)',
                background: 'transparent',
                borderRadius: '9999px'
              }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center font-semibold transition-all"
              style={{
                height: '48px',
                paddingLeft: '32px',
                paddingRight: '32px',
                fontSize: '16px',
                color: 'white',
                background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                borderRadius: '9999px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button with EXACT 24px icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center transition-colors"
            style={{
              width: '40px',
              height: '40px',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
              {mobileMenuOpen ? (
                <X size={24} strokeWidth={2} />
              ) : (
                <Menu size={24} strokeWidth={2} />
              )}
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderTop: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(8px)'
            }}
          >
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <Link
                  to="/tokenomics"
                  className="block font-medium"
                  style={{
                    padding: '8px 0',
                    fontSize: '16px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Tokenomics
                </Link>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Link
                  to="/help"
                  className="block font-medium"
                  style={{
                    padding: '8px 0',
                    fontSize: '16px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Docs
                </Link>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <Link
                  to="/guidelines"
                  className="block font-medium"
                  style={{
                    padding: '8px 0',
                    fontSize: '16px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Community
                </Link>
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '16px'
                }}
              >
                <Link
                  to="/login"
                  className="block text-center font-semibold"
                  style={{
                    height: '48px',
                    lineHeight: '48px',
                    marginBottom: '8px',
                    fontSize: '16px',
                    color: 'var(--brand-primary)',
                    background: 'white',
                    border: '2px solid var(--brand-primary)',
                    borderRadius: '9999px'
                  }}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block text-center font-semibold"
                  style={{
                    height: '48px',
                    lineHeight: '48px',
                    fontSize: '16px',
                    color: 'white',
                    background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                    borderRadius: '9999px'
                  }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* CRITICAL: Main content with padding-top equal to header height */}
      <div style={{ paddingTop: window.innerWidth >= 768 ? '72px' : '56px' }}>
        {/* Hero Section - EXACT SPACING */}
        <section
          style={{
            paddingTop: window.innerWidth >= 768 ? '64px' : '48px',
            paddingBottom: window.innerWidth >= 768 ? '64px' : '48px',
            paddingLeft: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
            paddingRight: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
          }}
        >
          <div className="max-w-7xl mx-auto text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center rounded-full"
              style={{
                gap: '8px',
                marginBottom: '32px',
                padding: '8px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <span
                className="rounded-full"
                style={{
                  width: '8px',
                  height: '8px',
                  background: '#58a6ff'
                }}
              ></span>
              <span
                className="font-medium"
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)'
                }}
              >
                Decentralized Social, Reimagined
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-bold leading-tight"
              style={{
                fontSize: window.innerWidth >= 1024 ? '56px' : window.innerWidth >= 768 ? '48px' : '32px',
                marginBottom: window.innerWidth >= 768 ? '32px' : '24px'
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>Where Communities</span>
              <br />
              <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                Own Themselves
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="max-w-3xl mx-auto"
              style={{
                fontSize: window.innerWidth >= 768 ? '20px' : '18px',
                lineHeight: '1.625',
                marginBottom: window.innerWidth >= 768 ? '48px' : '32px',
                color: 'var(--text-secondary)'
              }}
            >
              The first truly decentralized social platform. Crypto-native communities with
              <span style={{ color: '#58a6ff' }}> NFT membership</span>,
              <span style={{ color: '#a371f7' }}> DAO governance</span>, and
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}> real ownership</span>.
            </p>

            {/* CTA Buttons - EXACT HEIGHTS */}
            <div
              className="flex flex-col sm:flex-row justify-center"
              style={{ gap: '16px' }}
            >
              <Link
                to="/register"
                className="inline-flex items-center justify-center font-semibold transition-all"
                style={{
                  height: '56px',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  fontSize: '16px',
                  gap: '8px',
                  color: 'white',
                  background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                  borderRadius: '9999px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                Get Started Free
                <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                  <ArrowRight size={24} strokeWidth={2} />
                </div>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center font-semibold transition-all"
                style={{
                  height: '56px',
                  paddingLeft: '32px',
                  paddingRight: '32px',
                  fontSize: '16px',
                  color: 'var(--brand-primary)',
                  background: 'white',
                  border: '2px solid var(--brand-primary)',
                  borderRadius: '9999px'
                }}
              >
                Explore Platform
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section - EXACT 48px gap from hero */}
        <section
          style={{
            marginTop: '48px',
            paddingTop: '48px',
            paddingBottom: '48px',
            paddingLeft: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
            paddingRight: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div
              className="grid grid-cols-2 lg:grid-cols-4"
              style={{ gap: '24px' }}
            >
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="card text-center"
                  style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                >
                  <div
                    className="font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent"
                    style={{
                      fontSize: window.innerWidth >= 1024 ? '48px' : window.innerWidth >= 768 ? '40px' : '32px',
                      marginBottom: '8px'
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="font-medium"
                    style={{
                      fontSize: window.innerWidth >= 768 ? '16px' : '14px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - EXACT 48px gap from stats */}
        <section
          style={{
            marginTop: '48px',
            paddingTop: '64px',
            paddingBottom: '64px',
            paddingLeft: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
            paddingRight: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
          }}
        >
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div
              className="text-center"
              style={{ marginBottom: window.innerWidth >= 768 ? '64px' : '48px' }}
            >
              <h2
                className="font-bold"
                style={{
                  fontSize: window.innerWidth >= 1024 ? '48px' : window.innerWidth >= 768 ? '40px' : '32px',
                  marginBottom: '16px'
                }}
              >
                <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                  Built Different
                </span>
              </h2>
              <p
                className="max-w-2xl mx-auto"
                style={{
                  fontSize: window.innerWidth >= 768 ? '20px' : '18px',
                  color: 'var(--text-secondary)'
                }}
              >
                Not your average social platform. Web3-native from the ground up.
              </p>
            </div>

            {/* Features Grid - EXACT 24px gap */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              style={{ gap: '24px' }}
            >
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="card card-interactive group"
                  style={{ minHeight: '200px' }}
                >
                  <div
                    className="flex items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                    style={{
                      width: '56px',
                      height: '56px',
                      marginBottom: '24px',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.2) 0%, rgba(163, 113, 247, 0.2) 100%)',
                      color: '#58a6ff',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                      <feature.icon size={24} strokeWidth={2} />
                    </div>
                  </div>
                  <h3
                    className="font-semibold"
                    style={{
                      fontSize: '20px',
                      marginBottom: '12px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.625',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - EXACT 48px gap from features */}
        <section
          style={{
            marginTop: '48px',
            paddingTop: '64px',
            paddingBottom: '64px',
            paddingLeft: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
            paddingRight: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
          }}
        >
          <div className="max-w-4xl mx-auto">
            <div
              className="card card-elevated relative overflow-hidden text-center"
              style={{
                padding: window.innerWidth >= 768 ? '64px' : '32px',
                borderRadius: '24px',
                background: 'var(--bg-gradient-subtle)'
              }}
            >
              {/* Background Glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute rounded-full opacity-[0.08] blur-3xl"
                  style={{
                    width: '384px',
                    height: '384px',
                    top: 0,
                    left: '25%',
                    background: '#58a6ff'
                  }}
                ></div>
                <div
                  className="absolute rounded-full opacity-[0.08] blur-3xl"
                  style={{
                    width: '384px',
                    height: '384px',
                    bottom: 0,
                    right: '25%',
                    background: '#a371f7'
                  }}
                ></div>
              </div>

              <div style={{ position: 'relative', zIndex: 10 }}>
                <h2
                  className="font-bold"
                  style={{
                    fontSize: window.innerWidth >= 1024 ? '48px' : window.innerWidth >= 768 ? '40px' : '32px',
                    marginBottom: '24px'
                  }}
                >
                  <span style={{ color: 'var(--text-primary)' }}>Ready to </span>
                  <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                    Own Your Space?
                  </span>
                </h2>
                <p
                  className="max-w-2xl mx-auto"
                  style={{
                    fontSize: window.innerWidth >= 768 ? '20px' : '18px',
                    marginBottom: '32px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Join thousands of communities building the future of social. Your keys, your community, your rules.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center font-semibold transition-all"
                  style={{
                    height: '56px',
                    paddingLeft: '32px',
                    paddingRight: '32px',
                    fontSize: '16px',
                    gap: '8px',
                    color: 'white',
                    background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)',
                    borderRadius: '9999px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  Get Started Free
                  <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                    <ArrowRight size={24} strokeWidth={2} />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer - EXACT 48px gap from CTA */}
        <footer
          style={{
            marginTop: '48px',
            paddingTop: '48px',
            paddingBottom: '48px',
            paddingLeft: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
            paddingRight: window.innerWidth >= 1024 ? '80px' : window.innerWidth >= 640 ? '24px' : '16px',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div
              className="grid grid-cols-2 md:grid-cols-4"
              style={{ gap: '32px', marginBottom: '48px' }}
            >
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <span className="text-2xl font-black bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                  CRYB
                </span>
                <p
                  style={{
                    fontSize: '14px',
                    marginTop: '16px',
                    lineHeight: '1.625',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Building the decentralized future of social.
                </p>
              </div>

              {/* Links */}
              <div>
                <h4
                  className="font-semibold"
                  style={{
                    marginBottom: '16px',
                    color: 'var(--text-primary)'
                  }}
                >
                  Platform
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li>
                    <Link
                      to="/communities"
                      className="transition-colors"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Communities
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/nft-marketplace"
                      className="transition-colors"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      NFT Marketplace
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/governance"
                      className="transition-colors"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Governance
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/tokenomics"
                      className="transition-colors"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Tokenomics
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4
                  className="font-semibold"
                  style={{
                    marginBottom: '16px',
                    color: 'var(--text-primary)'
                  }}
                >
                  Resources
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li>
                    <Link
                      to="/help"
                      className="transition-colors"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/guidelines"
                      className="transition-colors"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Guidelines
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="transition-colors"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4
                  className="font-semibold"
                  style={{
                    marginBottom: '16px',
                    color: 'var(--text-primary)'
                  }}
                >
                  Legal
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li>
                    <Link
                      to="/privacy"
                      className="transition-colors"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/terms"
                      className="transition-colors"
                      style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div
              className="flex flex-col md:flex-row justify-between items-center"
              style={{
                paddingTop: '32px',
                gap: '16px',
                borderTop: '1px solid var(--border-subtle)'
              }}
            >
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)'
                }}
              >
                © 2025 Cryb.ai. All rights reserved.
              </p>
              <div
                className="flex items-center"
                style={{ gap: '24px' }}
              >
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                </a>
                <a
                  href="https://discord.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
                    </svg>
                  </div>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <div style={{ width: '24px', height: '24px', flexShrink: 0 }}>
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
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
