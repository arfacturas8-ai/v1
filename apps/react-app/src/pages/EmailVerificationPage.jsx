import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import authService from '../services/authService'
import { useResponsive } from '../hooks/useResponsive'

export default function EmailVerificationPage() {
  const { isMobile } = useResponsive()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link. No token provided.')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (token) => {
    try {
      const result = await authService.verifyEmail(token)

      if (result.success) {
        setStatus('success')
        setMessage(result.message || 'Email verified successfully!')

        setTimeout(() => {
          navigate('/home')
        }, 3000)
      } else {
        setStatus('expired')
        setMessage(result.error || 'This verification link has expired or is invalid.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred while verifying your email. Please try again.')
      console.error('Email verification error:', error)
    }
  }

  const resendVerification = async () => {
    setStatus('verifying')
    setMessage('Sending new verification email...')

    try {
      const result = await authService.resendVerification()

      if (result.success) {
        setStatus('success')
        setMessage(result.message || 'A new verification email has been sent! Check your inbox.')
      } else {
        setStatus('error')
        setMessage(result.error || 'Failed to resend verification email. Please try again later.')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Failed to resend verification email. Please try again later.')
      console.error('Resend verification error:', error)
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'verifying':
        return (
          <div
            className="w-20 h-20 rounded-full border-4 border-[#58a6ff] border-t-transparent "
            role="status"
            aria-label="Verifying email"
          />
        )
      case 'success':
        return (
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center" aria-hidden="true">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
        )
      case 'error':
        return (
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center" aria-hidden="true">
            <XCircle className="w-10 h-10 text-red-400" />
          </div>
        )
      case 'expired':
        return (
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center" aria-hidden="true">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-3 md:p-4"
      style={{ background: 'var(--bg-primary)' }}
      role="main"
      aria-label="Email verification page"
    >
      <div className="bg-white  rounded-xl p-5 md:p-6 lg:p-8 max-w-md md:max-w-lg w-full text-center shadow-sm" style={{ border: '1px solid var(--border-subtle)' }}>
        <div className="flex justify-center mb-6 md:mb-8">
          {getIcon()}
        </div>

        <h1 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4" style={{ color: 'var(--text-primary)' }}>
          {status === 'verifying' && 'Verifying Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
          {status === 'expired' && 'Link Expired'}
        </h1>

        <p
          className="text-sm md:text-base leading-relaxed mb-6 md:mb-8"
          style={{ color: 'var(--text-secondary)' }}
          role={status === 'error' || status === 'expired' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message}
        </p>

        <div className="flex flex-col gap-2 md:gap-3">
          {status === 'success' && (
            <>
              <Link
                to="/home"
                style={{color: "var(--text-primary)"}} className="inline-block min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl font-semibold text-sm md:text-base shadow-[0_4px_12px_rgba(88,166,255,0.4)] transition-all hover:opacity-90"
                aria-label="Go to home page"
              >
                Go to Home →
              </Link>
              <p className="text-xs md:text-sm italic m-0" style={{ color: 'var(--text-secondary)' }}>
                Redirecting automatically in 3 seconds...
              </p>
            </>
          )}

          {(status === 'error' || status === 'expired') && (
            <>
              <button
                onClick={resendVerification}
                style={{color: "var(--text-primary)"}} className="min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7]  rounded-xl font-semibold text-sm md:text-base shadow-sm transition-all hover:opacity-90 border-none cursor-pointer"
                aria-label="Resend verification email"
              >
                Resend Verification Email
              </button>

              <Link
                to="/"
                className="inline-block min-h-[44px] px-3 py-2 md:px-4 md:py-3 bg-transparent text-[#58a6ff] border-2 border-[#58a6ff] rounded-2xl shadow-sm font-semibold text-xs md:text-sm transition-all hover:border-[#79c0ff] hover:text-[#79c0ff]"
                aria-label="Back to home page"
              >
                Back to Home
              </Link>
            </>
          )}

          {status === 'verifying' && (
            <p className="text-xs md:text-sm italic m-0" style={{ color: 'var(--text-secondary)' }}>
              This may take a few seconds...
            </p>
          )}
        </div>

        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t text-xs md:text-sm" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
          <p>Having trouble? <Link to="/help" className="text-[#58a6ff] hover:text-[#79c0ff] underline transition-colors">Contact Support</Link></p>
        </div>
      </div>
    </div>
  )
}

