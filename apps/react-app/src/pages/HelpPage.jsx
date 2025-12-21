/**
 * HelpPage - Help center with FAQs and support options
 *
 * iOS Design System:
 * - Background: #FAFAFA (light gray)
 * - Text: #000 (primary), #666 (secondary)
 * - Cards: white with subtle shadows
 * - Border radius: 16-24px for modern iOS feel
 * - Shadows: 0 2px 8px rgba(0,0,0,0.04)
 * - Gradient: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)
 * - Icons: 20px standard size
 * - Hover: translateY(-2px) for interactive elements
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronDown, Mail, MessageCircle, Bug } from 'lucide-react'
import LandingHeader from '../components/LandingHeader'

function HelpPage() {
  const [activeSection, setActiveSection] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState({})

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

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
    <>
      <LandingHeader />
      <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', minHeight: '100vh', background: '#FAFAFA', paddingTop: isMobile ? '52px' : '64px' }}>
      {/* Sidebar - Desktop only */}
      {isDesktop && (
        <aside style={{
          width: '280px',
          position: 'sticky',
          top: '72px',
          height: 'calc(100vh - 72px)',
          overflowY: 'auto',
          padding: '48px 32px',
          borderRight: '1px solid rgba(0,0,0,0.06)',
          zIndex: 10,
          background: '#fff'
        }}>
          <div style={{ position: 'sticky', top: '24px' }}>
            <h2 style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#666',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '24px'
            }}>
              Topics
            </h2>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {sections.map((section) => {
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    style={{
                      height: '40px',
                      paddingLeft: isActive ? '12px' : '16px',
                      paddingRight: '16px',
                      fontSize: '14px',
                      fontWeight: isActive ? '500' : '400',
                      color: isActive ? '#6366F1' : '#666',
                      background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                      borderLeft: isActive ? '2px solid #6366F1' : '2px solid transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      textAlign: 'left',
                      borderRadius: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.background = '#FAFAFA'
                        e.target.style.color = '#000'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.background = 'transparent'
                        e.target.style.color = '#666'
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
      <main style={{
        flex: 1,
        maxWidth: '900px',
        margin: '0 auto',
        padding: isMobile ? '80px 20px' : '72px 80px 64px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: isMobile ? '32px' : '48px',
            fontWeight: '600',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Help Center
          </h1>
          <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
            Find answers to common questions and get support
          </p>

          {/* Search Bar */}
          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}>
              <Search size={20} style={{ color: '#666' }} />
            </div>
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                paddingLeft: '48px',
                paddingRight: '16px',
                fontSize: '16px',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '16px',
                background: '#fff',
                color: '#000',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            />
          </div>
        </div>

        {/* FAQ Sections */}
        {sections.slice(0, -1).map((section) => (
          filteredFaqs[section.id] && filteredFaqs[section.id].length > 0 && (
            <section key={section.id} id={section.id} style={{ marginBottom: '48px' }}>
              <div style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,0.06)',
                padding: '32px',
                borderRadius: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#000',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '2px solid rgba(99, 102, 241, 0.2)'
                }}>
                  {section.title}
                </h2>
                {filteredFaqs[section.id].map((faq, index) => {
                  const isExpanded = expandedItems[`${section.id}-${index}`]
                  return (
                    <div
                      key={index}
                      style={{
                        borderBottom: index < filteredFaqs[section.id].length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none'
                      }}
                    >
                      <button
                        onClick={() => toggleFaq(section.id, index)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          height: '72px',
                          padding: 0,
                          background: 'transparent',
                          border: 'none',
                          color: '#000',
                          fontSize: '16px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#6366F1'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#000'
                        }}
                      >
                        <span style={{ flex: 1 }}>{faq.question}</span>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginLeft: '16px'
                        }}>
                          <ChevronDown
                            size={20}
                            style={{
                              color: '#6366F1',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s'
                            }}
                          />
                        </div>
                      </button>
                      {isExpanded && (
                        <div style={{
                          paddingBottom: '24px',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#666'
                        }}>
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
          <div style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.06)',
            padding: '32px',
            borderRadius: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#000',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid rgba(99, 102, 241, 0.2)'
            }}>
              Contact Support
            </h2>
            <p style={{ fontSize: '16px', color: '#000', marginBottom: '32px' }}>
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '24px'
            }}>
              {[
                {
                  icon: MessageCircle,
                  title: 'Community Forum',
                  content: 'Join our community discussions',
                  subtitle: '',
                  link: '/communities',
                  isRoute: true
                }
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={index}
                    style={{
                      padding: '24px',
                      background: 'rgba(99, 102, 241, 0.05)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      minHeight: '160px',
                      borderRadius: '24px',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.1)'
                    }}>
                      <Icon size={24} style={{ color: '#6366F1' }} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#000', marginBottom: '8px' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '16px', color: '#000', marginBottom: '8px' }}>
                      {item.content}
                    </p>
                    {item.subtitle && (
                      <p style={{ fontSize: '14px', color: '#666' }}>
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
                            color: '#6366F1',
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
                            color: '#6366F1',
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
    </>
  )
}

export default HelpPage
