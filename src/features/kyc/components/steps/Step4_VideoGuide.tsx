import { Icon } from '../../../../components/ui/Icon';
﻿import React from 'react';
interface Props { onNext: (data: any) => void; onBack: () => void; }
export function Step4_VideoGuide({ onNext, onBack }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <h3 style={{ fontSize: 20, fontWeight: 700 }}><Icon name="video" size={20} /> Vidéo guidée</h3>
      <div className="kyc-camera-frame" style={{ flex: 1 }} />
      <p style={{ fontSize: 13, color: 'var(--kyc-text-muted)' }}>
        <Icon name="hand" size={20} tone="info" /> Regardez droit devant vous
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="kyc-btn kyc-btn-secondary" onClick={onBack}><Icon name="arrowLeft" size={20} /> Retour</button>
        <button className="kyc-btn kyc-btn-primary" onClick={() => onNext({})} style={{ flex: 1 }}>
          Démarrer
        </button>
      </div>
    </div>
  );
}
export default Step4_VideoGuide;
