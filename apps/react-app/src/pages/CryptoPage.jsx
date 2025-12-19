/**
 * CryptoPage - Modernized with iOS Aesthetic
 *
 * Design System:
 * - Background: #FAFAFA
 * - Text: #000 primary, #666 secondary
 * - Cards: white with subtle shadows
 * - Borders: 16-24px radius
 * - Buttons: 56px/48px height, 12-14px radius
 * - Icons: 20px
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04) cards, 0 8px 32px rgba(0,0,0,0.08) modals
 * - Gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
 * - Hover: translateY(-2px) + enhanced shadow
 */

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

function CryptoPage() {
  const featureFlags = useFeatureFlags()
  const { isDesktop, isTablet, isMobile } = useResponsive()
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeSection, setActiveSection] = useState('overview')
  const [isVisible, setIsVisible] = useState(false)

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
        backgroundColor: '#FAFAFA'
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, transparent 50%, rgba(139, 92, 246, 0.05) 100%)',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />

        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'white',
              borderRadius: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              marginBottom: '32px'
            }}
          >
            <Zap style={{ width: '20px', height: '20px', color: '#6366F1', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#6366F1' }}>Coming Soon</span>
          </div>

          <h1
            style={{
              fontSize: isDesktop ? '48px' : isTablet ? '36px' : '32px',
              fontWeight: 700,
              color: '#000',
              marginBottom: '24px',
              lineHeight: 1.2
            }}
          >
            The Future of
            <span style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> Web3 </span>
            Social
          </h1>

          <p
            style={{
              fontSize: isDesktop ? '20px' : '18px',
              maxWidth: '800px',
              margin: '0 auto 48px',
              lineHeight: 1.6,
              color: '#666'
            }}
          >
            Get ready to experience social networking reimagined with blockchain technology.
            Connect wallets, showcase NFTs, earn rewards, and join exclusive token-gated communities.
          </p>

          <CryptoCountdown />

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
            <button
              style={{
                height: '56px',
                padding: '0 32px',
                background: 'white',
                color: '#000',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <span>Learn More</span>
              <ChevronRight style={{ width: '20px', height: '20px', flexShrink: 0 }} />
            </button>
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
              gap: '12px',
              marginBottom: '48px'
            }}
          >
            {[
              { id: 'overview', label: 'Overview', icon: Zap },
              { id: 'demo', label: 'Demo', icon: Wallet },
              { id: 'education', label: 'Learn Web3', icon: Book },
              { id: 'roadmap', label: 'Roadmap', icon: Calendar },
              { id: 'tokenomics', label: 'Token Economics', icon: Target }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                style={{
                  height: '48px',
                  padding: '0 24px',
                  background: activeSection === id ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' : 'white',
                  color: activeSection === id ? 'white' : '#000',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== id) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                {!isMobile && <span>{label}</span>}
                {isMobile && <span>{label.split(' ')[0]}</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Content Sections */}
      {activeSection === 'demo' && (
        <section style={{ padding: `48px ${pagePadding}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2
                style={{
                  fontSize: isDesktop ? '36px' : '28px',
                  fontWeight: 700,
                  color: '#000',
                  marginBottom: '16px'
                }}
              >
                Try Web3 Features
              </h2>
              <p
                style={{
                  fontSize: isDesktop ? '18px' : '16px',
                  maxWidth: '800px',
                  margin: '0 auto',
                  color: '#666'
                }}
              >
                Get a preview of Cryb.ai's Web3 functionality
              </p>
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

      {/* Overview Content */}
      {activeSection === 'overview' && (
        <>
          <section style={{ padding: `48px ${pagePadding}` }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2
                  style={{
                    fontSize: isDesktop ? '36px' : '28px',
                    fontWeight: 700,
                    color: '#000',
                    marginBottom: '16px'
                  }}
                >
                  Powerful Web3 Features
                </h2>
              </div>

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
                        background: 'white',
                        borderRadius: '20px',
                        padding: '32px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => setActiveFeature(index)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '20px'
                        }}
                      >
                        <IconComponent style={{ width: '20px', height: '20px', color: 'white', flexShrink: 0 }} />
                      </div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#000', marginBottom: '12px' }}>{feature.title}</h3>
                      <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>{feature.description}</p>
                    </div>
                  )
                })}
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
              color: '#000',
              marginBottom: '16px'
            }}
          >
            Be Among the First
          </h2>
          <p
            style={{
              fontSize: isDesktop ? '18px' : '16px',
              marginBottom: '48px',
              color: '#666'
            }}
          >
            Join our early access program and be the first to experience the future of Web3 social networking
          </p>
        </div>
      </section>
    </div>
  )
}

export default CryptoPage
