import React, { useState } from 'react'
import { Book, Lightbulb, Shield, Coins, Users, Zap, ChevronDown, ChevronRight, ExternalLink, Play } from 'lucide-react'
import { useResponsive } from '../../hooks/useResponsive'

function Web3Education() {
  const { isMobile } = useResponsive()
  const [activeCategory, setActiveCategory] = useState('basics')
  const [expandedTopic, setExpandedTopic] = useState(null)

  const educationCategories = [
    {
      id: 'basics',
      title: 'Web3 Basics',
      icon: Book,
      description: 'Learn the fundamentals of Web3 and blockchain technology'
    },
    {
      id: 'wallets',
      title: 'Crypto Wallets',
      icon: Shield,
      description: 'Understanding digital wallets and how to keep your crypto secure'
    },
    {
      id: 'tokens',
      title: 'Tokens & NFTs',
      icon: Coins,
      description: 'Explore different types of digital assets and their uses'
    },
    {
      id: 'defi',
      title: 'DeFi Explained',
      icon: Zap,
      description: 'Decentralized Finance and how it changes traditional banking'
    },
    {
      id: 'community',
      title: 'DAOs & Governance',
      icon: Users,
      description: 'Community ownership and decentralized decision making'
    }
  ]

  const educationalContent = {
    basics: [
      {
        id: 'what-is-web3',
        title: 'What is Web3?',
        difficulty: 'Beginner',
        readTime: '5 min',
        summary: 'Web3 represents the next evolution of the internet, where users own their data and digital assets.',
        content: `Web3, also known as the decentralized web, is a new paradigm for the internet built on blockchain technology. Unlike Web2 (current internet), where big tech companies control your data and digital interactions, Web3 gives power back to users.

Key principles of Web3:
• **Decentralization**: No single entity controls the network
• **Ownership**: Users own their data, content, and digital assets  
• **Transparency**: All transactions are publicly verifiable
• **Permissionless**: Anyone can participate without gatekeepers

Web3 enables new possibilities like owning your social media profile, earning tokens for creating content, and participating in platform governance. It's not just about technology – it's about creating a more fair and open internet.`,
        keyTakeaways: [
          'Web3 gives users control over their digital lives',
          'Built on blockchain technology for transparency',
          'Enables true ownership of digital assets',
          'Creates new economic opportunities for users'
        ],
        nextSteps: ['Learn about blockchain basics', 'Understand cryptocurrency', 'Explore NFTs and tokens']
      },
      {
        id: 'blockchain-basics',
        title: 'Blockchain Technology',
        difficulty: 'Beginner',
        readTime: '7 min',
        summary: 'Understanding the technology that powers Web3 and cryptocurrency.',
        content: `A blockchain is a digital ledger that records transactions across many computers in a way that makes it nearly impossible to change, hack, or cheat the system.

Think of it like a special notebook that:
• **Everyone can read**: All transactions are public
• **No one can erase**: Once written, entries are permanent
• **Multiple copies exist**: Thousands of computers have the same notebook
• **Everyone agrees**: Network consensus validates all changes

This creates trust without needing a central authority like a bank. Bitcoin was the first major use case, but blockchains now power everything from smart contracts to NFTs to decentralized social networks like CRYB.

Popular blockchains include Ethereum (smart contracts), Bitcoin (digital money), and Solana (fast transactions). Each has different strengths and use cases.`,
        keyTakeaways: [
          'Blockchain = distributed, unchangeable digital ledger',
          'Creates trust without central authorities',
          'Powers cryptocurrencies, NFTs, and Web3 apps',
          'Different blockchains have different purposes'
        ],
        nextSteps: ['Explore different blockchain networks', 'Learn about smart contracts', 'Understand gas fees']
      },
      {
        id: 'why-web3-matters',
        title: 'Why Web3 Matters for Social Media',
        difficulty: 'Beginner',
        readTime: '6 min',
        summary: 'How Web3 technology can revolutionize social networking and online communities.',
        content: `Traditional social media has problems: platforms control your data, can delete your content, take your audience away, and don't share profits with creators. Web3 social media fixes these issues.

**Problems with Web2 social media:**
• Platforms own your content and followers
• Arbitrary censorship and account bans
• No creator revenue sharing
• Data harvesting without compensation
• Algorithmic manipulation

**Web3 social media solutions:**
• **Own your identity**: Your profile belongs to you, not the platform
• **Portable audience**: Take followers with you anywhere
• **Creator ownership**: Earn tokens for valuable content
• **Community governance**: Users vote on platform changes
• **Transparent algorithms**: Open-source recommendation systems

CRYB combines the best of both worlds: familiar social media experience with Web3 ownership and rewards. You can earn CRYB tokens for creating great content, vote on new features, and own your digital identity forever.`,
        keyTakeaways: [
          'Web3 gives creators true ownership of their content',
          'Users can earn tokens for valuable contributions',
          'Community governance replaces corporate decisions',
          'Portable identity means freedom to move platforms'
        ],
        nextSteps: ['Set up a Web3 wallet', 'Learn about social tokens', 'Explore creator monetization']
      }
    ],
    wallets: [
      {
        id: 'what-is-wallet',
        title: 'What is a Crypto Wallet?',
        difficulty: 'Beginner',
        readTime: '5 min',
        summary: 'Your digital wallet is like a bank account for cryptocurrency and NFTs.',
        content: `A crypto wallet doesn't actually store your cryptocurrency – it stores the keys that prove you own digital assets on the blockchain. Think of it like a secure keychain for the digital world.

**Types of wallets:**
• **Hot wallets**: Connected to internet (convenient but less secure)
• **Cold wallets**: Offline storage (very secure but less convenient)
• **Browser wallets**: Extensions like MetaMask
• **Mobile wallets**: Apps on your phone
• **Hardware wallets**: Physical devices like Ledger

**What wallets store:**
• Private keys (prove ownership)
• Public addresses (like account numbers)
• Transaction history
• NFT collections
• Token balances

Your wallet address is public (safe to share), but your private key/seed phrase must stay secret. Never share your seed phrase with anyone – it's like giving away your bank password.`,
        keyTakeaways: [
          'Wallets store keys, not actual cryptocurrency',
          'Private keys must always stay private',
          'Different wallet types for different security needs',
          'Your wallet address is safe to share publicly'
        ],
        nextSteps: ['Choose a wallet type', 'Set up your first wallet', 'Practice sending small amounts']
      },
      {
        id: 'wallet-security',
        title: 'Keeping Your Wallet Safe',
        difficulty: 'Intermediate',
        readTime: '8 min',
        summary: 'Essential security practices to protect your digital assets.',
        content: `Crypto security is different from traditional online security. There's no "forgot password" button – lose your keys, lose your crypto. Here's how to stay safe:

**Essential Security Rules:**
• **Write down your seed phrase**: Store it offline in multiple safe places
• **Never share private keys**: Legitimate services never ask for them
• **Use strong passwords**: Unique password for wallet apps
• **Enable 2FA**: Where available, use two-factor authentication
• **Verify URLs**: Always type wallet websites manually

**Common Scams to Avoid:**
• Fake wallet apps with similar names
• Phishing emails asking for seed phrases
• "Free crypto" offers requiring wallet connection
• Fake customer support requesting private keys
• Too-good-to-be-true investment opportunities

**Best Practices:**
• Start with small amounts to learn
• Use hardware wallets for large holdings
• Keep software updated
• Never screenshot seed phrases
• Test transactions with small amounts first

Remember: In crypto, you are your own bank. This means you have full control, but also full responsibility for security.`,
        keyTakeaways: [
          'Your seed phrase is the master key – guard it carefully',
          'Never share private keys with anyone',
          'Be extremely cautious of scams and phishing',
          'Start small and learn before investing large amounts'
        ],
        nextSteps: ['Set up proper seed phrase storage', 'Practice wallet security', 'Learn to identify scams']
      }
    ],
    tokens: [
      {
        id: 'tokens-vs-crypto',
        title: 'Tokens vs Cryptocurrency',
        difficulty: 'Beginner',
        readTime: '6 min',
        summary: 'Understanding the difference between cryptocurrencies, tokens, and NFTs.',
        content: `Not all digital assets are the same. Here's how to understand the different types:

**Cryptocurrency (Native tokens):**
• Bitcoin (BTC) on Bitcoin network
• Ether (ETH) on Ethereum network  
• Solana (SOL) on Solana network
• Used to pay transaction fees on their networks

**Tokens (Built on existing blockchains):**
• CRYB token built on Ethereum
• USDC stablecoin on multiple networks
• Represent ownership, utility, or rewards
• Powered by smart contracts

**NFTs (Non-Fungible Tokens):**
• Unique digital assets (art, collectibles, identity)
• Each one is different and rare
• Prove ownership of digital items
• Can be profile pictures, game items, or certificates

**Token Standards:**
• ERC-20: Standard tokens (like CRYB)
• ERC-721: NFTs (unique items)
• ERC-1155: Multi-tokens (gaming assets)

Think of it like this: cryptocurrencies are like the "electricity" that powers blockchain networks, tokens are like "gift cards" for specific platforms, and NFTs are like "certificates of authenticity" for unique digital items.`,
        keyTakeaways: [
          'Cryptocurrencies power blockchain networks',
          'Tokens represent utility or ownership in projects',
          'NFTs are unique, non-interchangeable digital assets',
          'Different token standards serve different purposes'
        ],
        nextSteps: ['Explore different token types', 'Learn about NFT marketplaces', 'Understand token economics']
      },
      {
        id: 'nft-guide',
        title: 'NFTs Explained Simply',
        difficulty: 'Beginner',
        readTime: '7 min',
        summary: 'A practical guide to Non-Fungible Tokens and their real-world uses.',
        content: `NFTs (Non-Fungible Tokens) are unique digital certificates that prove ownership of digital (or physical) items. "Non-fungible" means each one is unique and can't be replaced by something else.

**Real-world analogies:**
• Concert ticket: Proves you own a specific seat
• Car title: Proves you own a specific vehicle  
• Autographed photo: Unique, can't be exactly replicated
• Trading card: Each one has different rarity and value

**Common NFT types:**
• **Profile Pictures**: Show your digital identity (Bored Apes, CryptoPunks)
• **Digital Art**: Unique artworks by digital creators
• **Game Items**: Weapons, characters, skins that you truly own
• **Utility NFTs**: Give access to communities or services
• **Music/Videos**: Collectible multimedia content

**Why people buy NFTs:**
• Support favorite artists and creators
• Join exclusive communities  
• Show status and identity
• Collect rare digital items
• Speculate on future value
• Use in games and virtual worlds

**On CRYB:** NFTs can be your profile picture, give access to exclusive communities, and represent achievements or contributions to the platform.`,
        keyTakeaways: [
          'NFTs are unique digital certificates of ownership',
          'They have many uses beyond just expensive art',
          'Can represent community membership and identity',
          'Enable new ways to support creators directly'
        ],
        nextSteps: ['Browse NFT collections', 'Set up NFT as profile picture', 'Join NFT communities']
      }
    ],
    defi: [
      {
        id: 'defi-basics',
        title: 'What is DeFi?',
        difficulty: 'Intermediate',
        readTime: '8 min',
        summary: 'Decentralized Finance: Banking without banks, powered by smart contracts.',
        content: `DeFi (Decentralized Finance) recreates traditional financial services using blockchain technology and smart contracts instead of banks and brokers.

**Traditional Finance vs DeFi:**

**Traditional Banking:**
• Need bank approval for accounts
• Banks control your money
• Limited hours and locations
• High fees and slow transfers
• Opaque processes

**DeFi:**
• Open to anyone with internet
• You control your funds
• Always available, globally
• Lower fees, instant transfers  
• Transparent, auditable code

**Popular DeFi Services:**
• **Lending/Borrowing**: Earn interest or get loans without credit checks
• **Trading**: Exchange tokens without centralized exchanges
• **Yield Farming**: Earn rewards for providing liquidity
• **Staking**: Lock tokens to secure networks and earn rewards
• **Insurance**: Protect your funds against smart contract risks

**On CRYB:** You'll be able to stake CRYB tokens to earn rewards, provide liquidity for trading, and participate in decentralized governance decisions.

**Risks to understand:**
• Smart contract bugs can cause losses
• Impermanent loss in liquidity providing
• Regulatory uncertainty in some regions
• Higher complexity than traditional finance`,
        keyTakeaways: [
          'DeFi replaces traditional banks with smart contracts',
          'Offers global, permissionless financial services',
          'Enables new ways to earn yield on your crypto',
          'Has risks that traditional banking doesn\'t have'
        ],
        nextSteps: ['Start with small amounts', 'Learn about yield farming', 'Understand smart contract risks']
      }
    ],
    community: [
      {
        id: 'dao-basics',
        title: 'DAOs: Organizations for Web3',
        difficulty: 'Intermediate',
        readTime: '7 min',
        summary: 'How communities can own and govern platforms together through DAOs.',
        content: `A DAO (Decentralized Autonomous Organization) is like a company or club that's owned and controlled by its members, not by executives or shareholders.

**How DAOs work:**
• Members buy or earn governance tokens
• Token holders vote on proposals  
• Smart contracts automatically execute decisions
• No single person or entity controls everything
• Transparent voting and treasury management

**Types of DAOs:**
• **Protocol DAOs**: Govern DeFi protocols (Uniswap, Compound)
• **Investment DAOs**: Pool money for group investments
• **Creator DAOs**: Support artists and content creators
• **Social DAOs**: Communities around shared interests
• **Service DAOs**: Provide services to Web3 ecosystem

**CRYB DAO Vision:**
Once launched, CRYB will transition to community governance where CRYB token holders can:
• Vote on new features and updates
• Decide how community funds are spent
• Choose partnerships and integrations
• Set platform policies and rules
• Elect community representatives

**Benefits of DAO governance:**
• Community owns the platform they use
• Decisions benefit users, not just profits
• Transparent voting and fund management  
• Aligned incentives between users and platform
• Global participation in decision-making

**Challenges:**
• Voter apathy (low participation)
• Complex coordination problems
• Technical barriers to participation
• Potential for governance attacks`,
        keyTakeaways: [
          'DAOs enable community ownership of organizations',
          'Governance tokens give voting rights on decisions',
          'CRYB will transition to DAO governance over time',
          'Creates alignment between users and platform success'
        ],
        nextSteps: ['Join existing DAOs to learn', 'Participate in governance voting', 'Understand proposal processes']
      }
    ]
  }

  const currentContent = educationalContent[activeCategory] || []

  const toggleTopic = (topicId) => {
    setExpandedTopic(expandedTopic === topicId ? null : topicId)
  }

  return (
    <div className="card" style={{ padding: 'var(--space-8)' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-4)'
        }}>
          <Book style={{ height: 'var(--icon-sm)', width: 'var(--icon-sm)', color: 'var(--brand-primary)' }} />
          <span style={{ fontWeight: 'var(--font-medium)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>Learn Web3</span>
        </div>

        <h2 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-3)'
        }}>Web3 Education Center</h2>
        <p style={{
          fontSize: 'var(--text-lg)',
          color: 'var(--text-secondary)',
          maxWidth: '672px',
          margin: '0 auto'
        }}>
          Master the fundamentals of Web3, cryptocurrency, and decentralized technology with our beginner-friendly guides.
        </p>
      </div>

      {/* Category Navigation */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        justifyContent: 'center',
        marginBottom: 'var(--space-6)'
      }}>
        {educationCategories.map((category) => {
          const IconComponent = category.icon
          return (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id)
                setExpandedTopic(null)
              }}
              className={activeCategory === category.id ? 'btn-primary' : 'btn-secondary'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}
            >
              <IconComponent style={{ height: '16px', width: '16px' }} />
              <span style={{ display: isMobile ? 'none' : 'inline' }}>
                {category.title}
              </span>
              <span style={{ display: isMobile ? 'inline' : 'none' }}>
                {category.title.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Category Description */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        {educationCategories.find(cat => cat.id === activeCategory) && (
          <div style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-tertiary)'
          }}>
            <h3 style={{
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>
              {educationCategories.find(cat => cat.id === activeCategory).title}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              {educationCategories.find(cat => cat.id === activeCategory).description}
            </p>
          </div>
        )}
      </div>

      {/* Educational Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {currentContent.map((topic) => (
          <div key={topic.id} className="card" style={{ padding: 'var(--space-6)' }}>
            <button
              onClick={() => toggleTopic(topic.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ flex: '1' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-2)',
                    flexWrap: 'wrap'
                  }}>
                    <h3 style={{
                      fontWeight: 'var(--font-semibold)',
                      fontSize: 'var(--text-lg)',
                      color: 'var(--text-primary)'
                    }}>{topic.title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        padding: 'var(--space-1) var(--space-3)',
                        borderRadius: 'var(--radius-sm)',
                        background: topic.difficulty === 'Beginner' ? 'var(--color-success-light)' : 'var(--color-info-light)',
                        color: topic.difficulty === 'Beginner' ? 'var(--color-success-dark)' : 'var(--color-info-dark)',
                        fontWeight: 'var(--font-medium)'
                      }}>
                        {topic.difficulty}
                      </span>
                      <span style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)'
                      }}>{topic.readTime}</span>
                    </div>
                  </div>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    lineHeight: 'var(--leading-relaxed)'
                  }}>{topic.summary}</p>
                </div>
                <div style={{ marginLeft: 'var(--space-4)' }}>
                  {expandedTopic === topic.id ? (
                    <ChevronDown style={{
                      height: '20px',
                      width: '20px',
                      color: 'var(--text-secondary)'
                    }} />
                  ) : (
                    <ChevronRight style={{
                      height: '20px',
                      width: '20px',
                      color: 'var(--text-secondary)'
                    }} />
                  )}
                </div>
              </div>
            </button>

            {expandedTopic === topic.id && (
              <div style={{
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-6)',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                {/* Content */}
                <div style={{ marginBottom: 'var(--space-6)' }}>
                  {topic.content.split('\n\n').map((paragraph, index) => {
                    if (paragraph.startsWith('**') && paragraph.includes(':**')) {
                      // Handle section headers
                      const [header, ...content] = paragraph.split('\n')
                      return (
                        <div key={index} style={{ marginBottom: 'var(--space-6)' }}>
                          <h4 style={{
                            fontWeight: 'var(--font-semibold)',
                            fontSize: 'var(--text-base)',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--space-3)'
                          }}>
                            {header.replace(/\*\*/g, '')}
                          </h4>
                          {content.map((line, lineIndex) => (
                            <div key={lineIndex} style={{ marginBottom: 'var(--space-2)' }}>
                              {line.startsWith('• ') ? (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 'var(--space-2)'
                                }}>
                                  <div style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: 'var(--brand-primary)',
                                    marginTop: '8px',
                                    flexShrink: 0
                                  }}></div>
                                  <span style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: 'var(--text-sm)',
                                    lineHeight: 'var(--leading-relaxed)'
                                  }}>{line.substring(2).replace(/\*\*/g, '')}</span>
                                </div>
                              ) : (
                                <p style={{
                                  color: 'var(--text-secondary)',
                                  fontSize: 'var(--text-sm)',
                                  lineHeight: 'var(--leading-relaxed)'
                                }}>{line.replace(/\*\*/g, '')}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    } else {
                      // Handle regular paragraphs
                      const lines = paragraph.split('\n')
                      return (
                        <div key={index} style={{ marginBottom: 'var(--space-6)' }}>
                          {lines.map((line, lineIndex) => {
                            if (line.startsWith('• ')) {
                              return (
                                <div key={lineIndex} style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 'var(--space-2)',
                                  marginBottom: 'var(--space-2)'
                                }}>
                                  <div style={{
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: 'var(--brand-primary)',
                                    marginTop: '8px',
                                    flexShrink: 0
                                  }}></div>
                                  <span style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: 'var(--text-sm)',
                                    lineHeight: 'var(--leading-relaxed)'
                                  }}>{line.substring(2).replace(/\*\*/g, '')}</span>
                                </div>
                              )
                            } else {
                              return (
                                <p key={lineIndex} style={{
                                  color: 'var(--text-secondary)',
                                  fontSize: 'var(--text-sm)',
                                  lineHeight: 'var(--leading-relaxed)',
                                  marginBottom: 'var(--space-2)'
                                }}>
                                  {line.replace(/\*\*/g, '')}
                                </p>
                              )
                            }
                          })}
                        </div>
                      )
                    }
                  })}
                </div>

                {/* Key Takeaways */}
                <div style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-tertiary)',
                  marginBottom: 'var(--space-4)'
                }}>
                  <h4 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    fontWeight: 'var(--font-semibold)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-3)'
                  }}>
                    <Lightbulb style={{
                      height: '16px',
                      width: '16px',
                      color: 'var(--brand-primary)'
                    }} />
                    Key Takeaways
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {topic.keyTakeaways.map((takeaway, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--space-2)'
                      }}>
                        <div style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'var(--brand-primary)',
                          marginTop: '8px',
                          flexShrink: 0
                        }}></div>
                        <span style={{
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--text-sm)'
                        }}>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Steps */}
                <div style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-info-light)'
                }}>
                  <h4 style={{
                    fontWeight: 'var(--font-semibold)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-3)'
                  }}>What to Learn Next</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {topic.nextSteps.map((step, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)'
                      }}>
                        <ChevronRight style={{
                          height: '12px',
                          width: '12px',
                          color: 'var(--brand-primary)'
                        }} />
                        <span style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-secondary)'
                        }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div style={{
        marginTop: 'var(--space-8)',
        paddingTop: 'var(--space-8)',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--space-6)'
        }}>
          <h3 style={{
            fontWeight: 'var(--font-bold)',
            fontSize: 'var(--text-2xl)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)'
          }}>Additional Resources</h3>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-base)'
          }}>Expand your Web3 knowledge with these trusted sources</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-6)'
        }}>
          <div className="card" style={{
            padding: 'var(--space-6)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-4)' }}>📚</div>
            <h4 style={{
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>Documentation</h4>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-4)'
            }}>Read official docs from leading Web3 projects</p>
            <button className="btn-secondary" style={{
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              margin: '0 auto'
            }}>
              <ExternalLink style={{ height: '12px', width: '12px' }} />
              <span>Browse Docs</span>
            </button>
          </div>

          <div className="card" style={{
            padding: 'var(--space-6)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-4)' }}>🎥</div>
            <h4 style={{
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>Video Tutorials</h4>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-4)'
            }}>Step-by-step guides and explanations</p>
            <button className="btn-secondary" style={{
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              margin: '0 auto'
            }}>
              <Play style={{ height: '12px', width: '12px' }} />
              <span>Watch Videos</span>
            </button>
          </div>

          <div className="card" style={{
            padding: 'var(--space-6)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 'var(--text-5xl)', marginBottom: 'var(--space-4)' }}>💬</div>
            <h4 style={{
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-lg)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>Community</h4>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-4)'
            }}>Ask questions and learn from others</p>
            <button className="btn-secondary" style={{
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              margin: '0 auto'
            }}>
              <Users style={{ height: '12px', width: '12px' }} />
              <span>Join Community</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}




export default Web3Education
