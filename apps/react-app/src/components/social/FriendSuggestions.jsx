import React, { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, X, Sparkles, TrendingUp,
  MapPin, Calendar, Star, Hash, Eye, EyeOff,
  RefreshCw, Filter, MoreHorizontal, Shuffle
} from 'lucide-react'
import socialService from '../../services/socialService'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../ui/useToast'
import FollowButton from './FollowButton'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card'
import { Button, IconButton } from '../ui/Button'
const FriendSuggestions = ({ 
  onClose, 
  maxSuggestions = 20,
  showHeader = true,
  embedded = false 
}) => {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [algorithm, setAlgorithm] = useState('smart')
  const [showFilters, setShowFilters] = useState(false)
  const [dismissedSuggestions, setDismissedSuggestions] = useState(new Set())
  
  const [filters, setFilters] = useState({
    location: '',
    interests: [],
    minKarma: 0,
    maxKarma: 10000,
    verifiedOnly: false,
    mutualConnectionsMin: 0,
    joinedAfter: '',
    activeRecently: false
  })

  const algorithmOptions = [
    { value: 'smart', label: 'Smart Recommendations', icon: <Sparkles size={16} /> },
    { value: 'mutual', label: 'Mutual Connections', icon: <Users size={16} /> },
    { value: 'trending', label: 'Trending Users', icon: <TrendingUp size={16} /> },
    { value: 'nearby', label: 'Nearby Users', icon: <MapPin size={16} /> },
    { value: 'new', label: 'New Users', icon: <Calendar size={16} /> },
    { value: 'similar', label: 'Similar Interests', icon: <Hash size={16} /> }
  ]

  useEffect(() => {
    loadSuggestions()
  }, [algorithm])

  const loadSuggestions = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      const response = await socialService.getFriendSuggestions(maxSuggestions, algorithm)
      
      const newSuggestions = (response.suggestions || []).map(suggestion => ({
        ...suggestion,
        id: suggestion.user?.id || suggestion.id,
        user: suggestion.user || suggestion,
        reason: suggestion.reason || 'Suggested for you',
        score: suggestion.score || Math.random(),
        mutualConnections: suggestion.mutualConnections || 0,
        algorithm: algorithm
      }))

      setSuggestions(newSuggestions)
      
    } catch (error) {
      console.error('Error loading suggestions:', error)
      showToast('Failed to load suggestions', 'error')
      
      // Mock data for demo
      const mockSuggestions = generateMockSuggestions()
      setSuggestions(mockSuggestions)
      
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const generateMockSuggestions = useCallback(() => {
    const reasonTemplates = {
      smart: [
        'Similar interests',
        'Active in same communities',
        'Highly recommended',
        'Popular in your network'
      ],
      mutual: [
        '5 mutual connections',
        '8 mutual connections',
        '12 mutual connections',
        '3 mutual connections'
      ],
      trending: [
        'Trending creator',
        'Rising star',
        'Popular this week',
        'Viral content creator'
      ],
      nearby: [
        'Lives in San Francisco',
        'Lives in New York',
        'Lives in Los Angeles',
        'Lives in Austin'
      ],
      new: [
        'Joined this week',
        'New to CRYB',
        'Fresh perspective',
        'Recently active'
      ],
      similar: [
        'Loves Web3',
        'Crypto enthusiast',
        'Tech innovator',
        'Digital artist'
      ]
    }

    const baseUsers = [
      {
        id: 'suggested_1',
        username: 'cryptowhale',
        displayName: 'Crypto Whale',
        avatar: '🐋',
        bio: 'DeFi researcher and whale tracker. Building the future of finance.',
        karma: 4521,
        isVerified: true,
        isOnline: true,
        location: 'San Francisco, CA',
        joinedDate: '2023-01-15',
        interests: ['DeFi', 'Trading', 'Analytics'],
        mutualConnections: 8
      },
      {
        id: 'suggested_2',
        username: 'nftartist',
        displayName: 'NFT Artist',
        avatar: '🎨',
        bio: 'Digital artist creating unique NFTs. Passionate about creative expression.',
        karma: 2156,
        isVerified: false,
        isOnline: false,
        location: 'Brooklyn, NY',
        joinedDate: '2023-03-22',
        interests: ['Art', 'NFTs', 'Design'],
        mutualConnections: 5
      },
      {
        id: 'suggested_3',
        username: 'metaverse_dev',
        displayName: 'Metaverse Dev',
        avatar: '🚀',
        bio: 'VR/AR developer building immersive experiences in the metaverse.',
        karma: 3890,
        isVerified: true,
        isOnline: true,
        location: 'Seattle, WA',
        joinedDate: '2023-02-10',
        interests: ['VR', 'Gaming', 'Development'],
        mutualConnections: 12
      },
      {
        id: 'suggested_4',
        username: 'web3builder',
        displayName: 'Web3 Builder',
        avatar: '⛓️',
        bio: 'Full-stack developer specializing in blockchain and Web3 technologies.',
        karma: 1567,
        isVerified: false,
        isOnline: true,
        location: 'Austin, TX',
        joinedDate: '2023-04-05',
        interests: ['Blockchain', 'Development', 'Innovation'],
        mutualConnections: 3
      },
      {
        id: 'suggested_5',
        username: 'daofoundress',
        displayName: 'DAO Foundress',
        avatar: '👑',
        bio: 'Community builder and DAO governance expert. Democratizing organizations.',
        karma: 5234,
        isVerified: true,
        isOnline: false,
        location: 'Miami, FL',
        joinedDate: '2023-01-28',
        interests: ['Governance', 'Community', 'Leadership'],
        mutualConnections: 15
      }
    ]

    const reasons = reasonTemplates[algorithm] || reasonTemplates.smart
    
    return baseUsers.map((user, index) => ({
      ...user,
      reason: reasons[index % reasons.length],
      score: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      algorithm: algorithm
    }))
  }, [algorithm])

  const handleDismissSuggestion = async (userId) => {
    try {
      await socialService.dismissSuggestion(userId)
      
      setSuggestions(prev => prev.filter(s => s.id !== userId))
      setDismissedSuggestions(prev => new Set([...prev, userId]))
      
      showToast('Suggestion dismissed', 'info')
      
    } catch (error) {
      console.error('Error dismissing suggestion:', error)
      showToast('Failed to dismiss suggestion', 'error')
    }
  }

  const handleFollowStateChange = (userId, newState) => {
    if (newState.isFollowing) {
      // Remove from suggestions when followed
      setSuggestions(prev => prev.filter(s => s.id !== userId))
    }
  }

  const handleRefresh = () => {
    loadSuggestions(true)
  }

  const handleShuffleSuggestions = () => {
    setSuggestions(prev => [...prev].sort(() => Math.random() - 0.5))
  }

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (dismissedSuggestions.has(suggestion.id)) return false
    
    if (filters.verifiedOnly && !suggestion.user.isVerified) return false
    if (filters.minKarma && suggestion.user.karma < filters.minKarma) return false
    if (filters.maxKarma && suggestion.user.karma > filters.maxKarma) return false
    if (filters.mutualConnectionsMin && suggestion.mutualConnections < filters.mutualConnectionsMin) return false
    if (filters.location && !suggestion.user.location?.toLowerCase().includes(filters.location.toLowerCase())) return false
    
    return true
  })

  const getAlgorithmInfo = () => {
    const option = algorithmOptions.find(opt => opt.value === algorithm)
    return option || algorithmOptions[0]
  }

  if (!embedded && loading) {
    return (
      <div className="suggestions-loading">
        <div className="spinner" />
        <p>Finding great people for you...</p>
      </div>
    )
  }

  const content = (
    <div className="suggestions-content">
      {showHeader && (
        <div className="suggestions-header">
          <div className="header-title">
            <Sparkles size={24} />
            <div>
              <h2>People You May Know</h2>
              <p>Discover interesting people to connect with</p>
            </div>
          </div>
          
          <div className="header-controls">
            <button
              className="control-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh suggestions"
            >
              <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            </button>
            
            <button
              className="control-btn"
              onClick={handleShuffleSuggestions}
              title="Shuffle suggestions"
            >
              <Shuffle size={16} />
            </button>
            
            <button
              className={`control-btn ${showFilters ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
              onClick={() => setShowFilters(!showFilters)}
              title="Show filters"
            >
              <Filter size={16} />
            </button>
            
            {onClose && (
              <button className="close-btn" onClick={onClose}>
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Algorithm Selector */}
      <div className="algorithm-selector">
        <div className="algorithm-current">
          {getAlgorithmInfo().icon}
          <span>{getAlgorithmInfo().label}</span>
        </div>
        
        <select
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value)}
          className="algorithm-select"
        >
          {algorithmOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-grid">
            <div className="filter-group">
              <label>Location:</label>
              <input
                type="text"
                placeholder="City or region"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            
            <div className="filter-group">
              <label>Min Karma:</label>
              <input
                type="number"
                min="0"
                value={filters.minKarma}
                onChange={(e) => setFilters(prev => ({ ...prev, minKarma: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="filter-group">
              <label>Min Mutual:</label>
              <input
                type="number"
                min="0"
                value={filters.mutualConnectionsMin}
                onChange={(e) => setFilters(prev => ({ ...prev, mutualConnectionsMin: parseInt(e.target.value) || 0 }))}
              />
            </div>
            
            <div className="filter-group">
              <label>
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, verifiedOnly: e.target.checked }))}
                />
                Verified only
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      <div className="suggestions-list">
        {loading ? (
          <div className="suggestions-skeleton">
            {Array(6).fill().map((_, i) => (
              <div key={i} className="suggestion-skeleton" />
            ))}
          </div>
        ) : filteredSuggestions.length > 0 ? (
          filteredSuggestions.map(suggestion => (
            <Card key={suggestion.id} variant="interactive" hoverEffect="medium" style={{
  position: 'relative'
}}>
              <IconButton
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDismissSuggestion(suggestion.id)}
                aria-label="Dismiss suggestion"
                style={{
  position: 'absolute'
}}
              >
                <X size={14} />
              </IconButton>

              <CardHeader className="pb-3">
                <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
                  <div style={{
  position: 'relative'
}}>
                    <div style={{
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: '600',
  overflow: 'hidden'
}}>
                      {suggestion.user.avatar ? (
                        typeof suggestion.user.avatar === 'string' && suggestion.user.avatar.startsWith('http') ? (
                          <img src={suggestion.user.avatar} alt={suggestion.user.username} style={{
  width: '100%',
  height: '100%'
}} />
                        ) : (
                          <span>{suggestion.user.avatar}</span>
                        )
                      ) : (
                        <Users size={24} />
                      )}
                    </div>

                    {suggestion.user.isOnline && (
                      <div style={{
  position: 'absolute',
  width: '16px',
  height: '16px',
  borderRadius: '50%'
}} />
                    )}

                    {suggestion.user.isVerified && (
                      <div style={{
  position: 'absolute',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                        <Star size={10} style={{
  color: '#ffffff'
}} />
                      </div>
                    )}
                  </div>

                  <div style={{
  flex: '1'
}}>
                    <CardTitle className="text-base truncate">{suggestion.user.displayName}</CardTitle>
                    <CardDescription className="text-sm">@{suggestion.user.username}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {suggestion.user.bio && (
                  <p className="text-sm text-text-secondary line-clamp-2">{suggestion.user.bio}</p>
                )}

                <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
                  <span style={{
  display: 'inline-flex',
  alignItems: 'center',
  paddingLeft: '8px',
  paddingRight: '8px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderRadius: '50%',
  fontWeight: '500'
}}>
                    {suggestion.reason}
                  </span>
                </div>

                <div style={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}}>
                  {suggestion.user.karma && (
                    <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <Star size={12} />
                      {suggestion.user.karma}
                    </span>
                  )}

                  {suggestion.mutualConnections > 0 && (
                    <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <Users size={12} />
                      {suggestion.mutualConnections} mutual
                    </span>
                  )}

                  {suggestion.user.location && (
                    <span style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                      <MapPin size={12} />
                      {suggestion.user.location}
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border">
                <FollowButton
                  userId={suggestion.id}
                  size="small"
                  variant="primary"
                  onStateChange={(newState) => handleFollowStateChange(suggestion.id, newState)}
                  style={{
  width: '100%'
}}
                />
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="empty-suggestions">
            <Sparkles size={48} />
            <h3>No suggestions found</h3>
            <p>Try adjusting your filters or check back later</p>
            <button className="refresh-btn" onClick={handleRefresh}>
              <RefreshCw size={16} />
              Refresh Suggestions
            </button>
          </div>
        )}
      </div>

      {/* Load More */}
      {filteredSuggestions.length > 0 && filteredSuggestions.length < suggestions.length && (
        <button 
          className="load-more-btn"
          onClick={() => loadSuggestions()}
          disabled={loading}
        >
          Load More Suggestions
        </button>
      )}
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="friend-suggestions-modal">
      <div className="suggestions-container">
        {content}
      </div>
    </div>
  )
}



export default FriendSuggestions