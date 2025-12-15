import React, { useState, useEffect } from 'react'
import { Wrench, Clock, CheckCircle2, Twitter, MessageCircle } from 'lucide-react'

export default function MaintenancePage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const estimatedEnd = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const getTimeRemaining = () => {
    const diff = estimatedEnd - currentTime
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div role="main" aria-label="Maintenance page" style={{background: "var(--bg-primary)"}} className="min-h-screen flex items-center justify-center  px-4 sm:px-5">
      <div style={{color: "var(--text-primary)"}} className="text-center  max-w-full sm:max-w-[700px] px-0 sm:px-4">
        <div className="card inline-flex items-center justify-center w-24 sm:w-[120px] h-24 sm:h-[120px]   border border-[rgba(88,166,255,0.3)] rounded-full mb-6 backdrop-blur-[10px] relative">
          <Wrench size={48} className="sm:w-16 sm:h-16 text-[#58a6ff] animate-wiggle" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] bg-clip-text text-transparent">
          We'll Be Right Back!
        </h1>

        <p style={{color: "var(--text-secondary)"}} className="text-lg sm:text-xl  mb-8 leading-relaxed max-w-[500px] mx-auto">
          Cryb.ai is currently undergoing scheduled maintenance to bring you a better experience.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-8">
          <div style={{borderColor: "var(--border-subtle)"}} className="card    rounded-2xl  p-4 sm:p-5 border ">
            <Clock size={24} className="sm:w-7 sm:h-7 mb-4 text-[#58a6ff] mx-auto" />
            <div style={{color: "var(--text-secondary)"}} className="text-sm  mb-2">
              Estimated Duration
            </div>
            <div style={{color: "var(--text-primary)"}} className="text-xl sm:text-2xl font-bold ">
              {getTimeRemaining()}
            </div>
          </div>

          <div style={{borderColor: "var(--border-subtle)"}} className="card    rounded-2xl  p-4 sm:p-5 border ">
            <CheckCircle2 size={24} className="sm:w-7 sm:h-7 mb-4 text-emerald-500 mx-auto" />
            <div style={{color: "var(--text-secondary)"}} className="text-sm  mb-2">
              Expected Back
            </div>
            <div style={{color: "var(--text-primary)"}} className="text-xl sm:text-2xl font-bold ">
              {formatTime(estimatedEnd)}
            </div>
          </div>
        </div>

        <div style={{borderColor: "var(--border-subtle)"}} className="card    rounded-2xl  p-5 sm:p-6 mb-6 sm:mb-8 border  text-left">
          <h3 style={{color: "var(--text-primary)"}} className="text-base sm:text-lg font-semibold mb-4 text-center ">
            What's Being Improved?
          </h3>
          <ul style={{color: "var(--text-primary)"}} className="list-none p-0 m-0 text-sm  leading-8">
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
              Performance enhancements for faster loading
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
              Security updates and bug fixes
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
              New features and improvements
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
              Database optimization
            </li>
          </ul>
        </div>

        <div style={{borderColor: "var(--border-subtle)"}} className="card    rounded-2xl  p-4 sm:p-5 mb-6 sm:mb-8 border ">
          <p style={{color: "var(--text-primary)"}} className="text-base  mb-4 leading-relaxed">
            Stay updated on our progress:
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://twitter.com/crybplatform"
              target="_blank"
              rel="noopener noreferrer"
              style={{color: "var(--text-primary)"}} className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7]  border-none rounded-lg no-underline text-sm font-semibold transition-all hover:scale-105"
              aria-label="Follow us on Twitter"
            >
              <Twitter size={18} />
              Twitter
            </a>
            <a
              href="https://status.cryb.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{borderColor: "var(--border-subtle)"}} className="card card inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 /60  text-[#58a6ff] border  rounded-lg no-underline text-sm font-semibold transition-all hover: "
              aria-label="Check status page"
            >
              <MessageCircle size={18} />
              Status Page
            </a>
          </div>
        </div>

        <p style={{color: "var(--text-secondary)"}} className="text-sm  leading-relaxed">
          Thank you for your patience! We're working hard to get back online as quickly as possible.
          <br />
          Questions?{' '}
          <a
            href="mailto:support@cryb.app"
            className="text-[#58a6ff] underline font-semibold"
          >
            Contact support
          </a>
        </p>

        <div style={{color: "var(--text-secondary)"}} style={{borderColor: "var(--border-subtle)"}} className="card mt-6 sm:mt-8 p-4   rounded-lg  border  text-xs ">
          <p className="m-0">
            Maintenance ID: MAINT-{Math.random().toString(36).substring(7).toUpperCase()}
            <br />
            Started: {formatTime(new Date())}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

