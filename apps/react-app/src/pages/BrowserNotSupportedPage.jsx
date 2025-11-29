import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

const BrowserNotSupportedPage = () => {
  return (
    <div
      role="main"
      aria-label="Browser not supported page"
      className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        role="alert"
        aria-live="polite"
        className="text-center max-w-2xl w-full"
      >
        <div className="w-24 h-24 md:w-30 md:h-30 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-amber-500" aria-hidden="true" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Browser Not Supported
        </h1>
        <p className="text-[#8b949e] text-sm md:text-base mb-8 leading-relaxed">
          Your browser is outdated. Please upgrade to a modern browser for the best experience.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://www.google.com/chrome/"
            aria-label="Download Chrome browser"
            className="p-6 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] no-underline transition-all hover:border-white/10"
          >
            <div aria-hidden="true" className="text-5xl mb-3">🌐</div>
            <div className="font-semibold text-white">Chrome</div>
          </a>
          <a
            href="https://www.mozilla.org/firefox/"
            aria-label="Download Firefox browser"
            className="p-6 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] no-underline transition-all hover:border-white/10"
          >
            <div aria-hidden="true" className="text-5xl mb-3">🦊</div>
            <div className="font-semibold text-white">Firefox</div>
          </a>
          <a
            href="https://www.apple.com/safari/"
            aria-label="Download Safari browser"
            className="p-6 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] no-underline transition-all hover:border-white/10"
          >
            <div aria-hidden="true" className="text-5xl mb-3">🧭</div>
            <div className="font-semibold text-white">Safari</div>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default memo(BrowserNotSupportedPage)

