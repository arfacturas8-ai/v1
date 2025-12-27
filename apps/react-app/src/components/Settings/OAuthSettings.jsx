import React, { useState, useEffect } from 'react'
import { Link2, Unlink, CheckCircle, ExternalLink, Shield } from 'lucide-react'
import oauthService from '../../services/oauthService'
import ConfirmationModal from '../modals/ConfirmationModal'

const OAuthSettings = () => {
  const [connectedProviders, setConnectedProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState({})
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)
  const [providerToDisconnect, setProviderToDisconnect] = useState(null)

  const availableProviders = oauthService.getAvailableProviders()

  useEffect(() => {
    loadOAuthStatus()
  }, [])

  const loadOAuthStatus = async () => {
    setLoading(true)
    try {
      const response = await oauthService.getOAuthStatus()
      if (response.success) {
        setConnectedProviders(response.data.providers || [])
      }
    } catch (error) {
      console.error('Failed to load OAuth status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (providerId) => {
    setProcessing(prev => ({ ...prev, [providerId]: true }))
    try {
      await oauthService.connectProvider(providerId)
      // User will be redirected to OAuth provider
    } catch (error) {
      showMessage(`Failed to connect ${providerId}`, 'error')
      setProcessing(prev => ({ ...prev, [providerId]: false }))
    }
  }

  const handleDisconnect = (providerId, providerName) => {
    setProviderToDisconnect({ providerId, providerName })
    setShowDisconnectModal(true)
  }

  const confirmDisconnect = async () => {
    if (!providerToDisconnect) return

    const { providerId, providerName } = providerToDisconnect
    setShowDisconnectModal(false)
    setProcessing(prev => ({ ...prev, [providerId]: true }))

    try {
      const response = await oauthService.disconnectProvider(providerId)
      if (response.success) {
        showMessage(`${providerName} disconnected successfully`, 'success')
        loadOAuthStatus()
      } else {
        showMessage(`Failed to disconnect ${providerName}`, 'error')
      }
    } catch (error) {
      showMessage(`Failed to disconnect ${providerName}`, 'error')
    } finally {
      setProcessing(prev => ({ ...prev, [providerId]: false }))
      setProviderToDisconnect(null)
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }

  const isConnected = (providerId) => {
    return connectedProviders.some(p => p.provider === providerId && p.connected)
  }

  const getProviderData = (providerId) => {
    return connectedProviders.find(p => p.provider === providerId)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="oauth-settings">
      <div className="settings-header">
        <div>
          <h2>Connected Accounts</h2>
          <p className="settings-description">
            Connect external accounts for easy sign-in and enhanced features
          </p>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="info-banner">
        <Shield size={20} />
        <div>
          <strong>Your Privacy is Protected</strong>
          <p>
            We only access basic profile information. You can disconnect at any time.
            We never post without your permission.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading connected accounts...</div>
      ) : (
        <div className="providers-list">
          {availableProviders.map(provider => {
            const connected = isConnected(provider.id)
            const providerData = getProviderData(provider.id)

            return (
              <div key={provider.id} className="provider-card">
                <div className="provider-header">
                  <div className="provider-icon" style={{ background: provider.color }}>
                    <img src={provider.icon} alt={provider.name} />
                  </div>
                  <div className="provider-info">
                    <h3>{provider.name}</h3>
                    <p>{provider.description}</p>
                    {connected && providerData && (
                      <div className="provider-meta">
                        {providerData.email && (
                          <span className="provider-email">{providerData.email}</span>
                        )}
                        {providerData.connectedAt && (
                          <span className="provider-connected">
                            Connected {formatDate(providerData.connectedAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="provider-actions">
                  {connected ? (
                    <>
                      <div className="connected-badge">
                        <CheckCircle size={16} />
                        Connected
                      </div>
                      <button
                        className="btn-danger-outline"
                        onClick={() => handleDisconnect(provider.id, provider.name)}
                        disabled={processing[provider.id]}
                      >
                        {processing[provider.id] ? (
                          'Disconnecting...'
                        ) : (
                          <>
                            <Unlink size={16} />
                            Disconnect
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => handleConnect(provider.id)}
                      disabled={processing[provider.id]}
                    >
                      {processing[provider.id] ? (
                        'Connecting...'
                      ) : (
                        <>
                          <Link2 size={16} />
                          Connect
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="oauth-features">
        <h3>Benefits of Connecting Accounts</h3>
        <ul>
          <li>
            <CheckCircle size={16} />
            Sign in faster without typing your password
          </li>
          <li>
            <CheckCircle size={16} />
            Keep your profile picture and info up to date
          </li>
          <li>
            <CheckCircle size={16} />
            Import friends and contacts (optional)
          </li>
          <li>
            <CheckCircle size={16} />
            Share content to connected platforms
          </li>
        </ul>
      </div>

      <div className="oauth-help">
        <h4>Having trouble?</h4>
        <p>
          If you're unable to connect an account, make sure you've allowed pop-ups for this site.
          You can also try using a different browser.
        </p>
        <a href="/help" className="help-link">
          <ExternalLink size={14} />
          View Help Center
        </a>
      </div>

      {/* Disconnect Provider Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDisconnectModal}
        onClose={() => {
          setShowDisconnectModal(false)
          setProviderToDisconnect(null)
        }}
        onConfirm={confirmDisconnect}
        title="Disconnect OAuth Provider"
        message={`Disconnect ${providerToDisconnect?.providerName}? You won't be able to sign in with this account.`}
        confirmText="Disconnect"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  )
}
export default OAuthSettings
