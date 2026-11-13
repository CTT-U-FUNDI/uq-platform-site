// KycWindowStack — Empilement de fenêtres avec flou progressif
import React from 'react';
import { KycWindow, WindowState } from './KycWindow';

interface Step {
  id: string;
  title: string;
  icon?: string;
  component: React.ReactNode;
}

interface KycWindowStackProps {
  steps: Step[];
  currentStep: number; // 1-indexed
}

export function KycWindowStack({ steps, currentStep }: KycWindowStackProps) {
  return (
    <div className="kyc-stack">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        let state: WindowState = 'next';

        if (stepNum < currentStep) state = 'previous';
        else if (stepNum === currentStep) state = 'active';

        return (
          <KycWindow
            key={step.id}
            step={stepNum}
            totalSteps={steps.length}
            title={step.title}
            icon={step.icon}
            state={state}
          >
            {step.component}
          </KycWindow>
        );
      })}
    </div>
  );
}

export default KycWindowStack;
