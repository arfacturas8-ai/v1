import { useAuth } from '../../../contexts/AuthContext.jsx'

const WelcomeStep = ({ onComplete }) => {
  const { user } = useAuth()

  return (
    <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
      <div className="mb-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 style={{
  fontWeight: 'bold',
  color: '#A0A0A0'
}}>
          Welcome to CRYB, {user?.username || 'friend'}!
        </h3>
        <p style={{
  color: '#A0A0A0'
}}>
          You've joined the most innovative decentralized community platform. 
          We're here to help you get the most out of your CRYB experience.
        </p>
      </div>

      <div style={{
  display: 'grid',
  gap: '24px'
}}>
        <div style={{
  padding: '24px',
  borderRadius: '12px'
}}>
          <div className="text-3xl mb-3">🏘️</div>
          <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Join Communities</h4>
          <p style={{
  color: '#A0A0A0'
}}>
            Discover and participate in communities that match your interests
          </p>
        </div>
        
        <div style={{
  padding: '24px',
  borderRadius: '12px'
}}>
          <div className="text-3xl mb-3">🎤</div>
          <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Voice & Video</h4>
          <p style={{
  color: '#A0A0A0'
}}>
            Connect with others through real-time voice and video chat
          </p>
        </div>
        
        <div style={{
  padding: '24px',
  borderRadius: '12px'
}}>
          <div className="text-3xl mb-3">💰</div>
          <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>Earn Rewards</h4>
          <p style={{
  color: '#A0A0A0'
}}>
            Get CRYB tokens for participating and contributing to the community
          </p>
        </div>
      </div>

      <div style={{
  padding: '24px',
  borderRadius: '12px'
}}>
        <h4 style={{
  fontWeight: '600',
  color: '#A0A0A0'
}}>What makes CRYB special?</h4>
        <div style={{
  display: 'grid',
  gap: '16px',
  color: '#A0A0A0'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <span className="text-green-500">✓</span>
            <span>Decentralized and community-owned</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <span className="text-green-500">✓</span>
            <span>Built-in cryptocurrency rewards</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <span className="text-green-500">✓</span>
            <span>Real-time voice and video chat</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            <span className="text-green-500">✓</span>
            <span>NFT integration and marketplace</span>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={onComplete}
          style={{
  paddingLeft: '32px',
  paddingRight: '32px',
  paddingTop: '12px',
  paddingBottom: '12px',
  color: '#ffffff',
  fontWeight: '600',
  borderRadius: '12px'
}}
        >
          Let's Get Started! 🚀
        </button>
      </div>
    </div>
  )
}




export default WelcomeStep
