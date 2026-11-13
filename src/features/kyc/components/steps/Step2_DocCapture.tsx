import { Icon } from '../../../../components/ui/Icon';
﻿import React from 'react';
interface Props { onNext: (data: any) => void; onBack: () => void; }
export function Step2_DocCapture({ onNext, onBack }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <h3 style={{ fontSize: 20, fontWeight: 700 }}><Icon name="camera" size={20} /> Scan du document</h3>
      <div className="kyc-camera-frame" style={{ flex: 1 }}>
        <div className="kyc-camera-overlay">
          <div className="kyc-camera-guide" />
        </div>
      </div>
      <p style={{ fontSize: 13, color: 'var(--kyc-text-muted)' }}>
        Placez votre document dans le cadre
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="kyc-btn kyc-btn-secondary" onClick={onBack}><Icon name="arrowLeft" size={20} /> Retour</button>
        <button className="kyc-btn kyc-btn-primary" onClick={() => onNext({})} style={{ flex: 1 }}>
          <Icon name="camera" size={20} /> Capturer
        </button>
      </div>
    </div>
  );
}
export default Step2_DocCapture;
