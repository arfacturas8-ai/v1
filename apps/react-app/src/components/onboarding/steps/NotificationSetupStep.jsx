import React, { useState } from 'react'

const NotificationSetupStep = ({ onComplete, onSkip }) => {
  const [preferences, setPreferences] = useState({
    email: {
      enabled: true,
      mentions: true,
      replies: true,
      follows: true,
      community_updates: false,
      weekly_digest: true
    },
    push: {
      enabled: false,
      mentions: true,
      replies: true,
      follows: false,
      voice_calls: true,
      community_updates: false
    },
    inApp: {
      enabled: true,
      mentions: true,
      replies: true,
      follows: true,
      voice_calls: true,
      community_updates: true
    }
  })
  const [pushPermission, setPushPermission] = useState('default')

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setPushPermission(permission)
      
      if (permission === 'granted') {
        setPreferences(prev => ({
          ...prev,
          push: { ...prev.push, enabled: true }
        }))
      }
    }
  }

  const updatePreference = (type, setting, value) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [setting]: value
      }
    }))
  }

  const savePreferences = async () => {
    try {
      await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(preferences)
      })
      onComplete()
    } catch (error) {
      console.error('Failed to save preferences:', error)
      onComplete() // Still allow progression
    }
  }

  return (
    <div style={{
  paddingTop: '16px',
  paddingBottom: '16px'
}}>
      <div style={{
  textAlign: 'center'
}}>
        <h3 style={{
  fontWeight: 'bold',
  color: '#A0A0A0'
}}>Notification Preferences</h3>
        <p style={{
  color: '#A0A0A0'
}}>
          Choose how you want to be notified about community activity and updates.
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications */}
        <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-2xl">📧</span>
              <div>
                <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Email Notifications</h4>
                <p style={{
  color: '#A0A0A0'
}}>Get updates via email</p>
              </div>
            </div>
            <label style={{
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center'
}}>
              <input
                type="checkbox"
                checked={preferences.email.enabled}
                onChange={(e) => updatePreference('email', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div style={{
  width: '44px',
  height: '24px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '50%',
  border: '1px solid var(--border-subtle)'
}}></div>
            </label>
          </div>
          
          {preferences.email.enabled && (
            <div className="space-y-3 ml-11">
              {[
                { key: 'mentions', label: 'When someone mentions you' },
                { key: 'replies', label: 'Replies to your posts' },
                { key: 'follows', label: 'New followers' },
                { key: 'community_updates', label: 'Community announcements' },
                { key: 'weekly_digest', label: 'Weekly activity digest' }
              ].map(({ key, label }) => (
                <label key={key} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <input
                    type="checkbox"
                    checked={preferences.email[key]}
                    onChange={(e) => updatePreference('email', key, e.target.checked)}
                    style={{
  width: '16px',
  height: '16px',
  borderRadius: '4px'
}}
                  />
                  <span style={{
  color: '#A0A0A0'
}}>{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Push Notifications */}
        <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-2xl">📱</span>
              <div>
                <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Push Notifications</h4>
                <p style={{
  color: '#A0A0A0'
}}>Instant notifications on your device</p>
              </div>
            </div>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              {pushPermission === 'default' && (
                <button
                  onClick={requestPushPermission}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  color: '#ffffff',
  borderRadius: '4px'
}}
                >
                  Enable
                </button>
              )}
              <label style={{
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center'
}}>
                <input
                  type="checkbox"
                  checked={preferences.push.enabled}
                  onChange={(e) => updatePreference('push', 'enabled', e.target.checked)}
                  disabled={pushPermission !== 'granted'}
                  className="sr-only peer"
                />
                <div style={{
  width: '44px',
  height: '24px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '50%',
  border: '1px solid var(--border-subtle)'
}}></div>
              </label>
            </div>
          </div>
          
          {pushPermission === 'denied' && (
            <div style={{
  padding: '12px',
  borderRadius: '12px'
}}>
              <p className="text-sm text-red-700">
                Push notifications are blocked. Enable them in your browser settings to receive instant updates.
              </p>
            </div>
          )}
          
          {preferences.push.enabled && pushPermission === 'granted' && (
            <div className="space-y-3 ml-11">
              {[
                { key: 'mentions', label: 'When someone mentions you' },
                { key: 'replies', label: 'Replies to your posts' },
                { key: 'follows', label: 'New followers' },
                { key: 'voice_calls', label: 'Incoming voice/video calls' },
                { key: 'community_updates', label: 'Community announcements' }
              ].map(({ key, label }) => (
                <label key={key} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <input
                    type="checkbox"
                    checked={preferences.push[key]}
                    onChange={(e) => updatePreference('push', key, e.target.checked)}
                    style={{
  width: '16px',
  height: '16px',
  borderRadius: '4px'
}}
                  />
                  <span style={{
  color: '#A0A0A0'
}}>{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* In-App Notifications */}
        <div style={{
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px',
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-2xl">🔔</span>
              <div>
                <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>In-App Notifications</h4>
                <p style={{
  color: '#A0A0A0'
}}>Notifications while using CRYB</p>
              </div>
            </div>
            <label style={{
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center'
}}>
              <input
                type="checkbox"
                checked={preferences.inApp.enabled}
                onChange={(e) => updatePreference('inApp', 'enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div style={{
  width: '44px',
  height: '24px',
  background: 'rgba(20, 20, 20, 0.6)',
  borderRadius: '50%',
  border: '1px solid var(--border-subtle)'
}}></div>
            </label>
          </div>
          
          {preferences.inApp.enabled && (
            <div className="space-y-3 ml-11">
              {[
                { key: 'mentions', label: 'When someone mentions you' },
                { key: 'replies', label: 'Replies to your posts' },
                { key: 'follows', label: 'New followers' },
                { key: 'voice_calls', label: 'Incoming voice/video calls' },
                { key: 'community_updates', label: 'Community announcements' }
              ].map(({ key, label }) => (
                <label key={key} style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <input
                    type="checkbox"
                    checked={preferences.inApp[key]}
                    onChange={(e) => updatePreference('inApp', key, e.target.checked)}
                    style={{
  width: '16px',
  height: '16px',
  borderRadius: '4px'
}}
                  />
                  <span style={{
  color: '#A0A0A0'
}}>{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
          <h5 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>💡 Notification Tips</h5>
          <div style={{
  color: '#A0A0A0'
}}>
            <div>• You can change these settings anytime in your profile</div>
            <div>• Email digests help you stay updated without spam</div>
            <div>• Push notifications are great for real-time conversations</div>
            <div>• Turn off notifications for communities you're less active in</div>
          </div>
        </div>
      </div>

      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
        <button
          onClick={onSkip}
          style={{
  color: '#A0A0A0'
}}
        >
          Skip for now
        </button>
        
        <button
          onClick={savePreferences}
          style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
        >
          Save & Continue
        </button>
      </div>
    </div>
  )
}




export default NotificationSetupStep
