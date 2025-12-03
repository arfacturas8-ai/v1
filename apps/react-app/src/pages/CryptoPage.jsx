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

function CryptoPage() {
  const [activeFeature, setActiveFeature] = useState(0)
  const [activeSection, setActiveSection] = useState('overview')
  const [isVisible, setIsVisible] = useState(false)

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
    <>
      <div className="container py-8 md:py-12 lg:py-16" role="main" aria-label="Crypto features page">
      {/* Hero Section */}
      <section className={`relative overflow-hidden transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 via-transparent to-accent-secondary/10" aria-hidden="true"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent-primary/20 rounded-full blur-3xl" aria-hidden="true"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent-secondary/20 rounded-full blur-2xl" aria-hidden="true"></div>

        <div className="relative container py-12 md:py-20 lg:py-24 text-center">
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-accent-primary/20 backdrop-blur-sm rounded-full border border-accent-primary/30 mb-6 md:mb-8">
            <Zap className="h-4 w-4 text-accent-light" aria-hidden="true" />
            <span className="text-sm font-medium text-accent-light">Coming Soon</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
            The Future of
            <span className="text-gradient bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent"> Web3 </span>
            Social
          </h1>

          {/* Hero Subtitle */}
          <p className="text-lg md:text-xl text-[#A0A0A0] max-w-3xl mx-auto mb-12 md:mb-16 leading-relaxed px-4">
            Get ready to experience social networking reimagined with blockchain technology.
            Connect wallets, showcase NFTs, earn rewards, and join exclusive token-gated communities.
          </p>

          {/* Countdown Component */}
          <CryptoCountdown />

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center mt-12 md:mt-16 px-4">
            <EmailSignup />
            <Button variant="secondary" className="group">
              <span>Learn More</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>


      {/* Navigation Section */}
      <section className="container py-8 md:py-12">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-12 md:mb-16">
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
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(' ')[0]}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Dynamic Content Sections */}
      {activeSection === 'demo' && (
        <section className="container py-12 md:py-16">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-accent-primary/20 backdrop-blur-sm rounded-full border border-accent-primary/30 mb-4 md:mb-6">
              <Wallet className="h-4 w-4 text-accent-light" />
              <span className="text-sm font-medium text-accent-light">Interactive Demo</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Try Web3 Features</h2>
            <p className="text-base md:text-lg text-[#A0A0A0] max-w-2xl mx-auto mb-12 md:mb-16 px-4">
              Get a preview of Cryb.ai's Web3 functionality. All features show "Coming Soon" but demonstrate the planned user experience.
            </p>
          </div>

          {/* Demo Grid */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 max-w-4xl mx-auto px-4">
            {/* Wallet Connection Demo */}
            <div className="space-y-6 md:space-y-8">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3 flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet Connection
                </h3>
                <p className="text-sm md:text-base text-[#A0A0A0] mb-4 md:mb-6">Connect your Web3 wallet to access token-gated features</p>
                <div className="flex flex-wrap gap-3 md:gap-4">
                  <WalletConnectButton size="md" />
                  <WalletConnectButton size="sm" variant="secondary" />
                </div>
              </div>

              {/* NFT Profile Badge Demo */}
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  NFT Profile Badges
                </h3>
                <p className="text-sm md:text-base text-[#A0A0A0] mb-4 md:mb-6">Show off your NFT collections with profile badges</p>
                <div className="flex flex-wrap gap-3 md:gap-4 items-center">
                  <NFTProfileBadge collection="Cryb.ai Genesis" size="sm" />
                  <NFTProfileBadge collection="Cool Cats" size="md" rarity="rare" />
                  <NFTProfileBadge collection="BAYC" size="lg" rarity="legendary" />
                </div>
              </div>
            </div>

            {/* Token Balance & Tipping Demo */}
            <div className="space-y-6 md:space-y-8">
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3 flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Token Portfolio
                </h3>
                <p className="text-sm md:text-base text-[#A0A0A0] mb-4 md:mb-6">Track your crypto balances and portfolio value</p>
                <TokenBalanceDisplay className="max-w-sm" />
              </div>

              <div>
                <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Crypto Tipping
                </h3>
                <p className="text-sm md:text-base text-[#A0A0A0] mb-4 md:mb-6">Tip creators and community members with crypto</p>
                <div className="flex flex-wrap gap-3 md:gap-4">
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
          <div className="mt-12 md:mt-16 text-center px-4">
            <div className="bg-info/10 border border-info/20 rounded-lg p-4 md:p-6 max-w-2xl mx-auto">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="p-2 bg-info/20 rounded-full flex-shrink-0">
                  <Zap className="h-4 w-4 text-info" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-white mb-2">Demo Mode</h4>
                  <p className="text-sm text-[#A0A0A0]">
                    These components demonstrate the planned Web3 functionality. All features show "Coming Soon" overlays
                    but you can interact with them to see the intended user experience. Set{' '}
                    <code className="bg-info/20 px-1 rounded text-xs">VITE_ENABLE_WEB3_FEATURES=true</code> in
                    development to enable full functionality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeSection === 'education' && (
        <section className="container py-12 md:py-16">
          <Web3Education />
        </section>
      )}

      {activeSection === 'roadmap' && (
        <section className="container py-12 md:py-16">
          <Web3Roadmap />
        </section>
      )}

      {activeSection === 'tokenomics' && (
        <section className="container py-12 md:py-16 px-4">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-accent-primary/20 backdrop-blur-sm rounded-full border border-accent-primary/30 mb-4 md:mb-6">
              <Coins className="h-4 w-4 text-accent-light" />
              <span className="text-sm font-medium text-accent-light">Token Economics Preview</span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Cryb.ai Token Economics</h2>
            <p className="text-base md:text-lg text-[#A0A0A0] max-w-2xl mx-auto mb-12 md:mb-16">
              Discover how Cryb.ai token will power the future of decentralized social networking through innovative economic mechanisms.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto mb-12 md:mb-16">
              <div className="bg-[#141414]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 p-6">
                <div className="p-4 md:p-6 text-center">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">1B</div>
                  <div className="text-sm text-[#666666]">Total Supply</div>
                </div>
              </div>
              <div className="bg-[#141414]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 p-6">
                <div className="p-4 md:p-6 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-2">40%</div>
                  <div className="text-sm text-[#666666]">Community Owned</div>
                </div>
              </div>
              <div className="bg-[#141414]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 p-6">
                <div className="p-4 md:p-6 text-center">
                  <div className="text-2xl md:text-3xl font-bold text-emerald-400 mb-2">15%</div>
                  <div className="text-sm text-[#666666]">Max Staking APY</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-accent-primary/10 to-success/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 md:p-12 lg:p-16 border border-accent-primary/20">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
                <div className="text-left">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">Token Utility</h3>
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      <Users className="h-5 w-5 text-accent-light flex-shrink-0" />
                      <span className="text-sm md:text-base text-[#A0A0A0]">Governance voting rights</span>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                      <Shield className="h-5 w-5 text-success flex-shrink-0" />
                      <span className="text-sm md:text-base text-[#A0A0A0]">Token-gated community access</span>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                      <TrendingUp className="h-5 w-5 text-warning flex-shrink-0" />
                      <span className="text-sm md:text-base text-[#A0A0A0]">Staking rewards up to 15% APY</span>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                      <Star className="h-5 w-5 text-info flex-shrink-0" />
                      <span className="text-sm md:text-base text-[#A0A0A0]">Creator monetization & tips</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="bg-[#141414]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 p-4 md:p-6">
                    <h4 className="font-semibold text-white mb-3 md:mb-4">Token Flow</h4>
                    <div className="space-y-2 md:space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#666666]">User Rewards</span>
                        <span className="bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent font-semibold">40%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666666]">Development</span>
                        <span className="text-[#58a6ff] font-semibold">20%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666666]">Ecosystem</span>
                        <span className="text-emerald-400 font-semibold">15%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666666]">Treasury</span>
                        <span className="text-[#a371f7] font-semibold">15%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666666]">Public Sale</span>
                        <span className="text-[#58a6ff] font-semibold">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 md:mt-8 text-center">
                <Button as="a" href="/tokenomics" variant="primary" className="group">
                  <Coins className="h-4 w-4" />
                  <span>View Full Tokenomics</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Overview Content (Default) */}
      {activeSection === 'overview' && (
        <>
          {/* Features Preview Section */}
          <section className="container py-12 md:py-16 lg:py-24 px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">
                Powerful Web3 Features
              </h2>
              <p className="text-base md:text-lg text-[#A0A0A0] max-w-2xl mx-auto">
                Discover what's coming to Cryb.ai's Web3 ecosystem
              </p>
            </div>

            {/* Feature Grid - Mobile */}
            <div className="grid gap-4 md:gap-6 md:hidden">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div key={index} className="bg-[#141414]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 p-4 md:p-6 group hover:border-[#58a6ff]/50 transition-all duration-300">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="p-3 bg-gradient-to-br from-[#58a6ff]/20 to-[#a371f7]/20 rounded-lg group-hover:from-[#58a6ff]/30 group-hover:to-[#a371f7]/30 transition-colors flex-shrink-0">
                        <IconComponent className="h-6 w-6 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-bold text-white mb-2">{feature.title}</h3>
                        <p className="text-sm text-[#A0A0A0] mb-3 md:mb-4">{feature.description}</p>
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {feature.benefits.map((benefit, benefitIndex) => (
                            <span key={benefitIndex} className="badge bg-[#58a6ff]/10 text-[#58a6ff] text-xs border border-[#58a6ff]/20">
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Feature Grid - Desktop & Tablet */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                return (
                  <div
                    key={index}
                    className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 group hover:border-[#58a6ff]/50 transition-all duration-300 cursor-pointer"
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="text-center">
                      <div className="inline-flex p-4 md:p-6 bg-gradient-to-br from-[#58a6ff]/20 to-[#a371f7]/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] group-hover:from-[#58a6ff]/30 group-hover:to-[#a371f7]/30 transition-colors mb-4 md:mb-6">
                        <IconComponent className="h-8 w-8 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent" />
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">{feature.title}</h3>
                      <p className="text-sm md:text-base text-[#A0A0A0] mb-4 md:mb-6">{feature.description}</p>

                      <div className="space-y-2">
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center justify-center gap-2 text-sm text-[#666666]">
                            <div className="w-1.5 h-1.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-full"></div>
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Feature Details Section - Hidden on Mobile */}
          <section className="hidden lg:block container py-12 md:py-16">
            <Web3FeaturePreview feature={features[activeFeature]} />
          </section>

          {/* Benefits Section */}
          <section className="bg-[#0A0A0B] py-12 md:py-16 lg:py-24">
            <div className="container px-4">
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">
                  Why Cryb.ai Web3?
                </h2>
                <p className="text-base md:text-lg text-[#A0A0A0] max-w-2xl mx-auto">
                  The perfect blend of social networking and blockchain technology
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 text-center group hover:border-emerald-400/30 transition-all duration-300">
                  <div className="inline-flex p-4 md:p-6 bg-emerald-400/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="h-8 w-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Secure & Trustless</h3>
                  <p className="text-sm md:text-base text-[#A0A0A0]">Built on blockchain technology for maximum security and transparency</p>
                </div>

                <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 text-center group hover:border-[#58a6ff]/50 transition-all duration-300">
                  <div className="inline-flex p-4 md:p-6 bg-[#58a6ff]/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-[#58a6ff]" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Community Owned</h3>
                  <p className="text-sm md:text-base text-[#A0A0A0]">Participate in governance and help shape the future of the platform</p>
                </div>

                <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 text-center group hover:border-[#a371f7]/50 transition-all duration-300">
                  <div className="inline-flex p-4 md:p-6 bg-[#a371f7]/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-8 w-8 text-[#a371f7]" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2 md:mb-3">Earn While Social</h3>
                  <p className="text-sm md:text-base text-[#A0A0A0]">Get rewarded for your contributions to the community</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Final CTA Section */}
      <section className="container py-12 md:py-16 lg:py-24 text-center px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">
            Be Among the First
          </h2>
          <p className="text-base md:text-lg text-[#A0A0A0] mb-8 md:mb-12 lg:mb-16">
            Join our early access program and be the first to experience the future of Web3 social networking
          </p>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
            <EmailSignup variant="large" />
            <div className="text-xs md:text-sm text-[#666666]">
              <Mail className="h-4 w-4 inline mr-1 md:mr-2" />
              Get exclusive updates and early access
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}

export default CryptoPage
