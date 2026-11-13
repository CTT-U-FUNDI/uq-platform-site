import { Icon } from '../../../../components/ui/Icon';
﻿import React from 'react';
interface Props { data: any; onNext: (data: any) => void; onBack: () => void; }
export function Step5_FaceCompare({ data, onNext, onBack }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontSize: 20, fontWeight: 700 }}><Icon name="user" size={20} /> Comparaison visage</h3>
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="kyc-spinner" style={{ margin: '0 auto 20px' }} />
        <p style={{ color: 'var(--kyc-text-muted)' }}>Comparaison en cours...</p>
      </div>
      <button className="kyc-btn kyc-btn-primary" onClick={() => onNext({})}>Voir résultat →</button>
    </div>
  );
}
export default Step5_FaceCompare;
