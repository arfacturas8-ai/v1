/**
 * AccountRecoveryPage.jsx
 * Account recovery screen with multiple recovery methods
 * Redesigned with glassmorphism Help page design system
 */
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Mail, Smartphone, Key, Check, AlertCircle, Loader2, ArrowLeft, HelpCircle } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

export default function AccountRecoveryPage() {
  const { isMobile } = useResponsive()

  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [recoveryMethod, setRecoveryMethod] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: 'What was the name of your first pet?', answer: '' },
    { question: 'In what city were you born?', answer: '' },
    { question: 'What is your mother\'s maiden name?', answer: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendCode = async (e) => {
    e.preventDefault()
    setError('')
    const contactInfo = recoveryMethod === 'email' ? email : phone
    if (!contactInfo) {
      setError(`Please enter your ${recoveryMethod}`)
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/recovery/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: recoveryMethod, contact: contactInfo }),
      })
      if (response.ok) {
        setStep(2)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to send verification code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError('')
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/recovery/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: recoveryMethod,
          contact: recoveryMethod === 'email' ? email : phone,
          code: verificationCode,
        }),
      })
      if (response.ok) {
        setStep(3)
      } else {
        const data = await response.json()
        setError(data.message || 'Invalid verification code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSecurityQuestions = async (e) => {
    e.preventDefault()
    setError('')
    const unanswered = securityQuestions.some(q => !q.answer.trim())
    if (unanswered) {
      setError('Please answer all security questions')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/recovery/verify-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: securityQuestions.map(q => q.answer) }),
      })
      if (response.ok) {
        setStep(3)
      } else {
        const data = await response.json()
        setError(data.message || 'Security answers do not match')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackupCode = async (e) => {
    e.preventDefault()
    setError('')
    if (!backupCode || backupCode.length < 8) {
      setError('Please enter a valid backup code')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/recovery/verify-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupCode }),
      })
      if (response.ok) {
        setStep(3)
      } else {
        const data = await response.json()
        setError(data.message || 'Invalid backup code')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/auth/recovery/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword,
          verificationCode: recoveryMethod !== 'backup-code' ? verificationCode : undefined,
          backupCode: recoveryMethod === 'backup-code' ? backupCode : undefined,
        }),
      })
      if (response.ok) {
        setStep(4)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to reset password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex items-center justify-center p-4 md:p-6 lg:p-8">
      <div className="w-full max-w-md md:max-w-lg">
        {step === 1 && (
          <button
            onClick={() => navigate('/login')}
            className="mb-6 md:mb-8 flex items-center gap-2 text-[#8b949e] hover:text-[#c9d1d9] transition-colors text-sm md:text-base min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>Back to login</span>
          </button>
        )}

        <div className="bg-[#161b22]/60 backdrop-blur-xl backdrop-blur-xl border border-white/10 rounded-xl p-5 md:p-6 lg:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          {/* Step 1: Method Selection */}
          {step === 1 && (
            <>
              <div className="text-center mb-6 md:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-[#161b22]/60 backdrop-blur-xl rounded-full mb-3 md:mb-4">
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-[#58a6ff]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">Recover Your Account</h1>
                <p className="text-sm md:text-base text-[#8b949e] leading-relaxed">Choose a recovery method to regain access to your account</p>
              </div>

              <div className="flex flex-col gap-3 md:gap-4 mb-6 md:mb-8">
                {[
                  { id: 'email', icon: Mail, title: 'Email Verification', desc: 'Send a code to your recovery email' },
                  { id: 'phone', icon: Smartphone, title: 'SMS Verification', desc: 'Send a code to your phone number' },
                  { id: 'security-questions', icon: HelpCircle, title: 'Security Questions', desc: 'Answer your security questions' },
                  { id: 'backup-code', icon: Key, title: 'Backup Code', desc: 'Use your MFA backup code' },
                ].map(({ id, icon: Icon, title, desc }) => (
                  <button
                    key={id}
                    onClick={() => setRecoveryMethod(id)}
                    className={`w-full min-h-[44px] p-3 md:p-4 bg-[#161b22]/60 backdrop-blur-xl border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center gap-3 md:gap-4 cursor-pointer transition-all text-left hover:border-[#58a6ff]/50 ${
                      recoveryMethod === id ? 'border-[#58a6ff] bg-[#161b22]/60 backdrop-blur-xl' : 'border-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-[#58a6ff] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-medium text-white mb-1">{title}</h3>
                      <p className="text-xs md:text-sm text-[#8b949e] m-0">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {recoveryMethod === 'email' && (
                <form onSubmit={handleSendCode} className="mt-6 md:mt-8">
                  <div className="mb-6 md:mb-8">
                    <label htmlFor="email" className="block text-xs md:text-sm font-medium text-[#c9d1d9] mb-2">Recovery Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      required
                      disabled={loading}
                      className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-[#c9d1d9] text-sm md:text-base outline-none transition-all focus:border-[#58a6ff] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  {error && (
                    <div className="p-3 md:p-4 bg-[#161b22]/60 backdrop-blur-xl border border-[rgba(248,81,73,0.2)] rounded-lg flex items-start gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-[#f85149] flex-shrink-0 mt-0.5" />
                      <p className="text-sm md:text-base text-[#f85149]">{error}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white text-sm md:text-base font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Code'
                    )}
                  </button>
                </form>
              )}

              {recoveryMethod === 'phone' && (
                <form onSubmit={handleSendCode} className="mt-6 md:mt-8">
                  <div className="mb-6 md:mb-8">
                    <label htmlFor="phone" className="block text-xs md:text-sm font-medium text-[#c9d1d9] mb-2">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                      disabled={loading}
                      className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-[#c9d1d9] text-sm md:text-base outline-none transition-all focus:border-[#58a6ff] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  {error && (
                    <div className="p-3 md:p-4 bg-[#161b22]/60 backdrop-blur-xl border border-[rgba(248,81,73,0.2)] rounded-lg flex items-start gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-[#f85149] flex-shrink-0 mt-0.5" />
                      <p className="text-sm md:text-base text-[#f85149]">{error}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white text-sm md:text-base font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Code'
                    )}
                  </button>
                </form>
              )}

              {recoveryMethod === 'security-questions' && (
                <form onSubmit={handleSecurityQuestions} className="mt-6 md:mt-8">
                  {securityQuestions.map((q, index) => (
                    <div key={index} className="mb-6 md:mb-8">
                      <label htmlFor={`question-${index}`} className="block text-xs md:text-sm font-medium text-[#c9d1d9] mb-2">{q.question}</label>
                      <input
                        type="text"
                        id={`question-${index}`}
                        value={q.answer}
                        onChange={(e) => {
                          const newQuestions = [...securityQuestions]
                          newQuestions[index].answer = e.target.value
                          setSecurityQuestions(newQuestions)
                        }}
                        disabled={loading}
                        className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-[#c9d1d9] text-sm md:text-base outline-none transition-all focus:border-[#58a6ff] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  ))}
                  {error && (
                    <div className="p-3 md:p-4 bg-[#161b22]/60 backdrop-blur-xl border border-[rgba(248,81,73,0.2)] rounded-lg flex items-start gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-[#f85149] flex-shrink-0 mt-0.5" />
                      <p className="text-sm md:text-base text-[#f85149]">{error}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white text-sm md:text-base font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Answers'
                    )}
                  </button>
                </form>
              )}

              {recoveryMethod === 'backup-code' && (
                <form onSubmit={handleBackupCode} className="mt-6 md:mt-8">
                  <div className="mb-6 md:mb-8">
                    <label htmlFor="backupCode" className="block text-xs md:text-sm font-medium text-[#c9d1d9] mb-2">Backup Code</label>
                    <input
                      type="text"
                      id="backupCode"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value)}
                      placeholder="Enter your backup code"
                      disabled={loading}
                      className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-[#c9d1d9] text-sm md:text-base outline-none transition-all focus:border-[#58a6ff] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="mt-2 text-xs text-[#8b949e]">Use one of your MFA backup codes provided during setup</p>
                  </div>
                  {error && (
                    <div className="p-3 md:p-4 bg-[#161b22]/60 backdrop-blur-xl border border-[rgba(248,81,73,0.2)] rounded-lg flex items-start gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-[#f85149] flex-shrink-0 mt-0.5" />
                      <p className="text-sm md:text-base text-[#f85149]">{error}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white text-sm md:text-base font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Code'
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* Step 2: Code Verification */}
          {step === 2 && (
            <>
              <div className="text-center mb-6 md:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-[#161b22]/60 backdrop-blur-xl rounded-full mb-3 md:mb-4">
                  <Mail className="w-6 h-6 md:w-8 md:h-8 text-[#58a6ff]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">Enter Verification Code</h1>
                <p className="text-sm md:text-base text-[#8b949e] leading-relaxed">
                  We sent a 6-digit code to <span className="text-white font-medium">{recoveryMethod === 'email' ? email : phone}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} className="mt-6 md:mt-8">
                <div className="mb-6 md:mb-8">
                  <label htmlFor="code" className="block text-xs md:text-sm font-medium text-[#c9d1d9] mb-2">Verification Code</label>
                  <input
                    type="text"
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                    className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-[#c9d1d9] text-lg md:text-2xl outline-none transition-all focus:border-[#58a6ff] disabled:opacity-50 disabled:cursor-not-allowed text-center font-mono tracking-widest"
                  />
                </div>
                {error && (
                  <div className="p-3 md:p-4 bg-[#161b22]/60 backdrop-blur-xl border border-[rgba(248,81,73,0.2)] rounded-lg flex items-start gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-[#f85149] flex-shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-[#f85149]">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white text-sm md:text-base font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="text-xs md:text-sm text-[#58a6ff] hover:text-[#79c0ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    Didn't receive a code? Resend
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <>
              <div className="text-center mb-6 md:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-[#161b22]/60 backdrop-blur-xl rounded-full mb-3 md:mb-4">
                  <Key className="w-6 h-6 md:w-8 md:h-8 text-[#58a6ff]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">Create New Password</h1>
                <p className="text-sm md:text-base text-[#8b949e] leading-relaxed">Choose a strong password to secure your account</p>
              </div>

              <form onSubmit={handleResetPassword} className="mt-6 md:mt-8">
                <div className="mb-6 md:mb-8">
                  <label htmlFor="newPassword" className="block text-xs md:text-sm font-medium text-[#c9d1d9] mb-2">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-[#c9d1d9] text-sm md:text-base outline-none transition-all focus:border-[#58a6ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p className="mt-2 text-xs text-[#8b949e]">Must be at least 8 characters long</p>
                </div>

                <div className="mb-6 md:mb-8">
                  <label htmlFor="confirmPassword" className="block text-xs md:text-sm font-medium text-[#c9d1d9] mb-2">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={loading}
                    className="w-full min-h-[44px] px-3 py-2 md:px-4 md:py-3 bg-[#161b22]/60 backdrop-blur-xl border border-white/10 rounded-lg text-[#c9d1d9] text-sm md:text-base outline-none transition-all focus:border-[#58a6ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {error && (
                  <div className="p-3 md:p-4 bg-[#161b22]/60 backdrop-blur-xl border border-[rgba(248,81,73,0.2)] rounded-lg flex items-start gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-[#f85149] flex-shrink-0 mt-0.5" />
                    <p className="text-sm md:text-base text-[#f85149]">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white text-sm md:text-base font-medium rounded-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <>
              <div className="text-center mb-6 md:mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-[#161b22]/60 backdrop-blur-xl rounded-full mb-3 md:mb-4">
                  <Check className="w-6 h-6 md:w-8 md:h-8 text-[#3fb950]" />
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-white mb-2">Password Reset Successful</h1>
                <p className="text-sm md:text-base text-[#8b949e] leading-relaxed">Your password has been successfully reset</p>
              </div>

              <div className="p-4 md:p-5 bg-[#161b22]/60 backdrop-blur-xl border border-[rgba(88,166,255,0.2)] rounded-lg mb-6 md:mb-8">
                <h3 className="text-sm md:text-base font-medium text-white mb-3 md:mb-4">Security Recommendations</h3>
                <ul className="list-none p-0 m-0 space-y-3 md:space-y-4">
                  <li className="flex items-start gap-2 text-xs md:text-sm text-[#c9d1d9]">
                    <Check className="w-4 h-4 text-[#3fb950] flex-shrink-0 mt-0.5" />
                    <span>Use a unique password for each account</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs md:text-sm text-[#c9d1d9]">
                    <Check className="w-4 h-4 text-[#3fb950] flex-shrink-0 mt-0.5" />
                    <span>Enable two-factor authentication for added security</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs md:text-sm text-[#c9d1d9]">
                    <Check className="w-4 h-4 text-[#3fb950] flex-shrink-0 mt-0.5" />
                    <span>Update your recovery methods in settings</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full min-h-[44px] px-5 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white text-sm md:text-base font-medium rounded-lg transition-all hover:opacity-90"
              >
                Continue to Login
              </button>
            </>
          )}
        </div>

        {step === 1 && (
          <div className="mt-5 md:mt-6 text-center">
            <p className="text-xs md:text-sm text-[#8b949e]">
              Still need help?{' '}
              <Link to="/contact" className="text-[#58a6ff] hover:text-[#79c0ff] transition-colors">Contact Support</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

