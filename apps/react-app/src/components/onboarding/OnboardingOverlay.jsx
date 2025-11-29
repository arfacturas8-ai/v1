import { useOnboarding } from '../../contexts/OnboardingContext'
import WelcomeStep from './steps/WelcomeStep'
import ProfileSetupStep from './steps/ProfileSetupStep'
import JoinCommunitiesStep from './steps/JoinCommunitiesStep'
import FirstPostStep from './steps/FirstPostStep'
import VoiceVideoStep from './steps/VoiceVideoStep'
import CryptoWalletStep from './steps/CryptoWalletStep'
import NotificationSetupStep from './steps/NotificationSetupStep'
import CompletionStep from './steps/CompletionStep'

const STEP_COMPONENTS = {
  WelcomeStep,
  ProfileSetupStep,
  JoinCommunitiesStep,
  FirstPostStep,
  VoiceVideoStep,
  CryptoWalletStep,
  NotificationSetupStep,
  CompletionStep
}

const OnboardingOverlay = () => {
  const { 
    onboardingState, 
    onboardingSteps,
    nextOnboardingStep,
    previousOnboardingStep,
    completeOnboardingStep,
    skipOnboardingStep,
    finishOnboarding
  } = useOnboarding()

  if (!onboardingState.isActive) return null

  const currentStep = onboardingSteps[onboardingState.currentStep]
  const StepComponent = STEP_COMPONENTS[currentStep.component]
  const progress = ((onboardingState.currentStep + 1) / onboardingSteps.length) * 100

  const handleNext = () => {
    if (onboardingState.currentStep === onboardingSteps.length - 1) {
      finishOnboarding()
    } else {
      nextOnboardingStep()
    }
  }

  const handleSkip = () => {
    skipOnboardingStep(currentStep.id)
    handleNext()
  }

  const handleComplete = () => {
    completeOnboardingStep(currentStep.id)
    handleNext()
  }

  return (
    <div style={{
  position: 'fixed',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
}}>
      <div style={{
  borderRadius: '24px',
  width: '100%',
  overflow: 'hidden'
}}>
        {/* Header with progress */}
        <div style={{
  color: '#ffffff',
  padding: '24px'
}}>
          <div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
            <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
              <span className="text-3xl">{currentStep.icon}</span>
              <div>
                <h2 style={{
  fontWeight: 'bold'
}}>{currentStep.title}</h2>
                <p className="opacity-90">{currentStep.description}</p>
              </div>
            </div>
            <div style={{
  textAlign: 'right'
}}>
              <div className="text-sm opacity-75">Step {onboardingState.currentStep + 1} of {onboardingSteps.length}</div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div style={{
  width: '100%',
  borderRadius: '50%',
  height: '8px'
}}>
            <div
              style={{
  height: '8px',
  borderRadius: '50%',
  width: `${progress}%`
}}
            />
          </div>
        </div>

        {/* Step content */}
        <div style={{
  padding: '24px',
  maxHeight: 'calc(90vh - 200px)'
}}>
          {StepComponent && (
            <StepComponent
              onComplete={handleComplete}
              onSkip={handleSkip}
              onNext={handleNext}
              onPrevious={previousOnboardingStep}
              canSkip={!currentStep.required}
              isFirstStep={onboardingState.currentStep === 0}
              isLastStep={onboardingState.currentStep === onboardingSteps.length - 1}
            />
          )}
        </div>

        {/* Footer with navigation */}
        <div style={{
  background: 'rgba(22, 27, 34, 0.6)',
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '16px',
  paddingBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
          <button
            onClick={previousOnboardingStep}
            disabled={onboardingState.currentStep === 0}
            style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#c9d1d9'
}}
          >
            ← Previous
          </button>
          
          <div style={{
  display: 'flex',
  alignItems: 'center'
}}>
            {!currentStep.required && (
              <button
                onClick={handleSkip}
                style={{
  paddingLeft: '16px',
  paddingRight: '16px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#c9d1d9'
}}
              >
                Skip for now
              </button>
            )}
            
            <button
              onClick={handleComplete}
              style={{
  paddingLeft: '24px',
  paddingRight: '24px',
  paddingTop: '8px',
  paddingBottom: '8px',
  color: '#ffffff',
  borderRadius: '12px'
}}
            >
              {onboardingState.currentStep === onboardingSteps.length - 1 ? 'Finish' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}




export default STEP_COMPONENTS
