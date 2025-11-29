import React, { useState, useEffect } from 'react'
import { Calendar, CheckCircle, Clock, Zap, Users, Coins, Shield, TrendingUp, Star, ArrowRight, GitBranch, Target } from 'lucide-react'

function Web3Roadmap() {
  const [selectedPhase, setSelectedPhase] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const roadmapPhases = [
    {
      id: 'phase-1',
      phase: 'Phase 1',
      title: 'Foundation Layer',
      subtitle: 'Building Core Web3 Infrastructure',
      timeline: 'Q2 2024',
      status: 'upcoming',
      progress: 25,
      duration: '3 months',
      budget: '$500K',
      team: 'Core Development',
      description: 'Establish the fundamental Web3 infrastructure and core token mechanics that will power the entire CRYB ecosystem.',
      objectives: [
        'Launch CRYB token with advanced tokenomics',
        'Implement secure wallet integration system',
        'Deploy governance smart contracts',
        'Create basic staking infrastructure',
        'Establish community treasury'
      ],
      features: [
        {
          name: 'Multi-Wallet Support',
          description: 'Connect MetaMask, WalletConnect, Coinbase Wallet',
          icon: Shield,
          complexity: 'Medium'
        },
        {
          name: 'CRYB Token Launch',
          description: 'ERC-20 token with burn and staking mechanisms',
          icon: Coins,
          complexity: 'High'
        },
        {
          name: 'Basic Governance',
          description: 'Community voting on key platform decisions',
          icon: Users,
          complexity: 'Medium'
        },
        {
          name: 'Staking System',
          description: 'Earn rewards by locking CRYB tokens',
          icon: TrendingUp,
          complexity: 'High'
        }
      ],
      deliverables: [
        'CRYB token smart contract deployment',
        'Wallet integration SDK',
        'Governance voting interface',
        'Staking rewards calculator',
        'Community treasury dashboard',
        'Security audit reports'
      ],
      risks: [
        'Smart contract vulnerabilities',
        'Regulatory compliance requirements',
        'Network congestion and gas fees'
      ],
      success_metrics: [
        '10,000+ connected wallets',
        '1M+ CRYB tokens staked',
        '500+ governance votes cast'
      ]
    },
    {
      id: 'phase-2',
      phase: 'Phase 2',
      title: 'Social Integration',
      subtitle: 'NFTs, Profiles & Token Gating',
      timeline: 'Q3 2024',
      status: 'upcoming',
      progress: 0,
      duration: '4 months',
      budget: '$750K',
      team: 'Full Stack + Design',
      description: 'Transform social interactions with NFT integration, token-gated communities, and enhanced creator monetization.',
      objectives: [
        'Enable NFT profile pictures and showcases',
        'Launch token-gated premium communities',
        'Implement creator monetization tools',
        'Deploy reputation and achievement systems',
        'Establish creator funding programs'
      ],
      features: [
        {
          name: 'NFT Profile System',
          description: 'Use your NFTs as profile pictures and display collections',
          icon: Star,
          complexity: 'Medium'
        },
        {
          name: 'Token Gating',
          description: 'Exclusive communities based on token/NFT holdings',
          icon: Shield,
          complexity: 'High'
        },
        {
          name: 'Creator Rewards',
          description: 'Earn CRYB tokens for high-quality content',
          icon: Coins,
          complexity: 'High'
        },
        {
          name: 'Social Tipping',
          description: 'Send crypto tips to favorite creators',
          icon: TrendingUp,
          complexity: 'Medium'
        }
      ],
      deliverables: [
        'NFT metadata integration system',
        'Token gating smart contracts',
        'Creator monetization dashboard',
        'Social tipping infrastructure',
        'Achievement NFT collections',
        'Community premium features'
      ],
      risks: [
        'NFT market volatility',
        'Complex token gating logic',
        'Creator onboarding challenges'
      ],
      success_metrics: [
        '50,000+ NFT profiles created',
        '100+ token-gated communities',
        '$50K+ in creator tips paid'
      ]
    },
    {
      id: 'phase-3',
      phase: 'Phase 3',
      title: 'DeFi Integration',
      subtitle: 'Trading, Yield & Cross-Chain',
      timeline: 'Q4 2024',
      status: 'upcoming',
      progress: 0,
      duration: '5 months',
      budget: '$1M',
      team: 'DeFi Specialists + Security',
      description: 'Deep DeFi integration with yield farming, decentralized trading, and cross-chain compatibility.',
      objectives: [
        'Launch decentralized CRYB trading pairs',
        'Implement yield farming and liquidity mining',
        'Deploy cross-chain bridge infrastructure',
        'Create DeFi portfolio management tools',
        'Establish automated market makers'
      ],
      features: [
        {
          name: 'DEX Integration',
          description: 'Trade CRYB directly within the platform',
          icon: TrendingUp,
          complexity: 'High'
        },
        {
          name: 'Yield Farming',
          description: 'Earn additional rewards by providing liquidity',
          icon: Coins,
          complexity: 'High'
        },
        {
          name: 'Cross-Chain Bridge',
          description: 'Use CRYB on multiple blockchain networks',
          icon: GitBranch,
          complexity: 'Very High'
        },
        {
          name: 'DeFi Dashboard',
          description: 'Manage all your DeFi positions in one place',
          icon: Target,
          complexity: 'Medium'
        }
      ],
      deliverables: [
        'Uniswap/SushiSwap liquidity pools',
        'Yield farming smart contracts',
        'Cross-chain bridge contracts',
        'Portfolio tracking interface',
        'Automated rebalancing tools',
        'DeFi security protocols'
      ],
      risks: [
        'Impermanent loss risks',
        'Cross-chain security vulnerabilities',
        'DeFi protocol dependencies'
      ],
      success_metrics: [
        '$10M+ in total value locked',
        '1,000+ active liquidity providers',
        '5+ supported blockchain networks'
      ]
    },
    {
      id: 'phase-4',
      phase: 'Phase 4',
      title: 'Ecosystem Expansion',
      subtitle: 'Partnerships, Integrations & Scale',
      timeline: 'Q1 2025',
      status: 'upcoming',
      progress: 0,
      duration: '6 months',
      budget: '$1.5M',
      team: 'Full Organization',
      description: 'Scale the ecosystem through strategic partnerships, advanced features, and global expansion.',
      objectives: [
        'Partner with major Web3 platforms and protocols',
        'Launch mobile app with full Web3 features',
        'Implement advanced DAO governance tools',
        'Create developer API and SDK ecosystem',
        'Establish global community chapters'
      ],
      features: [
        {
          name: 'Partner Integrations',
          description: 'Connect with other Web3 platforms and protocols',
          icon: Users,
          complexity: 'High'
        },
        {
          name: 'Mobile Web3 App',
          description: 'Full-featured mobile app with wallet integration',
          icon: Shield,
          complexity: 'Very High'
        },
        {
          name: 'Advanced DAO Tools',
          description: 'Sophisticated governance and proposal systems',
          icon: Target,
          complexity: 'High'
        },
        {
          name: 'Developer Ecosystem',
          description: 'APIs and SDKs for third-party developers',
          icon: GitBranch,
          complexity: 'Medium'
        }
      ],
      deliverables: [
        'Partnership integration protocols',
        'Mobile app with Web3 wallet',
        'Advanced governance dashboard',
        'Developer documentation portal',
        'Global community hubs',
        'Enterprise partnership program'
      ],
      risks: [
        'Partnership integration complexity',
        'Mobile Web3 UX challenges',
        'Scaling governance participation'
      ],
      success_metrics: [
        '10+ major partnership integrations',
        '100K+ mobile app downloads',
        '50+ active DAO proposals monthly'
      ]
    },
    {
      id: 'phase-5',
      phase: 'Phase 5',
      title: 'Future Vision',
      subtitle: 'AI, Metaverse & Next-Gen Social',
      timeline: 'Q2-Q4 2025',
      status: 'planning',
      progress: 0,
      duration: '9 months',
      budget: '$2M+',
      team: 'Research & Innovation',
      description: 'Push the boundaries of social networking with AI, metaverse integration, and next-generation features.',
      objectives: [
        'Integrate AI-powered content curation and creation',
        'Launch metaverse social spaces and events',
        'Implement advanced reputation algorithms',
        'Create autonomous creator economy tools',
        'Establish research partnerships with universities'
      ],
      features: [
        {
          name: 'AI Content Tools',
          description: 'AI-powered content generation and curation',
          icon: Zap,
          complexity: 'Very High'
        },
        {
          name: 'Metaverse Integration',
          description: 'Virtual spaces for community events and meetings',
          icon: Star,
          complexity: 'Very High'
        },
        {
          name: 'Advanced Reputation',
          description: 'Sophisticated trust and reputation algorithms',
          icon: Shield,
          complexity: 'High'
        },
        {
          name: 'Autonomous Economy',
          description: 'Self-governing creator economy mechanisms',
          icon: TrendingUp,
          complexity: 'Very High'
        }
      ],
      deliverables: [
        'AI content generation API',
        'Metaverse event platform',
        'Advanced reputation system',
        'Autonomous creator fund',
        'Research partnership program',
        'Innovation lab establishment'
      ],
      risks: [
        'Emerging technology maturity',
        'AI regulation and ethics',
        'Metaverse adoption rates'
      ],
      success_metrics: [
        '1M+ AI-generated content pieces',
        '10,000+ metaverse event attendees',
        '$1M+ autonomous creator payouts'
      ]
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success'
      case 'in-progress': return 'text-accent-light'
      case 'upcoming': return 'text-warning'
      case 'planning': return 'text-muted'
      default: return 'text-muted'
    }
  }

  const getStatusBg = (status) => {
    switch (status) {
      case 'completed': return 'bg-success/20'
      case 'in-progress': return 'bg-accent-primary/20'
      case 'upcoming': return 'bg-warning/20'
      case 'planning': return 'bg-muted/20'
      default: return 'bg-muted/20'
    }
  }

  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'Low': return 'text-success'
      case 'Medium': return 'text-warning'
      case 'High': return 'text-error'
      case 'Very High': return 'text-error'
      default: return 'text-muted'
    }
  }

  return (
    <div className="card p-2xl">
      {/* Header */}
      <div style={{
  textAlign: 'center'
}}>
        <div style={{
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '50%',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <Calendar style={{
  height: '16px',
  width: '16px'
}} />
          <span style={{
  fontWeight: '500'
}}>Development Roadmap</span>
        </div>
        
        <h2 style={{
  fontWeight: 'bold'
}}>
          Web3 Development
          <span className="text-gradient bg-gradient-to-r from-accent-primary to-success bg-clip-text text-transparent"> Roadmap</span>
        </h2>
        <p className="text-lg text-secondary max-w-2xl mx-auto">
          Our comprehensive plan to build the future of Web3 social networking, from foundation to cutting-edge innovation.
        </p>
      </div>

      {/* Timeline Overview */}
      <div className="mb-2xl">
        <div style={{
  display: 'none',
  position: 'relative'
}}>
          {/* Timeline Line */}
          <div style={{
  position: 'absolute',
  height: '4px'
}}></div>
          
          {/* Phase Cards */}
          <div style={{
  display: 'grid',
  position: 'relative'
}}>
            {roadmapPhases.map((phase, index) => (
              <div 
                key={phase.id}
                style={{
  position: 'relative'
}}
                onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
              >
                {/* Timeline Node */}
                <div style={{
  position: 'absolute',
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}}></div>
                
                {/* Phase Card */}
                <div className={`card p-lg mt-20 hover:border-accent-primary/30 transition-all duration-300 ${
                  selectedPhase === phase.id ? 'border-accent-primary/50 bg-accent-primary/5' : ''
                }`}>
                  <div style={{
  textAlign: 'center'
}}>
                    <div style={{
  display: 'inline-flex',
  borderRadius: '50%',
  fontWeight: '500'
}}>
                      {phase.status === 'completed' && <CheckCircle style={{
  height: '12px',
  width: '12px'
}} />}
                      {phase.status === 'in-progress' && <Clock style={{
  height: '12px',
  width: '12px'
}} />}
                      {phase.status === 'upcoming' && <Calendar style={{
  height: '12px',
  width: '12px'
}} />}
                      {phase.status === 'planning' && <Target style={{
  height: '12px',
  width: '12px'
}} />}
                      {phase.status.charAt(0).toUpperCase() + phase.status.slice(1).replace('-', ' ')}
                    </div>
                    
                    <h3 style={{
  fontWeight: 'bold'
}}>{phase.phase}</h3>
                    <h4 style={{
  fontWeight: '600'
}}>{phase.title}</h4>
                    <p className="text-xs text-secondary mb-md">{phase.subtitle}</p>
                    
                    <div className="text-xs text-muted mb-md">{phase.timeline}</div>
                    
                    {/* Progress Bar */}
                    {phase.progress > 0 && (
                      <div style={{
  width: '100%',
  borderRadius: '50%',
  height: '8px'
}}>
                        <div
                          style={{
  height: '8px',
  borderRadius: '50%',
  width: `${phase.progress}%`
}}
                        ></div>
                      </div>
                    )}
                    
                    <div className="text-xs text-accent-light">
                      {phase.features.length} features planned
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="lg:hidden space-y-lg">
          {roadmapPhases.map((phase, index) => (
            <div key={phase.id} style={{
  position: 'relative'
}}>
              {/* Connector Line */}
              {index < roadmapPhases.length - 1 && (
                <div style={{
  position: 'absolute',
  height: '64px'
}}></div>
              )}
              
              <div 
                style={{
  display: 'flex',
  alignItems: 'flex-start'
}}
                onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
              >
                {/* Timeline Node */}
                <div style={{
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}}></div>
                
                {/* Phase Card */}
                <div style={{
  flex: '1'
}}>
                  <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                    <div>
                      <h3 style={{
  fontWeight: 'bold'
}}>{phase.phase}: {phase.title}</h3>
                      <p className="text-sm text-secondary">{phase.subtitle}</p>
                    </div>
                    <div style={{
  borderRadius: '50%',
  fontWeight: '500'
}}>
                      {phase.timeline}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  {phase.progress > 0 && (
                    <div style={{
  width: '100%',
  borderRadius: '50%',
  height: '8px'
}}>
                      <div
                        style={{
  height: '8px',
  borderRadius: '50%',
  width: `${phase.progress}%`
}}
                      ></div>
                    </div>
                  )}
                  
                  <div className="text-sm text-muted">
                    {phase.features.length} features • {phase.duration} • {phase.budget}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase Details */}
      {selectedPhase && (
        <div className="border-t border-border-primary pt-2xl">
          {roadmapPhases.filter(phase => phase.id === selectedPhase).map(phase => (
            <div key={phase.id} className="space-y-2xl">
              {/* Phase Header */}
              <div style={{
  textAlign: 'center'
}}>
                <h3 style={{
  fontWeight: 'bold'
}}>
                  {phase.phase}: {phase.title}
                </h3>
                <p className="text-lg text-secondary max-w-3xl mx-auto">
                  {phase.description}
                </p>
              </div>

              {/* Phase Stats */}
              <div style={{
  display: 'grid'
}}>
                <div style={{
  textAlign: 'center'
}}>
                  <Calendar style={{
  height: '24px',
  width: '24px'
}} />
                  <div style={{
  fontWeight: 'bold'
}}>{phase.timeline}</div>
                  <div className="text-sm text-muted">Timeline</div>
                </div>
                <div style={{
  textAlign: 'center'
}}>
                  <Clock style={{
  height: '24px',
  width: '24px'
}} />
                  <div style={{
  fontWeight: 'bold'
}}>{phase.duration}</div>
                  <div className="text-sm text-muted">Duration</div>
                </div>
                <div style={{
  textAlign: 'center'
}}>
                  <Coins style={{
  height: '24px',
  width: '24px'
}} />
                  <div style={{
  fontWeight: 'bold'
}}>{phase.budget}</div>
                  <div className="text-sm text-muted">Budget</div>
                </div>
                <div style={{
  textAlign: 'center'
}}>
                  <Users style={{
  height: '24px',
  width: '24px'
}} />
                  <div style={{
  fontWeight: 'bold'
}}>{phase.team}</div>
                  <div className="text-sm text-muted">Team</div>
                </div>
              </div>

              {/* Objectives */}
              <div className="card p-lg">
                <h4 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
                  <Target style={{
  height: '20px',
  width: '20px'
}} />
                  Key Objectives
                </h4>
                <div style={{
  display: 'grid'
}}>
                  {phase.objectives.map((objective, index) => (
                    <div key={index} style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                      <CheckCircle style={{
  height: '16px',
  width: '16px'
}} />
                      <span className="text-secondary">{objective}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="card p-lg">
                <h4 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
                  <Zap style={{
  height: '20px',
  width: '20px'
}} />
                  Core Features
                </h4>
                <div style={{
  display: 'grid'
}}>
                  {phase.features.map((feature, index) => {
                    const IconComponent = feature.icon
                    return (
                      <div key={index} style={{
  borderRadius: '12px'
}}>
                        <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
                          <div style={{
  borderRadius: '12px'
}}>
                            <IconComponent style={{
  height: '20px',
  width: '20px'
}} />
                          </div>
                          <div style={{
  flex: '1'
}}>
                            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                              <h5 style={{
  fontWeight: '600'
}}>{feature.name}</h5>
                              <span style={{
  borderRadius: '4px'
}}>
                                {feature.complexity}
                              </span>
                            </div>
                            <p className="text-sm text-secondary">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Success Metrics */}
              <div style={{
  display: 'grid'
}}>
                <div className="card p-lg">
                  <h4 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
                    <TrendingUp style={{
  height: '16px',
  width: '16px'
}} />
                    Success Metrics
                  </h4>
                  <div className="space-y-sm">
                    {phase.success_metrics.map((metric, index) => (
                      <div key={index} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <ArrowRight style={{
  height: '12px',
  width: '12px'
}} />
                        <span>{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-lg">
                  <h4 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
                    <Shield style={{
  height: '16px',
  width: '16px'
}} />
                    Key Risks
                  </h4>
                  <div className="space-y-sm">
                    {phase.risks.map((risk, index) => (
                      <div key={index} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <ArrowRight style={{
  height: '12px',
  width: '12px'
}} />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card p-lg">
                  <h4 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center'
}}>
                    <CheckCircle style={{
  height: '16px',
  width: '16px'
}} />
                    Key Deliverables
                  </h4>
                  <div className="space-y-sm">
                    {phase.deliverables.slice(0, 3).map((deliverable, index) => (
                      <div key={index} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                        <ArrowRight style={{
  height: '12px',
  width: '12px'
}} />
                        <span>{deliverable}</span>
                      </div>
                    ))}
                    {phase.deliverables.length > 3 && (
                      <div className="text-xs text-muted">
                        +{phase.deliverables.length - 3} more deliverables
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Call to Action */}
      <div style={{
  textAlign: 'center'
}}>
        <div style={{
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>
          <h3 style={{
  fontWeight: 'bold'
}}>
            Shape the Future of Web3 Social
          </h3>
          <p className="text-secondary mb-lg max-w-2xl mx-auto">
            Join our community and help us build the next generation of social networking. 
            Your feedback and participation shape our roadmap.
          </p>
          <div style={{
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
}}>
            <button className="btn btn-primary">
              <Users style={{
  height: '16px',
  width: '16px'
}} />
              <span>Join Community</span>
            </button>
            <button className="btn btn-secondary">
              <GitBranch style={{
  height: '16px',
  width: '16px'
}} />
              <span>View on GitHub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}




export default Web3Roadmap
