import React, { memo } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

const NetworkOfflinePage = () => {
  return (
    <div
      role="main"
      aria-label="Network offline page"
      style={{background: "var(--bg-primary)"}} className="min-h-screen flex items-center justify-center p-6 "
    >
      <div style={{color: "var(--text-primary)"}} className="text-center max-w-lg w-full ">
        <div className="w-24 h-24 md:w-30 md:h-30 bg-[#8b949e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff style={{ color: "var(--text-secondary)", width: "64px", height: "64px", flexShrink: 0 }} aria-hidden="true" />
        </div>
        <h1 style={{color: "var(--text-primary)"}} className="text-2xl md:text-3xl font-bold mb-4 ">
          No Internet Connection
        </h1>
        <p style={{color: "var(--text-secondary)"}} className="text-sm md:text-base  mb-8 leading-relaxed">
          Please check your network connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{color: "var(--text-primary)"}} className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7]  border-0 rounded-2xl  text-base font-semibold cursor-pointer transition-opacity hover:opacity-90"
          aria-label="Reload page"
        >
          <RefreshCw style={{ width: "24px", height: "24px", flexShrink: 0 }} aria-hidden="true" />
          Try Again
        </button>
      </div>
    </div>
  )
}

export default memo(NetworkOfflinePage)

