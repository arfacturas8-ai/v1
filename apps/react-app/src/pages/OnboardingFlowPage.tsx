import React, { useState } from 'react';
import { ConnectWalletStep } from './onboarding/ConnectWalletStep';
import { CreateProfileStep } from './onboarding/CreateProfileStep';
import { SelectInterestsStep } from './onboarding/SelectInterestsStep';
import { FollowSuggestionsStep } from './onboarding/FollowSuggestionsStep';
import { CompleteStep } from './onboarding/CompleteStep';
import { colors, spacing } from '../design-system/tokens';

export default function OnboardingFlowPage() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      component: ConnectWalletStep,
      props: {
        onNext: () => setCurrentStep(1),
        onSkip: () => setCurrentStep(1),
      },
    },
    {
      component: CreateProfileStep,
      props: {
        onNext: () => setCurrentStep(2),
      },
    },
    {
      component: SelectInterestsStep,
      props: {
        onNext: () => setCurrentStep(3),
      },
    },
    {
      component: FollowSuggestionsStep,
      props: {
        onNext: () => setCurrentStep(4),
        onSkip: () => setCurrentStep(4),
      },
    },
    {
      component: CompleteStep,
      props: {},
    },
  ];

  const CurrentStepComponent = steps[currentStep].component;
  const currentStepProps = steps[currentStep].props;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg.primary }}>
      {/* Progress bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          backgroundColor: colors.bg.tertiary,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((currentStep + 1) / steps.length) * 100}%`,
            backgroundColor: colors.brand.primary,
            transition: 'width 300ms ease-out',
          }}
        />
      </div>

      {/* Step counter */}
      <div
        style={{
          position: 'fixed',
          top: spacing[4],
          right: spacing[4],
          fontSize: '14px',
          color: colors.text.tertiary,
          zIndex: 999,
        }}
      >
        Step {currentStep + 1} of {steps.length}
      </div>

      {/* Current step */}
      <CurrentStepComponent {...currentStepProps} />
    </div>
  );
}
