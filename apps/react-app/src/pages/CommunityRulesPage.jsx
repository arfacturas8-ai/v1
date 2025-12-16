import React, { memo, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, AlertTriangle, ChevronLeft, CheckCircle } from 'lucide-react'

const CommunityRulesPage = () => {
  const { communityName } = useParams()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching rules
    setTimeout(() => {
      setRules([
        { id: 1, title: 'Be respectful and civil', description: 'Treat all members with respect. No harassment, hate speech, or personal attacks.' },
        { id: 2, title: 'No spam or self-promotion', description: 'Do not post spam, excessive self-promotion, or irrelevant content.' },
        { id: 3, title: 'Use appropriate content', description: 'All posts must be appropriate for the community. NSFW content must be tagged.' },
        { id: 4, title: 'Search before posting', description: 'Check if your question or topic has already been discussed.' },
        { id: 5, title: 'Follow content guidelines', description: 'Adhere to the platform-wide content policy and community-specific guidelines.' }
      ])
      setLoading(false)
    }, 500)
  }, [communityName])

  return (
    <div className="min-h-screen py-6 px-4 sm:py-10 sm:px-5" role="main" aria-label="Community rules page" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-3xl mx-auto">
        <Link
          to={`/community/${communityName}`}
          className="inline-flex items-center gap-1 no-underline text-xs sm:text-sm mb-4 sm:mb-6 transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronLeft size={20} />
          Back to c/{communityName}
        </Link>

        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Shield size={32} className="text-[#58a6ff]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent mb-2">
            Community Rules
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>c/{communityName}</p>
        </div>

        <div className=" rounded-2xl p-5 sm:p-6 mb-4 sm:mb-6" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-subtle)' }}>
          {loading ? (
            <div className="text-center py-8 sm:py-10" style={{ color: 'var(--text-secondary)' }}>Loading rules...</div>
          ) : (
            <div className="flex flex-col gap-4 sm:gap-5">
              {rules.map((rule, index) => (
                <div key={rule.id} className="flex gap-3 sm:gap-4">
                  <div style={{width: "48px", height: "48px", flexShrink: 0, color: 'var(--text-inverse)'}}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{rule.title}</h3>
                    <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{rule.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex gap-2 sm:gap-3 mb-4 sm:mb-6" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <AlertTriangle size={20} className="text-amber-500 flex-shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-amber-500 mb-1 sm:mb-2">Violations may result in</h4>
            <ul className="m-0 pl-4 sm:pl-5 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              <li>Post removal</li>
              <li>Temporary or permanent ban</li>
              <li>Account suspension</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
          <CheckCircle size={16} className="text-emerald-500" />
          <span>By participating, you agree to follow these rules</span>
        </div>
      </div>
    </div>
  )
}

export default memo(CommunityRulesPage)

