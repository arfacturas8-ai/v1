import React, { useState, useEffect } from 'react'
import { Wallet, Coins, Shield, Zap, Users, TrendingUp, Star, ChevronRight, Mail, Book, Calendar, Target, ArrowRight } from 'lucide-react'
import { Button, Card, CardContent, CardTitle } from '../components/ui'
import CryptoCountdown from '../components/crypto/CryptoCountdown'
import Web3FeaturePreview from '../components/crypto/Web3FeaturePreview'
import EmailSignup from '../components/crypto/EmailSignup'
import Web3Education from '../components/crypto/Web3Education'
import Web3Roadmap from '../components/crypto/Web3Roadmap'
import WalletConnectButton from '../components/web3/WalletConnectButton'
import TokenBalanceDisplay from '../components/web3/TokenBalanceDisplay'
import CryptoTippingButton from '../components/web3/CryptoTippingButton'
import NFTProfileBadge from '../components/web3/NFTProfileBadge'
import { GatedFeature } from '../design-system/organisms/ComingSoonGate'
import { useFeatureFlags } from '../config/features'
import { useResponsive } from '../hooks/useResponsive'

/**
 * CryptoPage - Web3 Features & Token Economics
 *
 * Master Prompt Standards Applied:
 * - Responsive padding: 80px desktop, 24px tablet, 16px mobile
 * - Header offset: 72px desktop/tablet, 56px mobile
 * - All icons 24px in shrink-0 containers
 * - Section gaps: 48px, card gaps: 24px, inline gaps: 16px
 * - All buttons 48px height with 12px radius
 * - Z-index: overlays at appropriate levels
 */

function CryptoPage() {
  const featureFlags = useFeatureFlags()
  const { isDesktop, isTablet, isMobile } = useResponsive()
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeSection, setActiveSection] = useState('overview')
  const [isVisible, setIsVisible] = useState(false)

  // Calculate responsive values
  const pagePadding = isDesktop ? '80px' : isTablet ? '24px' : '16px'
  const headerPaddingTop = isDesktop || isTablet ? '72px' : '56px'

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: Wallet,
      title: 'Wallet Integration',
      description: 'Seamlessly connect with MetaMask, WalletConnect, and other Web3 wallets',
      preview: 'Connect your favorite crypto wallet in one click',
      benefits: ['Multi-wallet support', 'Secure connections', 'Gas optimization']
    },
    {
      icon: Star,
      title: 'NFT Profile System',
      description: 'Use your NFTs as profile pictures and showcase your collections',
      preview: 'Your digital identity, powered by your NFT collection',
      benefits: ['NFT avatars', 'Collection display', 'Verified ownership']
    },
    {
      icon: Coins,
      title: 'Crypto Payments',
      description: 'Send and receive payments in cryptocurrency with ease',
      preview: 'Fast, secure crypto transactions within Cryb.ai',
      benefits: ['Multiple currencies', 'Low fees', 'Instant transfers']
    },
    {
      icon: Shield,
      title: 'Token Gating',
      description: 'Create exclusive communities based on token ownership',
      preview: 'Premium access based on your crypto holdings',
      benefits: ['Exclusive access', 'Token verification', 'Community rewards']
    },
    {
      icon: TrendingUp,
      title: 'DeFi Integration',
      description: 'Access DeFi protocols directly from your Cryb.ai profile',
      preview: 'Manage your DeFi portfolio without leaving the platform',
      benefits: ['Yield farming', 'Staking rewards', 'Portfolio tracking']
    },
    {
      icon: Users,
      title: 'DAO Governance',
      description: 'Participate in decentralized decision making',
      preview: 'Your voice matters in the future of Cryb.ai',
      benefits: ['Voting rights', 'Proposal creation', 'Community governance']
    }
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)'
      }}
      role="main"
      aria-label="Crypto features page"
    >
      {/* Hero Section */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: `${headerPaddingTop} ${pagePadding} 48px`,
          transition: 'all 1s',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(32px)'
        }}
      >
        {/* Background Effects */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, transparent 50%, rgba(163, 113, 247, 0.1) 100%)',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '256px',
            height: '256px',
            background: 'rgba(88, 166, 255, 0.2)',
            borderRadius: '50%',
            filter: 'blur(64px)',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />
        <div
          style={{
            position: 'absolute',
            bottom: '25%',
            right: '25%',
            width: '192px',
            height: '192px',
            background: 'rgba(163, 113, 247, 0.2)',
            borderRadius: '50%',
            filter: 'blur(48px)',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />

        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          {/* Coming Soon Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(88, 166, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              borderRadius: '24px',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(88, 166, 255, 0.3)',
              marginBottom: '32px'
            }}
          >
            <Zap style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#58a6ff' }}>Coming Soon</span>
          </div>

          {/* Hero Title */}
          <h1
            style={{
              fontSize: isDesktop ? '48px' : isTablet ? '36px' : '32px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '24px',
              lineHeight: 1.2
            }}
          >
            The Future of
            <span style={{ background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> Web3 </span>
            Social
          </h1>

          {/* Hero Subtitle */}
          <p
            style={{
              fontSize: isDesktop ? '20px' : '18px',
              maxWidth: '800px',
              margin: '0 auto 48px',
              lineHeight: 1.6,
              color: 'var(--text-secondary)'
            }}
          >
            Get ready to experience social networking reimagined with blockchain technology.
            Connect wallets, showcase NFTs, earn rewards, and join exclusive token-gated communities.
          </p>

          {/* Countdown Component */}
          <CryptoCountdown />

          {/* CTA Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '48px'
            }}
          >
            <EmailSignup />
            <Button variant="secondary" className="group">
              <span>Learn More</span>
              <ChevronRight style={{ width: '24px', height: '24px', flexShrink: 0 }} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Navigation Section */}
      <section style={{ padding: `48px ${pagePadding}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '48px'
            }}
          >
            {[
              { id: 'overview', label: 'Overview', icon: Zap, description: 'Platform introduction' },
              { id: 'demo', label: 'Demo', icon: Wallet, description: 'Try Web3 features' },
              { id: 'education', label: 'Learn Web3', icon: Book, description: 'Educational content' },
              { id: 'roadmap', label: 'Roadmap', icon: Calendar, description: 'Development timeline' },
              { id: 'tokenomics', label: 'Token Economics', icon: Target, description: 'Economic model' }
            ].map(({ id, label, icon: Icon, description }) => (
              <Button
                key={id}
                onClick={() => setActiveSection(id)}
                variant={activeSection === id ? 'primary' : 'secondary'}
                className="group transition-all duration-200"
              >
                <Icon style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                {!isMobile && <span>{label}</span>}
                {isMobile && <span>{label.split(' ')[0]}</span>}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Content Sections */}
      {activeSection === 'demo' && (
        <section style={{ padding: `48px ${pagePadding}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'rgba(88, 166, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '24px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(88, 166, 255, 0.3)',
                  marginBottom: '24px'
                }}
              >
                <Wallet style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#58a6ff' }}>Interactive Demo</span>
              </div>

              <h2
                style={{
                  fontSize: isDesktop ? '36px' : '28px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '16px'
                }}
              >
                Try Web3 Features
              </h2>
              <p
                style={{
                  fontSize: isDesktop ? '18px' : '16px',
                  maxWidth: '800px',
                  margin: '0 auto 48px',
                  color: 'var(--text-secondary)'
                }}
              >
                Get a preview of Cryb.ai's Web3 functionality. All features show "Coming Soon" but demonstrate the planned user experience.
              </p>
            </div>

            {/* Demo Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
                gap: '48px',
                maxWidth: '1000px',
                margin: '0 auto'
              }}
            >
              {/* Wallet Connection Demo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h3
                    style={{
                      fontSize: isDesktop ? '20px' : '18px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Wallet style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                    Wallet Connection
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '24px'
                    }}
                  >
                    Connect your Web3 wallet to access token-gated features
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <WalletConnectButton size="md" />
                    <WalletConnectButton size="sm" variant="secondary" />
                  </div>
                </div>

                {/* NFT Profile Badge Demo */}
                <div>
                  <h3
                    style={{
                      fontSize: isDesktop ? '20px' : '18px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Star style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                    NFT Profile Badges
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '24px'
                    }}
                  >
                    Show off your NFT collections with profile badges
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    <NFTProfileBadge collection="Cryb.ai Genesis" size="sm" />
                    <NFTProfileBadge collection="Cool Cats" size="md" rarity="rare" />
                    <NFTProfileBadge collection="BAYC" size="lg" rarity="legendary" />
                  </div>
                </div>
              </div>

              {/* Token Balance & Tipping Demo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div>
                  <h3
                    style={{
                      fontSize: isDesktop ? '20px' : '18px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Coins style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                    Token Portfolio
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '24px'
                    }}
                  >
                    Track your crypto balances and portfolio value
                  </p>
                  <TokenBalanceDisplay className="max-w-sm" />
                </div>

                <div>
                  <h3
                    style={{
                      fontSize: isDesktop ? '20px' : '18px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Zap style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                    Crypto Tipping
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '24px'
                    }}
                  >
                    Tip creators and community members with crypto
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <CryptoTippingButton
                      recipientName="@alice"
                      recipientAddress="0x1234...5678"
                      size="md"
                    />
                    <CryptoTippingButton
                      recipientName="@bob"
                      size="sm"
                      variant="secondary"
                      showAmount={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Notice */}
            <div style={{ marginTop: '48px', textAlign: 'center' }}>
              <div
                style={{
                  backgroundColor: 'rgba(88, 166, 255, 0.1)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(88, 166, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '24px',
                  maxWidth: '800px',
                  margin: '0 auto'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(88, 166, 255, 0.2)',
                      borderRadius: '50%'
                    }}
                  >
                    <Zap style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Demo Mode</h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      These components demonstrate the planned Web3 functionality. All features show "Coming Soon" overlays
                      but you can interact with them to see the intended user experience. Set{' '}
                      <code style={{ backgroundColor: 'rgba(88, 166, 255, 0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                        VITE_ENABLE_WEB3_FEATURES=true
                      </code>{' '}
                      in development to enable full functionality.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeSection === 'education' && (
        <section style={{ padding: `48px ${pagePadding}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Web3Education />
          </div>
        </section>
      )}

      {activeSection === 'roadmap' && (
        <section style={{ padding: `48px ${pagePadding}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Web3Roadmap />
          </div>
        </section>
      )}

      {activeSection === 'tokenomics' && (
        <section style={{ padding: `48px ${pagePadding}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  background: 'rgba(88, 166, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '24px',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(88, 166, 255, 0.3)',
                  marginBottom: '24px'
                }}
              >
                <Coins style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#58a6ff' }}>Token Economics Preview</span>
              </div>

              <h2
                style={{
                  fontSize: isDesktop ? '36px' : '28px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '16px'
                }}
              >
                Cryb.ai Token Economics
              </h2>
              <p
                style={{
                  fontSize: isDesktop ? '18px' : '16px',
                  maxWidth: '800px',
                  margin: '0 auto 48px',
                  color: 'var(--text-secondary)'
                }}
              >
                Discover how Cryb.ai token will power the future of decentralized social networking through innovative economic mechanisms.
              </p>

              {/* Key Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '24px',
                  maxWidth: '800px',
                  margin: '0 auto 48px'
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-primary)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '32px', fontWeight: 700, background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
                    1B
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Supply</div>
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-primary)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>40%</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Community Owned</div>
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-primary)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>15%</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Max Staking APY</div>
                </div>
              </div>

              {/* Token Utility Section */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(88, 166, 255, 0.2)',
                  borderRadius: '12px',
                  padding: isDesktop ? '64px' : '32px'
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr',
                    gap: '48px',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <h3
                      style={{
                        fontSize: isDesktop ? '20px' : '18px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '24px'
                      }}
                    >
                      Token Utility
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Users style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Governance voting rights</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Shield style={{ width: '24px', height: '24px', color: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Token-gated community access</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <TrendingUp style={{ width: '24px', height: '24px', color: '#eab308', flexShrink: 0 }} />
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Staking rewards up to 15% APY</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Star style={{ width: '24px', height: '24px', color: '#06b6d4', flexShrink: 0 }} />
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Creator monetization & tips</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'var(--border-primary)',
                        borderRadius: '12px',
                        padding: '24px'
                      }}
                    >
                      <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Token Flow</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>User Rewards</span>
                          <span style={{ background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 600 }}>40%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Development</span>
                          <span style={{ color: '#58a6ff', fontWeight: 600 }}>20%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Ecosystem</span>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>15%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Treasury</span>
                          <span style={{ color: '#a371f7', fontWeight: 600 }}>15%</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Public Sale</span>
                          <span style={{ color: '#58a6ff', fontWeight: 600 }}>10%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                  <Button as="a" href="/tokenomics" variant="primary" className="group">
                    <Coins style={{ width: '24px', height: '24px', flexShrink: 0 }} />
                    <span>View Full Tokenomics</span>
                    <ArrowRight style={{ width: '24px', height: '24px', flexShrink: 0 }} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Overview Content (Default) */}
      {activeSection === 'overview' && (
        <>
          {/* Features Preview Section */}
          <section style={{ padding: `48px ${pagePadding}` }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: isDesktop ? '36px' : '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '16px'
                  }}
                >
                  Powerful Web3 Features
                </h2>
                <p
                  style={{
                    fontSize: isDesktop ? '18px' : '16px',
                    maxWidth: '800px',
                    margin: '0 auto',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Discover what's coming to Cryb.ai's Web3 ecosystem
                </p>
              </div>

              {/* Feature Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: '24px'
                }}
              >
                {features.map((feature, index) => {
                  const IconComponent = feature.icon
                  return (
                    <div
                      key={index}
                      style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'var(--border-primary)',
                        borderRadius: '12px',
                        padding: '24px',
                        textAlign: isMobile ? 'left' : 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      className="group hover:border-[#58a6ff]/50 hover:shadow-lg"
                      onClick={() => setActiveFeature(index)}
                    >
                      {isMobile ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.2) 0%, rgba(163, 113, 247, 0.2) 100%)',
                              borderRadius: '12px',
                              transition: 'all 0.3s'
                            }}
                            className="group-hover:bg-gradient-to-br group-hover:from-[#58a6ff]/30 group-hover:to-[#a371f7]/30"
                          >
                            <IconComponent style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{feature.title}</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{feature.description}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {feature.benefits.map((benefit, benefitIndex) => (
                                <span
                                  key={benefitIndex}
                                  style={{
                                    padding: '4px 12px',
                                    background: 'rgba(88, 166, 255, 0.1)',
                                    color: '#58a6ff',
                                    fontSize: '12px',
                                    borderRadius: '12px',
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: 'rgba(88, 166, 255, 0.2)'
                                  }}
                                >
                                  {benefit}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '64px',
                              height: '64px',
                              background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.2) 0%, rgba(163, 113, 247, 0.2) 100%)',
                              borderRadius: '12px',
                              marginBottom: '24px',
                              transition: 'all 0.3s'
                            }}
                            className="group-hover:bg-gradient-to-br group-hover:from-[#58a6ff]/30 group-hover:to-[#a371f7]/30"
                          >
                            <IconComponent style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
                          </div>
                          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>{feature.title}</h3>
                          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>{feature.description}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {feature.benefits.map((benefit, benefitIndex) => (
                              <div key={benefitIndex} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                <div style={{ width: '6px', height: '6px', background: 'linear-gradient(135deg, #58a6ff 0%, #a371f7 100%)', borderRadius: '50%' }} />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Feature Details Section - Hidden on Mobile */}
          {!isMobile && (
            <section style={{ padding: `48px ${pagePadding}` }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Web3FeaturePreview feature={features[activeFeature]} />
              </div>
            </section>
          )}

          {/* Benefits Section */}
          <section style={{ padding: `48px ${pagePadding}`, backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: isDesktop ? '36px' : '28px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '16px'
                  }}
                >
                  Why Cryb.ai Web3?
                </h2>
                <p
                  style={{
                    fontSize: isDesktop ? '18px' : '16px',
                    maxWidth: '800px',
                    margin: '0 auto',
                    color: 'var(--text-secondary)'
                  }}
                >
                  The perfect blend of social networking and blockchain technology
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '24px'
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-primary)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    transition: 'all 0.3s'
                  }}
                  className="group hover:border-emerald-400/30"
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '64px',
                      height: '64px',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      borderRadius: '12px',
                      marginBottom: '24px',
                      transition: 'transform 0.3s'
                    }}
                    className="group-hover:scale-110"
                  >
                    <Shield style={{ width: '24px', height: '24px', color: '#10b981', flexShrink: 0 }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Secure & Trustless</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Built on blockchain technology for maximum security and transparency</p>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-primary)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    transition: 'all 0.3s'
                  }}
                  className="group hover:border-[#58a6ff]/50"
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '64px',
                      height: '64px',
                      backgroundColor: 'rgba(88, 166, 255, 0.2)',
                      borderRadius: '12px',
                      marginBottom: '24px',
                      transition: 'transform 0.3s'
                    }}
                    className="group-hover:scale-110"
                  >
                    <Users style={{ width: '24px', height: '24px', color: '#58a6ff', flexShrink: 0 }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Community Owned</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Participate in governance and help shape the future of the platform</p>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'var(--border-primary)',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    transition: 'all 0.3s'
                  }}
                  className="group hover:border-[#a371f7]/50"
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '64px',
                      height: '64px',
                      backgroundColor: 'rgba(163, 113, 247, 0.2)',
                      borderRadius: '12px',
                      marginBottom: '24px',
                      transition: 'transform 0.3s'
                    }}
                    className="group-hover:scale-110"
                  >
                    <TrendingUp style={{ width: '24px', height: '24px', color: '#a371f7', flexShrink: 0 }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Earn While Social</h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Get rewarded for your contributions to the community</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Final CTA Section */}
      <section style={{ padding: `48px ${pagePadding}`, textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: isDesktop ? '36px' : '28px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}
          >
            Be Among the First
          </h2>
          <p
            style={{
              fontSize: isDesktop ? '18px' : '16px',
              marginBottom: '48px',
              color: 'var(--text-secondary)'
            }}
          >
            Join our early access program and be the first to experience the future of Web3 social networking
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '16px',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <EmailSignup variant="large" />
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail style={{ width: '24px', height: '24px', flexShrink: 0 }} />
              Get exclusive updates and early access
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CryptoPage
