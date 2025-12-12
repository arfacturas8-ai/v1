import React, { useState, useEffect } from 'react'
import { Shield, Key, Copy, Check, AlertCircle, QrCode, Lock } from 'lucide-react'
import { getErrorMessage } from '../../utils/errorUtils'
const TwoFactorAuth = ({ user, onClose, onUpdate }) => {
  const [step, setStep] = useState('setup') // setup, verify, disable
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedBackup, setCopiedBackup] = useState({})
  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.twoFactorEnabled || false)

  useEffect(() => {
    if (is2FAEnabled) {
      setStep('disable')
    } else {
      setup2FA()
    }
  }, [])

  const setup2FA = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setBackupCodes(data.backupCodes || [])
      } else {
        setError('Failed to setup 2FA. Please try again.')
      }
    } catch (error) {
      console.error('2FA setup error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verify2FA = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      })

      if (response.ok) {
        setIs2FAEnabled(true)
        setStep('success')
        if (onUpdate) {
          onUpdate({ ...user, twoFactorEnabled: true })
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid code. Please try again.')
      }
    } catch (error) {
      console.error('2FA verification error:', error)
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const disable2FA = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter your current 2FA code')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: verificationCode })
      })

      if (response.ok) {
        setIs2FAEnabled(false)
        if (onUpdate) {
          onUpdate({ ...user, twoFactorEnabled: false })
        }
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid code. Please try again.')
      }
    } catch (error) {
      console.error('2FA disable error:', error)
      setError('Failed to disable 2FA. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'secret') {
        setCopiedSecret(true)
        setTimeout(() => setCopiedSecret(false), 2000)
      } else if (type.startsWith('backup-')) {
        const index = type.replace('backup-', '')
        setCopiedBackup({ ...copiedBackup, [index]: true })
        setTimeout(() => {
          setCopiedBackup(prev => ({ ...prev, [index]: false }))
        }, 2000)
      }
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 6) {
      setVerificationCode(value)
    }
  }

  const renderSetup = () => (
    <div className="twofa-setup">
      <div className="setup-header">
        <Shield className="setup-icon" size={32} />
        <h3>Enable Two-Factor Authentication</h3>
        <p>Secure your account with an extra layer of protection</p>
      </div>

      <div className="setup-steps">
        <div className="setup-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Install Authenticator App</h4>
            <p>Download Google Authenticator, Authy, or any TOTP app on your phone</p>
          </div>
        </div>

        <div className="setup-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Scan QR Code</h4>
            <div className="qr-container">
              {loading ? (
                <div className="qr-loading">
                  <div className="spinner" />
                  <p>Generating QR Code...</p>
                </div>
              ) : qrCode ? (
                <img src={qrCode} alt="2FA QR Code" className="qr-code" />
              ) : (
                <div className="qr-placeholder">
                  <QrCode size={120} />
                </div>
              )}
            </div>
            
            <div className="manual-entry">
              <p>Can't scan? Enter this code manually:</p>
              <div className="secret-code">
                <code>{secret || 'XXXX-XXXX-XXXX-XXXX'}</code>
                <button 
                  className="copy-btn"
                  onClick={() => copyToClipboard(secret, 'secret')}
                  disabled={!secret}
                >
                  {copiedSecret ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="setup-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Enter Verification Code</h4>
            <p>Enter the 6-digit code from your authenticator app</p>
            <div className="code-input-container">
              <input
                type="text"
                className="code-input"
                placeholder="000000"
                value={verificationCode}
                onChange={handleCodeChange}
                maxLength={6}
                pattern="[0-9]*"
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {typeof error === "string" ? error : getErrorMessage(error, "")}
        </div>
      )}

      <div className="action-buttons">
        <button className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg font-medium transition-all" onClick={onClose}>
          Cancel
        </button>
        <button 
          className="btn-enable"
          onClick={() => setStep('verify')}
          disabled={!verificationCode || verificationCode.length !== 6 || loading}
        >
          {loading ? 'Verifying...' : 'Enable 2FA'}
        </button>
      </div>
    </div>
  )

  const renderVerify = () => (
    <div className="twofa-verify">
      <div className="verify-header">
        <Lock className="verify-icon" size={32} />
        <h3>Verify Your Identity</h3>
        <p>Enter the 6-digit code from your authenticator app</p>
      </div>

      <div className="verify-content">
        <div className="code-input-large">
          <input
            type="text"
            className="code-input"
            placeholder="000000"
            value={verificationCode}
            onChange={handleCodeChange}
            maxLength={6}
            pattern="[0-9]*"
            inputMode="numeric"
            autoFocus
          />
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {typeof error === "string" ? error : getErrorMessage(error, "")}
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg font-medium transition-all" onClick={() => setStep('setup')}>
          Back
        </button>
        <button 
          className="btn-verify"
          onClick={verify2FA}
          disabled={!verificationCode || verificationCode.length !== 6 || loading}
        >
          {loading ? (
            <>
              <div className="spinner small" />
              Verifying...
            </>
          ) : (
            'Verify & Enable'
          )}
        </button>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="twofa-success">
      <div className="success-icon">
        <Check size={48} />
      </div>
      <h3>Two-Factor Authentication Enabled!</h3>
      <p>Your account is now protected with 2FA</p>

      {backupCodes.length > 0 && (
        <div className="backup-codes">
          <h4>
            <Key size={20} />
            Save Your Backup Codes
          </h4>
          <p className="backup-warning">
            Store these codes in a safe place. You can use them to access your account if you lose your phone.
          </p>
          <div className="codes-grid">
            {backupCodes.map((code, index) => (
              <div key={index} className="backup-code-item">
                <code>{code}</code>
                <button 
                  className="copy-btn small"
                  onClick={() => copyToClipboard(code, `backup-${index}`)}
                >
                  {copiedBackup[index] ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))}
          </div>
          <button 
            className="btn-download"
            onClick={() => {
              const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'cryb-backup-codes.txt'
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Download Backup Codes
          </button>
        </div>
      )}

      <button className="btn-done" onClick={onClose}>
        Done
      </button>
    </div>
  )

  const renderDisable = () => (
    <div className="twofa-disable">
      <div className="disable-header">
        <AlertCircle className="warning-icon" size={32} />
        <h3>Disable Two-Factor Authentication?</h3>
        <p>Your account will be less secure without 2FA protection</p>
      </div>

      <div className="disable-content">
        <div className="warning-box">
          <p>
            Disabling 2FA will remove an important security layer from your account. 
            We strongly recommend keeping it enabled.
          </p>
        </div>

        <div className="verify-identity">
          <p>Enter your current 2FA code to confirm:</p>
          <div className="code-input-container">
            <input
              type="text"
              className="code-input"
              placeholder="000000"
              value={verificationCode}
              onChange={handleCodeChange}
              maxLength={6}
              pattern="[0-9]*"
              inputMode="numeric"
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {typeof error === "string" ? error : getErrorMessage(error, "")}
          </div>
        )}
      </div>

      <div className="action-buttons">
        <button className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg font-medium transition-all" onClick={onClose}>
          Keep 2FA Enabled
        </button>
        <button 
          className="btn-disable"
          onClick={disable2FA}
          disabled={!verificationCode || verificationCode.length !== 6 || loading}
        >
          {loading ? 'Disabling...' : 'Disable 2FA'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="twofa-modal">
      <div className="twofa-container">
        {step === 'setup' && renderSetup()}
        {step === 'verify' && renderVerify()}
        {step === 'success' && renderSuccess()}
        {step === 'disable' && renderDisable()}
      </div>
    </div>
  )
}



export default TwoFactorAuth