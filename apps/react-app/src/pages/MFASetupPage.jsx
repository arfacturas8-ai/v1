import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Copy, Check, Download, ArrowLeft, Smartphone } from 'lucide-react'

export default function MFASetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generateQRCode()
  }, [])

  const generateQRCode = async () => {
    try {
      const response = await fetch('/api/auth/mfa/generate', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        setSecret(data.secret)
      } else {
        setError('Failed to generate QR code')
      }
    } catch (err) {
      console.error('QR generation error:', err)
      setError('An error occurred. Please try again.')
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setError('')

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: verificationCode }),
      })

      if (response.ok) {
        const data = await response.json()
        setBackupCodes(data.backupCodes)
        setStep(3)
      } else {
        const data = await response.json()
        setError(data.message || 'Invalid verification code')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadBackupCodes = () => {
    const content = `Cryb.ai - MFA Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cryb-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#58a6ff] to-[#a371f7] p-4 md:p-5" role="main" aria-label="Multi-factor authentication setup page">
      <div className="card w-full max-w-full md:max-w-[560px] /95  rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-4 md:p-10" style={{ border: '1px solid var(--border-subtle)' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 md:w-16 h-14 md:h-16 bg-[#58a6ff]/[0.15] rounded-full mb-4">
            <Shield className="w-7 md:w-8 h-7 md:h-8 text-[#58a6ff]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Two-Factor Authentication
          </h1>
          <p style={{color: "var(--text-secondary)"}} className="text-sm  leading-relaxed">
            Add an extra layer of security to your account
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-sm transition-colors ${s <= step ? 'bg-[#58a6ff]' : 'bg-[#161b22]/60 '}`}
              aria-label={`Step ${s} ${s === step ? 'current' : s < step ? 'completed' : 'pending'}`}
            />
          ))}
        </div>

        {/* Step 1: Download Authenticator */}
        {step === 1 && (
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4" style={{ color: 'var(--text-primary)' }}>
              Step 1: Download Authenticator App
            </h2>
            <p style={{color: "var(--text-secondary)"}} className="text-sm  leading-relaxed mb-4 md:mb-6">
              Install an authenticator app on your mobile device. We recommend:
            </p>

            <div className="flex flex-col gap-3 mb-8">
              {['Google Authenticator', 'Microsoft Authenticator', 'Authy'].map((app) => (
                <div
                  key={app}
                  className="card flex items-center gap-3 p-4  rounded-2xl "
                >
                  <Smartphone style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  <span style={{color: "var(--text-primary)"}} className="text-[15px] font-medium ">
                    {app}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{color: "var(--text-primary)"}} className="w-full px-4 py-3 md:py-3.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7]  border-0 rounded-xl text-base font-semibold cursor-pointer shadow-[0_4px_12px_rgba(102,126,234,0.4)] transition-all hover:shadow-[0_6px_16px_rgba(102,126,234,0.5)]"
              aria-label="Continue to next step"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Scan QR Code */}
        {step === 2 && (
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4" style={{ color: 'var(--text-primary)' }}>
              Step 2: Scan QR Code
            </h2>
            <p style={{color: "var(--text-secondary)"}} className="text-sm  leading-relaxed mb-4 md:mb-6">
              Open your authenticator app and scan this QR code:
            </p>

            <div className="card flex justify-center p-6  rounded-2xl  mb-6">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="QR code for two-factor authentication"
                  className="w-[200px] h-[200px] border-4 border-white rounded-lg"
                />
              ) : (
                <div style={{color: "var(--text-secondary)"}} className="card w-[200px] h-[200px] flex items-center justify-center   rounded-lg ">
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-400 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-900 m-0 leading-normal">
                <strong>Can't scan?</strong> Enter this code manually:
              </p>
              <div className="flex items-center gap-2 mt-2">
                <code style={{color: "var(--text-primary)"}} className="card flex-1 px-2 py-2  rounded-md text-sm font-mono  overflow-x-auto">
                  {secret}
                </code>
                <button
                  onClick={copySecret}
                  className={`px-2 py-2 ${copied ? 'bg-emerald-600' : 'bg-[#21262d]'} border border-white/10 rounded-md cursor-pointer transition-all`}
                  aria-label={copied ? 'Copied' : 'Copy secret key'}
                >
                  {copied ? <Check style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} /> : <Copy style={{ color: "var(--text-primary)", width: "24px", height: "24px", flexShrink: 0 }} />}
                </button>
              </div>
            </div>

            <form onSubmit={handleVerify}>
              <div className="mb-6">
                <label
                  htmlFor="verification-code"
                  style={{color: "var(--text-primary)"}} className="block text-sm font-semibold  mb-2"
                >
                  Verification Code
                </label>
                <input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  disabled={isLoading}
                  maxLength={6}
                  className={`w-full px-3.5 py-3.5 text-lg tracking-[0.5em] text-center ${error ? 'border-2 border-red-500' : 'border-2 border-white/10 focus:border-[#58a6ff]'} rounded-2xl  outline-none transition-all font-mono ${isLoading ? 'bg-[#161b22]' : 'bg-white'}`}
                  aria-label="Enter 6-digit verification code"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'code-error' : undefined}
                />
                {error && (
                  <p
                    id="code-error"
                    role="alert"
                    className="mt-2 text-sm text-red-500"
                  >
                    {typeof error === 'string' ? error : 'An error occurred'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{color: "var(--text-primary)"}} className="flex-1 px-4 py-3.5 bg-[#21262d]  border-0 rounded-2xl  text-base font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-[#30363d] transition-colors"
                  aria-label="Go back to previous step"
                >
                  <ArrowLeft style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className={`flex-[2] px-4 py-3.5 ${isLoading || verificationCode.length !== 6 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-br from-[#58a6ff] to-[#a371f7] cursor-pointer shadow-[0_4px_12px_rgba(102,126,234,0.4)]'} text-white border-0 rounded-2xl  text-base font-semibold`}
                  aria-label={isLoading ? 'Verifying...' : 'Verify code'}
                >
                  Verify & Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 3 && (
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4" style={{ color: 'var(--text-primary)' }}>
              Step 3: Save Backup Codes
            </h2>
            <p style={{color: "var(--text-secondary)"}} className="text-sm  leading-relaxed mb-4 md:mb-6">
              Save these backup codes in a secure location. You can use them to access your account if you lose your device.
            </p>

            <div className="card  rounded-2xl  p-5 mb-6">
              <div className="grid grid-cols-2 gap-3">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    style={{color: "var(--text-primary)"}} className="px-3 py-3 bg-[#21262d] rounded-lg text-sm font-mono text-center  font-medium"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-red-900 m-0 leading-normal">
                <strong>Warning:</strong> Each backup code can only be used once. Store them securely and never share them with anyone.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={downloadBackupCodes}
                style={{color: "var(--text-primary)"}} className="w-full px-4 py-3.5 bg-[#21262d]  border-0 rounded-2xl  text-base font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors hover:bg-[#30363d]"
                aria-label="Download backup codes"
              >
                <Download style={{ width: "24px", height: "24px", flexShrink: 0 }} />
                Download Codes
              </button>

              <button
                onClick={() => navigate('/settings')}
                style={{color: "var(--text-primary)"}} className="w-full px-4 py-3.5 bg-gradient-to-br from-[#58a6ff] to-[#a371f7]  border-0 rounded-xl text-base font-semibold cursor-pointer shadow-[0_4px_12px_rgba(102,126,234,0.4)] hover:shadow-[0_6px_16px_rgba(102,126,234,0.5)] transition-shadow"
                aria-label="Complete setup and go to settings"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
          <Link
            to="/settings"
            className="text-[#58a6ff] no-underline text-sm font-semibold hover:text-[#3d9df0] transition-colors"
          >
            Cancel and return to settings
          </Link>
        </div>
      </div>
    </div>
  )
}

