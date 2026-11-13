// KycFlow — Orchestrateur principal du KYC
import React, { useState } from 'react';
import { KycWindowStack } from '../components/KycWindowStack';
import '../styles/kyc-flow.css';

// Steps (à compléter avec les vrais composants)
import Step1_Welcome from '../components/steps/Step1_Welcome';
import Step2_DocCapture from '../components/steps/Step2_DocCapture';
import Step3_DocAnalyze from '../components/steps/Step3_DocAnalyze';
import Step4_VideoGuide from '../components/steps/Step4_VideoGuide';
import Step5_FaceCompare from '../components/steps/Step5_FaceCompare';
import Step6_Result from '../components/steps/Step6_Result';

interface KycFlowProps {
  onComplete?: (result: any) => void;
  onCancel?: () => void;
}

export function KycFlow({ onComplete, onCancel }: KycFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [kycData, setKycData] = useState<any>({});

  const next = (data?: any) => {
    if (data) {
      setKycData((prev: any) => ({ ...prev, ...data }));
    }
    setCurrentStep((s) => Math.min(s + 1, 6));
  };

  const back = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const steps = [
    {
      id: 'welcome',
      title: 'Vérification d\'identité',
      icon: '🎯',
      component: <Step1_Welcome onNext={() => next()} onCancel={onCancel} />,
    },
    {
      id: 'doc-capture',
      title: 'Scanner le document',
      icon: '📷',
      component: <Step2_DocCapture onNext={(data: any) => next(data)} onBack={back} />,
    },
    {
      id: 'doc-analyze',
      title: 'Analyse OCR',
      icon: '🔍',
      component: <Step3_DocAnalyze data={kycData} onNext={(data: any) => next(data)} onBack={back} />,
    },
    {
      id: 'video-guide',
      title: 'Vidéo guidée',
      icon: '🎥',
      component: <Step4_VideoGuide onNext={(data: any) => next(data)} onBack={back} />,
    },
    {
      id: 'face-compare',
      title: 'Comparaison visage',
      icon: '👤',
      component: <Step5_FaceCompare data={kycData} onNext={(data: any) => next(data)} onBack={back} />,
    },
    {
      id: 'result',
      title: 'Résultat final',
      icon: '🎉',
      component: <Step6_Result data={kycData} onComplete={onComplete} />,
    },
  ];

  return (
    <div className="kyc-flow-container">
      <KycWindowStack steps={steps} currentStep={currentStep} />
    </div>
  );
}

export default KycFlow;
