import React from 'react';
import { KycBadge } from '../KycBadge';
import { Icon } from '../../../../components/ui/Icon';
interface Props { data: any; onComplete?: (data: any) => void; }
export function Step6_Result({ data, onComplete }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}><Icon name="sparkle" size={20} tone="brand" /></div>
        <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Vérification réussie !
        </h3>
        <KycBadge status="verified" size="lg" />
      </div>

      <div className="kyc-score-card">
        <div className="kyc-score-label">Score final</div>
        <div className="kyc-score-value">89%</div>
      </div>

      <button className="kyc-btn kyc-btn-primary" onClick={() => onComplete?.(data)}>
        Accéder à mon compte →
      </button>
    </div>
  );
}
export default Step6_Result;
