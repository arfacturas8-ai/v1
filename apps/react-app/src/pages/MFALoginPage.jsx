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

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '16px' : '24px',
      background: '#FAFAFA',
      color: '#1A1A1A'
    }} role="main" aria-label="Two-factor authentication">
      <div style={{
        width: '100%',
        maxWidth: '440px'
      }}>
        <button
          onClick={() => navigate('/login')}
          style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#666666',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px',
            transition: 'color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#1A1A1A'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
          aria-label="Back to login"
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          <span>Back to login</span>
        </button>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          padding: isMobile ? '24px' : '32px',
          border: '1px solid #E8EAED'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              background: 'rgba(88, 166, 255, 0.1)',
              borderRadius: '50%',
              marginBottom: '16px'
            }}>
              <Shield style={{ width: '28px', height: '28px', color: '#000000' }} />
            </div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '8px',
              color: '#1A1A1A'
            }}>Two-Factor Authentication</h1>
            <p style={{
              fontSize: '14px',
              color: '#666666',
              lineHeight: '1.5'
            }}>
              {email && <span style={{
                display: 'block',
                fontSize: '12px',
                marginBottom: '8px',
                color: '#999999'
              }}>{email}</span>}
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {!showBackupCodes ? (
            <>
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '20px',
                justifyContent: 'center'
              }}>
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
                    style={{
                      width: isMobile ? '42px' : '52px',
                      height: isMobile ? '52px' : '60px',
                      textAlign: 'center',
                      fontSize: '24px',
                      fontWeight: '700',
                      background: '#FFFFFF',
                      borderRadius: '12px',
                      outline: 'none',
                      border: '2px solid #E8EAED',
                      color: '#1A1A1A',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#000000'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#E8EAED'}
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>

              {error && (
                <div style={{
                  marginBottom: '20px',
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <AlertCircle style={{
                    width: '18px',
                    height: '18px',
                    color: '#EF4444',
                    flexShrink: 0,
                    marginTop: '2px'
                  }} />
                  <p style={{
                    color: '#EF4444',
                    fontSize: '13px',
                    margin: 0
                  }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                </div>
              )}

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  disabled={loading}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  fontSize: '14px',
                  color: '#666666'
                }}>
                  Remember this device for 30 days
                </span>
              </label>

              {loading && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: '#666666'
                }}>
                  <Loader2 style={{
                    width: '18px',
                    height: '18px',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span>Verifying...</span>
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowBackupCodes(true)}
                  disabled={loading}
                  style={{
                    fontSize: '14px',
                    color: '#000000',
                    background: 'transparent',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px',
                    transition: 'color 0.2s ease',
                    opacity: loading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.color = '#000000')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.color = '#000000')}
                >
                  <Key style={{ width: '16px', height: '16px' }} />
                  Use backup code instead
                </button>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleBackupCodeSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label htmlFor="backupCode" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#666666'
                  }}>
                    Backup Code
                  </label>
                  <input
                    type="text"
                    id="backupCode"
                    name="backupCode"
                    placeholder="Enter your backup code"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      background: '#F5F5F5',
                      borderRadius: '12px',
                      outline: 'none',
                      border: '1px solid #E8EAED',
                      color: '#1A1A1A',
                      transition: 'all 0.2s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#000000'
                      e.currentTarget.style.background = '#FFFFFF'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E8EAED'
                      e.currentTarget.style.background = '#F5F5F5'
                    }}
                    required
                  />
                  <p style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#666666',
                    lineHeight: '1.4'
                  }}>
                    Enter one of your backup codes provided during MFA setup
                  </p>
                </div>

                {error && (
                  <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <AlertCircle style={{
                      width: '18px',
                      height: '18px',
                      color: '#EF4444',
                      flexShrink: 0,
                      marginTop: '2px'
                    }} />
                    <p style={{
                      color: '#EF4444',
                      fontSize: '13px',
                      margin: 0
                    }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                  </div>
                )}

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    disabled={loading}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{
                    fontSize: '14px',
                    color: '#666666'
                  }}>
                    Remember this device for 30 days
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: loading ? 'rgba(88, 166, 255, 0.5)' : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: loading ? 'none' : 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: loading ? 'none' : 'blur(40px) saturate(200%)',
                    color: '#FFFFFF',
                    border: loading ? 'none' : '1px solid rgba(88, 166, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'opacity 0.2s ease',
                    opacity: loading ? 0.5 : 1,
                    boxShadow: loading ? 'none' : '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
                >
                  {loading && <Loader2 style={{
                    width: '20px',
                    height: '20px',
                    animation: 'spin 1s linear infinite'
                  }} />}
                  Verify Backup Code
                </button>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBackupCodes(false)
                      setError('')
                    }}
                    disabled={loading}
                    style={{
                      fontSize: '14px',
                      color: '#000000',
                      background: 'transparent',
                      border: 'none',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      transition: 'color 0.2s ease',
                      opacity: loading ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.color = '#000000')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.color = '#000000')}
                  >
                    Use authenticator code instead
                  </button>
                </div>
              </form>
            </>
          )}

          <div style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #E8EAED',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '13px',
              color: '#666666'
            }}>
              Lost access to your authenticator?{' '}
              <Link to="/account-recovery" style={{
                color: '#000000',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#000000'}
              >
                Recover your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
