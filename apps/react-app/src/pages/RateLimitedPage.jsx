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
    <div id="main-content" role="main" aria-label="429 Rate Limited" style={{background: "var(--bg-primary)"}} className="min-h-screen flex items-center justify-center  p-3 md:p-5">
      <div style={{color: "var(--text-primary)"}} className="text-center  max-w-2xl w-full">
        <div className="inline-flex items-center justify-center w-24 h-24 md:w-30 md:h-30 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-full mb-6 md:mb-8 backdrop-blur-sm relative" aria-hidden="true">
          <Clock size={64} aria-hidden="true" style={{ width: "64px", height: "64px", flexShrink: 0 }} />
          <div className="absolute inset-0 rounded-full border-4 border-[#58a6ff]/30 border-t-[#58a6ff] " aria-hidden="true" />
        </div>

        <div className="text-7xl md:text-9xl font-bold leading-none mb-5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent" aria-hidden="true">
          429
        </div>

        <h1 style={{color: "var(--text-primary)"}} className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 ">
          Slow Down There!
        </h1>

        <p style={{color: "var(--text-secondary)"}} className="text-base md:text-lg  mb-6 md:mb-8 leading-relaxed">
          You've made too many requests. Please wait a moment before trying again.
        </p>

        <div style={{borderColor: "var(--border-subtle)"}} className="card   rounded-2xl  md:rounded-2xl  p-6 md:p-8 mb-6 md:mb-8 border " role="timer" aria-live="polite" aria-atomic="true">
          <div className="text-4xl md:text-5xl font-bold mb-3 tracking-wider text-[#58a6ff]" aria-label={`${countdown} seconds remaining`}>
            {formatTime(countdown)}
          </div>
          <p style={{color: "var(--text-secondary)"}} className="text-sm  m-0">
            Time until you can try again
          </p>
        </div>

        <div style={{borderColor: "var(--border-subtle)"}} className="card   rounded-lg md:rounded-2xl  p-4 md:p-5 mb-6 md:mb-8 border  text-left">
          <div className="flex items-start gap-3 md:gap-4">
            <AlertCircle size={20} className="mt-0.5 flex-shrink-0 text-[#58a6ff]" aria-hidden="true" />
            <div>
              <h3 style={{color: "var(--text-primary)"}} className="text-sm md:text-base font-semibold mb-2 ">
                Why did this happen?
              </h3>
              <ul style={{color: "var(--text-primary)"}} className="list-none p-0 m-0 text-xs md:text-sm  leading-relaxed space-y-1">
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
              style={{color: "var(--text-primary)"}} className="inline-flex items-center gap-2 px-5 py-3 md:px-8 md:py-3.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7]  rounded-lg md:rounded-xl font-semibold text-sm md:text-base border-0 shadow-lg cursor-pointer transition-all hover:opacity-90"
              aria-label="Go back to previous page"
            >
              <ArrowLeft size={20} aria-hidden="true" />
              Go Back
            </button>

            <Link
              to="/"
              style={{borderColor: "var(--border-subtle)"}} className="card card inline-flex items-center gap-2 px-5 py-3 md:px-8 md:py-3.5 /60 text-[#58a6ff] border  rounded-lg md:rounded-2xl  no-underline font-semibold text-sm md:text-base  transition-all hover: "
              aria-label="Go to home page"
            >
              <Home size={20} aria-hidden="true" />
              Go Home
            </Link>
          </div>
        </nav>

        <div style={{color: "var(--text-secondary)"}} className="mt-8 md:mt-12 text-xs md:text-sm ">
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

