import React, { useState } from 'react'

const VoiceVideoStep = ({ onComplete, onSkip }) => {
  const [permissions, setPermissions] = useState({
    microphone: null,
    camera: null
  })
  const [isTestingAudio, setIsTestingAudio] = useState(false)

  const checkPermissions = async () => {
    try {
      // Check microphone
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissions(prev => ({ ...prev, microphone: true }))
      audioStream.getTracks().forEach(track => track.stop())

      // Check camera
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        setPermissions(prev => ({ ...prev, camera: true }))
        videoStream.getTracks().forEach(track => track.stop())
      } catch (videoError) {
        setPermissions(prev => ({ ...prev, camera: false }))
      }
    } catch (audioError) {
      setPermissions(prev => ({ ...prev, microphone: false, camera: false }))
    }
  }

  const testAudio = async () => {
    setIsTestingAudio(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Simulate audio test
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop())
        setIsTestingAudio(false)
      }, 2000)
    } catch (error) {
      setIsTestingAudio(false)
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
  color: '#c9d1d9'
}}>Try Voice & Video</h3>
        <p style={{
  color: '#c9d1d9'
}}>
          CRYB's real-time communication features help you connect with community members.
        </p>
      </div>

      <div className="space-y-6">
        <div style={{
  padding: '24px',
  borderRadius: '12px'
}}>
          <h4 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>🎤 Audio & Video Permissions</h4>
          <p style={{
  color: '#c9d1d9'
}}>
            Grant permissions to use voice and video features in communities.
          </p>
          
          <div className="space-y-3">
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  borderRadius: '12px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <span className="text-xl">🎤</span>
                <span style={{
  fontWeight: '500'
}}>Microphone Access</span>
              </div>
              <div style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#c9d1d9'
}}>
                {permissions.microphone === true ? 'Granted' :
                 permissions.microphone === false ? 'Denied' : 'Not checked'}
              </div>
            </div>
            
            <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px',
  borderRadius: '12px'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                <span className="text-xl">📹</span>
                <span style={{
  fontWeight: '500'
}}>Camera Access</span>
              </div>
              <div style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#c9d1d9'
}}>
                {permissions.camera === true ? 'Granted' :
                 permissions.camera === false ? 'Denied' : 'Not checked'}
              </div>
            </div>
          </div>
          
          <button
            onClick={checkPermissions}
            style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
          >
            Check Permissions
          </button>
        </div>

        <div style={{
  display: 'grid',
  gap: '16px'
}}>
          <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
            <h5 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>🎙️ Voice Chat Features</h5>
            <ul style={{
  color: '#c9d1d9'
}}>
              <li>• Crystal clear audio quality</li>
              <li>• Push-to-talk or open mic</li>
              <li>• Noise suppression</li>
              <li>• Individual volume controls</li>
            </ul>
          </div>
          
          <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
            <h5 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>📹 Video Chat Features</h5>
            <ul style={{
  color: '#c9d1d9'
}}>
              <li>• HD video streaming</li>
              <li>• Screen sharing</li>
              <li>• Virtual backgrounds</li>
              <li>• Picture-in-picture mode</li>
            </ul>
          </div>
        </div>

        {permissions.microphone && (
          <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '16px',
  borderRadius: '12px'
}}>
            <h5 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>🔊 Test Your Audio</h5>
            <p style={{
  color: '#c9d1d9'
}}>
              Test your microphone to make sure it's working properly.
            </p>
            <button
              onClick={testAudio}
              disabled={isTestingAudio}
              style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  background: 'rgba(22, 27, 34, 0.6)',
  color: '#ffffff'
}}
            >
              {isTestingAudio ? 'Testing...' : 'Test Microphone'}
            </button>
          </div>
        )}

        <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
          <h5 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>💡 Voice Chat Tips</h5>
          <div style={{
  color: '#c9d1d9'
}}>
            <div>• Use headphones to prevent echo</div>
            <div>• Mute when not speaking in large groups</div>
            <div>• Test your setup before important calls</div>
            <div>• Respect community voice chat rules</div>
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
  color: '#c9d1d9'
}}
        >
          Skip for now
        </button>
        
        <button
          onClick={onComplete}
          style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
        >
          Continue
        </button>
      </div>
    </div>
  )
}




export default VoiceVideoStep
