import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext.jsx'

const OnboardingContext = createContext()

// Onboarding steps configuration
const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to CRYB!',
    description: 'Let\'s get you started with the best decentralized community platform',
    component: 'WelcomeStep',
    icon: '👋',
    required: true
  },
  {
    id: 'profile-setup',
    title: 'Set Up Your Profile',
    description: 'Tell the community about yourself',
    component: 'ProfileSetupStep',
    icon: '👤',
    required: true
  },
  {
    id: 'join-communities',
    title: 'Join Communities',
    description: 'Find and join communities that interest you',
    component: 'JoinCommunitiesStep',
    icon: '🏘️',
    required: false
  },
  {
    id: 'first-post',
    title: 'Create Your First Post',
    description: 'Share something with the community',
    component: 'FirstPostStep',
    icon: '✍️',
    required: false
  },
  {
    id: 'voice-video',
    title: 'Try Voice & Video',
    description: 'Experience real-time communication',
    component: 'VoiceVideoStep',
    icon: '🎤',
    required: false
  },
  {
    id: 'crypto-wallet',
    title: 'Connect Your Wallet',
    description: 'Connect your crypto wallet for token rewards',
    component: 'CryptoWalletStep',
    icon: '💰',
    required: false
  },
  {
    id: 'notification-setup',
    title: 'Notification Preferences',
    description: 'Choose how you want to be notified',
    component: 'NotificationSetupStep',
    icon: '🔔',
    required: false
  },
  {
    id: 'completion',
    title: 'You\'re All Set!',
    description: 'Welcome to the CRYB community',
    component: 'CompletionStep',
    icon: '🎉',
    required: true
  }
]

// Tutorial definitions
const TUTORIALS = {
  'posting': {
    id: 'posting',
    title: 'How to Create Posts',
    description: 'Learn how to create engaging posts in communities',
    steps: [
      {
        target: '[data-tutorial="create-post-button"]',
        content: 'Click here to create a new post',
        placement: 'bottom'
      },
      {
        target: '[data-tutorial="post-title"]',
        content: 'Give your post an engaging title',
        placement: 'bottom'
      },
      {
        target: '[data-tutorial="post-content"]',
        content: 'Write your post content here. You can use markdown formatting!',
        placement: 'top'
      },
      {
        target: '[data-tutorial="post-community"]',
        content: 'Select which community to post in',
        placement: 'right'
      },
      {
        target: '[data-tutorial="post-submit"]',
        content: 'Click here to publish your post',
        placement: 'top'
      }
    ],
    reward: 50 // CRYB tokens
  },
  'voice-chat': {
    id: 'voice-chat',
    title: 'Voice & Video Chat',
    description: 'Learn how to use voice and video features',
    steps: [
      {
        target: '[data-tutorial="voice-button"]',
        content: 'Click here to join voice chat',
        placement: 'bottom'
      },
      {
        target: '[data-tutorial="video-button"]',
        content: 'Toggle video on/off',
        placement: 'bottom'
      },
      {
        target: '[data-tutorial="mute-button"]',
        content: 'Mute/unmute your microphone',
        placement: 'bottom'
      },
      {
        target: '[data-tutorial="leave-button"]',
        content: 'Leave the voice/video chat',
        placement: 'top'
      }
    ],
    reward: 25
  },
  'communities': {
    id: 'communities',
    title: 'Community Features',
    description: 'Discover all the community features',
    steps: [
      {
        target: '[data-tutorial="communities-nav"]',
        content: 'Browse all communities here',
        placement: 'bottom'
      },
      {
        target: '[data-tutorial="join-community"]',
        content: 'Click to join a community',
        placement: 'left'
      },
      {
        target: '[data-tutorial="community-rules"]',
        content: 'Read community rules and guidelines',
        placement: 'right'
      },
      {
        target: '[data-tutorial="create-community"]',
        content: 'Create your own community',
        placement: 'bottom'
      }
    ],
    reward: 30
  },
  'crypto-features': {
    id: 'crypto-features',
    title: 'Crypto & NFT Features',
    description: 'Learn about tokenomics and NFT features',
    steps: [
      {
        target: '[data-tutorial="wallet-connect"]',
        content: 'Connect your crypto wallet here',
        placement: 'bottom'
      },
      {
        target: '[data-tutorial="token-balance"]',
        content: 'View your CRYB token balance',
        placement: 'bottom'
      },
      {
        target: '[data-tutorial="nft-gallery"]',
        content: 'Browse and showcase your NFTs',
        placement: 'right'
      },
      {
        target: '[data-tutorial="reward-system"]',
        content: 'Earn tokens through community participation',
        placement: 'left'
      }
    ],
    reward: 75
  }
}

export function OnboardingProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const [onboardingState, setOnboardingState] = useState({
    isActive: false,
    currentStep: 0,
    completedSteps: [],
    skippedSteps: [],
    isCompleted: false
  })
  
  const [tutorialState, setTutorialState] = useState({
    activeTutorial: null,
    currentStep: 0,
    completedTutorials: [],
    isActive: false
  })
  
  const [userProgress, setUserProgress] = useState({
    onboardingProgress: 0,
    tutorialsCompleted: 0,
    totalRewardsEarned: 0,
    achievements: []
  })

  // Load user onboarding state from localStorage or API
  useEffect(() => {
    if (isAuthenticated && user) {
      loadOnboardingState()
    }
  }, [isAuthenticated, user])

  const loadOnboardingState = async () => {
    try {
      // Try to load from API first
      const response = await fetch('/api/user/onboarding-progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOnboardingState(data.onboarding || onboardingState)
        setTutorialState(data.tutorials || tutorialState)
        setUserProgress(data.progress || userProgress)
      } else {
        // Fallback to localStorage (API endpoint not implemented yet)
        loadFromLocalStorage()
      }
    } catch (error) {
      // Silently fail and use localStorage
      loadFromLocalStorage()
    }
  }

  const loadFromLocalStorage = () => {
    const savedOnboarding = localStorage.getItem(`onboarding_${user?.id}`)
    const savedTutorials = localStorage.getItem(`tutorials_${user?.id}`)
    const savedProgress = localStorage.getItem(`progress_${user?.id}`)
    
    if (savedOnboarding) {
      setOnboardingState(JSON.parse(savedOnboarding))
    }
    if (savedTutorials) {
      setTutorialState(JSON.parse(savedTutorials))
    }
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress))
    }
  }

  const saveState = async (newOnboardingState, newTutorialState, newProgress) => {
    // Always save to localStorage as primary storage (API not implemented yet)
    if (user?.id) {
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(newOnboardingState))
      localStorage.setItem(`tutorials_${user.id}`, JSON.stringify(newTutorialState))
      localStorage.setItem(`progress_${user.id}`, JSON.stringify(newProgress))
    }

    // Try to save to API in background (fail silently if endpoint doesn't exist)
    try {
      await fetch('/api/user/onboarding-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          onboarding: newOnboardingState,
          tutorials: newTutorialState,
          progress: newProgress
        })
      })
    } catch (error) {
      // Silently fail - localStorage is primary storage
    }
  }

  const startOnboarding = () => {
    const newState = {
      ...onboardingState,
      isActive: true,
      currentStep: 0
    }
    setOnboardingState(newState)
    saveState(newState, tutorialState, userProgress)
  }

  const completeOnboardingStep = (stepId) => {
    const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === stepId)
    const newCompletedSteps = [...onboardingState.completedSteps]
    
    if (!newCompletedSteps.includes(stepId)) {
      newCompletedSteps.push(stepId)
    }

    const newProgress = {
      ...userProgress,
      onboardingProgress: (newCompletedSteps.length / ONBOARDING_STEPS.length) * 100
    }

    const newState = {
      ...onboardingState,
      completedSteps: newCompletedSteps,
      currentStep: Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1),
      isCompleted: newCompletedSteps.length === ONBOARDING_STEPS.length
    }

    setOnboardingState(newState)
    setUserProgress(newProgress)
    saveState(newState, tutorialState, newProgress)

    // Award achievement for completing onboarding
    if (newState.isCompleted && !userProgress.achievements.includes('onboarding_complete')) {
      awardAchievement('onboarding_complete', 'Onboarding Master', 'Completed the full onboarding process', 100)
    }
  }

  const skipOnboardingStep = (stepId) => {
    const stepIndex = ONBOARDING_STEPS.findIndex(step => step.id === stepId)
    const newSkippedSteps = [...onboardingState.skippedSteps, stepId]
    
    const newState = {
      ...onboardingState,
      skippedSteps: newSkippedSteps,
      currentStep: Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1)
    }

    setOnboardingState(newState)
    saveState(newState, tutorialState, userProgress)
  }

  const nextOnboardingStep = () => {
    const newState = {
      ...onboardingState,
      currentStep: Math.min(onboardingState.currentStep + 1, ONBOARDING_STEPS.length - 1)
    }
    setOnboardingState(newState)
    saveState(newState, tutorialState, userProgress)
  }

  const previousOnboardingStep = () => {
    const newState = {
      ...onboardingState,
      currentStep: Math.max(onboardingState.currentStep - 1, 0)
    }
    setOnboardingState(newState)
    saveState(newState, tutorialState, userProgress)
  }

  const finishOnboarding = () => {
    const newState = {
      ...onboardingState,
      isActive: false,
      isCompleted: true
    }
    setOnboardingState(newState)
    saveState(newState, tutorialState, userProgress)
  }

  const startTutorial = (tutorialId) => {
    if (!TUTORIALS[tutorialId]) return

    const newState = {
      ...tutorialState,
      activeTutorial: tutorialId,
      currentStep: 0,
      isActive: true
    }
    setTutorialState(newState)
    saveState(onboardingState, newState, userProgress)
  }

  const nextTutorialStep = () => {
    const tutorial = TUTORIALS[tutorialState.activeTutorial]
    if (!tutorial) return

    const newStep = Math.min(tutorialState.currentStep + 1, tutorial.steps.length - 1)
    const newState = {
      ...tutorialState,
      currentStep: newStep
    }
    setTutorialState(newState)
    saveState(onboardingState, newState, userProgress)
  }

  const previousTutorialStep = () => {
    const newStep = Math.max(tutorialState.currentStep - 1, 0)
    const newState = {
      ...tutorialState,
      currentStep: newStep
    }
    setTutorialState(newState)
    saveState(onboardingState, newState, userProgress)
  }

  const completeTutorial = (tutorialId) => {
    const tutorial = TUTORIALS[tutorialId]
    if (!tutorial) return

    const newCompletedTutorials = [...tutorialState.completedTutorials]
    if (!newCompletedTutorials.includes(tutorialId)) {
      newCompletedTutorials.push(tutorialId)
    }

    const newTutorialState = {
      ...tutorialState,
      completedTutorials: newCompletedTutorials,
      activeTutorial: null,
      isActive: false,
      currentStep: 0
    }

    const newProgress = {
      ...userProgress,
      tutorialsCompleted: newCompletedTutorials.length,
      totalRewardsEarned: userProgress.totalRewardsEarned + (tutorial.reward || 0)
    }

    setTutorialState(newTutorialState)
    setUserProgress(newProgress)
    saveState(onboardingState, newTutorialState, newProgress)

    // Award tokens for completing tutorial
    if (tutorial.reward) {
      awardTokens(tutorial.reward, `Completed tutorial: ${tutorial.title}`)
    }
  }

  const exitTutorial = () => {
    const newState = {
      ...tutorialState,
      activeTutorial: null,
      isActive: false,
      currentStep: 0
    }
    setTutorialState(newState)
    saveState(onboardingState, newState, userProgress)
  }

  const awardTokens = async (amount, reason) => {
    try {
      await fetch('/api/user/award-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount, reason })
      })
    } catch (error) {
      // Silently fail - API not implemented yet
    }
  }

  const awardAchievement = (id, title, description, tokenReward = 0) => {
    const newAchievements = [...userProgress.achievements, {
      id,
      title,
      description,
      tokenReward,
      earnedAt: new Date().toISOString()
    }]

    const newProgress = {
      ...userProgress,
      achievements: newAchievements,
      totalRewardsEarned: userProgress.totalRewardsEarned + tokenReward
    }

    setUserProgress(newProgress)
    saveState(onboardingState, tutorialState, newProgress)

    if (tokenReward > 0) {
      awardTokens(tokenReward, `Achievement: ${title}`)
    }
  }

  const shouldShowOnboarding = () => {
    if (!isAuthenticated || !user) return false
    if (onboardingState.isCompleted) return false
    
    // Show onboarding for new users or if explicitly started
    const isNewUser = !user.lastLoginAt || 
      (new Date() - new Date(user.createdAt)) < (24 * 60 * 60 * 1000) // Less than 24 hours old
    
    return isNewUser || onboardingState.isActive
  }

  const getTutorialProgress = (tutorialId) => {
    const tutorial = TUTORIALS[tutorialId]
    if (!tutorial) return { completed: false, progress: 0 }
    
    const isCompleted = tutorialState.completedTutorials.includes(tutorialId)
    const progress = isCompleted ? 100 : 0
    
    return { completed: isCompleted, progress }
  }

  const getAvailableTutorials = () => {
    return Object.values(TUTORIALS).filter(tutorial => 
      !tutorialState.completedTutorials.includes(tutorial.id)
    )
  }

  const value = {
    // Onboarding
    onboardingState,
    onboardingSteps: ONBOARDING_STEPS,
    startOnboarding,
    completeOnboardingStep,
    skipOnboardingStep,
    nextOnboardingStep,
    previousOnboardingStep,
    finishOnboarding,
    shouldShowOnboarding,

    // Tutorials
    tutorialState,
    tutorials: TUTORIALS,
    startTutorial,
    nextTutorialStep,
    previousTutorialStep,
    completeTutorial,
    exitTutorial,
    getTutorialProgress,
    getAvailableTutorials,

    // Progress & Achievements
    userProgress,
    awardAchievement,
    awardTokens
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
export default OnboardingContext
