import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

export default function ForgotPasswordPage() {
  const { isMobile } = useResponsive()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Email is required')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1'}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data?.success) {
        setIsSubmitted(true)
      } else {
        setError(data?.error || data?.message || 'Failed to send reset email')
      }
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4 md:p-6" role="main" aria-label="Password reset confirmation">
        <div className="w-full max-w-md md:max-w-lg bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex justify-center mb-3 md:mb-4">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-full" aria-hidden="true">
              <CheckCircle size={22} color="#fff" aria-hidden="true" />
            </div>
          </div>

          <h1 className="text-lg md:text-xl font-bold text-white mb-2 text-center">
            Check Your Email
          </h1>

          <p className="text-sm md:text-base text-[#A0A0A0] leading-relaxed mb-4 md:mb-5 text-center">
            We've sent password reset instructions to <strong>{email}</strong>
          </p>

          <div className="bg-[#141414]/60 backdrop-blur-xl rounded-lg p-3 md:p-4 mb-4 md:mb-5">
            <p className="text-xs md:text-sm text-[#A0A0A0] leading-relaxed m-0">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSubmitted(false)}
                className="text-[#58a6ff] hover:text-[#79c0ff] font-semibold underline transition-colors"
                aria-label="Try sending reset email again"
              >
                try again
              </button>
            </p>
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 min-h-[44px] px-3 py-2.5 md:px-4 md:py-3 bg-[#141414]/60 backdrop-blur-xl text-[#58a6ff] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] font-semibold text-sm md:text-base transition-all hover:border-[#58a6ff]/50"
            aria-label="Back to login page"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4 md:p-6" role="main" aria-label="Forgot password page">
      <div className="w-full max-w-md md:max-w-lg bg-[#141414]/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="text-center mb-5 md:mb-6">
          <h1 className="text-lg md:text-xl font-bold text-white mb-2">
            Forgot Password?
          </h1>
          <p className="text-sm md:text-base text-[#A0A0A0] leading-relaxed">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 md:mb-5">
            <label htmlFor="email" className="block text-xs md:text-sm font-semibold text-white mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#666666]" aria-hidden="true" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={isLoading}
                className={`w-full min-h-[44px] pl-10 md:pl-11 pr-3 py-2 md:pr-4 md:py-3 text-sm md:text-base border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] outline-none transition-all bg-[#141414]/60 backdrop-blur-xl text-white placeholder:text-[#666666] focus:border-[#58a6ff] disabled:opacity-50 disabled:cursor-not-allowed ${
                  error ? 'border-[#FF3B3B]' : 'border-white/10'
                }`}
                aria-label="Email address"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'email-error' : undefined}
              />
            </div>
            {error && (
              <p id="email-error" role="alert" className="mt-2 text-xs md:text-sm text-[#FF3B3B]">
                {typeof error === 'string' ? error : 'An error occurred'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-none rounded-xl text-sm md:text-base font-semibold cursor-pointer transition-all hover:opacity-90 shadow-[0_4px_12px_rgba(88,166,255,0.4)] mb-4 md:mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isLoading ? 'Sending reset email...' : 'Send reset email'}
          >
            Send Reset Link
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#58a6ff] hover:text-[#79c0ff] text-xs md:text-sm font-semibold min-h-[44px] transition-colors"
              aria-label="Back to login page"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to Login
            </Link>
          </div>
        </form>

        <div className="mt-5 md:mt-6 pt-3 md:pt-4 border-t border-white/10 text-center">
          <p className="text-xs md:text-sm text-[#A0A0A0] mb-2">
            Don't have an account?
          </p>
          <Link
            to="/register"
            className="inline-block px-3 py-2 md:px-4 md:py-2.5 bg-[#141414]/60 backdrop-blur-xl text-[#58a6ff] border border-white/10 rounded-lg text-xs md:text-sm font-semibold transition-all hover:border-[#58a6ff]/50 min-h-[44px]"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}

ForgotPasswordPage.propTypes = {}

export { ForgotPasswordPage }
