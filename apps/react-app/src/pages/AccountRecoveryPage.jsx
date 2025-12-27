/**
 * AccountRecoveryPage.jsx
 * Account recovery screen with multiple recovery methods
 * Rebuilt with master prompt standards
 */
import React, { useState } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '16px' : '24px',
      color: 'var(--text-primary)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '512px'
      }}>
        {step === 1 && (
          <button
            onClick={() => navigate('/login')}
            style={{
              marginBottom: isMobile ? '24px' : '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-primary)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: isMobile ? '14px' : '16px',
              minHeight: '48px',
              padding: 0,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <ArrowLeft style={{ width: "24px", height: "24px", flexShrink: 0 }} />
            <span>Back to login</span>
          </button>
        )}

        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: isMobile ? '20px' : '32px',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Step 1: Method Selection */}
          {step === 1 && (
            <>
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '24px' : '32px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(88, 166, 255, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Shield style={{ width: "32px", height: "32px", color: 'var(--cryb-primary)', flexShrink: 0 }} />
                </div>
                <h1 style={{
                  fontSize: isMobile ? '24px' : '30px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>Recover Your Account</h1>
                <p style={{
                  fontSize: isMobile ? '14px' : '16px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  margin: 0
                }}>Choose a recovery method to regain access to your account</p>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '12px' : '16px',
                marginBottom: isMobile ? '24px' : '32px'
              }}>
                {[
                  { id: 'email', icon: Mail, title: 'Email Verification', desc: 'Send a code to your recovery email' },
                  { id: 'phone', icon: Smartphone, title: 'SMS Verification', desc: 'Send a code to your phone number' },
                  { id: 'security-questions', icon: HelpCircle, title: 'Security Questions', desc: 'Answer your security questions' },
                  { id: 'backup-code', icon: Key, title: 'Backup Code', desc: 'Use your MFA backup code' },
                ].map(({ id, icon: Icon, title, desc }) => (
                  <button
                    key={id}
                    onClick={() => setRecoveryMethod(id)}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: isMobile ? '12px' : '16px',
                      background: 'rgba(22, 27, 34, 0.6)',
                      border: `1px solid ${recoveryMethod === id ? '#58a6ff' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '12px' : '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      if (recoveryMethod !== id) e.target.style.borderColor = 'rgba(88, 166, 255, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                      if (recoveryMethod !== id) e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Icon style={{ width: "24px", height: "24px", color: 'var(--cryb-primary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                        margin: 0
                      }}>{title}</h3>
                      <p style={{
                        fontSize: isMobile ? '12px' : '14px',
                        color: 'var(--text-secondary)',
                        margin: 0
                      }}>{desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {recoveryMethod === 'email' && (
                <form onSubmit={handleSendCode} style={{ marginTop: isMobile ? '24px' : '32px' }}>
                  <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                    <label htmlFor="email" style={{
                      display: 'block',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>Recovery Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        padding: isMobile ? '12px' : '16px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        fontSize: isMobile ? '14px' : '16px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        opacity: loading ? 0.5 : 1,
                        cursor: loading ? 'not-allowed' : 'text'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                    />
                  </div>
                  {error && (
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: isMobile ? '12px' : '16px',
                      border: '1px solid rgba(248, 81, 73, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <AlertCircle style={{ width: "24px", height: "24px", color: '#f85149', flexShrink: 0 }} />
                      <p style={{
                        fontSize: isMobile ? '14px' : '16px',
                        color: '#f85149',
                        margin: 0
                      }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: isMobile ? '12px 20px' : '14px 24px',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      color: 'var(--text-primary)',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '500',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                      opacity: loading ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')}
                    onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
                  >
                    Send Code
                  </button>
                </form>
              )}

              {recoveryMethod === 'phone' && (
                <form onSubmit={handleSendCode} style={{ marginTop: isMobile ? '24px' : '32px' }}>
                  <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                    <label htmlFor="phone" style={{
                      display: 'block',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      required
                      disabled={loading}
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        padding: isMobile ? '12px' : '16px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        fontSize: isMobile ? '14px' : '16px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        opacity: loading ? 0.5 : 1,
                        cursor: loading ? 'not-allowed' : 'text'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                    />
                  </div>
                  {error && (
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: isMobile ? '12px' : '16px',
                      border: '1px solid rgba(248, 81, 73, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <AlertCircle style={{ width: "24px", height: "24px", color: '#f85149', flexShrink: 0 }} />
                      <p style={{
                        fontSize: isMobile ? '14px' : '16px',
                        color: '#f85149',
                        margin: 0
                      }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: isMobile ? '12px 20px' : '14px 24px',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      color: 'var(--text-primary)',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '500',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                      opacity: loading ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')}
                    onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
                  >
                    Send Code
                  </button>
                </form>
              )}

              {recoveryMethod === 'security-questions' && (
                <form onSubmit={handleSecurityQuestions} style={{ marginTop: isMobile ? '24px' : '32px' }}>
                  {securityQuestions.map((q, index) => (
                    <div key={index} style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                      <label htmlFor={`question-${index}`} style={{
                        display: 'block',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '8px'
                      }}>{q.question}</label>
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
                        style={{
                          width: '100%',
                          minHeight: '48px',
                          padding: isMobile ? '12px' : '16px',
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          fontSize: isMobile ? '14px' : '16px',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          opacity: loading ? 0.5 : 1,
                          cursor: loading ? 'not-allowed' : 'text'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                      />
                    </div>
                  ))}
                  {error && (
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: isMobile ? '12px' : '16px',
                      border: '1px solid rgba(248, 81, 73, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <AlertCircle style={{ width: "24px", height: "24px", color: '#f85149', flexShrink: 0 }} />
                      <p style={{
                        fontSize: isMobile ? '14px' : '16px',
                        color: '#f85149',
                        margin: 0
                      }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: isMobile ? '12px 20px' : '14px 24px',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      color: 'var(--text-primary)',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '500',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                      opacity: loading ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')}
                    onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
                  >
                    Verify Answers
                  </button>
                </form>
              )}

              {recoveryMethod === 'backup-code' && (
                <form onSubmit={handleBackupCode} style={{ marginTop: isMobile ? '24px' : '32px' }}>
                  <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                    <label htmlFor="backupCode" style={{
                      display: 'block',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      marginBottom: '8px'
                    }}>Backup Code</label>
                    <input
                      type="text"
                      id="backupCode"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value)}
                      placeholder="Enter your backup code"
                      disabled={loading}
                      style={{
                        width: '100%',
                        minHeight: '48px',
                        padding: isMobile ? '12px' : '16px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        fontSize: isMobile ? '14px' : '16px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        opacity: loading ? 0.5 : 1,
                        cursor: loading ? 'not-allowed' : 'text'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#58a6ff'}
                      onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                    />
                    <p style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      margin: '8px 0 0 0'
                    }}>Use one of your MFA backup codes provided during setup</p>
                  </div>
                  {error && (
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      padding: isMobile ? '12px' : '16px',
                      border: '1px solid rgba(248, 81, 73, 0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '16px'
                    }}>
                      <AlertCircle style={{ width: "24px", height: "24px", color: '#f85149', flexShrink: 0 }} />
                      <p style={{
                        fontSize: isMobile ? '14px' : '16px',
                        color: '#f85149',
                        margin: 0
                      }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: isMobile ? '12px 20px' : '14px 24px',
                      background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                      color: 'var(--text-primary)',
                      fontSize: isMobile ? '14px' : '16px',
                      fontWeight: '500',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                      opacity: loading ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')}
                    onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
                  >
                    Verify Code
                  </button>
                </form>
              )}
            </>
          )}

          {/* Step 2: Code Verification */}
          {step === 2 && (
            <>
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '24px' : '32px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(88, 166, 255, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Mail style={{ width: "32px", height: "32px", color: 'var(--cryb-primary)', flexShrink: 0 }} />
                </div>
                <h1 style={{
                  fontSize: isMobile ? '24px' : '30px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>Enter Verification Code</h1>
                <p style={{
                  fontSize: isMobile ? '14px' : '16px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  We sent a 6-digit code to <span style={{
                    color: 'var(--text-primary)',
                    fontWeight: '500'
                  }}>{recoveryMethod === 'email' ? email : phone}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyCode} style={{ marginTop: isMobile ? '24px' : '32px' }}>
                <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                  <label htmlFor="code" style={{
                    display: 'block',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>Verification Code</label>
                  <input
                    type="text"
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: isMobile ? '12px' : '16px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      fontSize: isMobile ? '18px' : '24px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'text',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      letterSpacing: '0.1em'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#000000'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>
                {error && (
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    padding: isMobile ? '12px' : '16px',
                    border: '1px solid rgba(248, 81, 73, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <AlertCircle style={{ width: "24px", height: "24px", color: '#f85149', flexShrink: 0 }} />
                    <p style={{
                      fontSize: isMobile ? '14px' : '16px',
                      color: '#f85149',
                      margin: 0
                    }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: isMobile ? '12px 20px' : '14px 24px',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    color: 'var(--text-primary)',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '500',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: (loading || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                    opacity: (loading || verificationCode.length !== 6) ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => !(loading || verificationCode.length !== 6) && (e.target.style.opacity = '0.9')}
                  onMouseLeave={(e) => !(loading || verificationCode.length !== 6) && (e.target.style.opacity = '1')}
                >
                  Verify Code
                </button>
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    style={{
                      fontSize: isMobile ? '12px' : '14px',
                      color: '#000000',
                      background: 'transparent',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1,
                      minHeight: '48px',
                      padding: 0,
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.color = '#79c0ff')}
                    onMouseLeave={(e) => !loading && (e.target.style.color = '#000000')}
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
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '24px' : '32px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(88, 166, 255, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Key style={{ width: "32px", height: "32px", color: 'var(--cryb-primary)', flexShrink: 0 }} />
                </div>
                <h1 style={{
                  fontSize: isMobile ? '24px' : '30px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>Create New Password</h1>
                <p style={{
                  fontSize: isMobile ? '14px' : '16px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  margin: 0
                }}>Choose a strong password to secure your account</p>
              </div>

              <form onSubmit={handleResetPassword} style={{ marginTop: isMobile ? '24px' : '32px' }}>
                <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                  <label htmlFor="newPassword" style={{
                    display: 'block',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: isMobile ? '12px' : '16px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      fontSize: isMobile ? '14px' : '16px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'text'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#000000'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                  <p style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    margin: '8px 0 0 0'
                  }}>Must be at least 8 characters long</p>
                </div>

                <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
                  <label htmlFor="confirmPassword" style={{
                    display: 'block',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    marginBottom: '8px'
                  }}>Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      minHeight: '48px',
                      padding: isMobile ? '12px' : '16px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      fontSize: isMobile ? '14px' : '16px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'text'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#000000'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
                  />
                </div>

                {error && (
                  <div style={{
                    background: 'var(--bg-tertiary)',
                    padding: isMobile ? '12px' : '16px',
                    border: '1px solid rgba(248, 81, 73, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '16px'
                  }}>
                    <AlertCircle style={{ width: "24px", height: "24px", color: '#f85149', flexShrink: 0 }} />
                    <p style={{
                      fontSize: isMobile ? '14px' : '16px',
                      color: '#f85149',
                      margin: 0
                    }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    minHeight: '48px',
                    padding: isMobile ? '12px 20px' : '14px 24px',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    color: 'var(--text-primary)',
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: '500',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                    opacity: loading ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.opacity = '0.9')}
                  onMouseLeave={(e) => !loading && (e.target.style.opacity = '1')}
                >
                  Reset Password
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <>
              <div style={{
                textAlign: 'center',
                marginBottom: isMobile ? '24px' : '32px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(88, 166, 255, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Check style={{ width: "32px", height: "32px", color: 'var(--cryb-primary)', flexShrink: 0 }} />
                </div>
                <h1 style={{
                  fontSize: isMobile ? '24px' : '30px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>Password Reset Successful</h1>
                <p style={{
                  fontSize: isMobile ? '14px' : '16px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  margin: 0
                }}>Your password has been successfully reset</p>
              </div>

              <div style={{
                background: 'var(--bg-tertiary)',
                padding: isMobile ? '16px' : '20px',
                border: '1px solid rgba(88, 166, 255, 0.2)',
                borderRadius: '8px',
                marginBottom: isMobile ? '24px' : '32px'
              }}>
                <h3 style={{
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  marginBottom: isMobile ? '12px' : '16px',
                  margin: '0 0 16px 0'
                }}>Security Recommendations</h3>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '12px' : '16px'
                }}>
                  <li style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: isMobile ? '12px' : '14px',
                    color: 'var(--text-primary)'
                  }}>
                    <Check style={{ width: "16px", height: "16px", color: 'var(--cryb-primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Use a unique password for each account</span>
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: isMobile ? '12px' : '14px',
                    color: 'var(--text-primary)'
                  }}>
                    <Check style={{ width: "16px", height: "16px", color: 'var(--cryb-primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Enable two-factor authentication for added security</span>
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: isMobile ? '12px' : '14px',
                    color: 'var(--text-primary)'
                  }}>
                    <Check style={{ width: "16px", height: "16px", color: 'var(--cryb-primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span>Update your recovery methods in settings</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: isMobile ? '12px 20px' : '14px 24px',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  color: 'var(--text-primary)',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '500',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Continue to Login
              </button>
            </>
          )}
        </div>

        {step === 1 && (
          <div style={{
            marginTop: isMobile ? '20px' : '24px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: isMobile ? '12px' : '14px',
              color: 'var(--text-secondary)',
              margin: 0
            }}>
              Still need help?{' '}
              <Link to="/contact" style={{
                color: '#000000',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#79c0ff'}
              onMouseLeave={(e) => e.target.style.color = '#000000'}
              >Contact Support</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
