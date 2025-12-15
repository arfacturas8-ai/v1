import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function HelpPage() {
  const [activeSection, setActiveSection] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState({})

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
        answer: 'After logging in, click on your avatar in the top right corner and select "Profile." From there, you can upload a profile picture, add a bio, set your display name, and customize your profile theme. You can also link your social media accounts and crypto wallets.'
      },
      {
        question: 'How do I join a community?',
        answer: 'Browse communities by clicking "Explore" in the navigation menu. You can search for communities by name or topic, or browse by category. Click on a community to view its content, then click "Join" to become a member.'
      },
      {
        question: 'How do I make my first post?',
        answer: 'Navigate to the community where you want to post. Click the "Create Post" button, add your title and content (text, images, videos, or links), select appropriate tags, and click "Post." Make sure to follow the community guidelines.'
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
      },
      {
        question: 'How do I customize my notification preferences?',
        answer: 'Navigate to Settings > Notifications. You can customize notifications for posts, comments, messages, community updates, and more. Choose between push notifications, email, or both.'
      }
    ],
    'communities': [
      {
        question: 'How do I create a community?',
        answer: 'Click "Create" in the navigation menu and select "Community." Choose a unique name, description, category, and privacy settings (public, private, or invite-only). You can also set community rules and customize the appearance.'
      },
      {
        question: 'How do I become a moderator?',
        answer: 'Community creators can invite moderators. If you are interested in moderating a community, engage actively and positively, then reach out to the community creator or existing moderators to express your interest.'
      },
      {
        question: 'What are community roles?',
        answer: 'Communities have several roles: Owner (creator), Moderators (manage content and members), and Members. Each role has different permissions for managing posts, members, and community settings.'
      },
      {
        question: 'How do I report inappropriate content?',
        answer: 'Click the three dots menu on any post or comment and select "Report." Choose the reason for reporting (spam, harassment, misinformation, etc.) and provide details. Our moderation team will review it within 24 hours.'
      },
      {
        question: 'Can I edit or delete my posts?',
        answer: 'Yes, you can edit or delete your posts at any time. Click the three dots menu on your post and select "Edit" or "Delete." Edited posts will show an "edited" indicator. Deleted posts cannot be recovered.'
      }
    ],
    'messaging': [
      {
        question: 'How do I send a direct message?',
        answer: 'Click on a user\'s profile and select "Message." You can also start a new conversation by clicking the message icon in the navigation and searching for the user. Type your message and press send.'
      },
      {
        question: 'How do I create a group chat?',
        answer: 'Click the message icon, then "New Group." Add members by searching for their usernames, give your group a name, and optionally add a group image. Group chats can have up to 50 members.'
      },
      {
        question: 'Can I block users from messaging me?',
        answer: 'Yes, go to Settings > Privacy > Blocked Users. You can also block a user directly from their profile or a message by clicking the three dots menu and selecting "Block User."'
      },
      {
        question: 'How do I share media in messages?',
        answer: 'Click the attachment icon in the message input field. You can share images, videos, GIFs, and files up to 100MB. You can also paste images directly into the message field.'
      }
    ],
    'web3': [
      {
        question: 'How do I connect my crypto wallet?',
        answer: 'Go to Settings > Web3 > Connect Wallet. Select your wallet provider (MetaMask, WalletConnect, etc.) and follow the prompts to authorize the connection. Your wallet address will be linked to your profile.'
      },
      {
        question: 'What cryptocurrencies are supported?',
        answer: 'Cryb.ai supports Ethereum, Polygon, and other EVM-compatible chains. You can use ETH, MATIC, and various ERC-20 tokens for tipping, NFT trading, and community features.'
      },
      {
        question: 'How do I tip other users?',
        answer: 'Click the tip icon on any post or user profile. Select the amount and token, confirm the transaction in your wallet, and the tip will be sent. The recipient will receive a notification.'
      },
      {
        question: 'How do I view my NFTs on my profile?',
        answer: 'Once your wallet is connected, go to your Profile > NFTs. Your NFTs will be automatically displayed. You can choose which NFTs to showcase and set a featured NFT as your profile picture.'
      },
      {
        question: 'Are blockchain transactions reversible?',
        answer: 'No, blockchain transactions are permanent and cannot be reversed. Always double-check wallet addresses and transaction amounts before confirming. Cryb.ai cannot recover lost or incorrectly sent crypto assets.'
      }
    ],
    'troubleshooting': [
      {
        question: 'Why can\'t I log in to my account?',
        answer: 'Ensure you are using the correct email and password. Try resetting your password if needed. Check if your account has been suspended. Clear your browser cache or try a different browser. If issues persist, contact support.'
      },
      {
        question: 'Why are images not loading?',
        answer: 'Check your internet connection. Try clearing your browser cache and cookies. Disable browser extensions that might block images. If the issue continues, try using a different browser or device.'
      },
      {
        question: 'Why am I not receiving notifications?',
        answer: 'Check your notification settings in Settings > Notifications. Ensure notifications are enabled in your browser or device settings. Check your email spam folder for email notifications. Try logging out and back in.'
      },
      {
        question: 'Why is the site loading slowly?',
        answer: 'Check your internet connection speed. Clear your browser cache and cookies. Close unnecessary browser tabs. Try using a different browser. The site may be experiencing high traffic; try again later.'
      },
      {
        question: 'How do I report a bug?',
        answer: 'Click "Report Bug" in the footer or Help menu. Provide a detailed description of the issue, steps to reproduce it, your browser and device information, and any relevant screenshots. Our team will investigate.'
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
      const offset = 80
      const elementPosition = element.offsetTop - offset
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
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] relative">
      {/* Sidebar Table of Contents */}
      <aside className="hidden md:block md:w-[280px] md:sticky md:top-[80px] md:h-[calc(100vh-80px)] md:overflow-y-auto md:p-10 md:border-r md:border-black/10">
        <div className="sticky top-5">
          <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-5">Topics</h2>
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`bg-transparent border-none text-sm p-2 px-3 text-left cursor-pointer rounded-md transition-all duration-200 font-inherit outline-none ${
                  activeSection === section.id
                    ? 'text-[#58a6ff] bg-[#58a6ff]/10 font-medium border-l-2 border-[#58a6ff] pl-2.5'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/60 '
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 pb-20 md:px-5 md:py-10 md:pb-20">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-4 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
            Help Center
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)] mb-6">Find answers to common questions and get support</p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 md:px-5 md:py-3.5 pr-11 md:pr-12 bg-[var(--color-bg-secondary)]/60 border border-black/10 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] text-[var(--color-text-primary)] text-base outline-none transition-all duration-200 font-inherit placeholder:text-[var(--color-text-tertiary)] focus:border-[#58a6ff]/50 focus:ring-1 focus:ring-[#58a6ff]/50"
            />
            <svg className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4" stroke="var(--color-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Getting Started */}
        <section id="getting-started" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-4 border-b-2 border-[#58a6ff]/20">Getting Started</h2>
            {filteredFaqs['getting-started'] && filteredFaqs['getting-started'].map((faq, index) => (
              <div key={index} className="border-b border-black/10 last:border-0">
                <button
                  onClick={() => toggleFaq('getting-started', index)}
                  className="w-full flex justify-between items-center py-3.5 md:py-4.5 bg-transparent border-none text-[var(--color-text-primary)] text-base font-medium cursor-pointer text-left font-inherit transition-colors duration-200 outline-none hover:text-[#58a6ff]"
                >
                  <span>{faq.question}</span>
                  <span className="text-xl md:text-2xl text-[#58a6ff] ml-4 flex-shrink-0">{expandedItems[`getting-started-${index}`] ? '−' : '+'}</span>
                </button>
                {expandedItems[`getting-started-${index}`] && (
                  <div className="pb-4 md:pb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Account & Profile */}
        <section id="account" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-4 border-b-2 border-[#58a6ff]/20">Account & Profile</h2>
            {filteredFaqs['account'] && filteredFaqs['account'].map((faq, index) => (
              <div key={index} className="border-b border-black/10 last:border-0">
                <button
                  onClick={() => toggleFaq('account', index)}
                  className="w-full flex justify-between items-center py-3.5 md:py-4.5 bg-transparent border-none text-[var(--color-text-primary)] text-base font-medium cursor-pointer text-left font-inherit transition-colors duration-200 outline-none hover:text-[#58a6ff]"
                >
                  <span>{faq.question}</span>
                  <span className="text-xl md:text-2xl text-[#58a6ff] ml-4 flex-shrink-0">{expandedItems[`account-${index}`] ? '−' : '+'}</span>
                </button>
                {expandedItems[`account-${index}`] && (
                  <div className="pb-4 md:pb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Communities & Posts */}
        <section id="communities" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-4 border-b-2 border-[#58a6ff]/20">Communities & Posts</h2>
            {filteredFaqs['communities'] && filteredFaqs['communities'].map((faq, index) => (
              <div key={index} className="border-b border-black/10 last:border-0">
                <button
                  onClick={() => toggleFaq('communities', index)}
                  className="w-full flex justify-between items-center py-3.5 md:py-4.5 bg-transparent border-none text-[var(--color-text-primary)] text-base font-medium cursor-pointer text-left font-inherit transition-colors duration-200 outline-none hover:text-[#58a6ff]"
                >
                  <span>{faq.question}</span>
                  <span className="text-xl md:text-2xl text-[#58a6ff] ml-4 flex-shrink-0">{expandedItems[`communities-${index}`] ? '−' : '+'}</span>
                </button>
                {expandedItems[`communities-${index}`] && (
                  <div className="pb-4 md:pb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Messaging */}
        <section id="messaging" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-4 border-b-2 border-[#58a6ff]/20">Messaging</h2>
            {filteredFaqs['messaging'] && filteredFaqs['messaging'].map((faq, index) => (
              <div key={index} className="border-b border-black/10 last:border-0">
                <button
                  onClick={() => toggleFaq('messaging', index)}
                  className="w-full flex justify-between items-center py-3.5 md:py-4.5 bg-transparent border-none text-[var(--color-text-primary)] text-base font-medium cursor-pointer text-left font-inherit transition-colors duration-200 outline-none hover:text-[#58a6ff]"
                >
                  <span>{faq.question}</span>
                  <span className="text-xl md:text-2xl text-[#58a6ff] ml-4 flex-shrink-0">{expandedItems[`messaging-${index}`] ? '−' : '+'}</span>
                </button>
                {expandedItems[`messaging-${index}`] && (
                  <div className="pb-4 md:pb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Web3/Crypto */}
        <section id="web3" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-4 border-b-2 border-[#58a6ff]/20">Web3/Crypto</h2>
            {filteredFaqs['web3'] && filteredFaqs['web3'].map((faq, index) => (
              <div key={index} className="border-b border-black/10 last:border-0">
                <button
                  onClick={() => toggleFaq('web3', index)}
                  className="w-full flex justify-between items-center py-3.5 md:py-4.5 bg-transparent border-none text-[var(--color-text-primary)] text-base font-medium cursor-pointer text-left font-inherit transition-colors duration-200 outline-none hover:text-[#58a6ff]"
                >
                  <span>{faq.question}</span>
                  <span className="text-xl md:text-2xl text-[#58a6ff] ml-4 flex-shrink-0">{expandedItems[`web3-${index}`] ? '−' : '+'}</span>
                </button>
                {expandedItems[`web3-${index}`] && (
                  <div className="pb-4 md:pb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Troubleshooting */}
        <section id="troubleshooting" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-4 border-b-2 border-[#58a6ff]/20">Troubleshooting</h2>
            {filteredFaqs['troubleshooting'] && filteredFaqs['troubleshooting'].map((faq, index) => (
              <div key={index} className="border-b border-black/10 last:border-0">
                <button
                  onClick={() => toggleFaq('troubleshooting', index)}
                  className="w-full flex justify-between items-center py-3.5 md:py-4.5 bg-transparent border-none text-[var(--color-text-primary)] text-base font-medium cursor-pointer text-left font-inherit transition-colors duration-200 outline-none hover:text-[#58a6ff]"
                >
                  <span>{faq.question}</span>
                  <span className="text-xl md:text-2xl text-[#58a6ff] ml-4 flex-shrink-0">{expandedItems[`troubleshooting-${index}`] ? '−' : '+'}</span>
                </button>
                {expandedItems[`troubleshooting-${index}`] && (
                  <div className="pb-4 md:pb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section id="contact" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-4 border-b-2 border-[#58a6ff]/20">Contact Support</h2>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="p-6 bg-[#58a6ff]/5 border border-[#58a6ff]/20 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Email Support</h3>
                <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-2">support@cryb.com</p>
                <p className="text-sm text-[var(--color-text-secondary)]">Response within 24 hours</p>
              </div>
              <div className="p-6 bg-[#58a6ff]/5 border border-[#58a6ff]/20 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Community Forum</h3>
                <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-2">Join our community discussions</p>
                <Link to="/communities" className="inline-block mt-2 text-[#58a6ff] no-underline text-sm font-medium transition-colors duration-200 hover:text-[#1a6bc0]">Visit Forum</Link>
              </div>
              <div className="p-6 bg-[#58a6ff]/5 border border-[#58a6ff]/20 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Report a Bug</h3>
                <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-2">Help us improve Cryb.ai</p>
                <a href="mailto:bugs@cryb.com" className="inline-block mt-2 text-[#58a6ff] no-underline text-sm font-medium transition-colors duration-200 hover:text-[#1a6bc0]">Report Issue</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HelpPage
