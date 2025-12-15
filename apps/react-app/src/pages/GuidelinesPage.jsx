import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function GuidelinesPage() {
  const [activeSection, setActiveSection] = useState('')

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'respectful', title: 'Be Respectful' },
    { id: 'safe', title: 'Stay Safe' },
    { id: 'quality', title: 'Quality Content' },
    { id: 'privacy', title: 'Privacy & Security' },
    { id: 'enforcement', title: 'Enforcement Actions' },
    { id: 'reporting', title: 'Reporting Violations' },
    { id: 'appeals', title: 'Appeals Process' }
  ]

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

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] relative">
      {/* Sidebar Table of Contents */}
      <aside className="hidden md:block w-[280px] sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto p-10 px-6 border-r border-black/10">
        <div className="sticky top-6">
          <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-6">Guidelines</h2>
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`bg-transparent border-none text-sm p-1 px-2 text-left cursor-pointer rounded-md transition-all duration-200 font-inherit outline-none ${
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
      <main className="flex-1 max-w-3xl mx-auto px-3 py-6 pb-12 md:px-6 md:py-10 md:pb-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-2 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
            Community Guidelines
          </h1>
          <p className="text-sm text-[var(--color-text-tertiary)]">Last updated: November 8, 2025</p>
        </div>

        <section id="introduction" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Introduction</h2>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Welcome to the Cryb.ai community! Our platform is built on the principles of respect, safety, and meaningful engagement. These Community Guidelines outline the standards of behavior we expect from all users to create a positive and inclusive environment.
            </p>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              By using Cryb.ai, you agree to follow these guidelines. Violations may result in content removal, account suspension, or permanent ban. We encourage all community members to help maintain these standards by reporting violations and treating each other with respect.
            </p>
            <div className="mt-6 p-6 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-lg border-l-4 border-l-[#58a6ff]">
              <p className="text-base leading-relaxed text-[#58a6ff] m-0 font-medium">
                Our mission is to build a community where everyone feels welcome to express themselves, connect with others, and engage in meaningful discussions.
              </p>
            </div>
          </div>
        </section>

        <section id="respectful" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Be Respectful</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Treat Others with Kindness</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Respect is the foundation of our community. Treat all members with kindness, empathy, and understanding, regardless of their background, beliefs, opinions, or identity.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">No Harassment or Bullying</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">The following behaviors are strictly prohibited:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Personal attacks, insults, or degrading language</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Harassment, stalking, or intimidation</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Bullying, trolling, or deliberately antagonizing others</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Doxxing or sharing personal information without consent</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Threats of violence or harm</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Sexual harassment or unwanted advances</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">No Hate Speech or Discrimination</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              We have zero tolerance for hate speech, discrimination, or content that promotes violence against individuals or groups based on:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Race, ethnicity, or national origin</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Religion or religious beliefs</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Gender identity or sexual orientation</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Disability or medical condition</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Age or veteran status</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Constructive Disagreement</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Disagreements are natural and can lead to productive discussions. When disagreeing:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Focus on ideas, not individuals</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Use respectful language and tone</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Listen to different perspectives</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Provide constructive feedback</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Know when to disengage from unproductive conversations</li>
            </ul>
          </div>
        </section>

        <section id="safe" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Stay Safe</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">No Illegal Content</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">Do not post, share, or promote content that:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Violates local, national, or international laws</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Promotes illegal activities or services</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Involves child exploitation or abuse</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Distributes drugs, weapons, or other illegal items</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Involves fraud, scams, or financial crimes</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">No Violent or Graphic Content</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">Content depicting or promoting violence, gore, or self-harm is prohibited, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Graphic violence or death</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Self-harm or suicide</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Animal abuse or cruelty</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Terrorism or extremist content</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">No Adult or Explicit Content</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Cryb.ai is intended for users 13 and older. Sexually explicit content, pornography, or content that sexualizes minors is strictly forbidden.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Protect Your Safety</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">For your own protection:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Do not share personal information (address, phone number, financial details)</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Be cautious about meeting people from the platform in person</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Report suspicious behavior or accounts</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Use strong passwords and enable two-factor authentication</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Be aware of phishing attempts and scams</li>
            </ul>
          </div>
        </section>

        <section id="quality" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Quality Content</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">No Spam</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">Spam degrades the community experience. Prohibited spam includes:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Repetitive, unsolicited, or irrelevant posts</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Excessive self-promotion or advertising</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Mass messaging or comment spam</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Misleading links or clickbait</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Vote manipulation or engagement bait</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Stay On Topic</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Post content relevant to the community or channel you're in. Off-topic posts may be removed, especially if they disrupt ongoing discussions or violate community-specific rules.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">No Misinformation</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Do not deliberately spread false or misleading information, especially regarding:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Health and medical advice</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Elections and voting</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Emergencies and public safety</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Financial advice or investment schemes</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Cryptocurrency scams or pump-and-dump schemes</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Original and Authentic Content</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Share original content or properly attribute others' work. Do not:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Plagiarize or steal content</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Post copyrighted material without permission</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Impersonate others or create fake accounts</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Manipulate media to deceive (deepfakes without disclosure)</li>
            </ul>
          </div>
        </section>

        <section id="privacy" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Privacy & Security</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Respect Privacy</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Privacy is a fundamental right. You must not:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Share others' personal information without explicit consent</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Post private messages or conversations publicly</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Access accounts or data without authorization</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Track or monitor users without their knowledge</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Crypto and Web3 Security</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              When engaging with Web3 features:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Never share your private keys or seed phrases</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Verify wallet addresses before transactions</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Be cautious of phishing attempts</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Do not promote scams or rug pulls</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Report suspicious NFT or token projects</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Account Security</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Protect your account by:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Using a strong, unique password</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Enabling two-factor authentication</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Not sharing your account with others</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Logging out on shared devices</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Reporting unauthorized access immediately</li>
            </ul>
          </div>
        </section>

        <section id="enforcement" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Enforcement Actions</h2>

            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              When guidelines are violated, we take appropriate action based on the severity and frequency of violations. Our enforcement approach is fair, consistent, and transparent.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Warning</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              For minor or first-time violations, we may issue a warning explaining the violation and expected behavior. Warnings are educational opportunities to help users understand our guidelines.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Content Removal</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Content that violates our guidelines will be removed. You will receive a notification explaining which guideline was violated and why the content was removed.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Temporary Suspension</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Repeated violations or serious infractions may result in temporary account suspension (1-30 days). During suspension, you cannot post, comment, or interact with the platform.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Permanent Ban</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Severe violations or continued pattern of abuse may result in permanent account termination. Banned users may not create new accounts.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Immediate Removal</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Certain violations result in immediate permanent ban without warning:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Child exploitation or abuse</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Credible threats of violence</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Terrorism or violent extremism</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Doxxing with malicious intent</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Operating a bot network or spam operation</li>
            </ul>
          </div>
        </section>

        <section id="reporting" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Reporting Violations</h2>

            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Help us maintain a safe community by reporting content or behavior that violates these guidelines.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">How to Report</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              To report a violation:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Click the three dots menu on any post or comment</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Select "Report"</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Choose the violation category</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Provide additional details if needed</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Submit your report</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">What Happens After Reporting</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Once you submit a report:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Our moderation team reviews it within 24 hours</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">We investigate based on context and guidelines</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Appropriate action is taken if violation is confirmed</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">You receive a notification about the outcome</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Your report remains confidential</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Emergency Situations</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              If you encounter content involving:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Immediate danger to life or safety</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Child exploitation</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Terrorism or violent threats</li>
            </ul>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Contact law enforcement immediately, then report to us at emergency@cryb.com.
            </p>
          </div>
        </section>

        <section id="appeals" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60  border border-black/10 rounded-xl p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Appeals Process</h2>

            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              If you believe your content was removed or your account was suspended in error, you can appeal the decision.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">How to Appeal</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              To submit an appeal:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Go to the enforcement notification email or message</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Click "Appeal this decision"</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Provide a clear explanation of why you believe the action was incorrect</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Include any relevant context or evidence</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Submit your appeal within 30 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Appeal Review</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Our appeals team will:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Review your appeal within 5-7 business days</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Re-examine the content and context</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Make an independent determination</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Notify you of the final decision</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Appeal Outcomes</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">Possible outcomes include:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Uphold: Original decision stands</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Reverse: Content restored or account reinstated</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Modify: Enforcement action adjusted</li>
            </ul>

            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Appeal decisions are final. Multiple frivolous appeals may result in additional enforcement action.
            </p>
          </div>
        </section>

        <div className="mt-12">
          <div className="bg-white  rounded-xl p-6 md:p-8 shadow-sm" style={{ border: '1px solid var(--border-subtle)' }}>
            <h3 className="text-xl font-semibold mt-6 mb-2" style={{ color: 'var(--text-primary)' }}>Questions or Concerns?</h3>
            <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
              If you have questions about these Community Guidelines or need clarification, please contact us:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>Email: guidelines@cryb.com</li>
              <li className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>Help Center: <Link to="/help" className="text-[#58a6ff] no-underline transition-colors duration-200 hover:text-[#1a6bc0]">Visit Help Center</Link></li>
              <li className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>Terms of Service: <Link to="/terms" className="text-[#58a6ff] no-underline transition-colors duration-200 hover:text-[#1a6bc0]">Read our Terms</Link></li>
            </ul>
            <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
              Thank you for helping make Cryb.ai a welcoming and positive community for everyone!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default GuidelinesPage
