import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import OnboardingOverlay from './OnboardingOverlay'
import { useOnboarding } from '../../contexts/OnboardingContext'

// Mock the context
jest.mock('../../contexts/OnboardingContext')

// Mock step components
jest.mock('./steps/WelcomeStep', () => {
  return function WelcomeStep({ onComplete, onSkip, onNext, onPrevious, canSkip, isFirstStep, isLastStep }) {
    return (
      <div data-testid="welcome-step">
        <h3>Welcome Step</h3>
        <button onClick={onComplete}>Complete</button>
        <button onClick={onSkip} disabled={!canSkip}>Skip</button>
        <button onClick={onNext}>Next</button>
        <button onClick={onPrevious} disabled={isFirstStep}>Previous</button>
        <span data-testid="is-last-step">{String(isLastStep)}</span>
      </div>
    )
  }
})

jest.mock('./steps/ProfileSetupStep', () => {
  return function ProfileSetupStep({ onComplete, onSkip, onNext, onPrevious, canSkip, isFirstStep, isLastStep }) {
    return (
      <div data-testid="profile-setup-step">
        <h3>Profile Setup Step</h3>
        <button onClick={onComplete}>Complete</button>
        <button onClick={onSkip} disabled={!canSkip}>Skip</button>
        <button onClick={onNext}>Next</button>
        <button onClick={onPrevious}>Previous</button>
        <span data-testid="is-last-step">{String(isLastStep)}</span>
      </div>
    )
  }
})

jest.mock('./steps/JoinCommunitiesStep', () => {
  return function JoinCommunitiesStep({ onComplete, onSkip, onNext, onPrevious, canSkip, isFirstStep, isLastStep }) {
    return (
      <div data-testid="join-communities-step">
        <h3>Join Communities Step</h3>
        <button onClick={onComplete}>Complete</button>
        <button onClick={onSkip} disabled={!canSkip}>Skip</button>
        <span data-testid="is-last-step">{String(isLastStep)}</span>
      </div>
    )
  }
})

jest.mock('./steps/FirstPostStep', () => {
  return function FirstPostStep({ onComplete, onSkip, onNext, onPrevious, canSkip, isFirstStep, isLastStep }) {
    return (
      <div data-testid="first-post-step">
        <h3>First Post Step</h3>
        <button onClick={onComplete}>Complete</button>
        <button onClick={onSkip} disabled={!canSkip}>Skip</button>
        <span data-testid="is-last-step">{String(isLastStep)}</span>
      </div>
    )
  }
})

jest.mock('./steps/VoiceVideoStep', () => {
  return function VoiceVideoStep({ onComplete, onSkip, onNext, onPrevious, canSkip, isFirstStep, isLastStep }) {
    return (
      <div data-testid="voice-video-step">
        <h3>Voice Video Step</h3>
        <button onClick={onComplete}>Complete</button>
        <button onClick={onSkip} disabled={!canSkip}>Skip</button>
        <span data-testid="is-last-step">{String(isLastStep)}</span>
      </div>
    )
  }
})

jest.mock('./steps/CryptoWalletStep', () => {
  return function CryptoWalletStep({ onComplete, onSkip, onNext, onPrevious, canSkip, isFirstStep, isLastStep }) {
    return (
      <div data-testid="crypto-wallet-step">
        <h3>Crypto Wallet Step</h3>
        <button onClick={onComplete}>Complete</button>
        <button onClick={onSkip} disabled={!canSkip}>Skip</button>
        <span data-testid="is-last-step">{String(isLastStep)}</span>
      </div>
    )
  }
})

jest.mock('./steps/NotificationSetupStep', () => {
  return function NotificationSetupStep({ onComplete, onSkip, onNext, onPrevious, canSkip, isFirstStep, isLastStep }) {
    return (
      <div data-testid="notification-setup-step">
        <h3>Notification Setup Step</h3>
        <button onClick={onComplete}>Complete</button>
        <button onClick={onSkip} disabled={!canSkip}>Skip</button>
        <span data-testid="is-last-step">{String(isLastStep)}</span>
      </div>
    )
  }
})

jest.mock('./steps/CompletionStep', () => {
  return function CompletionStep({ onComplete, onSkip, onNext, onPrevious, canSkip, isFirstStep, isLastStep }) {
    return (
      <div data-testid="completion-step">
        <h3>Completion Step</h3>
        <button onClick={onComplete}>Complete</button>
        <button onClick={onSkip} disabled={!canSkip}>Skip</button>
        <span data-testid="is-last-step">{String(isLastStep)}</span>
      </div>
    )
  }
})

describe('OnboardingOverlay', () => {
  const mockOnboardingSteps = [
    {
      id: 'welcome',
      component: 'WelcomeStep',
      title: 'Welcome to Cryb',
      description: 'Let\'s get you started',
      icon: '👋',
      required: true
    },
    {
      id: 'profile',
      component: 'ProfileSetupStep',
      title: 'Setup Your Profile',
      description: 'Tell us about yourself',
      icon: '👤',
      required: true
    },
    {
      id: 'communities',
      component: 'JoinCommunitiesStep',
      title: 'Join Communities',
      description: 'Find your people',
      icon: '🌐',
      required: false
    },
    {
      id: 'completion',
      component: 'CompletionStep',
      title: 'All Set!',
      description: 'You\'re ready to go',
      icon: '🎉',
      required: true
    }
  ]

  let mockUseOnboarding

  beforeEach(() => {
    mockUseOnboarding = {
      onboardingState: {
        isActive: true,
        currentStep: 0,
        completedSteps: []
      },
      onboardingSteps: mockOnboardingSteps,
      nextOnboardingStep: jest.fn(),
      previousOnboardingStep: jest.fn(),
      completeOnboardingStep: jest.fn(),
      skipOnboardingStep: jest.fn(),
      finishOnboarding: jest.fn()
    }

    useOnboarding.mockReturnValue(mockUseOnboarding)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering and Initialization', () => {
    it('should render the overlay when onboarding is active', () => {
      render(<OnboardingOverlay />)
      expect(screen.getByText('Welcome to Cryb')).toBeInTheDocument()
    })

    it('should not render when onboarding is not active', () => {
      mockUseOnboarding.onboardingState.isActive = false
      const { container } = render(<OnboardingOverlay />)
      expect(container.firstChild).toBeNull()
    })

    it('should render the modal overlay background', () => {
      const { container } = render(<OnboardingOverlay />)
      const overlay = container.querySelector('.fixed.inset-0')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('bg-black', 'bg-opacity-75', 'z-50')
    })

    it('should render the modal container with proper styling', () => {
      const { container } = render(<OnboardingOverlay />)
      const modal = container.querySelector('.bg-white.rounded-2xl')
      expect(modal).toBeInTheDocument()
      expect(modal).toHaveClass('shadow-2xl', 'max-w-4xl', 'w-full')
    })

    it('should render the current step component', () => {
      render(<OnboardingOverlay />)
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument()
    })

    it('should render step title and description', () => {
      render(<OnboardingOverlay />)
      expect(screen.getByText('Welcome to Cryb')).toBeInTheDocument()
      expect(screen.getByText('Let\'s get you started')).toBeInTheDocument()
    })

    it('should render step icon', () => {
      render(<OnboardingOverlay />)
      expect(screen.getByText('👋')).toBeInTheDocument()
    })

    it('should render step counter', () => {
      render(<OnboardingOverlay />)
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    })

    it('should render progress bar', () => {
      const { container } = render(<OnboardingOverlay />)
      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toBeInTheDocument()
    })

    it('should calculate progress percentage correctly for first step', () => {
      const { container } = render(<OnboardingOverlay />)
      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toHaveStyle({ width: '25%' })
    })

    it('should render navigation footer', () => {
      const { container } = render(<OnboardingOverlay />)
      const footer = container.querySelector('.bg-gray-50.px-6.py-4')
      expect(footer).toBeInTheDocument()
    })

    it('should render Previous button', () => {
      render(<OnboardingOverlay />)
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    })

    it('should render Continue button', () => {
      render(<OnboardingOverlay />)
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })
  })

  describe('Step Progression - Forward Navigation', () => {
    it('should call nextOnboardingStep when Continue button is clicked', async () => {
      const user = userEvent.setup()
      render(<OnboardingOverlay />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)

      expect(mockUseOnboarding.nextOnboardingStep).toHaveBeenCalledTimes(1)
    })

    it('should call completeOnboardingStep before advancing', async () => {
      const user = userEvent.setup()
      render(<OnboardingOverlay />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)

      expect(mockUseOnboarding.completeOnboardingStep).toHaveBeenCalledWith('welcome')
    })

    it('should call finishOnboarding on last step', async () => {
      const user = userEvent.setup()
      mockUseOnboarding.onboardingState.currentStep = 3
      render(<OnboardingOverlay />)

      const finishButton = screen.getByRole('button', { name: /continue/i })
      await user.click(finishButton)

      expect(mockUseOnboarding.finishOnboarding).toHaveBeenCalledTimes(1)
    })

    it('should display "Finish" button text on last step', () => {
      mockUseOnboarding.onboardingState.currentStep = 3
      render(<OnboardingOverlay />)

      expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
    })

    it('should display "Continue" button text on non-last steps', () => {
      mockUseOnboarding.onboardingState.currentStep = 0
      render(<OnboardingOverlay />)

      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    })

    it('should render second step when currentStep is 1', () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      expect(screen.getByTestId('profile-setup-step')).toBeInTheDocument()
      expect(screen.getByText('Setup Your Profile')).toBeInTheDocument()
    })

    it('should update progress bar for second step', () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      const { container } = render(<OnboardingOverlay />)

      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toHaveStyle({ width: '50%' })
    })

    it('should update step counter for second step', () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    })

    it('should update icon for each step', () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      expect(screen.getByText('👤')).toBeInTheDocument()
    })

    it('should pass correct props to step component', () => {
      render(<OnboardingOverlay />)

      const welcomeStep = screen.getByTestId('welcome-step')
      expect(welcomeStep).toBeInTheDocument()
      expect(screen.getByTestId('is-last-step')).toHaveTextContent('false')
    })

    it('should pass isLastStep=true to last step component', () => {
      mockUseOnboarding.onboardingState.currentStep = 3
      render(<OnboardingOverlay />)

      expect(screen.getByTestId('is-last-step')).toHaveTextContent('true')
    })
  })

  describe('Step Progression - Backward Navigation', () => {
    it('should call previousOnboardingStep when Previous button is clicked', async () => {
      const user = userEvent.setup()
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      const previousButton = screen.getByRole('button', { name: /previous/i })
      await user.click(previousButton)

      expect(mockUseOnboarding.previousOnboardingStep).toHaveBeenCalledTimes(1)
    })

    it('should disable Previous button on first step', () => {
      mockUseOnboarding.onboardingState.currentStep = 0
      render(<OnboardingOverlay />)

      const previousButton = screen.getByRole('button', { name: /previous/i })
      expect(previousButton).toBeDisabled()
    })

    it('should enable Previous button on second step', () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      const previousButton = screen.getByRole('button', { name: /previous/i })
      expect(previousButton).not.toBeDisabled()
    })

    it('should enable Previous button on last step', () => {
      mockUseOnboarding.onboardingState.currentStep = 3
      render(<OnboardingOverlay />)

      const previousButton = screen.getByRole('button', { name: /previous/i })
      expect(previousButton).not.toBeDisabled()
    })

    it('should pass isFirstStep=true to first step component', () => {
      mockUseOnboarding.onboardingState.currentStep = 0
      render(<OnboardingOverlay />)

      const welcomeStep = screen.getByTestId('welcome-step')
      const previousButton = within(welcomeStep).getByRole('button', { name: /previous/i })
      expect(previousButton).toBeDisabled()
    })

    it('should pass isFirstStep=false to non-first steps', () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      const profileStep = screen.getByTestId('profile-setup-step')
      const previousButton = within(profileStep).getByRole('button', { name: /previous/i })
      expect(previousButton).not.toBeDisabled()
    })
  })

  describe('Skip Functionality', () => {
    it('should render skip button when step is not required', () => {
      mockUseOnboarding.onboardingState.currentStep = 2
      render(<OnboardingOverlay />)

      expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
    })

    it('should not render skip button when step is required', () => {
      mockUseOnboarding.onboardingState.currentStep = 0
      render(<OnboardingOverlay />)

      expect(screen.queryByRole('button', { name: /skip for now/i })).not.toBeInTheDocument()
    })

    it('should call skipOnboardingStep when skip button is clicked', async () => {
      const user = userEvent.setup()
      mockUseOnboarding.onboardingState.currentStep = 2
      render(<OnboardingOverlay />)

      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      await user.click(skipButton)

      expect(mockUseOnboarding.skipOnboardingStep).toHaveBeenCalledWith('communities')
    })

    it('should advance to next step after skipping', async () => {
      const user = userEvent.setup()
      mockUseOnboarding.onboardingState.currentStep = 2
      render(<OnboardingOverlay />)

      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      await user.click(skipButton)

      expect(mockUseOnboarding.nextOnboardingStep).toHaveBeenCalledTimes(1)
    })

    it('should finish onboarding when skipping last step', async () => {
      const user = userEvent.setup()
      const customSteps = [...mockOnboardingSteps]
      customSteps[3].required = false
      mockUseOnboarding.onboardingSteps = customSteps
      mockUseOnboarding.onboardingState.currentStep = 3
      render(<OnboardingOverlay />)

      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      await user.click(skipButton)

      expect(mockUseOnboarding.finishOnboarding).toHaveBeenCalledTimes(1)
    })

    it('should pass canSkip=false to required steps', () => {
      mockUseOnboarding.onboardingState.currentStep = 0
      render(<OnboardingOverlay />)

      const welcomeStep = screen.getByTestId('welcome-step')
      const skipButton = within(welcomeStep).getByRole('button', { name: /skip/i })
      expect(skipButton).toBeDisabled()
    })

    it('should pass canSkip=true to optional steps', () => {
      mockUseOnboarding.onboardingState.currentStep = 2
      render(<OnboardingOverlay />)

      const communitiesStep = screen.getByTestId('join-communities-step')
      const skipButton = within(communitiesStep).getByRole('button', { name: /skip/i })
      expect(skipButton).not.toBeDisabled()
    })
  })

  describe('Progress Tracking', () => {
    it('should calculate 25% progress for step 1 of 4', () => {
      mockUseOnboarding.onboardingState.currentStep = 0
      const { container } = render(<OnboardingOverlay />)

      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toHaveStyle({ width: '25%' })
    })

    it('should calculate 50% progress for step 2 of 4', () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      const { container } = render(<OnboardingOverlay />)

      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toHaveStyle({ width: '50%' })
    })

    it('should calculate 75% progress for step 3 of 4', () => {
      mockUseOnboarding.onboardingState.currentStep = 2
      const { container } = render(<OnboardingOverlay />)

      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toHaveStyle({ width: '75%' })
    })

    it('should calculate 100% progress for step 4 of 4', () => {
      mockUseOnboarding.onboardingState.currentStep = 3
      const { container } = render(<OnboardingOverlay />)

      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toHaveStyle({ width: '100%' })
    })

    it('should have transition classes on progress bar', () => {
      const { container } = render(<OnboardingOverlay />)

      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toHaveClass('transition-all', 'duration-300', 'ease-out')
    })

    it('should update step counter correctly', () => {
      mockUseOnboarding.onboardingState.currentStep = 2
      render(<OnboardingOverlay />)

      expect(screen.getByText('Step 3 of 4')).toBeInTheDocument()
    })
  })

  describe('Step Completion', () => {
    it('should call completeOnboardingStep when onComplete is triggered', async () => {
      const user = userEvent.setup()
      render(<OnboardingOverlay />)

      const welcomeStep = screen.getByTestId('welcome-step')
      const completeButton = within(welcomeStep).getByRole('button', { name: /complete/i })
      await user.click(completeButton)

      expect(mockUseOnboarding.completeOnboardingStep).toHaveBeenCalledWith('welcome')
    })

    it('should advance after completing a step', async () => {
      const user = userEvent.setup()
      render(<OnboardingOverlay />)

      const welcomeStep = screen.getByTestId('welcome-step')
      const completeButton = within(welcomeStep).getByRole('button', { name: /complete/i })
      await user.click(completeButton)

      expect(mockUseOnboarding.nextOnboardingStep).toHaveBeenCalledTimes(1)
    })

    it('should finish onboarding when completing last step', async () => {
      const user = userEvent.setup()
      mockUseOnboarding.onboardingState.currentStep = 3
      render(<OnboardingOverlay />)

      const completionStep = screen.getByTestId('completion-step')
      const completeButton = within(completionStep).getByRole('button', { name: /complete/i })
      await user.click(completeButton)

      expect(mockUseOnboarding.finishOnboarding).toHaveBeenCalledTimes(1)
    })

    it('should complete correct step when on middle step', async () => {
      const user = userEvent.setup()
      mockUseOnboarding.onboardingState.currentStep = 2
      render(<OnboardingOverlay />)

      const communitiesStep = screen.getByTestId('join-communities-step')
      const completeButton = within(communitiesStep).getByRole('button', { name: /complete/i })
      await user.click(completeButton)

      expect(mockUseOnboarding.completeOnboardingStep).toHaveBeenCalledWith('communities')
    })
  })

  describe('Context Integration', () => {
    it('should use onboardingState from context', () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
    })

    it('should use onboardingSteps from context', () => {
      render(<OnboardingOverlay />)

      expect(screen.getByText('Welcome to Cryb')).toBeInTheDocument()
    })

    it('should call context methods for navigation', async () => {
      const user = userEvent.setup()
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      const previousButton = screen.getByRole('button', { name: /previous/i })
      await user.click(previousButton)

      expect(mockUseOnboarding.previousOnboardingStep).toHaveBeenCalled()
    })

    it('should respect isActive state', () => {
      mockUseOnboarding.onboardingState.isActive = false
      const { container } = render(<OnboardingOverlay />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Modal Overlay Behavior', () => {
    it('should render with fixed positioning', () => {
      const { container } = render(<OnboardingOverlay />)
      const overlay = container.querySelector('.fixed.inset-0')

      expect(overlay).toBeInTheDocument()
    })

    it('should have centered content', () => {
      const { container } = render(<OnboardingOverlay />)
      const overlay = container.querySelector('.fixed.inset-0')

      expect(overlay).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('should have high z-index', () => {
      const { container } = render(<OnboardingOverlay />)
      const overlay = container.querySelector('.fixed.inset-0')

      expect(overlay).toHaveClass('z-50')
    })

    it('should have padding around modal', () => {
      const { container } = render(<OnboardingOverlay />)
      const overlay = container.querySelector('.fixed.inset-0')

      expect(overlay).toHaveClass('p-4')
    })

    it('should constrain modal max height', () => {
      const { container } = render(<OnboardingOverlay />)
      const modal = container.querySelector('.bg-white.rounded-2xl')

      expect(modal).toHaveClass('max-h-[90vh]')
    })

    it('should have overflow hidden on modal', () => {
      const { container } = render(<OnboardingOverlay />)
      const modal = container.querySelector('.bg-white.rounded-2xl')

      expect(modal).toHaveClass('overflow-hidden')
    })

    it('should have scrollable content area', () => {
      const { container } = render(<OnboardingOverlay />)
      const content = container.querySelector('.overflow-y-auto')

      expect(content).toBeInTheDocument()
    })
  })

  describe('Component Props Passing', () => {
    it('should pass onNext callback to step component', async () => {
      render(<OnboardingOverlay />)

      const welcomeStep = screen.getByTestId('welcome-step')
      const nextButton = within(welcomeStep).getByRole('button', { name: /next/i })

      expect(nextButton).toBeInTheDocument()
    })

    it('should pass onPrevious callback to step component', async () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      const profileStep = screen.getByTestId('profile-setup-step')
      const previousButton = within(profileStep).getByRole('button', { name: /previous/i })

      expect(previousButton).toBeInTheDocument()
    })

    it('should pass onComplete callback to step component', () => {
      render(<OnboardingOverlay />)

      const welcomeStep = screen.getByTestId('welcome-step')
      const completeButton = within(welcomeStep).getByRole('button', { name: /complete/i })

      expect(completeButton).toBeInTheDocument()
    })

    it('should pass onSkip callback to step component', () => {
      mockUseOnboarding.onboardingState.currentStep = 2
      render(<OnboardingOverlay />)

      const communitiesStep = screen.getByTestId('join-communities-step')
      const skipButton = within(communitiesStep).getByRole('button', { name: /skip/i })

      expect(skipButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single step onboarding', () => {
      mockUseOnboarding.onboardingSteps = [mockOnboardingSteps[0]]
      mockUseOnboarding.onboardingState.currentStep = 0
      render(<OnboardingOverlay />)

      expect(screen.getByText('Step 1 of 1')).toBeInTheDocument()
    })

    it('should show 100% progress for single step', () => {
      mockUseOnboarding.onboardingSteps = [mockOnboardingSteps[0]]
      mockUseOnboarding.onboardingState.currentStep = 0
      const { container } = render(<OnboardingOverlay />)

      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toHaveStyle({ width: '100%' })
    })

    it('should handle many steps', () => {
      const manySteps = Array(10).fill(null).map((_, i) => ({
        id: `step-${i}`,
        component: 'WelcomeStep',
        title: `Step ${i}`,
        description: `Description ${i}`,
        icon: '🎯',
        required: true
      }))
      mockUseOnboarding.onboardingSteps = manySteps
      mockUseOnboarding.onboardingState.currentStep = 5
      render(<OnboardingOverlay />)

      expect(screen.getByText('Step 6 of 10')).toBeInTheDocument()
    })

    it('should calculate correct progress for many steps', () => {
      const manySteps = Array(10).fill(null).map((_, i) => ({
        id: `step-${i}`,
        component: 'WelcomeStep',
        title: `Step ${i}`,
        description: `Description ${i}`,
        icon: '🎯',
        required: true
      }))
      mockUseOnboarding.onboardingSteps = manySteps
      mockUseOnboarding.onboardingState.currentStep = 4
      const { container } = render(<OnboardingOverlay />)

      const progressBar = container.querySelector('.bg-white.h-2.rounded-full')
      expect(progressBar).toHaveStyle({ width: '50%' })
    })

    it('should handle missing step component gracefully', () => {
      const invalidStep = {
        id: 'invalid',
        component: 'NonExistentStep',
        title: 'Invalid Step',
        description: 'This component does not exist',
        icon: '❌',
        required: true
      }
      mockUseOnboarding.onboardingSteps = [invalidStep]
      mockUseOnboarding.onboardingState.currentStep = 0

      const { container } = render(<OnboardingOverlay />)
      expect(container).toBeInTheDocument()
    })

    it('should handle empty step title', () => {
      const stepWithNoTitle = { ...mockOnboardingSteps[0], title: '' }
      mockUseOnboarding.onboardingSteps = [stepWithNoTitle]

      render(<OnboardingOverlay />)
      expect(screen.queryByText('Welcome to Cryb')).not.toBeInTheDocument()
    })

    it('should handle empty step description', () => {
      const stepWithNoDescription = { ...mockOnboardingSteps[0], description: '' }
      mockUseOnboarding.onboardingSteps = [stepWithNoDescription]

      render(<OnboardingOverlay />)
      expect(screen.queryByText('Let\'s get you started')).not.toBeInTheDocument()
    })

    it('should handle empty icon', () => {
      const stepWithNoIcon = { ...mockOnboardingSteps[0], icon: '' }
      mockUseOnboarding.onboardingSteps = [stepWithNoIcon]

      const { container } = render(<OnboardingOverlay />)
      const iconContainer = container.querySelector('.text-3xl')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should handle rapid button clicks', async () => {
      const user = userEvent.setup()
      render(<OnboardingOverlay />)

      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)
      await user.click(continueButton)
      await user.click(continueButton)

      expect(mockUseOnboarding.completeOnboardingStep).toHaveBeenCalled()
    })

    it('should handle all steps being optional', () => {
      const allOptionalSteps = mockOnboardingSteps.map(step => ({ ...step, required: false }))
      mockUseOnboarding.onboardingSteps = allOptionalSteps
      mockUseOnboarding.onboardingState.currentStep = 0

      render(<OnboardingOverlay />)
      expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument()
    })

    it('should handle all steps being required', () => {
      const allRequiredSteps = mockOnboardingSteps.map(step => ({ ...step, required: true }))
      mockUseOnboarding.onboardingSteps = allRequiredSteps
      mockUseOnboarding.onboardingState.currentStep = 2

      render(<OnboardingOverlay />)
      expect(screen.queryByRole('button', { name: /skip for now/i })).not.toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('should have gradient header', () => {
      const { container } = render(<OnboardingOverlay />)
      const header = container.querySelector('.bg-gradient-to-r.from-blue-600.to-purple-600')

      expect(header).toBeInTheDocument()
    })

    it('should have white text in header', () => {
      const { container } = render(<OnboardingOverlay />)
      const header = container.querySelector('.bg-gradient-to-r.from-blue-600.to-purple-600')

      expect(header).toHaveClass('text-white')
    })

    it('should have rounded corners on modal', () => {
      const { container } = render(<OnboardingOverlay />)
      const modal = container.querySelector('.bg-white')

      expect(modal).toHaveClass('rounded-2xl')
    })

    it('should have shadow on modal', () => {
      const { container } = render(<OnboardingOverlay />)
      const modal = container.querySelector('.bg-white')

      expect(modal).toHaveClass('shadow-2xl')
    })

    it('should have border on footer', () => {
      const { container } = render(<OnboardingOverlay />)
      const footer = container.querySelector('.bg-gray-50')

      expect(footer).toHaveClass('border-t')
    })

    it('should style Continue button correctly', () => {
      render(<OnboardingOverlay />)
      const continueButton = screen.getByRole('button', { name: /continue/i })

      expect(continueButton).toHaveClass('bg-blue-600', 'text-white', 'rounded-lg')
    })

    it('should style Previous button correctly', () => {
      render(<OnboardingOverlay />)
      const previousButton = screen.getByRole('button', { name: /previous/i })

      expect(previousButton).toHaveClass('text-gray-600')
    })

    it('should style Skip button correctly when present', () => {
      mockUseOnboarding.onboardingState.currentStep = 2
      render(<OnboardingOverlay />)

      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      expect(skipButton).toHaveClass('text-gray-500')
    })
  })

  describe('Different Step Components', () => {
    it('should render WelcomeStep component', () => {
      mockUseOnboarding.onboardingState.currentStep = 0
      render(<OnboardingOverlay />)

      expect(screen.getByTestId('welcome-step')).toBeInTheDocument()
    })

    it('should render ProfileSetupStep component', () => {
      mockUseOnboarding.onboardingState.currentStep = 1
      render(<OnboardingOverlay />)

      expect(screen.getByTestId('profile-setup-step')).toBeInTheDocument()
    })

    it('should render JoinCommunitiesStep component', () => {
      mockUseOnboarding.onboardingState.currentStep = 2
      render(<OnboardingOverlay />)

      expect(screen.getByTestId('join-communities-step')).toBeInTheDocument()
    })

    it('should render CompletionStep component', () => {
      mockUseOnboarding.onboardingState.currentStep = 3
      render(<OnboardingOverlay />)

      expect(screen.getByTestId('completion-step')).toBeInTheDocument()
    })

    it('should render all 8 step types when configured', () => {
      const allSteps = [
        { id: 'welcome', component: 'WelcomeStep', title: 'Welcome', description: 'Start', icon: '👋', required: true },
        { id: 'profile', component: 'ProfileSetupStep', title: 'Profile', description: 'Setup', icon: '👤', required: true },
        { id: 'communities', component: 'JoinCommunitiesStep', title: 'Communities', description: 'Join', icon: '🌐', required: false },
        { id: 'post', component: 'FirstPostStep', title: 'First Post', description: 'Create', icon: '📝', required: false },
        { id: 'voice', component: 'VoiceVideoStep', title: 'Voice', description: 'Setup', icon: '🎤', required: false },
        { id: 'wallet', component: 'CryptoWalletStep', title: 'Wallet', description: 'Connect', icon: '💰', required: false },
        { id: 'notifications', component: 'NotificationSetupStep', title: 'Notifications', description: 'Enable', icon: '🔔', required: false },
        { id: 'completion', component: 'CompletionStep', title: 'Done', description: 'Finish', icon: '🎉', required: true }
      ]

      mockUseOnboarding.onboardingSteps = allSteps

      for (let i = 0; i < allSteps.length; i++) {
        mockUseOnboarding.onboardingState.currentStep = i
        const { unmount } = render(<OnboardingOverlay />)
        expect(screen.getByText(allSteps[i].title)).toBeInTheDocument()
        unmount()
      }
    })
  })
})

export default WelcomeStep
