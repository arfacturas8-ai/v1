/**
 * MFALoginPage.jsx
 * Two-factor authentication login screen with 6-digit code input
 */
import React, { useState, useEffect, useRef } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Shield, ArrowLeft, Key, AlertCircle, Loader2 } from 'lucide-react'

export default function MFALoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberDevice, setRememberDevice] = useState(false)
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const inputRefs = useRef([])

  const email = location.state?.email || ''

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  useEffect(() => {
    if (code.every(digit => digit !== '') && !loading) {
      handleSubmit()
    }
  }, [code])

  const handleInputChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value

    setCode(newCode)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('')
        const newCode = [...code]
        digits.forEach((digit, i) => {
          if (index + i < 6) {
            newCode[index + i] = digit
          }
        })
        setCode(newCode)
        const lastIndex = Math.min(index + digits.length, 5)
        inputRefs.current[lastIndex]?.focus()
      })
    }
  }

  const handleSubmit = async () => {
    const fullCode = code.join('')

    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/mfa/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          code: fullCode,
          rememberDevice,
          email,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const redirectTo = location.state?.from || '/home'
        navigate(redirectTo, { replace: true })
      } else {
        const data = await response.json()
        setError(data?.message || 'Invalid verification code')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      console.error('MFA verification error:', err)
      setError('An error occurred. Please try again.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const backupCode = formData.get('backupCode')

    if (!backupCode || backupCode.length < 8) {
      setError('Please enter a valid backup code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/mfa/verify-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          backupCode,
          rememberDevice,
          email,
        }),
      })

      if (response.ok) {
        const redirectTo = location.state?.from || '/home'
        navigate(redirectTo, { replace: true })
      } else {
        const data = await response.json()
        setError(data?.message || 'Invalid backup code')
      }
    } catch (err) {
      console.error('Backup code verification error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pb-8 md:p-4" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} role="main" aria-label="Two-factor authentication">
      <div className="w-full max-w-full md:max-w-[480px] lg:max-w-[440px]">
        <button
          onClick={() => navigate('/login')}
          className="mb-3 md:mb-4 flex items-center gap-2 text-[#666666] bg-transparent border-0 cursor-pointer text-xs p-1 transition-colors"
          style={{ '--hover-color': 'var(--text-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
          aria-label="Back to login"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to login</span>
        </button>

        <div className="bg-white backdrop-blur-xl rounded-[10px] shadow-sm p-5 md:p-6 lg:p-5" style={{ border: '1px solid var(--border-subtle)' }}>
          <div className="text-center mb-4 md:mb-5 lg:mb-4">
            <div className="inline-flex items-center justify-center w-11 h-11 bg-[#58a6ff]/10 rounded-full mb-3 md:mb-2.5 lg:mb-2">
              <Shield className="w-5.5 h-5.5 text-[#58a6ff]" />
            </div>
            <h1 className="text-xl font-bold mb-2 md:mb-1.5" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</h1>
            <p className="text-xs text-[#666666] leading-relaxed">
              {email && <span className="block text-[11px] mb-2 md:mb-1.5 text-[#A0A0A0]">{email}</span>}
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {!showBackupCodes ? (
            <>
              <div className="flex gap-1.5 md:gap-2 mb-4 md:mb-3.5 lg:mb-3 justify-center">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    className="w-[38px] md:w-[42px] h-11 md:h-12 text-center text-lg font-bold bg-white rounded-[10px] outline-none transition-all disabled:opacity-50"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              {error && (
                <div className="mb-4 md:mb-3.5 lg:mb-3 p-4 md:p-3.5 lg:p-3 bg-red-500/10 border border-red-500/30 rounded-[10px] flex items-start gap-2">
                  <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-500 text-xs m-0">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                </div>
              )}

              <label className="flex items-center gap-2 mb-4 md:mb-3.5 lg:mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ border: '1px solid var(--border-subtle)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Remember this device for 30 days
                </span>
              </label>

              {loading && (
                <div className="flex items-center justify-center gap-2 mb-4 md:mb-3.5 lg:mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <Loader2 className="w-4.5 h-4.5 " />
                  <span>Verify</span>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={() => setShowBackupCodes(true)}
                  disabled={loading}
                  className="text-xs text-[#58a6ff] bg-transparent border-0 cursor-pointer inline-flex items-center gap-2 p-1 transition-colors hover:text-[#79c0ff] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Key className="w-3.5 h-3.5" />
                  Use backup code instead
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleBackupCodeSubmit} className="flex flex-col gap-4 md:gap-3.5 lg:gap-3">
                <div className="flex flex-col">
                  <label htmlFor="backupCode" className="block text-xs font-medium mb-2 md:mb-1.5 text-[#A0A0A0]">
                    Backup Code
                  </label>
                  <input
                    type="text"
                    id="backupCode"
                    name="backupCode"
                    placeholder="Enter your backup code"
                    disabled={loading}
                    className="w-full px-3 md:px-2.5 py-3 md:py-2.5 text-sm bg-[#202225]/60 rounded-[10px] outline-none transition-all disabled:opacity-50"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    required
                  />
                  <p className="mt-2 md:mt-1.5 text-[11px] text-[#666666] leading-normal">
                    Enter one of your backup codes provided during MFA setup
                  </p>
                </div>

                {error && (
                  <div className="p-4 md:p-3.5 lg:p-3 bg-red-500/10 border border-red-500/30 rounded-[10px] flex items-start gap-2">
                    <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-500 text-xs m-0">{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded border border-white/10 bg-[#202225]/60 cursor-pointer"
                  />
                  <span className="text-xs text-[#A0A0A0]">
                    Remember this device for 30 days
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-3 py-2.5 md:py-2.5 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white border-0 rounded-[10px] text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify Backup Code
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBackupCodes(false)
                      setError('')
                    }}
                    disabled={loading}
                    className="text-xs text-[#58a6ff] bg-transparent border-0 cursor-pointer p-1 transition-colors hover:text-[#79c0ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use authenticator code instead
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-5 md:mt-4.5 lg:mt-3.5 pt-4 md:pt-3.5 lg:pt-3 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-xs text-[#666666]">
              Lost access to your authenticator?{' '}
              <Link to="/account-recovery" className="text-[#58a6ff] no-underline transition-colors hover:text-[#79c0ff]">
                Recover your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

