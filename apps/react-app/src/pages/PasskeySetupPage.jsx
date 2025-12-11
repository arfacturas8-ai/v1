/**
 * PasskeySetupPage.jsx
 * WebAuthn/Passkey registration screen for passwordless authentication
 */
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Fingerprint, Smartphone, Key, Check, AlertCircle, Loader2, QrCode, ArrowLeft, Shield } from 'lucide-react'

export default function PasskeySetupPage() {
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
      <div className="min-h-screen text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-lg border border-white/10 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Browser Not Supported</h1>
              <p className="text-[#8b949e] mb-6">{error}</p>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
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
    <div className="min-h-screen text-white flex items-center justify-center p-4" role="main" aria-label="Passkey setup">
      <div className="w-full max-w-2xl">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-[#8b949e] hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Card */}
        <div className="bg-[#161b22]/60 backdrop-blur-xl rounded-lg border border-white/10 p-8">
          {/* Step 1: Introduction */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#58a6ff]/10 rounded-full mb-4">
                  <Fingerprint className="w-8 h-8 text-[#58a6ff]" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Set Up Passkey</h1>
                <p className="text-[#8b949e]">
                  Sign in faster and more securely with biometric authentication
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 p-4 bg-[#21262d] rounded-lg">
                  <Shield className="w-5 h-5 text-[#58a6ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">More Secure</h3>
                    <p className="text-sm text-[#8b949e]">
                      Passkeys use biometric authentication and are resistant to phishing attacks
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-[#21262d] rounded-lg">
                  <Fingerprint className="w-5 h-5 text-[#58a6ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">Faster Sign-In</h3>
                    <p className="text-sm text-[#8b949e]">
                      Sign in with Face ID, Touch ID, or Windows Hello
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-[#21262d] rounded-lg">
                  <Key className="w-5 h-5 text-[#58a6ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">No Password Needed</h3>
                    <p className="text-sm text-[#8b949e]">
                      Never worry about remembering or resetting passwords
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full px-6 py-3 bg-[#58a6ff] hover:bg-[#1a6fc7] rounded-lg font-medium transition-colors"
              >
                Continue
              </button>
            </>
          )}

          {/* Step 2: Setup */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#58a6ff]/10 rounded-full mb-4">
                  <Smartphone className="w-8 h-8 text-[#58a6ff]" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Name Your Device</h1>
                <p className="text-[#8b949e]">
                  This helps you identify which device this passkey is for
                </p>
              </div>

              <div className="space-y-6 mb-8">
                {/* Device name input */}
                <div>
                  <label htmlFor="deviceName" className="block text-sm font-medium mb-2">
                    Device Name
                  </label>
                  <input
                    type="text"
                    id="deviceName"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. iPhone 14, MacBook Pro"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-[#21262d] border border-white/10 rounded-lg focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                {/* QR code for mobile */}
                <div className="p-6 bg-[#21262d] rounded-lg border border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {qrCode && (
                        <div className="w-32 h-32 bg-white rounded-lg p-2">
                          <img src={qrCode} alt="QR Code for mobile setup" className="w-full h-full" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <QrCode className="w-5 h-5 text-[#58a6ff]" />
                        <h3 className="font-medium">Set Up on Mobile</h3>
                      </div>
                      <p className="text-sm text-[#8b949e]">
                        Scan this QR code with your phone to set up a passkey on your mobile device
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSetupPasskey}
                  disabled={loading || !deviceName.trim()}
                  className="flex-1 px-6 py-3 bg-[#58a6ff] hover:bg-[#1a6fc7] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Create Passkey
                </button>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Passkey Created!</h1>
                <p className="text-[#8b949e]">
                  Your passkey has been successfully set up on {registeredDevice?.name || deviceName}
                </p>
              </div>

              <div className="p-6 bg-[#21262d] rounded-lg border border-white/10 mb-8">
                <h3 className="font-medium mb-4">What's Next?</h3>
                <ul className="space-y-3 text-sm text-[#8b949e]">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>You can now sign in using biometric authentication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Set up passkeys on your other devices for seamless access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>You can manage your passkeys in Security Settings</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/settings/security')}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                >
                  Manage Passkeys
                </button>
                <button
                  onClick={() => navigate('/home')}
                  className="flex-1 px-6 py-3 bg-[#58a6ff] hover:bg-[#1a6fc7] rounded-lg font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help text */}
        {step === 2 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-[#8b949e]">
              Need help?{' '}
              <Link to="/help" className="text-[#58a6ff] hover:text-[#3d9df0]">
                Learn more about passkeys
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

