import React, { useState, useEffect } from 'react'

const JoinCommunitiesStep = ({ onComplete, onSkip }) => {
  const [communities, setCommunities] = useState([])
  const [selectedCommunities, setSelectedCommunities] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPopularCommunities()
  }, [])

  const fetchPopularCommunities = async () => {
    try {
      const response = await fetch('/api/communities?featured=true&limit=12')
      if (response.ok) {
        const data = await response.json()
        setCommunities(data.communities || [])
      }
    } catch (error) {
      console.error('Failed to fetch communities:', error)
      // Mock data for demo
      setCommunities([
        { id: 1, name: 'Welcome & General', description: 'General discussions and introductions', members: 15420, category: 'General', isDefault: true },
        { id: 2, name: 'Tech & Innovation', description: 'Latest in technology and innovation', members: 8930, category: 'Technology' },
        { id: 3, name: 'Crypto & Web3', description: 'Cryptocurrency and blockchain discussions', members: 12340, category: 'Crypto' },
        { id: 4, name: 'Gaming Hub', description: 'All things gaming and esports', members: 7650, category: 'Gaming' },
        { id: 5, name: 'Art & Creativity', description: 'Share and discuss art, music, and creative works', members: 5430, category: 'Art' },
        { id: 6, name: 'Startup Corner', description: 'Entrepreneurs and startup discussions', members: 4320, category: 'Business' },
        { id: 7, name: 'Learning & Education', description: 'Share knowledge and learn together', members: 6780, category: 'Education' },
        { id: 8, name: 'Fitness & Health', description: 'Health, fitness, and wellness community', members: 3450, category: 'Health' },
        { id: 9, name: 'Travel & Culture', description: 'Share travel experiences and cultural insights', members: 2890, category: 'Travel' },
        { id: 10, name: 'Food & Cooking', description: 'Recipes, cooking tips, and food discussions', members: 4100, category: 'Food' },
        { id: 11, name: 'Books & Literature', description: 'Book recommendations and literary discussions', members: 2340, category: 'Books' },
        { id: 12, name: 'Music & Audio', description: 'Music sharing and audio discussions', members: 5670, category: 'Music' }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommunityToggle = (communityId) => {
    setSelectedCommunities(prev => 
      prev.includes(communityId)
        ? prev.filter(id => id !== communityId)
        : [...prev, communityId]
    )
  }

  const handleJoinSelected = async () => {
    if (selectedCommunities.length === 0) {
      onSkip()
      return
    }

    try {
      // Join selected communities
      await Promise.all(
        selectedCommunities.map(communityId =>
          fetch(`/api/communities/${communityId}/join`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        )
      )
      onComplete()
    } catch (error) {
      console.error('Failed to join communities:', error)
      // Still allow progression
      onComplete()
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'General': '💬',
      'Technology': '💻',
      'Crypto': '💰',
      'Gaming': '🎮',
      'Art': '🎨',
      'Business': '💼',
      'Education': '📚',
      'Health': '💪',
      'Travel': '✈️',
      'Food': '🍳',
      'Books': '📖',
      'Music': '🎵'
    }
    return icons[category] || '🌟'
  }

  if (isLoading) {
    return (
      <div style={{
  textAlign: 'center',
  paddingTop: '32px',
  paddingBottom: '32px'
}}>
        <div style={{
  borderRadius: '50%',
  height: '48px',
  width: '48px'
}}></div>
        <p style={{
  color: '#c9d1d9'
}}>Loading communities...</p>
      </div>
    )
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
}}>Join Communities</h3>
        <p style={{
  color: '#c9d1d9'
}}>
          Discover communities that match your interests. You can always join more later!
        </p>
      </div>

      <div className="mb-6">
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <h4 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>
            Popular Communities
          </h4>
          <div style={{
  color: '#c9d1d9'
}}>
            {selectedCommunities.length} selected
          </div>
        </div>
        
        <div style={{
  display: 'grid',
  gap: '16px'
}}>
          {communities.map(community => (
            <div
              key={community.id}
              style={{
  padding: '16px',
  borderRadius: '12px'
}}
              onClick={() => handleCommunityToggle(community.id)}
            >
              <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
}}>
                <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
                  <span className="text-2xl">{getCategoryIcon(community.category)}</span>
                  <div>
                    <h5 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>
                      {community.name}
                    </h5>
                    {community.isDefault && (
                      <span style={{
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                        Recommended
                      </span>
                    )}
                  </div>
                </div>
                <div style={{
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  {selectedCommunities.includes(community.id) && (
                    <svg style={{
  width: '12px',
  height: '12px',
  color: '#ffffff'
}} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              
              <p style={{
  color: '#c9d1d9'
}}>
                {community.description}
              </p>
              
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#c9d1d9'
}}>
                <span>{community.members.toLocaleString()} members</span>
                <span style={{
  background: 'rgba(22, 27, 34, 0.6)',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '4px'
}}>
                  {community.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedCommunities.length > 0 && (
        <div style={{
  padding: '16px',
  borderRadius: '12px'
}}>
          <h5 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>
            Communities you'll join:
          </h5>
          <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
            {selectedCommunities.map(id => {
              const community = communities.find(c => c.id === id)
              return (
                <span
                  key={id}
                  style={{
  paddingLeft: '12px',
  paddingRight: '12px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center'
}}
                >
                  <span>{getCategoryIcon(community?.category)}</span>
                  <span>{community?.name}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  padding: '24px',
  borderRadius: '12px'
}}>
        <h5 style={{
  fontWeight: '600',
  color: '#c9d1d9'
}}>💡 Community Tips</h5>
        <div style={{
  display: 'grid',
  gap: '16px',
  color: '#c9d1d9'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
            <span className="text-green-500 mt-1">✓</span>
            <span>Start by introducing yourself in the Welcome community</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
            <span className="text-green-500 mt-1">✓</span>
            <span>Read community rules before posting</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
            <span className="text-green-500 mt-1">✓</span>
            <span>Use voice chat to connect with other members</span>
          </div>
          <div style={{
  display: 'flex',
  alignItems: 'flex-start'
}}>
            <span className="text-green-500 mt-1">✓</span>
            <span>Join communities that match your interests</span>
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
          onClick={handleJoinSelected}
          style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
        >
          {selectedCommunities.length > 0 
            ? `Join ${selectedCommunities.length} Communities`
            : 'Continue'
          }
        </button>
      </div>
    </div>
  )
}




export default JoinCommunitiesStep
