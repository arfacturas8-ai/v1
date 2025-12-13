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
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Password reset confirmation">
        <div className="card card-elevated w-full max-w-md md:max-w-lg rounded-xl p-5 md:p-6">
          <div className="flex justify-center mb-3 md:mb-4">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-full" aria-hidden="true">
              <CheckCircle size={22} color="#fff" aria-hidden="true" />
            </div>
          </div>

          <h1 className="text-lg md:text-xl font-bold mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
            Check Your Email
          </h1>

          <p className="text-sm md:text-base leading-relaxed mb-4 md:mb-5 text-center" style={{ color: 'var(--text-secondary)' }}>
            We've sent password reset instructions to <strong>{email}</strong>
          </p>

          <div className="rounded-lg p-3 md:p-4 mb-4 md:mb-5" style={{ background: 'var(--bg-tertiary)' }}>
            <p className="text-xs md:text-sm leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => setIsSubmitted(false)}
                className="font-semibold underline transition-colors"
                style={{ color: 'var(--brand-primary)' }}
                aria-label="Try sending reset email again"
              >
                try again
              </button>
            </p>
          </div>

          <Link
            to="/login"
            className="btn btn-secondary flex items-center justify-center gap-2 min-h-[44px] w-full"
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
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6" style={{ background: 'var(--bg-primary)' }} role="main" aria-label="Forgot password page">
      <div className="card card-elevated w-full max-w-md md:max-w-lg rounded-xl p-5 md:p-6">
        <div className="text-center mb-5 md:mb-6">
          <h1 className="text-lg md:text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Forgot Password?
          </h1>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 md:mb-5">
            <label htmlFor="email" className="block text-xs md:text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={isLoading}
                className={`input w-full min-h-[44px] pl-10 md:pl-11 pr-3 py-2 md:pr-4 md:py-3 text-sm md:text-base ${
                  error ? 'border-[#FF3B3B]' : ''
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
            className="btn btn-primary w-full min-h-[44px] mb-4 md:mb-5"
            aria-label={isLoading ? 'Sending reset email...' : 'Send reset email'}
          >
            Send Reset Link
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold min-h-[44px] transition-colors"
              style={{ color: 'var(--brand-primary)' }}
              aria-label="Back to login page"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to Login
            </Link>
          </div>
        </form>

        <div className="mt-5 md:mt-6 pt-3 md:pt-4 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs md:text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?
          </p>
          <Link
            to="/register"
            className="btn btn-secondary inline-block px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm min-h-[44px]"
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
