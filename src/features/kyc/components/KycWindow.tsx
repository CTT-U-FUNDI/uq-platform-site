// KycWindow — Fenêtre unique dans le stack
import React from 'react';

export type WindowState = 'previous' | 'active' | 'next';

interface KycWindowProps {
  step: number;
  totalSteps: number;
  title: string;
  icon?: string;
  state: WindowState;
  children: React.ReactNode;
}

export function KycWindow({
  step,
  totalSteps,
  title,
  icon,
  state,
  children,
}: KycWindowProps) {
  return (
    <div className="kyc-window" data-state={state}>
      {/* Header */}
      <div className="kyc-header">
        <h2 className="kyc-title">
          {icon && <span style={{ fontSize: 24 }}>{icon}</span>}
          <span>{title}</span>
        </h2>
        <div className="kyc-step-indicator">
          Étape {step} sur {totalSteps}
        </div>
      </div>

      {/* Progress bar */}
      <div className="kyc-progress">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const s = i + 1;
          let state: 'done' | 'active' | 'pending' = 'pending';
          if (s < step) state = 'done';
          else if (s === step) state = 'active';
          return (
            <div
              key={i}
              className="kyc-progress-dot"
              data-state={state}
            />
          );
        })}
      </div>

      {/* Content */}
      <div className="kyc-content kyc-animate-in">
        {children}
      </div>
    </div>
  );
}

export default KycWindow;
