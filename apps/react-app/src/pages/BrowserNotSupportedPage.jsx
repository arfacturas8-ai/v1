import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

const BrowserNotSupportedPage = () => {
  return (
    <div
      role="main"
      aria-label="Browser not supported page"
      style={{background: "var(--bg-primary)"}} className="min-h-screen  flex items-center justify-center p-6"
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
        <h1 style={{color: "var(--text-primary)"}} className="text-2xl md:text-3xl font-bold  mb-4">
          Browser Not Supported
        </h1>
        <p style={{color: "var(--text-secondary)"}} className=" text-sm md:text-base mb-8 leading-relaxed">
          Your browser is outdated. Please upgrade to a modern browser for the best experience.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://www.google.com/chrome/"
            aria-label="Download Chrome browser"
            style={{borderColor: "var(--border-subtle)"}} className="card p-6   border border-white/10 rounded-2xl  no-underline transition-all hover:"
          >
            <div aria-hidden="true" className="text-5xl mb-3">🌐</div>
            <div style={{color: "var(--text-primary)"}} className="font-semibold ">Chrome</div>
          </a>
          <a
            href="https://www.mozilla.org/firefox/"
            aria-label="Download Firefox browser"
            style={{borderColor: "var(--border-subtle)"}} className="card p-6   border border-white/10 rounded-2xl  no-underline transition-all hover:"
          >
            <div aria-hidden="true" className="text-5xl mb-3">🦊</div>
            <div style={{color: "var(--text-primary)"}} className="font-semibold ">Firefox</div>
          </a>
          <a
            href="https://www.apple.com/safari/"
            aria-label="Download Safari browser"
            style={{borderColor: "var(--border-subtle)"}} className="card p-6   border border-white/10 rounded-2xl  no-underline transition-all hover:"
          >
            <div aria-hidden="true" className="text-5xl mb-3">🧭</div>
            <div style={{color: "var(--text-primary)"}} className="font-semibold ">Safari</div>
          </a>
        </div>
      </motion.div>
    </div>
  )
}

export default memo(BrowserNotSupportedPage)

