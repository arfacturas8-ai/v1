import React, { useState, useEffect } from 'react'
import { Key, Copy, Trash2, Eye, EyeOff, Plus, Calendar, Activity, AlertTriangle } from 'lucide-react'
import apiKeysService from '../../services/apiKeysService'
import { useConfirmationDialog } from '../ui/modal'
const APIKeysSettings = () => {
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyData, setNewKeyData] = useState({
    name: '',
    scopes: [],
    expiresInDays: 90
  })
  const [createdKey, setCreatedKey] = useState(null)
  const [visibleKeys, setVisibleKeys] = useState({})
  const [message, setMessage] = useState('')

  const { confirm, ConfirmationDialog } = useConfirmationDialog()

  useEffect(() => {
    loadAPIKeys()
  }, [])

  const loadAPIKeys = async () => {
    setLoading(true)
    try {
      const response = await apiKeysService.getAPIKeys()
      if (response.success) {
        setApiKeys(response.data.items || [])
      }
    } catch (error) {
      console.error('Failed to load API keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async () => {
    if (!newKeyData.name.trim()) {
      showMessage('Please enter a name for the API key', 'error')
      return
    }

    if (newKeyData.scopes.length === 0) {
      showMessage('Please select at least one permission scope', 'error')
      return
    }

    try {
      const response = await apiKeysService.createAPIKey(
        newKeyData.name,
        newKeyData.scopes,
        newKeyData.expiresInDays
      )

      if (response.success) {
        setCreatedKey(response.data.key)
        setNewKeyData({ name: '', scopes: [], expiresInDays: 90 })
        loadAPIKeys()
        showMessage('API key created successfully!', 'success')
      }
    } catch (error) {
      showMessage('Failed to create API key', 'error')
    }
  }

  const handleRevokeKey = async (keyId, keyName) => {
    const confirmed = await confirm({
      type: 'error',
      title: 'Revoke API Key',
      description: `Are you sure you want to revoke "${keyName}"? This action cannot be undone and will immediately invalidate the key.`,
      confirmText: 'Revoke',
      confirmVariant: 'destructive'
    })

    if (!confirmed) return

    try {
      const response = await apiKeysService.revokeAPIKey(keyId)
      if (response.success) {
        loadAPIKeys()
        showMessage('API key revoked successfully', 'success')
      }
    } catch (error) {
      showMessage('Failed to revoke API key', 'error')
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showMessage('Copied to clipboard!', 'success')
    } catch (error) {
      showMessage('Failed to copy', 'error')
    }
  }

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }))
  }

  const toggleScope = (scopeId) => {
    setNewKeyData(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scopeId)
        ? prev.scopes.filter(s => s !== scopeId)
        : [...prev.scopes, scopeId]
    }))
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 3000)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const maskKey = (key) => {
    if (!key) return ''
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`
  }

  const availableScopes = apiKeysService.getAvailableScopes()

  return (
    <div className="api-keys-settings">
      <div className="settings-header">
        <div>
          <h2>API Keys</h2>
          <p className="settings-description">
            Manage API keys for programmatic access to your CRYB account
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} />
          Create API Key
        </button>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* API Keys List */}
      {loading ? (
        <div className="loading-state">Loading API keys...</div>
      ) : apiKeys.length === 0 ? (
        <div className="empty-state">
          <Key size={48} />
          <h3>No API Keys</h3>
          <p>Create your first API key to start using the CRYB API</p>
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create API Key
          </button>
        </div>
      ) : (
        <div className="api-keys-list">
          {apiKeys.map(key => (
            <div key={key.id} className="api-key-card">
              <div className="key-header">
                <div className="key-info">
                  <h3>{key.name}</h3>
                  <div className="key-meta">
                    <span className="key-id">ID: {key.id.substring(0, 8)}</span>
                    {key.lastUsed && (
                      <span className="last-used">
                        <Activity size={12} />
                        Last used {formatDate(key.lastUsed)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="btn-danger-ghost"
                  onClick={() => handleRevokeKey(key.id, key.name)}
                  title="Revoke key"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="key-value">
                <code>
                  {visibleKeys[key.id] ? key.key : maskKey(key.key)}
                </code>
                <div className="key-actions">
                  <button
                    onClick={() => toggleKeyVisibility(key.id)}
                    className="btn-icon"
                    title={visibleKeys[key.id] ? 'Hide key' : 'Show key'}
                  >
                    {visibleKeys[key.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(key.key)}
                    className="btn-icon"
                    title="Copy to clipboard"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <div className="key-scopes">
                <strong>Permissions:</strong>
                <div className="scopes-list">
                  {key.scopes?.map(scope => (
                    <span key={scope} className="scope-badge">{scope}</span>
                  ))}
                </div>
              </div>

              {key.expiresAt && (
                <div className="key-expiry">
                  <Calendar size={12} />
                  Expires {formatDate(key.expiresAt)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !createdKey && setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {!createdKey ? (
              <>
                <div className="modal-header">
                  <h2>Create API Key</h2>
                  <button
                    className="modal-close"
                    onClick={() => setShowCreateModal(false)}
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  <div className="form-group">
                    <label>Key Name *</label>
                    <input
                      type="text"
                      value={newKeyData.name}
                      onChange={e => setNewKeyData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Production API, Mobile App, Analytics Bot"
                      className="input"
                    />
                    <small>A descriptive name to identify this key</small>
                  </div>

                  <div className="form-group">
                    <label>Permissions *</label>
                    <div className="scopes-grid">
                      {availableScopes.map(scope => (
                        <label key={scope.id} className="scope-checkbox">
                          <input
                            type="checkbox"
                            checked={newKeyData.scopes.includes(scope.id)}
                            onChange={() => toggleScope(scope.id)}
                          />
                          <div>
                            <strong>{scope.name}</strong>
                            <small>{scope.description}</small>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Expiration</label>
                    <select
                      value={newKeyData.expiresInDays}
                      onChange={e => setNewKeyData(prev => ({
                        ...prev,
                        expiresInDays: e.target.value ? parseInt(e.target.value) : null
                      }))}
                      className="select"
                    >
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                      <option value="180">180 days</option>
                      <option value="365">1 year</option>
                      <option value="">Never expire</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleCreateKey}
                  >
                    Create Key
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-header success">
                  <h2>API Key Created!</h2>
                </div>

                <div className="modal-body">
                  <div className="success-message">
                    <AlertTriangle size={24} />
                    <p>
                      <strong>Important:</strong> Copy your API key now.
                      You won't be able to see it again!
                    </p>
                  </div>

                  <div className="created-key-display">
                    <label>Your API Key</label>
                    <div className="key-copy-box">
                      <code>{createdKey}</code>
                      <button
                        className="btn-primary"
                        onClick={() => copyToClipboard(createdKey)}
                      >
                        <Copy size={16} />
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="api-docs-link">
                    <p>
                      Use this key in the Authorization header of your API requests:
                    </p>
                    <code className="code-example">
                      Authorization: Bearer {createdKey}
                    </code>
                    <a
                      href="https://docs.cryb.ai/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link"
                    >
                      View API Documentation →
                    </a>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setCreatedKey(null)
                      setShowCreateModal(false)
                    }}
                  >
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {ConfirmationDialog}
    </div>
  )
}
export default APIKeysSettings
