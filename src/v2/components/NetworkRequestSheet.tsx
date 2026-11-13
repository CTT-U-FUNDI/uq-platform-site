// ============================================================================
// NetworkRequestSheet.tsx — Formulaire d'envoi de demande de reseau
// ============================================================================

import { useState } from 'react';
import { Sheet, Button } from './Ui';
import { requestNetwork } from '../lib/api';

interface NetworkRequestSheetProps {
  open: boolean;
  onClose: () => void;
  destinataire: string;
  pseudo: string;
  onSuccess?: () => void;
}

export function NetworkRequestSheet({
  open,
  onClose,
  destinataire,
  pseudo,
  onSuccess,
}: NetworkRequestSheetProps) {
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleEnvoyer = async () => {
    if (pin.length < 4) {
      setErreur('PIN trop court');
      return;
    }
    setBusy(true);
    setErreur('');
    try {
      const result = await requestNetwork({ destinataire, pin });
      if (result.status !== 'success') {
        setErreur(result.message || 'Erreur');
        setBusy(false);
        return;
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur');
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Rejoindre le reseau de @${pseudo}`}
      subtitle="Offre 1 USD pour envoyer une demande"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Explication */}
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: 'var(--v2-surface-2)',
            border: '1px solid var(--v2-line)',
            fontSize: 13.5,
            color: 'var(--v2-ink-2)',
            lineHeight: 1.5,
          }}
        >
          Pour augmenter ton reseau, tu dois offrir{' '}
          <b>1 USD</b> a ce membre. <b>Ca augmente ta reputation au publique.</b>
        </div>

        {/* Montant */}
        <div
          style={{
            padding: 16,
            borderRadius: 14,
            background: 'var(--v2-accent-soft)',
            border: '1px solid var(--v2-accent)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--v2-ink-3)', fontWeight: 600 }}>
            MONTANT
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>1,00 USD</div>
          <div style={{ fontSize: 12, color: 'var(--v2-ink-3)', marginTop: 4 }}>
            100 points BORB
          </div>
        </div>

        {/* Explication expiration */}
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.3)',
            fontSize: 12.5,
            color: 'var(--v2-ink-2)',
            lineHeight: 1.5,
          }}
        >
          <b>La demande expire dans 12h.</b>{' '}
          Si elle est acceptee, le 1 USD est transfere. Sinon, il t'est rendu.
        </div>

        {/* PIN */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--v2-ink-3)',
              marginBottom: 6,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Confirme avec ton code PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="• • • •"
            maxLength={6}
            style={{
              width: '100%',
              height: 52,
              borderRadius: 14,
              border: '1px solid var(--v2-line-strong)',
              background: 'var(--v2-surface)',
              fontSize: 24,
              textAlign: 'center',
              letterSpacing: 8,
              fontWeight: 700,
              outline: 'none',
            }}
          />
        </div>

        {erreur && (
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              background: 'rgba(230,57,70,0.1)',
              color: 'var(--v2-accent-strong)',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {erreur}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" block onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          <Button
            variant="primary"
            block
            onClick={handleEnvoyer}
            disabled={busy || pin.length < 4}
            loading={busy}
          >
            Envoyer
          </Button>
        </div>
      </div>
    </Sheet>
  );
}