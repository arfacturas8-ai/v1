import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function TermsPage() {
  const [activeSection, setActiveSection] = useState('')

  const sections = [
    { id: 'acceptance', title: 'Acceptance of Terms' },
    { id: 'accounts', title: 'User Accounts' },
    { id: 'user-content', title: 'User Content' },
    { id: 'prohibited', title: 'Prohibited Conduct' },
    { id: 'intellectual-property', title: 'Intellectual Property' },
    { id: 'termination', title: 'Termination' },
    { id: 'disclaimers', title: 'Disclaimers' },
    { id: 'liability', title: 'Limitation of Liability' },
    { id: 'dispute', title: 'Dispute Resolution' },
    { id: 'general', title: 'General Provisions' },
    { id: 'contact', title: 'Contact Information' }
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
      <aside className="hidden md:block w-[280px] sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto p-10 px-5 border-r border-black/10">
        <div className="sticky top-5">
          <h2 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-4">Contents</h2>
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`bg-transparent border-none text-sm p-2 px-3 text-left cursor-pointer rounded-md transition-all duration-200 font-inherit outline-none ${
                  activeSection === section.id
                    ? 'text-[#58a6ff] bg-[#58a6ff]/10 font-medium border-l-2 border-[#58a6ff] pl-2.5'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/60 backdrop-blur-xl'
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
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-3 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-sm text-[var(--color-text-tertiary)]">Last updated: November 8, 2025</p>
        </div>

        <section id="acceptance" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">Acceptance of Terms</h2>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Welcome to Cryb.ai. These Terms of Service ("Terms") govern your access to and use of our platform, services, and products. By accessing or using Cryb.ai, you agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              If you do not agree to these Terms, you may not access or use our services. We reserve the right to update these Terms at any time. Continued use of our services after changes constitutes acceptance of the modified Terms.
            </p>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              You must be at least 13 years old to use Cryb.ai. If you are under 18, you represent that you have your parent's or guardian's permission to use our services.
            </p>
          </div>
        </section>

        <section id="accounts" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">User Accounts</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Account Creation</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              To access certain features of Cryb.ai, you must create an account. When creating an account, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Provide accurate, current, and complete information</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Maintain and update your information to keep it accurate</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Maintain the security of your account credentials</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Accept responsibility for all activities under your account</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Notify us immediately of any unauthorized access or security breach</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Account Security</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. We are not liable for any loss or damage arising from your failure to protect your account credentials.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">One Account Per User</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Each user may maintain only one account. Creating multiple accounts may result in suspension or termination of all your accounts.
            </p>
          </div>
        </section>

        <section id="user-content" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">User Content</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Your Content</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Cryb.ai allows you to post, upload, and share content including text, images, videos, and other materials ("User Content"). You retain all ownership rights to your User Content.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">License to Cryb.ai</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              By posting User Content, you grant Cryb.ai a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, publish, and distribute your content in connection with operating and providing our services.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Content Responsibility</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">You are solely responsible for your User Content and represent that you:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Own or have the necessary rights to post the content</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Have obtained all required permissions and consents</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Your content does not violate any laws or third-party rights</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Your content complies with these Terms and our Community Guidelines</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Content Removal</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              We reserve the right to remove any User Content that violates these Terms, our Community Guidelines, or applicable laws, without prior notice. We do not endorse any User Content and are not responsible for its accuracy or reliability.
            </p>
          </div>
        </section>

        <section id="prohibited" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">Prohibited Conduct</h2>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">You agree not to engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Violating any applicable laws or regulations</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Infringing on intellectual property rights of others</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Posting false, misleading, or deceptive content</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Harassing, bullying, or threatening other users</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Posting spam, advertisements, or promotional content without permission</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Distributing malware, viruses, or harmful code</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Attempting to gain unauthorized access to our systems</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Impersonating others or misrepresenting your affiliation</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Collecting or harvesting data from our platform without permission</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Interfering with or disrupting our services</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Using automated systems or bots without authorization</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Engaging in market manipulation or fraudulent activities</li>
            </ul>
          </div>
        </section>

        <section id="intellectual-property" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">Intellectual Property Rights</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Cryb.ai's Intellectual Property</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              The Cryb.ai platform, including its design, features, graphics, and content (excluding User Content), is owned by Cryb.ai and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Trademarks</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Cryb.ai, our logo, and any other product or service names are trademarks of Cryb.ai. You may not use these trademarks without our prior written consent.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Copyright Infringement</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              We respect intellectual property rights and expect our users to do the same. If you believe your work has been copied in a way that constitutes copyright infringement, please contact us at legal@cryb.com with:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Description of the copyrighted work</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Location of the infringing material</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Your contact information</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">A statement of good faith belief</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">A statement under penalty of perjury that the information is accurate</li>
            </ul>
          </div>
        </section>

        <section id="termination" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">Termination</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Termination by You</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              You may terminate your account at any time by accessing your account settings or contacting our support team. Upon termination, your right to access and use our services will immediately cease.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Termination by Cryb.ai</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              We reserve the right to suspend or terminate your account and access to our services at any time, with or without notice, for any reason, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Violation of these Terms or our Community Guidelines</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Fraudulent, abusive, or illegal activity</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Extended periods of inactivity</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Requests by law enforcement or government agencies</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Effect of Termination</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Upon termination, all licenses and rights granted to you will immediately terminate. We may delete your account and User Content, though some information may be retained as required by law or legitimate business purposes.
            </p>
          </div>
        </section>

        <section id="disclaimers" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">Disclaimers</h2>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              <strong>THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</strong> To the fullest extent permitted by law, Cryb.ai disclaims all warranties, including but not limited to:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Merchantability and fitness for a particular purpose</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Non-infringement of third-party rights</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Accuracy, reliability, or completeness of content</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Uninterrupted or error-free service</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Security of data transmission</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Crypto and Blockchain Disclaimers</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Cryptocurrency and blockchain transactions involve significant risk. Cryb.ai does not provide financial, investment, or legal advice. You are solely responsible for evaluating the risks and merits of any transactions. Blockchain transactions are irreversible, and we cannot recover lost or stolen crypto assets.
            </p>
          </div>
        </section>

        <section id="liability" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">Limitation of Liability</h2>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, Cryb.ai SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Our total liability to you for any claims arising from or related to these Terms or our services shall not exceed the greater of (a) the amount you paid us in the 12 months prior to the claim, or (b) $100.
            </p>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
            </p>
          </div>
        </section>

        <section id="dispute" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Informal Resolution</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Before filing a claim, you agree to try to resolve the dispute informally by contacting legal@cryb.com. We will attempt to resolve the dispute informally within 60 days.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Arbitration</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Any dispute arising from or relating to these Terms or our services will be resolved through binding arbitration, rather than in court, except that you may assert claims in small claims court if they qualify.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Class Action Waiver</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              You agree that disputes will be resolved on an individual basis and waive your right to participate in class actions, class arbitrations, or representative actions.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Governing Law</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Cryb.ai is headquartered, without regard to its conflict of law provisions.
            </p>
          </div>
        </section>

        <section id="general" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">General Provisions</h2>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Changes to Terms</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              We may modify these Terms at any time. We will notify you of material changes via email or through our platform. Your continued use of our services after changes constitutes acceptance of the modified Terms.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Severability</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Entire Agreement</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              These Terms, together with our Privacy Policy and Community Guidelines, constitute the entire agreement between you and Cryb.ai regarding our services.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">No Waiver</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right or provision.
            </p>

            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mt-6 mb-2">Assignment</h3>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              You may not assign or transfer these Terms or your account without our prior written consent. We may assign our rights and obligations without restriction.
            </p>
          </div>
        </section>

        <section id="contact" className="mb-6">
          <div className="bg-[var(--color-bg-secondary)]/60 backdrop-blur-xl border border-black/10 rounded-xl p-5 md:p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-4 pb-2 border-b-2 border-[#58a6ff]/20">Contact Information</h2>
            <p className="text-base leading-relaxed text-[var(--color-text-primary)] mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Email: legal@cryb.com</li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Support: <Link to="/help" className="text-[#58a6ff] no-underline transition-colors duration-200 hover:text-[#4a8fd7]">Visit our Help Center</Link></li>
              <li className="text-base leading-relaxed text-[var(--color-text-primary)]">Address: Cryb.ai Platform, Inc.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

export default TermsPage
