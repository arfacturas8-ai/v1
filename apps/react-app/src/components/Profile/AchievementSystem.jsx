import React, { useState, useEffect } from 'react'
import { 
  Award, Star, Crown, Shield, Zap, Target, 
  Trophy, Medal, Gem, Heart, Users, MessageSquare,
  FileText, TrendingUp, Calendar, Gift, Lock,
  CheckCircle, Circle, ChevronRight, Info,
  Sparkles, Flame, Mountain, Rocket
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import profileService from '../../services/profileService'
import { useToast } from '../ui/useToast'


export default function AchievementSystem({ 
  userId = null,
  variant = 'full', // 'full', 'showcase', 'progress', 'compact'
  showProgress = true,
  showUnlocked = true,
  className = ''
}) {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  
  const [achievements, setAchievements] = useState([])
  const [unlockedBadges, setUnlockedBadges] = useState([])
  const [progressData, setProgressData] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false)

  const isOwnProfile = !userId || userId === currentUser?.id

  useEffect(() => {
    loadAchievements()
  }, [userId, selectedCategory])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      
      // Load achievements and badges
      const [achievementsData, badgesData] = await Promise.all([
        // profileService.getAchievements(userId),
        // profileService.getBadges(userId)
        Promise.resolve({ achievements: generateMockAchievements() }),
        Promise.resolve({ badges: generateMockBadges() })
      ])
      
      setAchievements(achievementsData.achievements || [])
      setUnlockedBadges(badgesData.badges || [])
      
      // Load progress data for own profile
      if (isOwnProfile) {
        const progressResponse = await Promise.resolve({ progress: generateMockProgress() })
        setProgressData(progressResponse.progress || {})
      }
      
    } catch (error) {
      console.error('Error loading achievements:', error)
      
      // Fallback to mock data
      setAchievements(generateMockAchievements())
      setUnlockedBadges(generateMockBadges())
      setProgressData(generateMockProgress())
      
    } finally {
      setLoading(false)
    }
  }

  const generateMockAchievements = () => [
    {
      id: 'first_post',
      name: 'First Steps',
      description: 'Create your first post',
      icon: 'FileText',
      category: 'content',
      rarity: 'common',
      points: 10,
      unlocked: true,
      unlockedAt: '2024-01-15T10:30:00Z',
      progress: { current: 1, total: 1 }
    },
    {
      id: 'community_builder',
      name: 'Community Builder',
      description: 'Help grow a community to 1000+ members',
      icon: 'Users',
      category: 'community',
      rarity: 'rare',
      points: 100,
      unlocked: true,
      unlockedAt: '2024-02-20T15:45:00Z',
      progress: { current: 1250, total: 1000 }
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Follow 50 users',
      icon: 'Heart',
      category: 'social',
      rarity: 'common',
      points: 25,
      unlocked: true,
      unlockedAt: '2024-01-28T09:15:00Z',
      progress: { current: 67, total: 50 }
    },
    {
      id: 'content_creator',
      name: 'Content Creator',
      description: 'Create 100 posts',
      icon: 'Star',
      category: 'content',
      rarity: 'uncommon',
      points: 50,
      unlocked: false,
      progress: { current: 42, total: 100 }
    },
    {
      id: 'karma_master',
      name: 'Karma Master',
      description: 'Reach 10,000 karma points',
      icon: 'Crown',
      category: 'engagement',
      rarity: 'legendary',
      points: 500,
      unlocked: false,
      progress: { current: 3847, total: 10000 }
    },
    {
      id: 'early_adopter',
      name: 'Early Adopter',
      description: 'Join during the beta period',
      icon: 'Rocket',
      category: 'special',
      rarity: 'epic',
      points: 200,
      unlocked: true,
      unlockedAt: '2024-01-01T00:00:00Z',
      progress: { current: 1, total: 1 }
    },
    {
      id: 'helpful_hand',
      name: 'Helpful Hand',
      description: 'Receive 100 helpful reactions',
      icon: 'Shield',
      category: 'engagement',
      rarity: 'uncommon',
      points: 75,
      unlocked: false,
      progress: { current: 23, total: 100 }
    },
    {
      id: 'conversation_starter',
      name: 'Conversation Starter',
      description: 'Start 50 discussions',
      icon: 'MessageSquare',
      category: 'content',
      rarity: 'common',
      points: 30,
      unlocked: false,
      progress: { current: 18, total: 50 }
    }
  ]

  const generateMockBadges = () => [
    {
      id: 'verified_badge',
      name: 'Verified User',
      description: 'Account verified by platform',
      icon: 'CheckCircle',
      type: 'verification',
      color: '#58a6ff'
    },
    {
      id: 'moderator_badge',
      name: 'Community Moderator',
      description: 'Trusted community moderator',
      icon: 'Shield',
      type: 'role',
      color: '#10b981'
    },
    {
      id: 'supporter_badge',
      name: 'Platform Supporter',
      description: 'Supporting platform development',
      icon: 'Heart',
      type: 'supporter',
      color: '#f59e0b'
    }
  ]

  const generateMockProgress = () => ({
    totalPoints: 385,
    level: 7,
    pointsToNextLevel: 115,
    totalPointsForNextLevel: 500,
    streak: {
      current: 12,
      longest: 28,
      type: 'daily_login'
    },
    categories: {
      content: { completed: 1, total: 3, points: 60 },
      community: { completed: 1, total: 2, points: 100 },
      social: { completed: 1, total: 3, points: 25 },
      engagement: { completed: 0, total: 2, points: 0 },
      special: { completed: 1, total: 1, points: 200 }
    }
  })

  const getAchievementIcon = (iconName) => {
    const icons = {
      FileText, Star, Crown, Shield, Zap, Target,
      Trophy, Medal, Gem, Heart, Users, MessageSquare,
      TrendingUp, Calendar, Gift, CheckCircle,
      Sparkles, Flame, Mountain, Rocket
    }
    return icons[iconName] || Award
  }

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#6b7280',
      uncommon: '#10b981',
      rare: '#58a6ff',
      epic: '#a371f7',
      legendary: '#f59e0b'
    }
    return colors[rarity] || '#6b7280'
  }

  const getCategoryIcon = (category) => {
    const icons = {
      content: FileText,
      community: Users,
      social: Heart,
      engagement: TrendingUp,
      special: Star
    }
    return icons[category] || Award
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const calculateProgress = (current, total) => {
    return Math.min((current / total) * 100, 100)
  }

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false
    }
    if (showUnlockedOnly && !achievement.unlocked) {
      return false
    }
    return true
  })

  const categories = [
    { id: 'all', name: 'All', icon: Award },
    { id: 'content', name: 'Content', icon: FileText },
    { id: 'community', name: 'Community', icon: Users },
    { id: 'social', name: 'Social', icon: Heart },
    { id: 'engagement', name: 'Engagement', icon: TrendingUp },
    { id: 'special', name: 'Special', icon: Star }
  ]

  if (loading) {
    return (
      <div className={`achievement-system achievement-system--loading ${className}`}>
        <div className="achievement-skeleton">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="achievement-card-skeleton">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-description"></div>
                <div className="skeleton-progress"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`achievement-system achievement-system--compact ${className}`}>
        <div className="compact-header">
          <Award size={20} />
          <h3>Achievements</h3>
          <span className="achievement-count">
            {unlockedBadges.length + achievements.filter(a => a.unlocked).length}
          </span>
        </div>
        
        <div className="compact-achievements">
          {unlockedBadges.slice(0, 3).map(badge => (
            <div key={badge.id} className="compact-badge">
              {React.createElement(getAchievementIcon(badge.icon), {
                size: 16,
                style: { color: badge.color }
              })}
            </div>
          ))}
          
          {achievements.filter(a => a.unlocked).slice(0, 3).map(achievement => (
            <div 
              key={achievement.id} 
              className="compact-achievement"
              style={{ borderColor: getRarityColor(achievement.rarity) }}
            >
              {React.createElement(getAchievementIcon(achievement.icon), {
                size: 16,
                style: { color: getRarityColor(achievement.rarity) }
              })}
            </div>
          ))}
          
          {(unlockedBadges.length + achievements.filter(a => a.unlocked).length) > 6 && (
            <div className="compact-more">
              +{(unlockedBadges.length + achievements.filter(a => a.unlocked).length) - 6}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'progress') {
    return (
      <div className={`achievement-system achievement-system--progress ${className}`}>
        <div className="progress-header">
          <div className="level-info">
            <div className="level-badge">
              <Crown size={20} />
              <span>Level {progressData.level}</span>
            </div>
            <div className="points-info">
              <span className="current-points">{progressData.totalPoints}</span>
              <span className="points-label">points</span>
            </div>
          </div>
          
          <div className="level-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${((progressData.totalPointsForNextLevel - progressData.pointsToNextLevel) / progressData.totalPointsForNextLevel) * 100}%` 
                }}
              ></div>
            </div>
            <div className="progress-text">
              {progressData.pointsToNextLevel} points to level {progressData.level + 1}
            </div>
          </div>
        </div>
        
        {progressData.streak && (
          <div className="streak-info">
            <Flame size={16} />
            <span>{progressData.streak.current} day streak</span>
            <span className="streak-best">(best: {progressData.streak.longest})</span>
          </div>
        )}
        
        <div className="category-progress">
          {Object.entries(progressData.categories).map(([category, data]) => {
            const CategoryIcon = getCategoryIcon(category)
            return (
              <div key={category} className="category-item">
                <div className="category-header">
                  <CategoryIcon size={16} />
                  <span>{category.charAt(0).toUpperCase() + category.slice(1)}</span>
                </div>
                <div className="category-stats">
                  <span>{data.completed}/{data.total}</span>
                  <span className="category-points">{data.points} pts</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={`achievement-system achievement-system--full ${className}`}>
      {/* Header */}
      <div className="achievement-header">
        <div className="header-content">
          <div className="header-title">
            <Award size={24} />
            <h2>Achievements & Badges</h2>
          </div>
          
          {isOwnProfile && progressData && (
            <div className="header-stats">
              <div className="stat-item">
                <Trophy size={16} />
                <span>{achievements.filter(a => a.unlocked).length} Unlocked</span>
              </div>
              <div className="stat-item">
                <Star size={16} />
                <span>{progressData.totalPoints} Points</span>
              </div>
              <div className="stat-item">
                <Crown size={16} />
                <span>Level {progressData.level}</span>
              </div>
            </div>
          )}
        </div>
        
        {showProgress && isOwnProfile && progressData && (
          <div className="level-progress-full">
            <div className="progress-info">
              <span>Level {progressData.level}</span>
              <span>{progressData.pointsToNextLevel} points to next level</span>
            </div>
            <div className="progress-bar-full">
              <div 
                className="progress-fill-full"
                style={{ 
                  width: `${((progressData.totalPointsForNextLevel - progressData.pointsToNextLevel) / progressData.totalPointsForNextLevel) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Badges Section */}
      {unlockedBadges.length > 0 && (
        <div className="badges-section">
          <h3>
            <Shield size={18} />
            Special Badges
          </h3>
          <div className="badges-grid">
            {unlockedBadges.map(badge => (
              <div key={badge.id} className="badge-card">
                <div 
                  className="badge-icon"
                  style={{ backgroundColor: badge.color }}
                >
                  {React.createElement(getAchievementIcon(badge.icon), {
                    size: 20,
                    color: 'white'
                  })}
                </div>
                <div className="badge-info">
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories and Filters */}
      <div className="achievement-filters">
        <div className="category-tabs">
          {categories.map(category => {
            const CategoryIcon = category.icon
            return (
              <button
                key={category.id}
                className={`category-tab ${selectedCategory === category.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CategoryIcon size={16} />
                <span>{category.name}</span>
              </button>
            )
          })}
        </div>
        
        <div className="filter-options">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={showUnlockedOnly}
              onChange={(e) => setShowUnlockedOnly(e.target.checked)}
            />
            <span>Show unlocked only</span>
          </label>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="achievements-grid">
        {filteredAchievements.map(achievement => (
          <AchievementCard 
            key={achievement.id} 
            achievement={achievement}
            isOwnProfile={isOwnProfile}
          />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="achievements-empty">
          <Target size={48} />
          <h3>No achievements found</h3>
          <p>Try adjusting your filters or start engaging with the community!</p>
        </div>
      )}
    </div>
  )
}

// Achievement Card Component
function AchievementCard({ achievement, isOwnProfile }) {
  const [showDetails, setShowDetails] = useState(false)
  
  const Icon = getAchievementIcon(achievement.icon)
  const rarityColor = getRarityColor(achievement.rarity)
  const progressPercent = calculateProgress(achievement.progress.current, achievement.progress.total)
  
  return (
    <div 
      className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="achievement-card-header">
        <div 
          className="achievement-icon"
          style={{ 
            backgroundColor: achievement.unlocked ? rarityColor : 'var(--text-secondary)',
            opacity: achievement.unlocked ? 1 : 0.5
          }}
        >
          <Icon size={24} color="white" />
        </div>
        
        <div className="achievement-info">
          <div className="achievement-title">
            <h4>{achievement.name}</h4>
            <div className="rarity-badge" style={{ backgroundColor: rarityColor }}>
              {achievement.rarity}
            </div>
          </div>
          <p>{achievement.description}</p>
          
          {achievement.unlocked && achievement.unlockedAt && (
            <div className="unlock-date">
              <Calendar size={12} />
              <span>Unlocked {formatDate(achievement.unlockedAt)}</span>
            </div>
          )}
        </div>
        
        <div className="achievement-points">
          <Star size={16} />
          <span>{achievement.points}</span>
        </div>
      </div>
      
      {!achievement.unlocked && isOwnProfile && (
        <div className="achievement-progress">
          <div className="progress-bar-small">
            <div 
              className="progress-fill-small"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="progress-text-small">
            {achievement.progress.current} / {achievement.progress.total}
          </div>
        </div>
      )}
      
      {showDetails && (
        <div className="achievement-details">
          <div className="detail-item">
            <span>Category:</span>
            <span>{achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}</span>
          </div>
          <div className="detail-item">
            <span>Rarity:</span>
            <span style={{ color: rarityColor, fontWeight: 600 }}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </span>
          </div>
          <div className="detail-item">
            <span>Points:</span>
            <span>{achievement.points}</span>
          </div>
          {achievement.unlocked && achievement.unlockedAt && (
            <div className="detail-item">
              <span>Unlocked:</span>
              <span>{new Date(achievement.unlockedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper functions
function getAchievementIcon(iconName) {
  const icons = {
    FileText, Star, Crown, Shield, Zap, Target,
    Trophy, Medal, Gem, Heart, Users, MessageSquare,
    TrendingUp, Calendar, Gift, CheckCircle,
    Sparkles, Flame, Mountain, Rocket
  }
  return icons[iconName] || Award
}

function getRarityColor(rarity) {
  const colors = {
    common: '#6b7280',
    uncommon: '#10b981',
    rare: '#58a6ff',
    epic: '#a371f7',
    legendary: '#f59e0b'
  }
  return colors[rarity] || '#6b7280'
}

function calculateProgress(current, total) {
  return Math.min((current / total) * 100, 100)
}
