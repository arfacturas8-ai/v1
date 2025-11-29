import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, ArrowLeft, Home, AlertCircle } from 'lucide-react'

export default function RateLimitedPage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleGoBack = () => {
    navigate(-1)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div id="main-content" role="main" aria-label="429 Rate Limited" className="min-h-screen flex items-center justify-center bg-[#0d1117] p-3 md:p-5">
      <div className="text-center text-white max-w-2xl w-full">
        <div className="inline-flex items-center justify-center w-24 h-24 md:w-30 md:h-30 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-full mb-6 md:mb-8 backdrop-blur-sm relative" aria-hidden="true">
          <Clock size={64} aria-hidden="true" className="w-12 h-12 md:w-16 md:h-16 text-[#58a6ff]" />
          <div className="absolute inset-0 rounded-full border-4 border-[#58a6ff]/30 border-t-[#58a6ff] animate-spin" aria-hidden="true" />
        </div>

        <div className="text-7xl md:text-9xl font-bold leading-none mb-5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent" aria-hidden="true">
          429
        </div>

        <h1 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 text-white">
          Slow Down There!
        </h1>

        <p className="text-base md:text-lg text-[#8b949e] mb-6 md:mb-8 leading-relaxed">
          You've made too many requests. Please wait a moment before trying again.
        </p>

        <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] md:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 md:p-8 mb-6 md:mb-8 border border-white/10" role="timer" aria-live="polite" aria-atomic="true">
          <div className="text-4xl md:text-5xl font-bold mb-3 tracking-wider text-[#58a6ff]" aria-label={`${countdown} seconds remaining`}>
            {formatTime(countdown)}
          </div>
          <p className="text-sm text-[#8b949e] m-0">
            Time until you can try again
          </p>
        </div>

        <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-lg md:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-5 mb-6 md:mb-8 border border-white/10 text-left">
          <div className="flex items-start gap-3 md:gap-4">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-[#58a6ff]" aria-hidden="true" />
            <div>
              <h3 className="text-sm md:text-base font-semibold mb-2 text-white">
                Why did this happen?
              </h3>
              <ul className="list-none p-0 m-0 text-xs md:text-sm text-[#c9d1d9] leading-relaxed space-y-1">
                <li>• You sent too many requests in a short time</li>
                <li>• Rate limits help protect our service for everyone</li>
                <li>• Automated scripts may trigger this protection</li>
              </ul>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-3 md:gap-4 items-center" aria-label="Error page actions">
          <div className="flex gap-3 md:gap-4 flex-wrap justify-center">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-5 py-3 md:px-8 md:py-3.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white rounded-lg md:rounded-xl font-semibold text-sm md:text-base border-0 shadow-lg cursor-pointer transition-all hover:opacity-90"
              aria-label="Go back to previous page"
            >
              <ArrowLeft size={20} aria-hidden="true" />
              Go Back
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-3 md:px-8 md:py-3.5 bg-[#161b22]/60 text-[#58a6ff] border border-white/10 rounded-lg md:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] no-underline font-semibold text-sm md:text-base backdrop-blur-xl transition-all hover:bg-[#161b22]/60 backdrop-blur-xl"
              aria-label="Go to home page"
            >
              <Home size={20} aria-hidden="true" />
              Go Home
            </Link>
          </div>
        </nav>

        <div className="mt-8 md:mt-12 text-xs md:text-sm text-[#8b949e]">
          <p>
            Having issues?{' '}
            <Link
              to="/help"
              className="text-[#58a6ff] underline font-semibold hover:text-[#a371f7] transition-colors"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

