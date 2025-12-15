import React, { useState, useEffect, useCallback } from 'react'
import {
  User, Crown, Trophy, Star, Shield, Zap, Award,
  Activity, Calendar, Users, MessageSquare, FileText,
  TrendingUp, Gift,
  MoreHorizontal, Map, Link
} from 'lucide-react'
import KarmaSystem from '../KarmaSystem'
import AwardNotificationSystem from '../community/AwardNotificationSystem'
const EnhancedUserProfile = ({ 
  userId, 
  isOwnProfile = false, 
  onFollow, 
  onUnfollow, 
  onBlock, 
  onReport 
}) => {
  const [user, setUser] = useState(null)
  const [karmaData, setKarmaData] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showKarmaModal, setShowKarmaModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userPosts, setUserPosts] = useState([])
  const [userComments, setUserComments] = useState([])
  const [relationship, setRelationship] = useState({
    isFollowing: false,
    isFollower: false,
    mutualFriends: 0
  })

  useEffect(() => {
    fetchUserProfile()
    fetchKarmaData()
    fetchAchievements()
    if (!isOwnProfile) {
      fetchRelationship()
    }
  }, [userId, isOwnProfile])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setUserPosts(data.posts || [])
        setUserComments(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      // Mock data for demo
      setUser({
        id: userId,
        username: 'cryptoenthusiast',
        displayName: 'Crypto Enthusiast',
        avatar: null,
        banner: null,
        bio: 'Passionate about blockchain technology, DeFi, and building the future of finance. Always learning and sharing knowledge.',
        location: 'San Francisco, CA',
        website: 'https://defi-wizard.io',
        socialLinks: {
          twitter: 'https://twitter.com/cryptoenthusiast',
          github: 'https://github.com/cryptoenthusiast'
        },
        isVerified: true,
        isPremium: true,
        createdAt: new Date('2023-01-15').toISOString(),
        lastActive: new Date().toISOString(),
        stats: {
          posts: 127,
          comments: 834,
          karma: 15420,
          postKarma: 8950,
          commentKarma: 6470,
          followers: 1247,
          following: 892,
          communities: 23,
          awards: 45,
          awardsGiven: 78
        }
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchKarmaData = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/karma`)
      if (response.ok) {
        const data = await response.json()
        setKarmaData(data)
      }
    } catch (error) {
      console.error('Failed to fetch karma data:', error)
      // Mock karma data
      setKarmaData({
        totalKarma: 15420,
        postKarma: 8950,
        commentKarma: 6470,
        weeklyChange: 234,
        monthlyChange: 892,
        rank: 'Expert',
        percentile: 5,
        breakdown: {
          posts: 8950,
          comments: 6470,
          awards: 1250,
          helpfulness: 450,
          consistency: 300
        },
        history: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          karma: Math.floor(Math.random() * 100) + 20
        }))
      })
    }
  }

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/achievements`)
      if (response.ok) {
        const data = await response.json()
        setAchievements(data.achievements)
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
      // Mock achievements
      setAchievements([
        {
          id: 'first_post',
          name: 'First Steps',
          description: 'Made your first post',
          icon: '📝',
          rarity: 'common',
          earnedAt: '2023-01-16T10:30:00Z',
          progress: 100
        },
        {
          id: 'karma_1000',
          name: 'Rising Star',
          description: 'Earned 1,000 karma',
          icon: '⭐',
          rarity: 'uncommon',
          earnedAt: '2023-03-20T15:45:00Z',
          progress: 100
        },
        {
          id: 'karma_10000',
          name: 'Community Leader',
          description: 'Earned 10,000 karma',
          icon: '👑',
          rarity: 'rare',
          earnedAt: '2023-11-15T09:20:00Z',
          progress: 100
        },
        {
          id: 'helpful_100',
          name: 'Helpful Hand',
          description: 'Received 100 helpful awards',
          icon: '🤝',
          rarity: 'epic',
          earnedAt: '2023-10-08T14:10:00Z',
          progress: 100
        },
        {
          id: 'streak_30',
          name: 'Dedicated',
          description: 'Maintained a 30-day activity streak',
          icon: '🔥',
          rarity: 'rare',
          earnedAt: '2023-08-12T18:30:00Z',
          progress: 100
        },
        {
          id: 'expert_contributor',
          name: 'Expert Contributor',
          description: 'Reached Expert karma rank',
          icon: '🏆',
          rarity: 'legendary',
          earnedAt: '2023-12-01T12:00:00Z',
          progress: 100
        },
        {
          id: 'karma_25000',
          name: 'Legend',
          description: 'Earn 25,000 karma',
          icon: '⚡',
          rarity: 'legendary',
          earnedAt: null,
          progress: 62
        }
      ])
    }
  }

  const fetchRelationship = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/relationship`)
      if (response.ok) {
        const data = await response.json()
        setRelationship(data)
      }
    } catch (error) {
      console.error('Failed to fetch relationship:', error)
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-gray-400'
      case 'uncommon': return 'text-green-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  const getRarityBg = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/10 border-gray-500/20'
      case 'uncommon': return 'bg-green-500/10 border-green-500/20'
      case 'rare': return 'bg-[#58a6ff]/10 border-blue-500/20'
      case 'epic': return 'bg-[#a371f7]/10 border-purple-500/20'
      case 'legendary': return 'bg-yellow-500/10 border-yellow-500/20'
      default: return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Karma Overview */}
      <div style={{
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid var(--border-subtle)'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <Star style={{
  width: '20px',
  height: '20px'
}} />
            Karma Overview
          </h3>
          <button
            onClick={() => setShowKarmaModal(true)}
            style={{
  fontWeight: '500'
}}
          >
            View Details
          </button>
        </div>
        
        <div style={{
  display: 'grid',
  gap: '16px'
}}>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>{user?.stats?.karma?.toLocaleString()}</div>
            <div className="text-sm text-muted/70">Total Karma</div>
            {karmaData?.weeklyChange && (
              <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px'
}}>
                <TrendingUp style={{
  width: '12px',
  height: '12px'
}} />
                {karmaData.weeklyChange >= 0 ? '+' : ''}{karmaData.weeklyChange} this week
              </div>
            )}
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>{user?.stats?.postKarma?.toLocaleString()}</div>
            <div className="text-sm text-muted/70">Post Karma</div>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>{user?.stats?.commentKarma?.toLocaleString()}</div>
            <div className="text-sm text-muted/70">Comment Karma</div>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>{karmaData?.rank || 'Member'}</div>
            <div className="text-sm text-muted/70">Rank</div>
            {karmaData?.percentile && (
              <div className="text-xs text-muted/60 mt-1">Top {karmaData.percentile}%</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div style={{
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid var(--border-subtle)'
}}>
        <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <h3 style={{
  fontWeight: '600',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            <Trophy style={{
  width: '20px',
  height: '20px'
}} />
            Recent Achievements
          </h3>
          <button
            onClick={() => setActiveTab('achievements')}
            style={{
  fontWeight: '500'
}}
          >
            View All
          </button>
        </div>
        
        <div style={{
  display: 'grid',
  gap: '12px'
}}>
          {achievements.filter(a => a.earnedAt).slice(0, 4).map(achievement => (
            <div key={achievement.id} style={{
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)'
}}>
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}}>
                <div className="text-2xl">{achievement.icon}</div>
                <div style={{
  flex: '1'
}}>
                  <h4 style={{
  fontWeight: '500'
}}>
                    {achievement.name}
                  </h4>
                  <p className="text-xs text-muted/70">{achievement.description}</p>
                  <p className="text-xs text-muted/60 mt-1">
                    {formatTimestamp(achievement.earnedAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Stats */}
      <div style={{
  display: 'grid',
  gap: '16px'
}}>
        <div style={{
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid var(--border-subtle)',
  textAlign: 'center'
}}>
          <FileText style={{
  width: '24px',
  height: '24px'
}} />
          <div style={{
  fontWeight: 'bold'
}}>{user?.stats?.posts}</div>
          <div className="text-sm text-muted/70">Posts</div>
        </div>
        <div style={{
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid var(--border-subtle)',
  textAlign: 'center'
}}>
          <MessageSquare style={{
  width: '24px',
  height: '24px'
}} />
          <div style={{
  fontWeight: 'bold'
}}>{user?.stats?.comments}</div>
          <div className="text-sm text-muted/70">Comments</div>
        </div>
        <div style={{
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid var(--border-subtle)',
  textAlign: 'center'
}}>
          <Award style={{
  width: '24px',
  height: '24px'
}} />
          <div style={{
  fontWeight: 'bold'
}}>{user?.stats?.awards}</div>
          <div className="text-sm text-muted/70">Awards Received</div>
        </div>
        <div style={{
  borderRadius: '12px',
  padding: '16px',
  border: '1px solid var(--border-subtle)',
  textAlign: 'center'
}}>
          <Gift style={{
  width: '24px',
  height: '24px'
}} />
          <div style={{
  fontWeight: 'bold'
}}>{user?.stats?.awardsGiven}</div>
          <div className="text-sm text-muted/70">Awards Given</div>
        </div>
      </div>
    </div>
  )

  const renderAchievementsTab = () => (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div style={{
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid var(--border-subtle)'
}}>
        <h3 style={{
  fontWeight: '600'
}}>Achievement Progress</h3>
        <div style={{
  display: 'grid',
  gap: '16px',
  textAlign: 'center'
}}>
          {Object.entries({
            common: achievements.filter(a => a.rarity === 'common' && a.earnedAt).length,
            uncommon: achievements.filter(a => a.rarity === 'uncommon' && a.earnedAt).length,
            rare: achievements.filter(a => a.rarity === 'rare' && a.earnedAt).length,
            epic: achievements.filter(a => a.rarity === 'epic' && a.earnedAt).length,
            legendary: achievements.filter(a => a.rarity === 'legendary' && a.earnedAt).length
          }).map(([rarity, count]) => (
            <div key={rarity} style={{
  padding: '12px',
  borderRadius: '12px'
}}>
              <div style={{
  fontWeight: 'bold'
}}>{count}</div>
              <div className="text-sm capitalize">{rarity}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div style={{
  display: 'grid',
  gap: '16px'
}}>
        {achievements.map(achievement => (
          <div 
            key={achievement.id} 
            className={`
              p-4 rounded-lg border transition-all duration-200
              ${achievement.earnedAt 
                ? `${getRarityBg(achievement.rarity)} hover:scale-105` 
                : 'bg-bg-tertiary/30 border-border-primary/20 opacity-60'
              }
            `}
          >
            <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px'
}}>
              <div className={`text-3xl ${achievement.earnedAt ? '' : 'grayscale'}`}>
                {achievement.icon}
              </div>
              <div style={{
  flex: '1'
}}>
                <h4 style={{
  fontWeight: '600'
}}>
                  {achievement.name}
                </h4>
                <p className="text-sm text-muted/70 mb-2">{achievement.description}</p>
                
                {achievement.earnedAt ? (
                  <div className="text-xs text-muted/60">
                    Earned {formatTimestamp(achievement.earnedAt)}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div style={{
  display: 'flex',
  justifyContent: 'space-between'
}}>
                      <span>Progress</span>
                      <span>{achievement.progress}%</span>
                    </div>
                    <div style={{
  width: '100%',
  borderRadius: '50%',
  height: '8px'
}}>
                      <div 
                        style={{
  height: '8px',
  borderRadius: '50%'
}}
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '256px'
}}>
        <div style={{
  borderRadius: '50%',
  height: '32px',
  width: '32px'
}}></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{
  textAlign: 'center',
  paddingTop: '48px',
  paddingBottom: '48px'
}}>
        <User style={{
  width: '64px',
  height: '64px'
}} />
        <h2 style={{
  fontWeight: '600'
}}>User not found</h2>
      </div>
    )
  }

  return (
    <div style={{
  padding: '24px'
}}>
      {/* Profile Header */}
      <div style={{
  borderRadius: '12px',
  padding: '24px',
  border: '1px solid var(--border-subtle)'
}}>
        {/* Banner */}
        <div style={{
  height: '128px',
  borderRadius: '12px',
  position: 'relative',
  overflow: 'hidden'
}}>
          {user.banner && (
            <img src={user.banner} alt="Profile banner" style={{
  width: '100%',
  height: '100%'
}} />
          )}
        </div>

        {/* Profile Info */}
        <div style={{
  display: 'flex',
  alignItems: 'flex-start',
  gap: '24px'
}}>
          {/* Avatar */}
          <div style={{
  position: 'relative'
}}>
            <div style={{
  width: '96px',
  height: '96px',
  borderRadius: '50%',
  overflow: 'hidden'
}}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.displayName} style={{
  width: '100%',
  height: '100%'
}} />
              ) : (
                <div style={{
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
                  <User style={{
  width: '48px',
  height: '48px'
}} />
                </div>
              )}
            </div>
            {user.isPremium && (
              <Crown style={{
  position: 'absolute',
  width: '24px',
  height: '24px'
}} />
            )}
          </div>

          {/* User Details */}
          <div style={{
  flex: '1'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
              <h1 style={{
  fontWeight: 'bold'
}}>{user.displayName}</h1>
              {user.isVerified && (
                <Shield style={{
  width: '20px',
  height: '20px'
}} />
              )}
            </div>
            <p className="text-muted/80 mb-1">@{user.username}</p>
            {user.bio && (
              <p className="text-muted/70 mb-4 max-w-2xl">{user.bio}</p>
            )}
            
            {/* Meta Info */}
            <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
}}>
              {user.location && (
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  <Map style={{
  width: '16px',
  height: '16px'
}} />
                  {user.location}
                </div>
              )}
              {user.website && (
                <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                  <Link style={{
  width: '16px',
  height: '16px'
}} />
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80">
                    Website
                  </a>
                </div>
              )}
              <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
}}>
                <Calendar style={{
  width: '16px',
  height: '16px'
}} />
                Joined {formatTimestamp(user.createdAt)}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}}>
            {isOwnProfile ? (
              <>
                <button
                  onClick={() => setShowNotifications(true)}
                  style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
                >
                  Notifications
                </button>
                <button style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
                  Edit Profile
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => relationship.isFollowing ? onUnfollow?.(userId) : onFollow?.(userId)}
                  style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)',
  color: '#ffffff'
}}
                >
                  {relationship.isFollowing ? 'Following' : 'Follow'}
                </button>
                <button style={{
  padding: '8px',
  border: '1px solid var(--border-subtle)',
  borderRadius: '12px'
}}>
                  <MoreHorizontal style={{
  width: '16px',
  height: '16px'
}} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '24px'
}}>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>{user.stats?.followers?.toLocaleString()}</div>
            <div className="text-sm text-muted/70">Followers</div>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>{user.stats?.following?.toLocaleString()}</div>
            <div className="text-sm text-muted/70">Following</div>
          </div>
          <div style={{
  textAlign: 'center'
}}>
            <div style={{
  fontWeight: 'bold'
}}>{user.stats?.communities}</div>
            <div className="text-sm text-muted/70">Communities</div>
          </div>
          {relationship.mutualFriends > 0 && (
            <div style={{
  textAlign: 'center'
}}>
              <div style={{
  fontWeight: 'bold'
}}>{relationship.mutualFriends}</div>
              <div className="text-sm text-muted/70">Mutual Friends</div>
            </div>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <div style={{
  borderRadius: '12px',
  border: '1px solid var(--border-subtle)'
}}>
        <div className="border-b border-border-primary/30">
          <div style={{
  display: 'flex',
  gap: '4px',
  padding: '4px'
}}>
            {[
              { id: 'overview', name: 'Overview', icon: Activity },
              { id: 'posts', name: 'Posts', icon: FileText },
              { id: 'comments', name: 'Comments', icon: MessageSquare },
              { id: 'achievements', name: 'Achievements', icon: Trophy }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  borderRadius: '12px',
  color: '#ffffff'
}}
                >
                  <Icon style={{
  width: '16px',
  height: '16px'
}} />
                  {tab.name}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{
  padding: '24px'
}}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'achievements' && renderAchievementsTab()}
          {activeTab === 'posts' && (
            <div style={{
  textAlign: 'center',
  paddingTop: '48px',
  paddingBottom: '48px'
}}>
              <FileText style={{
  width: '64px',
  height: '64px'
}} />
              <p>No posts to show</p>
            </div>
          )}
          {activeTab === 'comments' && (
            <div style={{
  textAlign: 'center',
  paddingTop: '48px',
  paddingBottom: '48px'
}}>
              <MessageSquare style={{
  width: '64px',
  height: '64px'
}} />
              <p>No comments to show</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showKarmaModal && (
        <KarmaSystem user={user} onClose={() => setShowKarmaModal(false)} />
      )}
      
      {showNotifications && (
        <AwardNotificationSystem 
          userId={user.id} 
          onClose={() => setShowNotifications(false)} 
        />
      )}
    </div>
  )
}



export default EnhancedUserProfile