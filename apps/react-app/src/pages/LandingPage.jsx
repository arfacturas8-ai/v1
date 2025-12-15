import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: 'NFT Membership',
      desc: 'Tokenized access. Tradeable invites. Programmable permissions.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: 'DAO Governance',
      desc: 'Communities vote on everything. No centralized control.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Crypto-Native',
      desc: 'Built-in wallets, token gates, airdrops, and DeFi integrations.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'E2E Encrypted',
      desc: 'Zero-knowledge proofs. Messages only you can read.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      title: 'Earn While You Vibe',
      desc: 'Creator rewards, staking, yield farming on your social graph.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ];

  const stats = [
    { value: '100K+', label: 'Active Users' },
    { value: '5K+', label: 'Communities' },
    { value: '10M+', label: 'Messages/Day' },
    { value: '99.99%', label: 'Uptime' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-[#58a6ff] rounded-full opacity-[0.05] blur-3xl"></div>
        <div className="absolute top-1/3 -left-40 w-[800px] h-[800px] bg-[#a371f7] rounded-full opacity-[0.05] blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#58a6ff] rounded-full opacity-[0.04] blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? ''
          : 'bg-transparent'
      }`}
        style={isScrolled ? { background: 'rgba(248, 249, 250, 0.95)', borderBottom: '1px solid var(--border-subtle)' } : {}}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                CRYB
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/tokenomics" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                Tokenomics
              </Link>
              <Link to="/help" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                Docs
              </Link>
              <Link to="/guidelines" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>
                Community
              </Link>
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                to="/login"
                className="btn btn-ghost text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary text-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden " style={{ background: 'rgba(255, 255, 255, 0.95)', borderTop: '1px solid var(--border-subtle)' }}>
            <div className="px-4 py-4 space-y-3">
              <Link to="/tokenomics" className="block py-2 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Tokenomics
              </Link>
              <Link to="/help" className="block py-2 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Docs
              </Link>
              <Link to="/guidelines" className="block py-2 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Community
              </Link>
              <div className="pt-4 space-y-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <Link to="/login" className="btn btn-secondary block text-center text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary block text-center text-sm">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2  rounded-full" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <span className="w-2 h-2 bg-[#58a6ff] rounded-full "></span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Decentralized Social, Reimagined</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 md:mb-8">
            <span style={{ color: 'var(--text-primary)' }}>Where Communities</span>
            <br />
            <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
              Own Themselves
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 md:mb-12 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            The first truly decentralized social platform. Crypto-native communities with
            <span className="text-[#58a6ff]"> NFT membership</span>,
            <span className="text-[#a371f7]"> DAO governance</span>, and
            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}> real ownership</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn btn-primary btn-lg inline-flex items-center justify-center gap-2"
            >
              Get Started Free
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="btn btn-secondary btn-lg inline-flex items-center justify-center gap-2"
            >
              Explore Platform
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 md:py-20 px-4 sm:px-6 lg:px-8" style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="card text-center transition-all"
              >
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm md:text-base font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                Built Different
              </span>
            </h2>
            <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Not your average social platform. Web3-native from the ground up.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card card-interactive group"
              >
                <div className="w-14 h-14 mb-6 flex items-center justify-center bg-gradient-to-br from-[#58a6ff]/20 to-[#a371f7]/20 rounded-xl text-[#58a6ff] group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="card card-elevated relative overflow-hidden rounded-3xl p-8 md:p-16 text-center" style={{ background: 'var(--bg-gradient-subtle)' }}>
            {/* Background Glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#58a6ff] rounded-full opacity-[0.08] blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#a371f7] rounded-full opacity-[0.08] blur-3xl"></div>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <span style={{ color: 'var(--text-primary)' }}>Ready to </span>
                <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                  Own Your Space?
                </span>
              </h2>
              <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
                Join thousands of communities building the future of social. Your keys, your community, your rules.
              </p>
              <Link
                to="/register"
                className="btn btn-primary btn-lg inline-flex items-center justify-center gap-2"
              >
                Get Started Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 md:py-16 px-4 sm:px-6 lg:px-8" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <span className="text-2xl font-black bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
                CRYB
              </span>
              <p className="text-sm mt-4 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Building the decentralized future of social.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Platform</h4>
              <ul className="space-y-3">
                <li><Link to="/communities" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Communities</Link></li>
                <li><Link to="/nft-marketplace" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>NFT Marketplace</Link></li>
                <li><Link to="/governance" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Governance</Link></li>
                <li><Link to="/tokenomics" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Tokenomics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Resources</h4>
              <ul className="space-y-3">
                <li><Link to="/help" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Help Center</Link></li>
                <li><Link to="/guidelines" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Guidelines</Link></li>
                <li><Link to="/contact" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Legal</h4>
              <ul className="space-y-3">
                <li><Link to="/privacy" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              © 2025 Cryb.ai. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition-colors" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
