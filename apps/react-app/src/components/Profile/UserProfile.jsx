import React, { useState, useEffect, useRef } from 'react'
import {
  User, Calendar, Edit2, Shield,
  Activity, MessageSquare, FileText, Heart,
  Users, Camera
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import profileService from '../../services/profileService'
import { useToast } from '../ui/useToast'
import './UserProfile.css'


export default function UserProfile({ userId, currentUser, isOwnProfile = false }) {
  const { user: authUser } = useAuth()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)
  const bannerInputRef = useRef(null)
  
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('posts')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    karma: 0,
    followers: 0,
    following: 0,
    joined: '',
    communities: 0,
    badges: []
  })

  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    banner: '',
    interests: [],
    socialLinks: {
      twitter: '',
      github: '',
      linkedin: '',
      instagram: '',
      youtube: '',
      discord: ''
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showActivity: true,
      allowMessages: true,
      showFollowers: true
    }
  })

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showActivity: true,
    allowMessages: true,
    showFollowers: true,
    allowFollowing: true,
    showOnlineStatus: true
  })

  const [relationship, setRelationship] = useState({
    isFollowing: false,
    isFollower: false,
    isBlocked: false,
    isFriend: false
  })

  useEffect(() => {
    fetchUserProfile()
    if (!isOwnProfile && userId) {
      fetchUserRelationship()
    }
  }, [userId, isOwnProfile])

  const fetchUserProfile = async () => {
    setLoading(true)
    try {
      const response = await profileService.getProfile(userId)
      const profileData = response.user || response
      
      setUser(profileData)
      setEditForm({
        displayName: profileData.displayName || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
        avatar: profileData.avatar || '',
        banner: profileData.banner || '',
        interests: profileData.interests || [],
        socialLinks: {
          twitter: profileData.socialLinks?.twitter || '',
          github: profileData.socialLinks?.github || '',
          linkedin: profileData.socialLinks?.linkedin || '',
          instagram: profileData.socialLinks?.instagram || '',
          youtube: profileData.socialLinks?.youtube || '',
          discord: profileData.socialLinks?.discord || ''
        },
        privacy: profileData.privacy || privacySettings
      })
      
      // Fetch user stats
      const statsResponse = await profileService.getUserStats(userId)
      setStats({
        posts: statsResponse.posts || 0,
        comments: statsResponse.comments || 0,
        karma: statsResponse.karma || 0,
        followers: statsResponse.followers || 0,
        following: statsResponse.following || 0,
        joined: new Date(profileData.createdAt).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        }),
        communities: statsResponse.communities || 0,
        badges: statsResponse.badges || []
      })
      
      // Fetch privacy settings if own profile
      if (isOwnProfile) {
        const privacyResponse = await profileService.getPrivacySettings()
        setPrivacySettings(privacyResponse.settings || privacySettings)
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error)
      showToast('Failed to load profile', 'error')
      
      // Fallback to mock data for demo
      const mockUser = {
        id: userId || authUser?.id,
        username: authUser?.username || 'DemoUser',
        displayName: authUser?.displayName || 'Demo User',
        email: authUser?.email || 'demo@cryb.ai',
        avatar: null,
        banner: null,
        bio: 'Welcome to my profile! I love building awesome communities.',
        location: 'San Francisco, CA',
        website: 'https://cryb.ai',
        isVerified: true,
        createdAt: new Date().toISOString(),
        role: 'member',
        badges: ['Early Adopter', 'Contributor', 'Community Builder'],
        socialLinks: {
          twitter: 'https://twitter.com/crybplatform',
          github: 'https://github.com/cryb-platform'
        }
      }
      
      setUser(mockUser)
      setStats({
        posts: 42,
        comments: 156,
        karma: 1337,
        followers: 89,
        following: 124,
        joined: 'January 2024',
        communities: 8,
        badges: mockUser.badges
      })
    } finally {
      setLoading(false)
    }
  }
  
  const fetchUserRelationship = async () => {
    try {
      const response = await profileService.getProfile(userId)
      setRelationship({
        isFollowing: response.relationship?.isFollowing || false,
        isFollower: response.relationship?.isFollower || false,
        isBlocked: response.relationship?.isBlocked || false,
        isFriend: response.relationship?.isFriend || false
      })
    } catch (error) {
      console.error('Error fetching user relationship:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://api.cryb.ai'}/api/v1/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          displayName: editForm.displayName,
          bio: editForm.bio,
          avatar: editForm.avatar
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        setUser(prev => ({
          ...prev,
          displayName: editForm.displayName,
          bio: editForm.bio,
          avatar: editForm.avatar
        }))
        
        setIsEditing(false)
      } else {
        console.error('Failed to update profile:', response.status)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      try {
        // Create form data for upload
        const formData = new FormData()
        formData.append('file', file)

        // Upload to API
        const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'https://api.cryb.ai'}/api/v1/uploads/avatar`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        })

        if (response.ok) {
          const data = await response.json()
          // Update form with uploaded avatar URL
          setEditForm(prev => ({
            ...prev,
            avatar: data.url || data.fileUrl
          }))
        } else {
          // Fallback to local preview using object URL (faster than base64)
          const objectUrl = URL.createObjectURL(file)
          setEditForm(prev => ({
            ...prev,
            avatar: objectUrl
          }))
        }
      } catch (error) {
        console.error('Error uploading avatar:', error)
        // Fallback to local preview using object URL (faster than base64)
        const objectUrl = URL.createObjectURL(file)
        setEditForm(prev => ({
          ...prev,
          avatar: objectUrl
        }))
      }
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-error">
        <User size={48} />
        <h2>User Not Found</h2>
        <p>The user you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="user-profile" onClick={() => setShowMoreOptions(false)}>
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-banner"></div>
        
        <div className="profile-info">
          <div className="profile-avatar-section">
            {isEditing ? (
              <label className="avatar-upload">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  hidden
                />
                <div className="avatar-edit-overlay">
                  <Camera size={24} />
                </div>
                {editForm.avatar || user.avatar ? (
                  <img src={editForm.avatar || user.avatar} alt={user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={40} />
                  </div>
                )}
              </label>
            ) : (
              <div className="profile-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={40} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="profile-details">
            <div className="profile-name-section">
              {isEditing ? (
                <input
                  type="text"
                  className="edit-display-name"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    displayName: e.target.value
                  }))}
                  placeholder="Display Name"
                />
              ) : (
                <h1 className="profile-display-name">
                  {user.displayName}
                  {user.isVerified && (
                    <Shield className="verified-badge" size={20} />
                  )}
                </h1>
              )}
              <p className="profile-username">@{user.username}</p>
            </div>

            {isOwnProfile && (
              <div className="profile-actions">
                {isEditing ? (
                  <>
                    <button 
                      className="btn-save"
                      onClick={handleSaveProfile}
                    >
                      Save Changes
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setIsEditing(false)
                        setEditForm({
                          displayName: user.displayName,
                          bio: user.bio,
                          avatar: user.avatar
                        })
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    className="btn-edit"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 size={16} />
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="profile-bio">
          {isEditing ? (
            <textarea
              className="edit-bio"
              value={editForm.bio}
              onChange={(e) => setEditForm(prev => ({
                ...prev,
                bio: e.target.value
              }))}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          ) : (
            <p>{user.bio || 'No bio yet.'}</p>
          )}
        </div>

        {/* Stats Bar */}
        <div className="profile-stats">
          <div className="stat-item">
            <FileText size={16} />
            <span className="stat-value">{stats.posts}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="stat-item">
            <MessageSquare size={16} />
            <span className="stat-value">{stats.comments}</span>
            <span className="stat-label">Comments</span>
          </div>
          <div className="stat-item">
            <Heart size={16} />
            <span className="stat-value">{stats.karma}</span>
            <span className="stat-label">Karma</span>
          </div>
          <div className="stat-item">
            <Users size={16} />
            <span className="stat-value">{stats.communities}</span>
            <span className="stat-label">Communities</span>
          </div>
          <div className="stat-item">
            <Calendar size={16} />
            <span className="stat-value">{stats.joined}</span>
            <span className="stat-label">Joined</span>
          </div>
        </div>

        {/* Badges */}
        {user.badges && user.badges.length > 0 && (
          <div className="profile-badges">
            <h3><Award size={16} /> Badges</h3>
            <div className="badges-list">
              {user.badges.map((badge, idx) => (
                <span key={idx} className="badge">{badge}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Tabs */}
      <div className="profile-content">
        <div className="content-tabs">
          <button
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <FileText size={16} />
            Posts
          </button>
          <button
            className={`tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            <MessageSquare size={16} />
            Comments
          </button>
          <button
            className={`tab ${activeTab === 'communities' ? 'active' : ''}`}
            onClick={() => setActiveTab('communities')}
          >
            <Users size={16} />
            Communities
          </button>
          <button
            className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <Activity size={16} />
            Activity
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'posts' && (
            <div className="posts-list">
              <p className="empty-state">No posts yet</p>
            </div>
          )}
          
          {activeTab === 'comments' && (
            <div className="comments-list">
              <p className="empty-state">No comments yet</p>
            </div>
          )}
          
          {activeTab === 'communities' && (
            <div className="communities-list">
              <p className="empty-state">Not a member of any communities</p>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div className="activity-feed">
              <p className="empty-state">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
