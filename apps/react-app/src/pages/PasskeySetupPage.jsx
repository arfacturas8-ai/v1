/**
 * PasskeySetupPage.jsx
 * WebAuthn/Passkey registration screen for passwordless authentication
 */
import React, { useState, useEffect } from 'react'
import { getErrorMessage } from "../utils/errorUtils";
import { useNavigate, Link } from 'react-router-dom'
import { Fingerprint, Smartphone, Key, Check, AlertCircle, Loader2, QrCode, ArrowLeft, Shield } from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

export default function PasskeySetupPage() {
  const { isMobile } = useResponsive()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: intro, 2: setup, 3: success
  const [deviceName, setDeviceName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [isSupported, setIsSupported] = useState(true)
  const [registeredDevice, setRegisteredDevice] = useState(null)

  useEffect(() => {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      setIsSupported(false)
      setError('Your browser does not support passkeys. Please use a modern browser like Chrome, Safari, or Edge.')
    }

    // Generate QR code for mobile setup
    generateQRCode()

    // Auto-detect device name
    const userAgent = navigator.userAgent
    let detectedDevice = 'This Device'
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      detectedDevice = 'iPhone'
    } else if (/Android/.test(userAgent)) {
      detectedDevice = 'Android Device'
    } else if (/Mac/.test(userAgent)) {
      detectedDevice = 'Mac'
    } else if (/Win/.test(userAgent)) {
      detectedDevice = 'Windows PC'
    }
    setDeviceName(detectedDevice)
  }, [])

  const generateQRCode = async () => {
    try {
      // Generate QR code for cross-device passkey setup
      const currentUrl = window.location.origin + '/passkey-setup'
      const qrData = `passkey-setup:${currentUrl}`
      // In production, use a proper QR code library
      setQrCode(`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='200' height='200' fill='white'/><text x='50%' y='50%' text-anchor='middle' dy='.3em' font-size='12'>QR Code: ${qrData.slice(0, 20)}...</text></svg>`)
    } catch (err) {
      console.error('QR generation error:', err)
    }
  }

  const handleSetupPasskey = async () => {
    if (!deviceName.trim()) {
      setError('Please enter a device name')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Step 1: Get challenge from server
      const challengeResponse = await fetch('/api/auth/passkey/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!challengeResponse.ok) {
        throw new Error('Failed to get challenge from server')
      }

      const { challenge, user } = await challengeResponse.json()

      // Step 2: Create WebAuthn credential
      const publicKeyCredentialCreationOptions = {
        challenge: Uint8Array.from(challenge, c => c.charCodeAt(0)),
        rp: {
          name: 'Cryb',
          id: window.location.hostname,
        },
        user: {
          id: Uint8Array.from(user.id, c => c.charCodeAt(0)),
          name: user.email || user.username,
          displayName: user.displayName || user.username,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },  // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // prefer platform authenticators (Touch ID, Face ID, Windows Hello)
          requireResidentKey: true,
          userVerification: 'required',
        },
        timeout: 60000,
        attestation: 'direct',
      }

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })

      if (!credential) {
        throw new Error('Failed to create credential')
      }

      // Step 3: Send credential to server for verification
      const verifyResponse = await fetch('/api/auth/passkey/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          credential: {
            id: credential.id,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
              attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
            },
            type: credential.type,
          },
          deviceName: deviceName.trim(),
        }),
      })

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify passkey')
      }

      const result = await verifyResponse.json()
      setRegisteredDevice(result.device)
      setStep(3)
    } catch (err) {
      console.error('Passkey setup error:', err)

      if (err.name === 'NotAllowedError') {
        setError('Passkey creation was cancelled. Please try again.')
      } else if (err.name === 'InvalidStateError') {
        setError('A passkey already exists for this account on this device.')
      } else {
        setError(err.message || 'Failed to set up passkey. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '16px' : '24px',
        background: '#FAFAFA',
        color: '#1A1A1A'
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: isMobile ? '24px' : '32px',
            border: '1px solid #E8EAED',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '50%',
                marginBottom: '16px'
              }}>
                <AlertCircle style={{ width: '32px', height: '32px', color: '#EF4444' }} />
              </div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '8px'
              }}>Browser Not Supported</h1>
              <p style={{
                fontSize: '15px',
                color: '#666666',
                marginBottom: '24px'
              }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: '12px 24px',
                  background: '#E5E7EB',
                  color: '#1A1A1A',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#D1D5DB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#E5E7EB'}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
    }} role="main" aria-label="Passkey setup">
      <div style={{ width: '100%', maxWidth: '720px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
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
          aria-label="Go back"
        >
          <ArrowLeft style={{ width: '20px', height: '20px' }} />
          <span>Back</span>
        </button>

        {/* Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '24px',
          padding: isMobile ? '24px' : '32px',
          border: '1px solid #E8EAED',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
        }}>
          {/* Step 1: Introduction */}
          {step === 1 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  background: 'rgba(88, 166, 255, 0.1)',
                  borderRadius: '50%',
                  marginBottom: '16px'
                }}>
                  <Fingerprint style={{ width: '32px', height: '32px', color: '#000000' }} />
                </div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>Set Up Passkey</h1>
                <p style={{
                  fontSize: '15px',
                  color: '#666666'
                }}>
                  Sign in faster and more securely with biometric authentication
                </p>
              </div>

              {/* Benefits */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '32px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: '#F5F5F5',
                  borderRadius: '16px'
                }}>
                  <Shield style={{ width: '24px', height: '24px', color: '#000000', flexShrink: 0 }} />
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>More Secure</h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#666666',
                      margin: 0
                    }}>
                      Passkeys use biometric authentication and are resistant to phishing attacks
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: '#F5F5F5',
                  borderRadius: '16px'
                }}>
                  <Fingerprint style={{ width: '24px', height: '24px', color: '#000000', flexShrink: 0 }} />
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>Faster Sign-In</h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#666666',
                      margin: 0
                    }}>
                      Sign in with Face ID, Touch ID, or Windows Hello
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  background: '#F5F5F5',
                  borderRadius: '16px'
                }}>
                  <Key style={{ width: '24px', height: '24px', color: '#000000', flexShrink: 0 }} />
                  <div>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '4px'
                    }}>No Password Needed</h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#666666',
                      margin: 0
                    }}>
                      Never worry about remembering or resetting passwords
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                  backdropFilter: 'blur(40px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(88, 166, 255, 0.3)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Continue
              </button>
            </>
          )}

          {/* Step 2: Setup */}
          {step === 2 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  background: 'rgba(88, 166, 255, 0.1)',
                  borderRadius: '50%',
                  marginBottom: '16px'
                }}>
                  <Smartphone style={{ width: '32px', height: '32px', color: '#000000' }} />
                </div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>Name Your Device</h1>
                <p style={{
                  fontSize: '15px',
                  color: '#666666'
                }}>
                  This helps you identify which device this passkey is for
                </p>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                marginBottom: '32px'
              }}>
                {/* Device name input */}
                <div>
                  <label htmlFor="deviceName" style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    color: '#666666'
                  }}>
                    Device Name
                  </label>
                  <input
                    type="text"
                    id="deviceName"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. iPhone 14, MacBook Pro"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#F5F5F5',
                      borderRadius: '12px',
                      border: '1px solid #E8EAED',
                      fontSize: '15px',
                      color: '#1A1A1A',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      opacity: loading ? 0.5 : 1
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#000000'
                      e.currentTarget.style.background = '#FFFFFF'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E8EAED'
                      e.currentTarget.style.background = '#F5F5F5'
                    }}
                  />
                </div>

                {/* QR code for mobile */}
                <div style={{
                  padding: '20px',
                  background: '#F5F5F5',
                  borderRadius: '16px',
                  border: '1px solid #E8EAED'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    flexDirection: isMobile ? 'column' : 'row'
                  }}>
                    <div style={{ flexShrink: 0 }}>
                      {qrCode && (
                        <div style={{
                          width: '128px',
                          height: '128px',
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '8px'
                        }}>
                          <img src={qrCode} alt="QR Code for mobile setup" style={{
                            width: '100%',
                            height: '100%'
                          }} />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <QrCode style={{ width: '20px', height: '20px', color: '#000000' }} />
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          margin: 0
                        }}>Set Up on Mobile</h3>
                      </div>
                      <p style={{
                        fontSize: '14px',
                        color: '#666666',
                        margin: 0
                      }}>
                        Scan this QR code with your phone to set up a passkey on your mobile device
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  marginBottom: '24px',
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <AlertCircle style={{
                    width: '20px',
                    height: '20px',
                    color: '#EF4444',
                    flexShrink: 0,
                    marginTop: '2px'
                  }} />
                  <p style={{
                    color: '#EF4444',
                    fontSize: '14px',
                    margin: 0
                  }}>{typeof error === "string" ? error : getErrorMessage(error, "An error occurred")}</p>
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#E5E7EB',
                    color: '#1A1A1A',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s ease',
                    opacity: loading ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#D1D5DB')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#E5E7EB')}
                >
                  Back
                </button>
                <button
                  onClick={handleSetupPasskey}
                  disabled={loading || !deviceName.trim()}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: (loading || !deviceName.trim()) ? 'rgba(88, 166, 255, 0.5)' : 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: (loading || !deviceName.trim()) ? 'none' : 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: (loading || !deviceName.trim()) ? 'none' : 'blur(40px) saturate(200%)',
                    color: '#FFFFFF',
                    border: (loading || !deviceName.trim()) ? 'none' : '1px solid rgba(88, 166, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (loading || !deviceName.trim()) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: (loading || !deviceName.trim()) ? 'none' : '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.2s ease',
                    opacity: (loading || !deviceName.trim()) ? 0.5 : 1
                  }}
                >
                  {loading && <Loader2 style={{
                    width: '20px',
                    height: '20px',
                    animation: 'spin 1s linear infinite'
                  }} />}
                  Create Passkey
                </button>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '50%',
                  marginBottom: '16px'
                }}>
                  <Check style={{ width: '32px', height: '32px', color: '#10B981' }} />
                </div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>Passkey Created!</h1>
                <p style={{
                  fontSize: '15px',
                  color: '#666666'
                }}>
                  Your passkey has been successfully set up on {registeredDevice?.name || deviceName}
                </p>
              </div>

              <div style={{
                padding: '20px',
                background: '#F5F5F5',
                borderRadius: '16px',
                marginBottom: '32px',
                border: '1px solid #E8EAED'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '16px'
                }}>What's Next?</h3>
                <ul style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  fontSize: '14px',
                  color: '#666666',
                  padding: 0,
                  margin: 0,
                  listStyle: 'none'
                }}>
                  <li style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <Check style={{ width: '20px', height: '20px', color: '#10B981', flexShrink: 0 }} />
                    <span>You can now sign in using biometric authentication</span>
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <Check style={{ width: '20px', height: '20px', color: '#10B981', flexShrink: 0 }} />
                    <span>Set up passkeys on your other devices for seamless access</span>
                  </li>
                  <li style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <Check style={{ width: '20px', height: '20px', color: '#10B981', flexShrink: 0 }} />
                    <span>You can manage your passkeys in Security Settings</span>
                  </li>
                </ul>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button
                  onClick={() => navigate('/settings/security')}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: '#E5E7EB',
                    color: '#1A1A1A',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#D1D5DB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#E5E7EB'}
                >
                  Manage Passkeys
                </button>
                <button
                  onClick={() => navigate('/home')}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.9) 0%, rgba(163, 113, 247, 0.9) 100%)',
                    backdropFilter: 'blur(40px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(88, 166, 255, 0.3)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 6px 24px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help text */}
        {step === 2 && (
          <div style={{
            marginTop: '24px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#666666'
            }}>
              Need help?{' '}
              <Link to="/help" style={{
                color: '#000000',
                transition: 'color 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#000000'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#000000'}
              >
                Learn more about passkeys
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
