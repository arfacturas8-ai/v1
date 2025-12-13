import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  Users,
  Bell,
  Shield,
  Sparkles,
  Check,
  Upload,
  Heart,
  Wallet,
  Camera,
  UserCheck,
  X,
  Zap
} from 'lucide-react'
import { useResponsive } from '../hooks/useResponsive'

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Cryb.ai',
    description: 'Your decentralized community space. Web3-native, DAO-governed.',
    icon: Sparkles,
    color: '#58a6ff'
  },
  {
    id: 'profile',
    title: 'Create Your Profile',
    description: 'Tell us about yourself',
    icon: Camera,
    color: '#58a6ff'
  },
  {
    id: 'interests',
    title: 'Choose Your Interests',
    description: 'Select topics that interest you',
    icon: Heart,
    color: '#58a6ff'
  },
  {
    id: 'communities',
    title: 'Discover Communities',
    description: 'Join communities that match your interests',
    icon: Users,
    color: '#58a6ff'
  },
  {
    id: 'follow',
    title: 'Follow Creators',
    description: 'Connect with people who inspire you',
    icon: UserCheck,
    color: '#58a6ff'
  },
  {
    id: 'notifications',
    title: 'Stay Updated',
    description: 'Get notified about important updates',
    icon: Bell,
    color: '#58a6ff'
  },
  {
    id: 'wallet',
    title: 'Connect Wallet',
    description: 'Optional: Connect your Web3 wallet',
    icon: Wallet,
    color: '#58a6ff'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Welcome to the Cryb.ai community',
    icon: Sparkles,
    color: '#58a6ff'
  }
]

const INTERESTS = [
  { id: 'gaming', name: 'Gaming', emoji: '🎮' },
  { id: 'technology', name: 'Technology', emoji: '💻' },
  { id: 'art', name: 'Art', emoji: '🎨' },
  { id: 'music', name: 'Music', emoji: '🎵' },
  { id: 'sports', name: 'Sports', emoji: '⚽' },
  { id: 'movies', name: 'Movies', emoji: '🎬' },
  { id: 'books', name: 'Books', emoji: '📚' },
  { id: 'food', name: 'Food', emoji: '🍕' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'fashion', name: 'Fashion', emoji: '👗' },
  { id: 'photography', name: 'Photography', emoji: '📷' }
]

const MOCK_COMMUNITIES = [
  { id: 1, name: 'Tech Innovators', members: '12.5K', avatar: '💻', description: 'Latest in tech and innovation' },
  { id: 2, name: 'Digital Artists', members: '8.2K', avatar: '🎨', description: 'Creative minds unite' },
  { id: 3, name: 'Gaming Zone', members: '15.7K', avatar: '🎮', description: 'For gamers by gamers' },
  { id: 4, name: 'Fitness Enthusiasts', members: '6.3K', avatar: '💪', description: 'Get fit together' }
]

const MOCK_USERS = [
  { id: 1, name: 'Alex Chen', username: '@alexchen', avatar: '👨‍💻', followers: '2.3K', verified: true },
  { id: 2, name: 'Sarah Design', username: '@sarahdesign', avatar: '👩‍🎨', followers: '5.1K', verified: true },
  { id: 3, name: 'Mike Gaming', username: '@mikegaming', avatar: '👨‍🎮', followers: '8.7K', verified: false },
  { id: 4, name: 'Emma Fitness', username: '@emmafitness', avatar: '👩‍💼', followers: '3.2K', verified: true }
]

export default function OnboardingPage() {
  const { isMobile, isTablet } = useResponsive()

  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [preferences, setPreferences] = useState({
    interests: [],
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: 'public',
    avatar: null,
    username: '',
    displayName: '',
    bio: '',
    communities: [],
    following: [],
    walletConnected: false
  })

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
      if (currentStep === ONBOARDING_STEPS.length - 2) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
      }
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.cryb.ai/api/v1'}/users/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })
      if (response.ok) {
        navigate('/home')
      } else {
        console.error('Onboarding failed:', response.status)
        navigate('/home')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      navigate('/home')
    }
  }

  const handleSkip = () => {
    navigate('/home')
  }

  const toggleInterest = (interest) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const toggleCommunity = (communityId) => {
    setPreferences(prev => ({
      ...prev,
      communities: prev.communities.includes(communityId)
        ? prev.communities.filter(c => c !== communityId)
        : [...prev.communities, communityId]
    }))
  }

  const toggleFollow = (userId) => {
    setPreferences(prev => ({
      ...prev,
      following: prev.following.includes(userId)
        ? prev.following.filter(u => u !== userId)
        : [...prev.following, userId]
    }))
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreferences(prev => ({ ...prev, avatar: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const step = ONBOARDING_STEPS[currentStep]
  const Icon = step.icon
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} role="main" aria-label="Onboarding page">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1000]">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                background: ['#58a6ff', '#8A2BE2', '#FF1493', '#FFD700', '#00CED1'][Math.floor(Math.random() * 5)]
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: window.innerHeight + 20,
                opacity: 0,
                rotate: Math.random() * 360
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      <div className="px-5 py-5 md:px-10 md:py-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="w-full h-1 bg-[#161b22]/60 backdrop-blur-xl rounded-sm overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-sm"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="text-xs text-[#8a939b] mt-2 text-center">
          Step {currentStep + 1} of {ONBOARDING_STEPS.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-5 py-8 md:py-10 lg:px-5 w-full max-w-[800px] mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {/* Step 1: Welcome */}
            {step.id === 'welcome' && (
              <div className="text-center">
                <motion.div
                  className="mb-6 md:mb-8 inline-block"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                >
                  <Sparkles size={isMobile ? 64 : 80} color="#58a6ff" strokeWidth={1.5} />
                </motion.div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-[#58a6ff] to-[#8A2BE2] bg-clip-text text-transparent">
                  Welcome to Cryb.ai
                </h1>
                <p className="text-sm md:text-base lg:text-lg text-[#8a939b] leading-relaxed max-w-[600px] mx-auto mb-8 md:mb-12">
                  The first truly decentralized social platform. Own your community,
                  govern with DAOs, and build the web3-native future.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8">
                  <div className="bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 md:p-6 flex flex-col items-center gap-3 transition-all" style={{ border: '1px solid var(--border-subtle)' }}>
                    <Users size={isMobile ? 20 : 24} color="#58a6ff" />
                    <span className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Join Communities</span>
                  </div>
                  <div className="bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 md:p-6 flex flex-col items-center gap-3 transition-all" style={{ border: '1px solid var(--border-subtle)' }}>
                    <Sparkles size={isMobile ? 20 : 24} color="#58a6ff" />
                    <span className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Create Content</span>
                  </div>
                  <div className="bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 md:p-6 flex flex-col items-center gap-3 transition-all" style={{ border: '1px solid var(--border-subtle)' }}>
                    <Wallet size={isMobile ? 20 : 24} color="#58a6ff" />
                    <span className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Web3 Ready</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Profile Setup */}
            {step.id === 'profile' && (
              <div className="max-w-[500px] mx-auto">
                <div className="text-center mb-8 md:mb-10">
                  <Camera size={isMobile ? 40 : 48} color="#58a6ff" strokeWidth={1.5} className="inline-block" />
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-3 md:mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h2>
                  <p className="text-sm md:text-base text-[#8a939b]">{step.description}</p>
                </div>

                <div className="flex justify-center mb-6 md:mb-8">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <label htmlFor="avatar-upload" className="cursor-pointer block">
                    {preferences.avatar ? (
                      <img src={preferences.avatar} alt="Avatar" className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-[3px] border-[#58a6ff]" />
                    ) : (
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-[#1a1a1a] border-2 border-dashed border-[#2a2a2a] flex flex-col items-center justify-center gap-2 transition-all hover:border-[#3a3a3a]">
                        <Upload size={isMobile ? 28 : 32} color="#8a939b" />
                        <span className="text-xs text-[#8a939b]">Upload Avatar</span>
                      </div>
                    )}
                  </label>
                </div>

                <div className="mb-5 md:mb-6">
                  <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2" style={{ color: 'var(--text-primary)' }}>Username</label>
                  <input
                    type="text"
                    value={preferences.username}
                    onChange={(e) => setPreferences(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="@yourusername"
                    className="w-full px-3 py-3 md:px-4 md:py-3 bg-[#21262d]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-sm md:text-base outline-none transition-all focus:border-[#58a6ff]/50 focus:bg-[#21262d]/80 min-h-[44px]"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="mb-5 md:mb-6">
                  <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2" style={{ color: 'var(--text-primary)' }}>Display Name</label>
                  <input
                    type="text"
                    value={preferences.displayName}
                    onChange={(e) => setPreferences(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Your Name"
                    className="w-full px-3 py-3 md:px-4 md:py-3 bg-[#21262d]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-sm md:text-base outline-none transition-all focus:border-[#58a6ff]/50 focus:bg-[#21262d]/80 min-h-[44px]"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="mb-5 md:mb-6">
                  <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2" style={{ color: 'var(--text-primary)' }}>Bio</label>
                  <textarea
                    value={preferences.bio}
                    onChange={(e) => setPreferences(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    className="w-full px-3 py-3 md:px-4 md:py-3 bg-[#21262d]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-sm md:text-base outline-none transition-all focus:border-[#58a6ff]/50 focus:bg-[#21262d]/80 resize-y font-inherit"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Interest Selection */}
            {step.id === 'interests' && (
              <div>
                <div className="text-center mb-8 md:mb-10">
                  <Heart size={isMobile ? 40 : 48} color="#58a6ff" strokeWidth={1.5} className="inline-block" />
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-3 md:mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h2>
                  <p className="text-sm md:text-base text-[#8a939b]">Select at least 3 topics you're interested in</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 mt-5 md:mt-6">
                  {INTERESTS.map((interest) => {
                    const isSelected = preferences.interests.includes(interest.id)
                    return (
                      <motion.div
                        key={interest.id}
                        className={`bg-[#161b22]/60 border-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-5 flex flex-col items-center gap-2 cursor-pointer transition-all relative ${
                          isSelected
                            ? 'bg-gradient-to-br from-[#58a6ff]/10 to-[#a371f7]/10 border-[#58a6ff]'
                            : ''
                        }`}
                        style={!isSelected ? { borderColor: 'var(--border-subtle)' } : {}}
                        onClick={() => toggleInterest(interest.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#58a6ff] flex items-center justify-center">
                            <Check size={isMobile ? 14 : 16} color="#fff" strokeWidth={3} />
                          </div>
                        )}
                        <div className="text-2xl md:text-3xl">{interest.emoji}</div>
                        <div className="text-xs md:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{interest.name}</div>
                      </motion.div>
                    )
                  })}
                </div>
                <div className="text-center mt-5 md:mt-6 text-xs md:text-sm text-[#8a939b]">
                  {preferences.interests.length} selected
                </div>
              </div>
            )}

            {/* Step 4: Community Recommendations */}
            {step.id === 'communities' && (
              <div>
                <div className="text-center mb-8 md:mb-10">
                  <Users size={isMobile ? 40 : 48} color="#58a6ff" strokeWidth={1.5} className="inline-block" />
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-3 md:mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h2>
                  <p className="text-sm md:text-base text-[#8a939b]">Based on your interests</p>
                </div>

                <div className="flex flex-col gap-3 md:gap-4 mt-5 md:mt-6">
                  {MOCK_COMMUNITIES.map((community) => {
                    const isJoined = preferences.communities.includes(community.id)
                    return (
                      <motion.div
                        key={community.id}
                        className="bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-5 flex items-center gap-3 md:gap-4 transition-all"
                        style={{ border: '1px solid var(--border-subtle)' }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] bg-[#2a2a2a] flex items-center justify-center text-2xl md:text-3xl shrink-0">
                          {community.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm md:text-base font-semibold mb-0.5 md:mb-1" style={{ color: 'var(--text-primary)' }}>{community.name}</div>
                          <div className="text-xs md:text-sm text-[#8a939b] mb-0.5 md:mb-1">{community.description}</div>
                          <div className="text-xs text-[#8a939b]">{community.members} members</div>
                        </div>
                        <button
                          onClick={() => toggleCommunity(community.id)}
                          className={`px-4 py-2.5 md:px-6 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 shrink-0 min-h-[44px] ${
                            isJoined
                              ? 'bg-[#161b22]/60 border border-[#58a6ff] text-[#58a6ff]'
                              : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:opacity-90'
                          }`}
                        >
                          {isJoined ? (
                            <>
                              <Check size={16} /> Joined
                            </>
                          ) : (
                            'Join'
                          )}
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Follow Suggestions */}
            {step.id === 'follow' && (
              <div>
                <div className="text-center mb-8 md:mb-10">
                  <UserCheck size={isMobile ? 40 : 48} color="#58a6ff" strokeWidth={1.5} className="inline-block" />
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-3 md:mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h2>
                  <p className="text-sm md:text-base text-[#8a939b]">Popular creators in your interests</p>
                </div>

                <div className="flex flex-col gap-3 md:gap-4 mt-5 md:mt-6">
                  {MOCK_USERS.map((user) => {
                    const isFollowing = preferences.following.includes(user.id)
                    return (
                      <motion.div
                        key={user.id}
                        className="bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-4 md:p-5 flex items-center gap-3 md:gap-4 transition-all"
                        style={{ border: '1px solid var(--border-subtle)' }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#2a2a2a] flex items-center justify-center text-2xl md:text-3xl shrink-0">
                          {user.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm md:text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{user.name}</span>
                            {user.verified && (
                              <div className="w-4 h-4 md:w-[18px] md:h-[18px] rounded-full bg-[#58a6ff] flex items-center justify-center shrink-0">
                                <Check size={isMobile ? 10 : 12} color="#fff" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div className="text-xs md:text-sm text-[#8a939b] mb-0.5 md:mb-1">{user.username}</div>
                          <div className="text-xs text-[#8a939b]">{user.followers} followers</div>
                        </div>
                        <button
                          onClick={() => toggleFollow(user.id)}
                          className={`px-4 py-2.5 md:px-6 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all shrink-0 min-h-[44px] ${
                            isFollowing
                              ? 'bg-[#161b22]/60 border border-[#58a6ff] text-[#58a6ff]'
                              : 'bg-gradient-to-r from-[#58a6ff] to-[#a371f7] text-white hover:opacity-90'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 6: Enable Notifications */}
            {step.id === 'notifications' && (
              <div>
                <div className="text-center mb-8 md:mb-10">
                  <Bell size={isMobile ? 40 : 48} color="#58a6ff" strokeWidth={1.5} className="inline-block" />
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-3 md:mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h2>
                  <p className="text-sm md:text-base text-[#8a939b]">Never miss important updates</p>
                </div>

                <div className="flex flex-col gap-3 md:gap-4 mt-5 md:mt-6">
                  <div className="bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 md:p-6 flex justify-between items-center gap-3 md:gap-4" style={{ border: '1px solid var(--border-subtle)' }}>
                    <div className="flex gap-3 md:gap-4 items-start flex-1">
                      <Zap size={isMobile ? 20 : 24} color="#58a6ff" className="shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm md:text-base font-semibold mb-0.5 md:mb-1" style={{ color: 'var(--text-primary)' }}>Push Notifications</div>
                        <div className="text-xs md:text-sm text-[#8a939b]">
                          Get notified about mentions, likes, and comments
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-block w-12 md:w-13 h-6 md:h-7 shrink-0 min-h-[44px] flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.pushNotifications}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          pushNotifications: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-[#2a2a2a] transition-all rounded-full peer-checked:bg-[#58a6ff] before:content-[''] before:absolute before:h-4 before:w-4 md:before:h-5 md:before:w-5 before:left-1 before:bottom-1 before:bg-[#161b22] before:transition-all before:rounded-full peer-checked:before:translate-x-6"></span>
                    </label>
                  </div>

                  <div className="bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 md:p-6 flex justify-between items-center gap-3 md:gap-4" style={{ border: '1px solid var(--border-subtle)' }}>
                    <div className="flex gap-3 md:gap-4 items-start flex-1">
                      <Bell size={isMobile ? 20 : 24} color="#58a6ff" className="shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm md:text-base font-semibold mb-0.5 md:mb-1" style={{ color: 'var(--text-primary)' }}>Email Notifications</div>
                        <div className="text-xs md:text-sm text-[#8a939b]">
                          Receive weekly digests and important updates
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-block w-12 md:w-13 h-6 md:h-7 shrink-0 min-h-[44px] flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          emailNotifications: e.target.checked
                        }))}
                        className="sr-only peer"
                      />
                      <span className="absolute cursor-pointer inset-0 bg-[#2a2a2a] transition-all rounded-full peer-checked:bg-[#58a6ff] before:content-[''] before:absolute before:h-4 before:w-4 md:before:h-5 md:before:w-5 before:left-1 before:bottom-1 before:bg-[#161b22] before:transition-all before:rounded-full peer-checked:before:translate-x-6"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Connect Wallet */}
            {step.id === 'wallet' && (
              <div>
                <div className="text-center mb-8 md:mb-10">
                  <Wallet size={isMobile ? 40 : 48} color="#58a6ff" strokeWidth={1.5} className="inline-block" />
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mt-3 md:mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h2>
                  <p className="text-sm md:text-base text-[#8a939b]">Connect your Web3 wallet to unlock features</p>
                </div>

                <div className="bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-5 md:p-6 text-center mt-5 md:mt-6 mb-6 md:mb-8" style={{ border: '1px solid var(--border-subtle)' }}>
                  <Shield size={isMobile ? 28 : 32} color="#8a939b" className="inline-block" />
                  <p className="text-xs md:text-sm text-[#8a939b] leading-relaxed mt-3 md:mt-4">
                    Connecting your wallet allows you to collect NFTs, participate in token-gated
                    communities, and verify your digital identity.
                  </p>
                </div>

                <div className="flex flex-col gap-2 md:gap-3">
                  <motion.button
                    className="px-5 py-3.5 md:px-6 md:py-4 bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-sm md:text-base font-semibold transition-all flex items-center justify-center gap-2 md:gap-3 min-h-[44px]"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPreferences(prev => ({ ...prev, walletConnected: true }))}
                  >
                    <img
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI3LjUgMTZDMjcuNSAyMi4zNTEzIDIyLjM1MTMgMjcuNSAxNiAyNy41QzkuNjQ4NzMgMjcuNSA0LjUgMjIuMzUxMyA0LjUgMTZDNC41IDkuNjQ4NzMgOS42NDg3MyA0LjUgMTYgNC41QzIyLjM1MTMgNC41IDI3LjUgOS42NDg3MyAyNy41IDE2WiIgZmlsbD0iIzYyNzdGNSIgc3Ryb2tlPSIjNjI3N0Y1Ii8+Cjwvc3ZnPgo="
                      alt="MetaMask"
                      className="w-6 h-6 md:w-8 md:h-8"
                    />
                    <span>Connect MetaMask</span>
                  </motion.button>

                  <motion.button
                    className="px-5 py-3.5 md:px-6 md:py-4 bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-sm md:text-base font-semibold transition-all flex items-center justify-center gap-2 md:gap-3 min-h-[44px]"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPreferences(prev => ({ ...prev, walletConnected: true }))}
                  >
                    <img
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiMzQjk5RkMiLz4KPC9zdmc+Cg=="
                      alt="WalletConnect"
                      className="w-6 h-6 md:w-8 md:h-8"
                    />
                    <span>WalletConnect</span>
                  </motion.button>

                  <motion.button
                    className="px-5 py-3.5 md:px-6 md:py-4 bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] text-sm md:text-base font-semibold transition-all flex items-center justify-center gap-2 md:gap-3 min-h-[44px]"
                    style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setPreferences(prev => ({ ...prev, walletConnected: true }))}
                  >
                    <img
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTIiIGZpbGw9IiM1MzUyRkYiLz4KPC9zdmc+Cg=="
                      alt="Coinbase Wallet"
                      className="w-6 h-6 md:w-8 md:h-8"
                    />
                    <span>Coinbase Wallet</span>
                  </motion.button>
                </div>

                {preferences.walletConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 md:mt-6 px-4 py-3.5 md:py-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-center gap-2"
                  >
                    <Check size={20} color="#10b981" />
                    <span className="text-xs md:text-sm text-[#10b981] font-semibold">Wallet connected successfully!</span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 8: Completion */}
            {step.id === 'complete' && (
              <div className="text-center">
                <motion.div
                  className="mb-6 md:mb-8 inline-block"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ duration: 1 }}
                >
                  <Sparkles size={isMobile ? 64 : 80} color="#58a6ff" strokeWidth={1.5} />
                </motion.div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-[#58a6ff] to-[#8A2BE2] bg-clip-text text-transparent">
                  You're All Set!
                </h2>
                <p className="text-sm md:text-base lg:text-lg text-[#8a939b] leading-relaxed max-w-[500px] mx-auto mb-8 md:mb-12">
                  Welcome to the Cryb.ai community. You're ready to explore, create, and own your space.
                </p>

                <div className="bg-[#161b22]/60 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 md:p-8 flex flex-col gap-3 md:gap-4" style={{ border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>
                    <Heart size={isMobile ? 18 : 20} color="#58a6ff" />
                    <span>{preferences.interests.length} interests selected</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>
                    <Users size={isMobile ? 18 : 20} color="#58a6ff" />
                    <span>{preferences.communities.length} communities joined</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>
                    <UserCheck size={isMobile ? 18 : 20} color="#58a6ff" />
                    <span>{preferences.following.length} creators followed</span>
                  </div>
                  {preferences.walletConnected && (
                    <div className="flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>
                      <Wallet size={isMobile ? 18 : 20} color="#58a6ff" />
                      <span>Wallet connected</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center px-5 py-5 md:px-10 md:py-6 border-t gap-3 md:gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`px-4 py-3 md:px-6 md:py-3 bg-[#161b22]/60 rounded-lg text-xs md:text-sm font-semibold transition-all flex items-center gap-1.5 min-h-[44px] ${
            currentStep === 0
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-[#161b22]/80'
          }`}
          style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <button
          onClick={handleSkip}
          className="px-4 py-3 md:px-6 md:py-3 bg-transparent text-xs md:text-sm font-semibold text-[#8a939b] transition-all hover:text-[#a8b1ba] min-h-[44px]"
        >
          Skip
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-3 md:px-8 md:py-3 bg-gradient-to-r from-[#58a6ff] to-[#a371f7] rounded-lg text-xs md:text-sm font-semibold text-white transition-all flex items-center gap-1.5 hover:opacity-90 min-h-[44px]"
        >
          {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

