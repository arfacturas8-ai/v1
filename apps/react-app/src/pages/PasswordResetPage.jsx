import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import authService from '../services/authService'
import { useResponsive } from '../hooks/useResponsive'

export default function PasswordResetPage() {
  const { isMobile } = useResponsive()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [step, setStep] = useState(token ? 'reset' : 'request') // request, reset, success, error
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Validate token if present
    if (token) {
      validateToken(token)
    }
  }, [token])

  useEffect(() => {
    // Calculate password strength
    if (password.length === 0) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    setPasswordStrength(strength)
  }, [password])

  const validateToken = async (token) => {
    // Token validation happens when user attempts to reset password
    // No separate validation endpoint needed - backend validates on reset
    setStep('reset')
  }

  const handleRequestReset = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authService.resetPassword(email)

      if (result.success) {
        setMessage(result.message || `Password reset email sent to ${email}. Check your inbox!`)
        setStep('success')
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.')
      }
    } catch (err) {
      console.error('Password reset request error:', err)
      setError('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (passwordStrength < 3) {
      setError('Password is too weak. Use uppercase, lowercase, numbers, and symbols.')
      setLoading(false)
      return
    }

    try {
      // Backend expects token in request body with password
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1'}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          password: password,
          confirmPassword: confirmPassword
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessage(data.message || 'Password reset successfully! Redirecting to login...')
        setStep('success')

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password. Please try again or request a new link.')
      }
    } catch (err) {
      console.error('Password reset error:', err)
      setError('Failed to reset password. Please try again or request a new link.')
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#ef4444'
    if (passwordStrength <= 3) return '#f59e0b'
    return '#10b981'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak'
    if (passwordStrength <= 3) return 'Medium'
    return 'Strong'
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#58a6ff] to-[#a371f7] p-4 md:p-6"
      role="main"
      aria-label="Password reset page"
    >
      <div className="bg-[#0A0A0B] rounded-xl p-5 md:p-6 max-w-md md:max-w-lg w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)]">
        {/* Header */}
        <div className="text-center mb-5 md:mb-6">
          <div className="w-11 h-11 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center text-white text-xl md:text-2xl font-bold mx-auto mb-2 md:mb-3" aria-hidden="true">
            🔑
          </div>
          <h1 className="text-lg md:text-xl font-semibold mb-2 text-white">
            {step === 'request' && 'Reset Password'}
            {step === 'reset' && 'Create New Password'}
            {step === 'success' && 'Success!'}
            {step === 'error' && 'Invalid Link'}
          </h1>
          <p className="text-sm md:text-base text-[#8b949e]">
            {step === 'request' && "Enter your email to receive a password reset link"}
            {step === 'reset' && "Choose a strong password for your account"}
            {step === 'success' && "Your password has been updated"}
            {step === 'error' && "This reset link is no longer valid"}
          </p>
        </div>

        {/* Request Reset Form */}
        {step === 'request' && (
          <form onSubmit={handleRequestReset}>
            <div className="mb-4 md:mb-5">
              <label htmlFor="email-input" className="block text-xs md:text-sm font-medium mb-2 text-[#c9d1d9]">
                Email Address
              </label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 text-sm md:text-base outline-none transition-all bg-[#161b22]/60 backdrop-blur-xl text-white placeholder:text-[#8b949e] focus:border-[#58a6ff]"
                aria-required="true"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "email-error" : undefined}
              />
            </div>

            {error && (
              <div
                id="email-error"
                role="alert"
                className="px-3 py-2 md:px-4 md:py-3 bg-[#161b22]/60 backdrop-blur-xl border border-[rgba(239,68,68,0.3)] rounded-lg text-[#ef4444] text-xs md:text-sm mb-4 md:mb-5"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white border-none rounded-xl text-sm md:text-base font-semibold cursor-pointer shadow-[0_4px_12px_rgba(102,126,234,0.4)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#4b5563] disabled:shadow-none"
              aria-label={loading ? "Sending reset email" : "Send reset link"}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center mt-5 md:mt-6">
              <Link to="/login" className="text-[#58a6ff] hover:text-[#58a6ff] text-xs md:text-sm min-h-[44px] inline-flex items-center transition-colors">
                ← Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* Reset Password Form */}
        {step === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4 md:mb-5">
              <label htmlFor="new-password" className="block text-xs md:text-sm font-medium mb-2 text-[#c9d1d9]">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 pr-10 md:pr-12 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 text-sm md:text-base outline-none transition-all bg-[#161b22]/60 backdrop-blur-xl text-white placeholder:text-[#8b949e] focus:border-[#58a6ff]"
                  aria-required="true"
                  aria-invalid={error ? "true" : "false"}
                  aria-describedby="password-strength"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base md:text-lg min-h-[44px]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {password && (
                <div id="password-strength" className="mt-2" role="status" aria-live="polite">
                  <div className="h-1 bg-[#161b22]/60 backdrop-blur-xl rounded-sm overflow-hidden" aria-hidden="true">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: getPasswordStrengthColor() }}>
                    Strength: {getPasswordStrengthText()}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-5 md:mb-6">
              <label htmlFor="confirm-password" className="block text-xs md:text-sm font-medium mb-2 text-[#c9d1d9]">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/10 text-sm md:text-base outline-none transition-all bg-[#161b22]/60 backdrop-blur-xl text-white placeholder:text-[#8b949e] focus:border-[#58a6ff]"
                aria-required="true"
                aria-invalid={error && error.includes('match') ? "true" : "false"}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="px-3 py-2 md:px-4 md:py-3 bg-[#161b22]/60 backdrop-blur-xl border border-[rgba(239,68,68,0.3)] rounded-lg text-[#ef4444] text-xs md:text-sm mb-4 md:mb-5"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white border-none rounded-xl text-sm md:text-base font-semibold cursor-pointer shadow-[0_4px_12px_rgba(102,126,234,0.4)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#4b5563] disabled:shadow-none"
              aria-label={loading ? "Resetting password" : "Reset password"}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="text-center" role="status" aria-live="polite">
            <div className="text-4xl md:text-5xl mb-5 md:mb-6" aria-hidden="true">✅</div>
            <p className="text-sm md:text-base text-[#8b949e] mb-5 md:mb-6 leading-relaxed">
              {message}
            </p>
            <Link
              to="/login"
              className="inline-block min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white rounded-xl font-semibold text-sm md:text-base shadow-[0_4px_12px_rgba(102,126,234,0.4)] transition-transform hover:-translate-y-0.5"
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="text-center" role="alert">
            <div className="text-4xl md:text-5xl mb-5 md:mb-6" aria-hidden="true">⚠️</div>
            <p className="text-sm md:text-base text-[#8b949e] mb-5 md:mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => setStep('request')}
              className="inline-block min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-br from-[#58a6ff] to-[#a371f7] text-white border-none rounded-xl font-semibold text-sm md:text-base cursor-pointer shadow-[0_4px_12px_rgba(102,126,234,0.4)] transition-transform hover:-translate-y-0.5"
              aria-label="Request new password reset link"
            >
              Request New Link
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-5 md:mt-6 pt-3 md:pt-4 border-t border-white/10 text-center text-xs md:text-sm text-[#6e7681]">
          Need help? <Link to="/help" className="text-[#58a6ff] hover:text-[#58a6ff] underline transition-colors">Contact Support</Link>
        </div>
      </div>
    </div>
  )
}

