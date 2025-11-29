import React, { useState, useEffect } from 'react'
import { Fingerprint, Smartphone, Laptop, Trash2, Plus, Shield, CheckCircle, AlertCircle } from 'lucide-react'
import webAuthnService from '../../services/webAuthnService'
const PasskeySettings = () => {
  const [passkeys, setPasskeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSupported, setIsSupported] = useState(false)
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false)
  const [message, setMessage] = useState('')
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    checkSupport()
    loadPasskeys()
  }, [])

  const checkSupport = async () => {
    const supported = webAuthnService.isSupported()
    setIsSupported(supported)

    if (supported) {
      const available = await webAuthnService.isPlatformAuthenticatorAvailable()
      setIsPlatformAvailable(available)
    }
  }

  const loadPasskeys = async () => {
    setLoading(true)
    try {
      const response = await webAuthnService.getPasskeys()
      if (response.success) {
        setPasskeys(response.data.credentials || [])
      }
    } catch (error) {
      console.error('Failed to load passkeys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterPasskey = async () => {
    if (!isSupported || !isPlatformAvailable) {
      showMessage('Passkeys are not supported on this device', 'error')
      return
    }

    setRegistering(true)
    try {
      const deviceName = webAuthnService.getDeviceInfo()
      const response = await webAuthnService.registerPasskey(deviceName)

      if (response.success) {
        showMessage('Passkey registered successfully!', 'success')
        loadPasskeys()
      } else {
        showMessage(response.error || 'Failed to register passkey', 'error')
      }
    } catch (error) {
      console.error('Passkey registration error:', error)
      if (error.name === 'NotAllowedError') {
        showMessage('Passkey registration was cancelled', 'error')
      } else {
        showMessage('Failed to register passkey. Please try again.', 'error')
      }
    } finally {
      setRegistering(false)
    }
  }

  const handleRemovePasskey = async (credentialId, nickname) => {
    if (!window.confirm(`Remove passkey "${nickname}"? You won't be able to use it to sign in anymore.`)) {
      return
    }

    try {
      const response = await webAuthnService.removePasskey(credentialId)
      if (response.success) {
        showMessage('Passkey removed successfully', 'success')
        loadPasskeys()
      } else {
        showMessage('Failed to remove passkey', 'error')
      }
    } catch (error) {
      console.error('Failed to remove passkey:', error)
      showMessage('Failed to remove passkey', 'error')
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 4000)
  }

  const getDeviceIcon = (nickname) => {
    if (!nickname) return <Fingerprint size={24} />

    const lower = nickname.toLowerCase()
    if (lower.includes('iphone') || lower.includes('android')) {
      return <Smartphone size={24} />
    } else if (lower.includes('mac') || lower.includes('windows') || lower.includes('linux')) {
      return <Laptop size={24} />
    }
    return <Fingerprint size={24} />
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isSupported) {
    return (
      <div className="passkey-settings">
        <div className="settings-header">
          <h2>Passkeys</h2>
          <p className="settings-description">Passwordless authentication</p>
        </div>

        <div className="unsupported-message">
          <AlertCircle size={48} />
          <h3>Passkeys Not Supported</h3>
          <p>
            Your browser doesn't support passkeys. Please use a modern browser like
            Chrome, Safari, Firefox, or Edge to use this feature.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="passkey-settings">
      <div className="settings-header">
        <div>
          <h2>Passkeys</h2>
          <p className="settings-description">
            Sign in faster and more securely using Face ID, Touch ID, or Windows Hello
          </p>
        </div>
        {isPlatformAvailable && (
          <button
            className="btn-primary"
            onClick={handleRegisterPasskey}
            disabled={registering}
          >
            <Plus size={16} />
            {registering ? 'Registering...' : 'Add Passkey'}
          </button>
        )}
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {!isPlatformAvailable && (
        <div className="info-banner">
          <Shield size={20} />
          <div>
            <strong>Platform Authenticator Not Available</strong>
            <p>
              This device doesn't have a built-in authenticator (Face ID, Touch ID, or Windows Hello).
              You can still use security keys if available.
            </p>
          </div>
        </div>
      )}

      {/* Passkeys List */}
      {loading ? (
        <div className="loading-state">Loading passkeys...</div>
      ) : passkeys.length === 0 ? (
        <div className="empty-state">
          <Fingerprint size={64} />
          <h3>No Passkeys Yet</h3>
          <p>
            Passkeys let you sign in without typing a password.
            They're faster, easier, and more secure.
          </p>
          {isPlatformAvailable && (
            <button
              className="btn-primary"
              onClick={handleRegisterPasskey}
              disabled={registering}
            >
              <Plus size={16} />
              {registering ? 'Registering...' : 'Create Your First Passkey'}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="passkeys-list">
            {passkeys.map(passkey => (
              <div key={passkey.credentialId} className="passkey-card">
                <div className="passkey-icon">
                  {getDeviceIcon(passkey.nickname)}
                </div>
                <div className="passkey-info">
                  <h3>{passkey.nickname || 'Unnamed Passkey'}</h3>
                  <div className="passkey-meta">
                    <span>Added {formatDate(passkey.createdAt)}</span>
                    {passkey.lastUsed && (
                      <span>• Last used {formatDate(passkey.lastUsed)}</span>
                    )}
                  </div>
                  {passkey.transports && (
                    <div className="passkey-transports">
                      {passkey.transports.map(transport => (
                        <span key={transport} className="transport-badge">
                          {transport}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="btn-danger-ghost"
                  onClick={() => handleRemovePasskey(passkey.credentialId, passkey.nickname)}
                  title="Remove passkey"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="passkey-benefits">
            <h3>
              <CheckCircle size={20} />
              Benefits of Passkeys
            </h3>
            <ul>
              <li>✓ Faster sign-in with Face ID, Touch ID, or Windows Hello</li>
              <li>✓ More secure than passwords - can't be phished or stolen</li>
              <li>✓ Works across your devices with iCloud or Google sync</li>
              <li>✓ No passwords to remember or reset</li>
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
export default PasskeySettings
