import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronDown, Mail, MessageCircle, Bug } from 'lucide-react'

function HelpPage() {
  const [activeSection, setActiveSection] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState({})

  // Standard responsive values
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  const pagePadding = isDesktop ? '80px' : isTablet ? '24px' : '16px'
  const headerPaddingTop = isDesktop || isTablet ? '72px' : '56px'

  const sections = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'account', title: 'Account & Profile' },
    { id: 'communities', title: 'Communities & Posts' },
    { id: 'messaging', title: 'Messaging' },
    { id: 'web3', title: 'Web3/Crypto' },
    { id: 'troubleshooting', title: 'Troubleshooting' },
    { id: 'contact', title: 'Contact Support' }
  ]

  const faqs = {
    'getting-started': [
      {
        question: 'How do I create an account?',
        answer: 'Click the "Sign Up" button in the top right corner. You can register using your email address or connect with your crypto wallet. Fill in your username, email, and password, then verify your email to activate your account.'
      },
      {
        question: 'How do I set up my profile?',
        answer: 'After logging in, click on your avatar in the top right corner and select "Profile." From there, you can upload a profile picture, add a bio, set your display name, and customize your profile theme.'
      },
      {
        question: 'How do I join a community?',
        answer: 'Browse communities by clicking "Explore" in the navigation menu. You can search for communities by name or topic, or browse by category. Click on a community to view its content, then click "Join" to become a member.'
      },
      {
        question: 'How do I make my first post?',
        answer: 'Navigate to the community where you want to post. Click the "Create Post" button, add your title and content (text, images, videos, or links), select appropriate tags, and click "Post."'
      }
    ],
    'account': [
      {
        question: 'How do I change my password?',
        answer: 'Go to Settings > Security. Click "Change Password," enter your current password, then your new password twice to confirm. For security, we recommend using a strong, unique password.'
      },
      {
        question: 'How do I enable two-factor authentication?',
        answer: 'Navigate to Settings > Security > Two-Factor Authentication. Click "Enable 2FA," scan the QR code with your authenticator app, and enter the verification code. Save your backup codes in a safe place.'
      },
      {
        question: 'Can I change my username?',
        answer: 'Yes, you can change your username once every 30 days. Go to Settings > Profile > Username. Note that changing your username will update your profile URL and mentions.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'Go to Settings > Account > Delete Account. You will need to confirm your password and acknowledge that this action is permanent. Your posts and content will be removed within 30 days.'
      }
    ],
    'communities': [
      {
        question: 'How do I create a community?',
        answer: 'Click "Create" in the navigation menu and select "Community." Choose a unique name, description, category, and privacy settings (public, private, or invite-only).'
      },
      {
        question: 'How do I become a moderator?',
        answer: 'Community creators can invite moderators. If you are interested in moderating a community, engage actively and positively, then reach out to the community creator or existing moderators.'
      },
      {
        question: 'How do I report inappropriate content?',
        answer: 'Click the three dots menu on any post or comment and select "Report." Choose the reason for reporting (spam, harassment, misinformation, etc.) and provide details.'
      },
      {
        question: 'Can I edit or delete my posts?',
        answer: 'Yes, you can edit or delete your posts at any time. Click the three dots menu on your post and select "Edit" or "Delete." Edited posts will show an "edited" indicator.'
      }
    ],
    'messaging': [
      {
        question: 'How do I send a direct message?',
        answer: 'Click on a user\'s profile and select "Message." You can also start a new conversation by clicking the message icon in the navigation and searching for the user.'
      },
      {
        question: 'How do I create a group chat?',
        answer: 'Click the message icon, then "New Group." Add members by searching for their usernames, give your group a name, and optionally add a group image. Group chats can have up to 50 members.'
      },
      {
        question: 'Can I block users from messaging me?',
        answer: 'Yes, go to Settings > Privacy > Blocked Users. You can also block a user directly from their profile or a message by clicking the three dots menu and selecting "Block User."'
      }
    ],
    'web3': [
      {
        question: 'How do I connect my crypto wallet?',
        answer: 'Go to Settings > Web3 > Connect Wallet. Select your wallet provider (MetaMask, WalletConnect, etc.) and follow the prompts to authorize the connection.'
      },
      {
        question: 'What cryptocurrencies are supported?',
        answer: 'Cryb supports Ethereum, Polygon, and other EVM-compatible chains. You can use ETH, MATIC, and various ERC-20 tokens for tipping, NFT trading, and community features.'
      },
      {
        question: 'How do I tip other users?',
        answer: 'Click the tip icon on any post or user profile. Select the amount and token, confirm the transaction in your wallet, and the tip will be sent.'
      },
      {
        question: 'Are blockchain transactions reversible?',
        answer: 'No, blockchain transactions are permanent and cannot be reversed. Always double-check wallet addresses and transaction amounts before confirming.'
      }
    ],
    'troubleshooting': [
      {
        question: 'Why can\'t I log in to my account?',
        answer: 'Ensure you are using the correct email and password. Try resetting your password if needed. Check if your account has been suspended. Clear your browser cache or try a different browser.'
      },
      {
        question: 'Why are images not loading?',
        answer: 'Check your internet connection. Try clearing your browser cache and cookies. Disable browser extensions that might block images.'
      },
      {
        question: 'Why am I not receiving notifications?',
        answer: 'Check your notification settings in Settings > Notifications. Ensure notifications are enabled in your browser or device settings. Check your email spam folder for email notifications.'
      },
      {
        question: 'How do I report a bug?',
        answer: 'Click "Report Bug" in the footer or Help menu. Provide a detailed description of the issue, steps to reproduce it, your browser and device information, and any relevant screenshots.'
      }
    ]
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id)
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      const offset = isDesktop || isTablet ? 72 : 56
      const elementPosition = element.offsetTop - offset - 32
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  const toggleFaq = (sectionId, index) => {
    const key = `${sectionId}-${index}`
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const filterFaqs = () => {
    if (!searchQuery.trim()) return faqs

    const filtered = {}
    Object.keys(faqs).forEach(section => {
      const matches = faqs[section].filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
      if (matches.length > 0) {
        filtered[section] = matches
      }
    })
    return filtered
  }

  const filteredFaqs = filterFaqs()

  return (
    <div
      className="flex flex-col md:flex-row min-h-screen"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Sidebar - Desktop only */}
      {isDesktop && (
        <aside
          style={{
            width: '280px',
            position: 'sticky',
            top: '72px',
            height: 'calc(100vh - 72px)',
            overflowY: 'auto',
            padding: '48px 32px',
            borderRight: '1px solid var(--border-primary)',
            zIndex: 10
          }}
        >
          <div style={{ position: 'sticky', top: '24px' }}>
            <h2
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '24px'
              }}
            >
              Topics
            </h2>
            <nav className="flex flex-col" style={{ gap: '4px' }}>
              {sections.map((section) => {
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="text-left rounded-lg transition-all outline-none"
                    style={{
                      height: '40px',
                      paddingLeft: isActive ? '12px' : '16px',
                      paddingRight: '16px',
                      fontSize: '14px',
                      fontWeight: isActive ? '500' : '400',
                      color: isActive ? '#58a6ff' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
                      borderLeft: isActive ? '2px solid #58a6ff' : '2px solid transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = 'var(--bg-secondary)'
                        e.target.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = 'transparent'
                        e.target.style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    {section.title}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          maxWidth: '900px',
          margin: '0 auto',
          paddingLeft: pagePadding,
          paddingRight: pagePadding,
          paddingTop: headerPaddingTop,
          paddingBottom: isMobile ? '80px' : '64px'
        }}
      >
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '48px' }}>
          <h1
            className="font-bold bg-gradient-to-r from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent"
            style={{ fontSize: isMobile ? '32px' : '48px', marginBottom: '16px' }}
          >
            Help Center
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Find answers to common questions and get support
          </p>

          {/* Search Bar */}
          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '24px',
                height: '24px',
                flexShrink: 0,
                pointerEvents: 'none'
              }}
            >
              <Search size={20} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none transition-all"
              style={{
                height: '48px',
                paddingLeft: '48px',
                paddingRight: '16px',
                fontSize: '16px',
                border: '1px solid var(--border-primary)',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(88, 166, 255, 0.5)'
                e.target.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* FAQ Sections */}
        {sections.slice(0, -1).map((section) => (
          filteredFaqs[section.id] && filteredFaqs[section.id].length > 0 && (
            <section key={section.id} id={section.id} style={{ marginBottom: '48px' }}>
              <div
                className="rounded-2xl"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  padding: '32px'
                }}
              >
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid rgba(88, 166, 255, 0.2)'
                  }}
                >
                  {section.title}
                </h2>
                {filteredFaqs[section.id].map((faq, index) => {
                  const isExpanded = expandedItems[`${section.id}-${index}`]
                  return (
                    <div
                      key={index}
                      style={{
                        borderBottom: index < filteredFaqs[section.id].length - 1 ? '1px solid var(--border-primary)' : 'none'
                      }}
                    >
                      <button
                        onClick={() => toggleFaq(section.id, index)}
                        className="w-full flex justify-between items-center transition-colors outline-none"
                        style={{
                          height: '72px',
                          paddingLeft: 0,
                          paddingRight: 0,
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--text-primary)',
                          fontSize: '16px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#58a6ff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-primary)'
                        }}
                      >
                        <span style={{ flex: 1 }}>{faq.question}</span>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '16px'
                          }}
                        >
                          <ChevronDown
                            size={20}
                            style={{
                              color: '#58a6ff',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}
                          />
                        </div>
                      </button>
                      {isExpanded && (
                        <div
                          style={{
                            paddingBottom: '24px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )
        ))}

        {/* Contact Support */}
        <section id="contact" style={{ marginBottom: '48px' }}>
          <div
            className="rounded-2xl"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              padding: '32px'
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(88, 166, 255, 0.2)'
              }}
            >
              Contact Support
            </h2>
            <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '32px' }}>
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div
              className="grid grid-cols-1 md:grid-cols-3"
              style={{ gap: '24px' }}
            >
              {[
                {
                  icon: Mail,
                  title: 'Email Support',
                  content: 'support@cryb.com',
                  subtitle: 'Response within 24 hours',
                  link: 'mailto:support@cryb.com'
                },
                {
                  icon: MessageCircle,
                  title: 'Community Forum',
                  content: 'Join our community discussions',
                  subtitle: '',
                  link: '/communities',
                  isRoute: true
                },
                {
                  icon: Bug,
                  title: 'Report a Bug',
                  content: 'Help us improve Cryb',
                  subtitle: '',
                  link: 'mailto:bugs@cryb.com'
                }
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={index}
                    className="rounded-2xl"
                    style={{
                      padding: '24px',
                      backgroundColor: 'rgba(88, 166, 255, 0.05)',
                      border: '1px solid rgba(88, 166, 255, 0.2)',
                      minHeight: '160px'
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(88, 166, 255, 0.1)'
                      }}
                    >
                      <Icon size={24} style={{ color: '#58a6ff' }} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {item.content}
                    </p>
                    {item.subtitle && (
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {item.subtitle}
                      </p>
                    )}
                    {item.link && (
                      item.isRoute ? (
                        <Link
                          to={item.link}
                          style={{
                            display: 'inline-block',
                            marginTop: '16px',
                            color: '#58a6ff',
                            fontSize: '14px',
                            fontWeight: '500',
                            textDecoration: 'none'
                          }}
                        >
                          Visit Forum →
                        </Link>
                      ) : (
                        <a
                          href={item.link}
                          style={{
                            display: 'inline-block',
                            marginTop: '16px',
                            color: '#58a6ff',
                            fontSize: '14px',
                            fontWeight: '500',
                            textDecoration: 'none'
                          }}
                        >
                          Contact →
                        </a>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HelpPage
