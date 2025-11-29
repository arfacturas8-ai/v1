import React, { memo } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

const NetworkOfflinePage = () => {
  return (
    <div
      role="main"
      aria-label="Network offline page"
      className="min-h-screen flex items-center justify-center p-6 bg-[#0d1117]"
    >
      <div className="text-center max-w-lg w-full text-white">
        <div className="w-24 h-24 md:w-30 md:h-30 bg-[#8b949e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-12 h-12 md:w-16 md:h-16 text-[#8b949e]" aria-hidden="true" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">
          No Internet Connection
        </h1>
        <p className="text-sm md:text-base text-[#8b949e] mb-8 leading-relaxed">
          Please check your network connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white border-0 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-base font-semibold cursor-pointer transition-opacity hover:opacity-90"
          aria-label="Reload page"
        >
          <RefreshCw className="w-5 h-5" aria-hidden="true" />
          Try Again
        </button>
      </div>
    </div>
  )
}

export default memo(NetworkOfflinePage)

