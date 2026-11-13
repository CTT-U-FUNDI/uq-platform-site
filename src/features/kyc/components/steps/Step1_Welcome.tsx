// Step 1 — Welcome
import React from 'react';
import { Icon } from '../../../../components/ui/Icon';

interface Props {
  onNext: () => void;
  onCancel?: () => void;
}

export function Step1_Welcome({ onNext, onCancel }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          Bienvenue <Icon name="hand" size={18} tone="info" />
        </h3>
        <p style={{ color: 'var(--kyc-text-muted)', lineHeight: 1.6 }}>
          Pour débloquer votre portefeuille et toutes les fonctionnalités,
          nous devons vérifier votre identité.
        </p>
      </div>

      <div style={{
        padding: 20,
        borderRadius: 16,
        background: 'var(--kyc-gradient-soft)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
          <Icon name="clipboard" size={20} tone="muted" /> Ce dont vous avez besoin :
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}><Icon name="fileText" size={20} tone="muted" /></span>
            <span>Votre carte d'identité ou passeport</span>
          </li>
          <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}><Icon name="camera" size={20} /></span>
            <span>Une caméra fonctionnelle</span>
          </li>
          <li style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}><Icon name="lightbulb" size={20} tone="warning" /></span>
            <span>Un bon éclairage</span>
          </li>
        </ul>
      </div>

      <div style={{
        padding: 16,
        borderRadius: 12,
        background: 'rgba(37, 99, 235, 0.1)',
        border: '1px solid rgba(37, 99, 235, 0.3)',
        fontSize: 13,
        color: 'var(--kyc-text-muted)'
      }}>
        <Icon name="timer" size={20} tone="muted" /> Durée estimée : <strong style={{ color: 'var(--kyc-text)' }}>2 minutes</strong>
        <br />
        <Icon name="lock" size={20} tone="muted" /> Vos données sont chiffrées de bout en bout
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 'auto' }}>
        {onCancel && (
          <button
            className="kyc-btn kyc-btn-secondary"
            onClick={onCancel}
            style={{ flex: 1 }}
          >
            Annuler
          </button>
        )}
        <button
          className="kyc-btn kyc-btn-primary"
          onClick={onNext}
          style={{ flex: 2 }}
        >
          Commencer →
        </button>
      </div>
    </div>
  );
}

export default Step1_Welcome;
