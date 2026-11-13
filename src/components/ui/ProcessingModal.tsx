import { Icon } from './Icon';
﻿import React, { useEffect, useState } from 'react';

interface ProcessingStep {
  label: string;
  status: 'pending' | 'loading' | 'done' | 'error';
}

interface ProcessingModalProps {
  title: string;
  subtitle?: string;
  steps: ProcessingStep[];
  progress?: number; // 0-100
  duration?: number; // ms
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  title,
  subtitle,
  steps,
  progress: initialProgress,
  duration = 2500,
}) => {
  const [progress, setProgress] = useState(initialProgress || 0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (initialProgress !== undefined) {
      setProgress(initialProgress);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);

      // Mettre à jour l'étape en cours
      const stepIndex = Math.floor((newProgress / 100) * steps.length);
      setCurrentStep(Math.min(stepIndex, steps.length - 1));

      if (newProgress >= 100) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [duration, initialProgress, steps.length]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#14141A] border border-[#2A2A38] rounded-2xl p-6 uq-animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3 animate-pulse"><Icon name="hourglass" size={20} tone="muted" /></div>
          <h3 className="text-lg font-bold text-[#EAECEF] mb-1">{title}</h3>
          {subtitle && <p className="text-xs text-[#8E8E9A]">{subtitle}</p>}
        </div>

        {/* Étapes */}
        <div className="space-y-2.5 mb-5">
          {steps.map((step, i) => {
            let icon = '⏳';
            let color = '#5A5A6A';

            if (i < currentStep || step.status === 'done') {
              icon = '✅';
              color = '#0ECB81';
            } else if (i === currentStep || step.status === 'loading') {
              icon = '🔄';
              color = '#4A9EFF';
            } else if (step.status === 'error') {
              icon = '❌';
              color = '#F6465D';
            }

            return (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-base" style={{ color }}>
                  {icon}
                </span>
                <span style={{ color: i <= currentStep ? '#EAECEF' : '#5A5A6A' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Barre de progression */}
        <div className="w-full h-2 bg-[#1A1A24] rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-xs text-[#8E8E9A]">{Math.round(progress)}%</p>
      </div>
    </div>
  );
};

export default ProcessingModal;
