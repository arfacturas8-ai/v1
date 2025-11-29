import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('')

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'data-collection', title: 'Data Collection' },
    { id: 'data-usage', title: 'How We Use Your Data' },
    { id: 'data-sharing', title: 'Data Sharing' },
    { id: 'your-rights', title: 'Your Rights' },
    { id: 'cookies', title: 'Cookies & Tracking' },
    { id: 'international', title: 'International Transfers' },
    { id: 'children', title: "Children's Privacy" },
    { id: 'security', title: 'Data Security' },
    { id: 'changes', title: 'Changes to This Policy' },
    { id: 'contact', title: 'Contact Us' }
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
    <div className="flex min-h-screen bg-[#0d1117] text-[#c9d1d9] relative">
      {/* Sidebar Table of Contents */}
      <aside className="hidden md:block w-[280px] sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto p-10 px-5 border-r border-white/10">
        <div className="sticky top-5">
          <h2 className="text-xs font-semibold text-[#8b949e] uppercase tracking-wide mb-5">Contents</h2>
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`bg-transparent border-none text-sm p-2 px-3 text-left cursor-pointer rounded-md transition-all duration-200 font-inherit outline-none ${
                  activeSection === section.id
                    ? 'text-[#58a6ff] bg-[#58a6ff]/10 font-medium border-l-2 border-[#58a6ff] pl-2.5'
                    : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]/60 backdrop-blur-xl'
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
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#8b949e]">Last updated: November 8, 2025</p>
        </div>

        <section id="introduction" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">Introduction</h2>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              Welcome to Cryb.ai. We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
            </p>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              By accessing or using Cryb.ai, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.
            </p>
          </div>
        </section>

        <section id="data-collection" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">Data Collection</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Information You Provide</h3>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">We collect information that you voluntarily provide to us when you:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[#c9d1d9]">Register for an account</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Create or modify your profile</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Post content, comments, or messages</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Join or create communities</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Connect your crypto wallet</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Contact our support team</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Automatically Collected Information</h3>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">When you access our services, we automatically collect certain information, including:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[#c9d1d9]">Device information (IP address, browser type, operating system)</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Usage data (pages visited, time spent, features used)</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Location data (with your permission)</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Blockchain Data</h3>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              When you connect a crypto wallet or engage in blockchain transactions, we may collect your wallet address and associated transaction data. Please note that blockchain transactions are publicly visible and permanent.
            </p>
          </div>
        </section>

        <section id="data-usage" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">How We Use Your Data</h2>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[#c9d1d9]">Provide, maintain, and improve our services</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Personalize your experience and content recommendations</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Process transactions and send related information</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Send you technical notices, updates, and security alerts</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Respond to your comments, questions, and support requests</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Monitor and analyze trends, usage, and activities</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Detect, prevent, and address technical issues and abuse</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Comply with legal obligations and enforce our terms</li>
            </ul>
          </div>
        </section>

        <section id="data-sharing" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">Data Sharing</h2>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">When We Share Your Information</h3>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">We may share your information in the following circumstances:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>With your consent:</strong> We may share your information when you give us permission</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Service providers:</strong> We share data with third-party vendors who help us operate our platform</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Business transfers:</strong> In connection with any merger, sale, or acquisition</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Legal requirements:</strong> To comply with laws, regulations, or legal processes</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Protection and safety:</strong> To protect the rights, property, and safety of Cryb.ai and our users</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Public Information</h3>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              Your profile information, posts, comments, and community participation are generally public and visible to other users. Blockchain transactions are also publicly visible on the blockchain.
            </p>
          </div>
        </section>

        <section id="your-rights" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">Your Rights</h2>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Access:</strong> Request a copy of your personal data</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Portability:</strong> Receive your data in a structured, commonly used format</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Objection:</strong> Object to certain processing of your data</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Withdrawal:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              To exercise these rights, please contact us at privacy@cryb.com. Note that some data may be retained as required by law or for legitimate business purposes.
            </p>
          </div>
        </section>

        <section id="cookies" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">Cookies & Tracking Technologies</h2>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>

            <h3 className="text-xl font-semibold text-white mt-6 mb-3">Types of Cookies We Use</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Essential cookies:</strong> Required for the platform to function properly</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Analytics cookies:</strong> Help us understand how users interact with our service</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Preference cookies:</strong> Remember your settings and preferences</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]"><strong>Marketing cookies:</strong> Track visitors across websites to display relevant ads</li>
            </ul>
          </div>
        </section>

        <section id="international" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">International Data Transfers</h2>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where data protection laws may differ.
            </p>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              We take appropriate safeguards to ensure that your personal data remains protected in accordance with this Privacy Policy. If you are located in the European Economic Area (EEA), we comply with GDPR requirements for international data transfers.
            </p>
          </div>
        </section>

        <section id="children" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">Children's Privacy</h2>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              Our service is not intended for users under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal data, please contact us.
            </p>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              If we become aware that we have collected personal data from children without verification of parental consent, we take steps to remove that information from our servers.
            </p>
          </div>
        </section>

        <section id="security" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">Data Security</h2>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[#c9d1d9]">Encryption of data in transit and at rest</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Regular security assessments and audits</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Access controls and authentication mechanisms</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Employee training on data protection</li>
            </ul>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee its absolute security.
            </p>
          </div>
        </section>

        <section id="changes" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">Changes to This Privacy Policy</h2>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this policy.
            </p>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              We will notify you via email and/or a prominent notice on our service prior to the change becoming effective. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </div>
        </section>

        <section id="contact" className="mb-6">
          <div className="bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h2 className="text-2xl font-semibold text-white mb-4 pb-3 border-b-2 border-[#58a6ff]/20">Contact Us</h2>
            <p className="text-base leading-relaxed text-[#c9d1d9] mb-4">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li className="text-base leading-relaxed text-[#c9d1d9]">Email: privacy@cryb.com</li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Support: <Link to="/help" className="text-[#58a6ff] no-underline transition-colors duration-200 hover:text-[#4a8fd7]">Visit our Help Center</Link></li>
              <li className="text-base leading-relaxed text-[#c9d1d9]">Address: Cryb.ai Platform, Inc.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PrivacyPage
