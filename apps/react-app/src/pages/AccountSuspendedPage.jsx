import React, { memo } from 'react'
import { Ban, Mail, FileText } from 'lucide-react'

const AccountSuspendedPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-5 md:p-10" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }} role="main" aria-label="Account suspended page">
      <div className="max-w-2xl w-full bg-white border rounded-xl p-8 md:p-12 shadow-lg text-center" style={{ borderColor: 'var(--border-subtle)' }} role="alert" aria-live="polite">
        <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-red-500/10 rounded-full mb-6">
          <Ban className="w-10 h-10 md:w-12 md:h-12 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Account Suspended</h1>
        <p className="text-sm md:text-base mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Your account has been suspended due to violation of our community guidelines.
        </p>

        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-8 text-left">
          <h3 className="text-sm font-semibold text-red-500 mb-2">Reason for suspension:</h3>
          <p className="text-sm m-0" style={{ color: 'var(--text-secondary)' }}>Multiple reports of spam and inappropriate content.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button style={{color: "var(--text-primary)"}} className="flex-1 min-w-[140px] px-6 py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] border-0 rounded-lg  text-base font-medium cursor-pointer transition-all hover:opacity-90 flex items-center justify-center gap-2" aria-label="Contact support about suspension">
            <Mail className="w-5 h-5" aria-hidden="true" />
            Contact Support
          </button>
          <button className="flex-1 min-w-[140px] px-6 py-3 bg-white border rounded-lg text-base font-medium cursor-pointer transition-all flex items-center justify-center gap-2" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }} aria-label="Appeal account suspension">
            <FileText className="w-5 h-5" aria-hidden="true" />
            Appeal Suspension
          </button>
        </div>
      </div>
    </div>
  )
}

export default memo(AccountSuspendedPage)

