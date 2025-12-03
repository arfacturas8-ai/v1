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
    <div className="flex min-h-screen bg-[#0D0D0D] text-[#A0A0A0] relative">
      {/* Sidebar Table of Contents */}
      <aside className="hidden md:block w-[280px] sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto p-10 px-6 border-r border-white/10">
        <div className="sticky top-6">
          <h2 className="text-xs font-semibold text-[#666666] uppercase tracking-wide mb-6">Guidelines</h2>
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`bg-transparent border-none text-sm p-1 px-2 text-left cursor-pointer rounded-md transition-all duration-200 font-inherit outline-none ${
                  activeSection === section.id
                    ? 'text-[#58a6ff] bg-[#58a6ff]/10 font-medium border-l-2 border-[#58a6ff] pl-2.5'
                    : 'text-[#666666] hover:text-[#A0A0A0] hover:bg-[#141414]/60 backdrop-blur-xl'
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
            Community Guidelines
          </h1>
          <p className="text-sm text-[#666666]">Last updated: November 8, 2025</p>
        </div>

        <section id="introduction" className="mb-6">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Introduction</h2>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Welcome to the Cryb.ai community! Our platform is built on the principles of respect, safety, and meaningful engagement. These Community Guidelines outline the standards of behavior we expect from all users to create a positive and inclusive environment.
            </p>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
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
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Be Respectful</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Treat Others with Kindness</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Respect is the foundation of our community. Treat all members with kindness, empathy, and understanding, regardless of their background, beliefs, opinions, or identity.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">No Harassment or Bullying</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">The following behaviors are strictly prohibited:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Personal attacks, insults, or degrading language</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Harassment, stalking, or intimidation</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Bullying, trolling, or deliberately antagonizing others</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Doxxing or sharing personal information without consent</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Threats of violence or harm</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Sexual harassment or unwanted advances</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">No Hate Speech or Discrimination</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              We have zero tolerance for hate speech, discrimination, or content that promotes violence against individuals or groups based on:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Race, ethnicity, or national origin</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Religion or religious beliefs</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Gender identity or sexual orientation</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Disability or medical condition</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Age or veteran status</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Constructive Disagreement</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Disagreements are natural and can lead to productive discussions. When disagreeing:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Focus on ideas, not individuals</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Use respectful language and tone</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Listen to different perspectives</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Provide constructive feedback</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Know when to disengage from unproductive conversations</li>
            </ul>
          </div>
        </section>

        <section id="safe" className="mb-6">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Stay Safe</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">No Illegal Content</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">Do not post, share, or promote content that:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Violates local, national, or international laws</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Promotes illegal activities or services</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Involves child exploitation or abuse</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Distributes drugs, weapons, or other illegal items</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Involves fraud, scams, or financial crimes</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">No Violent or Graphic Content</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">Content depicting or promoting violence, gore, or self-harm is prohibited, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Graphic violence or death</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Self-harm or suicide</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Animal abuse or cruelty</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Terrorism or extremist content</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">No Adult or Explicit Content</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Cryb.ai is intended for users 13 and older. Sexually explicit content, pornography, or content that sexualizes minors is strictly forbidden.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Protect Your Safety</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">For your own protection:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Do not share personal information (address, phone number, financial details)</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Be cautious about meeting people from the platform in person</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Report suspicious behavior or accounts</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Use strong passwords and enable two-factor authentication</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Be aware of phishing attempts and scams</li>
            </ul>
          </div>
        </section>

        <section id="quality" className="mb-6">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Quality Content</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">No Spam</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">Spam degrades the community experience. Prohibited spam includes:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Repetitive, unsolicited, or irrelevant posts</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Excessive self-promotion or advertising</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Mass messaging or comment spam</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Misleading links or clickbait</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Vote manipulation or engagement bait</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Stay On Topic</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Post content relevant to the community or channel you're in. Off-topic posts may be removed, especially if they disrupt ongoing discussions or violate community-specific rules.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">No Misinformation</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Do not deliberately spread false or misleading information, especially regarding:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Health and medical advice</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Elections and voting</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Emergencies and public safety</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Financial advice or investment schemes</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Cryptocurrency scams or pump-and-dump schemes</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Original and Authentic Content</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Share original content or properly attribute others' work. Do not:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Plagiarize or steal content</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Post copyrighted material without permission</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Impersonate others or create fake accounts</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Manipulate media to deceive (deepfakes without disclosure)</li>
            </ul>
          </div>
        </section>

        <section id="privacy" className="mb-6">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Privacy & Security</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Respect Privacy</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Privacy is a fundamental right. You must not:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Share others' personal information without explicit consent</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Post private messages or conversations publicly</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Access accounts or data without authorization</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Track or monitor users without their knowledge</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Crypto and Web3 Security</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              When engaging with Web3 features:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Never share your private keys or seed phrases</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Verify wallet addresses before transactions</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Be cautious of phishing attempts</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Do not promote scams or rug pulls</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Report suspicious NFT or token projects</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Account Security</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Protect your account by:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Using a strong, unique password</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Enabling two-factor authentication</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Not sharing your account with others</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Logging out on shared devices</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Reporting unauthorized access immediately</li>
            </ul>
          </div>
        </section>

        <section id="enforcement" className="mb-6">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Enforcement Actions</h2>

            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              When guidelines are violated, we take appropriate action based on the severity and frequency of violations. Our enforcement approach is fair, consistent, and transparent.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Warning</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              For minor or first-time violations, we may issue a warning explaining the violation and expected behavior. Warnings are educational opportunities to help users understand our guidelines.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Content Removal</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Content that violates our guidelines will be removed. You will receive a notification explaining which guideline was violated and why the content was removed.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Temporary Suspension</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Repeated violations or serious infractions may result in temporary account suspension (1-30 days). During suspension, you cannot post, comment, or interact with the platform.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Permanent Ban</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Severe violations or continued pattern of abuse may result in permanent account termination. Banned users may not create new accounts.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Immediate Removal</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Certain violations result in immediate permanent ban without warning:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Child exploitation or abuse</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Credible threats of violence</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Terrorism or violent extremism</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Doxxing with malicious intent</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Operating a bot network or spam operation</li>
            </ul>
          </div>
        </section>

        <section id="reporting" className="mb-6">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Reporting Violations</h2>

            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Help us maintain a safe community by reporting content or behavior that violates these guidelines.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">How to Report</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              To report a violation:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Click the three dots menu on any post or comment</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Select "Report"</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Choose the violation category</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Provide additional details if needed</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Submit your report</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">What Happens After Reporting</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Once you submit a report:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Our moderation team reviews it within 24 hours</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">We investigate based on context and guidelines</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Appropriate action is taken if violation is confirmed</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">You receive a notification about the outcome</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Your report remains confidential</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Emergency Situations</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              If you encounter content involving:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Immediate danger to life or safety</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Child exploitation</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Terrorism or violent threats</li>
            </ul>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Contact law enforcement immediately, then report to us at emergency@cryb.com.
            </p>
          </div>
        </section>

        <section id="appeals" className="mb-6">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b-2 border-[#58a6ff]/20">Appeals Process</h2>

            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              If you believe your content was removed or your account was suspended in error, you can appeal the decision.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">How to Appeal</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              To submit an appeal:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Go to the enforcement notification email or message</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Click "Appeal this decision"</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Provide a clear explanation of why you believe the action was incorrect</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Include any relevant context or evidence</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Submit your appeal within 30 days</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Appeal Review</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Our appeals team will:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Review your appeal within 5-7 business days</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Re-examine the content and context</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Make an independent determination</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Notify you of the final decision</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Appeal Outcomes</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">Possible outcomes include:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Uphold: Original decision stands</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Reverse: Content restored or account reinstated</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Modify: Enforcement action adjusted</li>
            </ul>

            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Appeal decisions are final. Multiple frivolous appeals may result in additional enforcement action.
            </p>
          </div>
        </section>

        <div className="mt-12">
          <div className="bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Questions or Concerns?</h3>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              If you have questions about these Community Guidelines or need clarification, please contact us:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li className="text-base leading-relaxed text-[#A0A0A0]">Email: guidelines@cryb.com</li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Help Center: <Link to="/help" className="text-[#58a6ff] no-underline transition-colors duration-200 hover:text-[#1a6bc0]">Visit Help Center</Link></li>
              <li className="text-base leading-relaxed text-[#A0A0A0]">Terms of Service: <Link to="/terms" className="text-[#58a6ff] no-underline transition-colors duration-200 hover:text-[#1a6bc0]">Read our Terms</Link></li>
            </ul>
            <p className="text-base leading-relaxed text-[#A0A0A0] mb-4">
              Thank you for helping make Cryb.ai a welcoming and positive community for everyone!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default GuidelinesPage
