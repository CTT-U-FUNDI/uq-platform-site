import { Icon } from '../../../../components/ui/Icon';
﻿import React from 'react';
interface Props { data: any; onNext: (data: any) => void; onBack: () => void; }
export function Step3_DocAnalyze({ data, onNext, onBack }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontSize: 20, fontWeight: 700 }}><Icon name="search" size={20} /> Analyse OCR</h3>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="kyc-spinner" style={{ margin: '0 auto 20px' }} />
        <p style={{ color: 'var(--kyc-text-muted)' }}>Analyse en cours...</p>
      </div>
      <button className="kyc-btn kyc-btn-primary" onClick={() => onNext({})}>Suivant →</button>
    </div>
  );
}
export default Step3_DocAnalyze;
