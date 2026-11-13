// ============================================================================
// ReputationTable.tsx — Tableau de réputation en overlay (fond flou)
// ============================================================================

import { Icon } from './Icon';

export interface ReputationData {
  vert: number;
  blanc: number;
  orange: number;
  rouge: number;
  noir: number;
  vert_depuis_rouge?: number;
}

interface ReputationTableProps {
  open: boolean;
  onClose: () => void;
  pseudo: string;
  data: ReputationData | null;
  confiance?: number;
  noteMoyenne?: number;
  nbAvis?: number;
}

const COULEURS: Array<{
  key: keyof ReputationData;
  nom: string;
  icone: string;
  desc: string;
  couleur: string;
}> = [
  { key: 'vert', nom: 'VERT', icone: '🟢', desc: "Tes bonnes actions d'aujourd'hui", couleur: '#22c55e' },
  { key: 'blanc', nom: 'BLANC', icone: '⚪', desc: "Ta mémoire, ne s'efface jamais", couleur: '#e5e7eb' },
  { key: 'orange', nom: 'ORANGE', icone: '🟠', desc: 'En cours de vérification', couleur: '#f97316' },
  { key: 'rouge', nom: 'ROUGE', icone: '🔴', desc: 'Problème confirmé', couleur: '#ef4444' },
  { key: 'noir', nom: 'NOIR', icone: '⬛', desc: 'Histoire permanente', couleur: '#111827' },
];

export function ReputationTable({
  open,
  onClose,
  pseudo,
  data,
  confiance,
  noteMoyenne,
  nbAvis,
}: ReputationTableProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          background: 'var(--v2-surface)',
          borderRadius: 20,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 18px',
            borderBottom: '1px solid var(--v2-line)',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 750, letterSpacing: '-0.01em' }}>
              Réputation de @{pseudo}
            </div>
            <div style={{ fontSize: 12, color: 'var(--v2-ink-3)', marginTop: 2 }}>
              Détail des 5 couleurs et de la confiance
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              border: '1px solid var(--v2-line)',
              background: 'var(--v2-surface-2)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {COULEURS.map((c) => {
            const valeur = data ? (data[c.key] as number | undefined) ?? 0 : 0;
            return (
              <div
                key={c.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: 'var(--v2-surface-2)',
                  border: '1px solid var(--v2-line)',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    flex: 'none',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 20,
                    background: c.couleur,
                    color: c.key === 'blanc' ? '#111827' : '#fff',
                    border: c.key === 'blanc' ? '2px solid #d1d5db' : 'none',
                  }}
                >
                  {c.key === 'noir' ? '⬛' : c.icone}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{c.nom}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--v2-ink-3)', marginTop: 2 }}>
                    {c.desc}
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 780, minWidth: 44, textAlign: 'right' }}>
                  {valeur}
                </div>
              </div>
            );
          })}

          {/* Confiance + Avis */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginTop: 16,
              padding: 14,
              borderRadius: 14,
              background: 'var(--v2-accent-soft)',
              border: '1px solid var(--v2-accent)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--v2-ink-3)', fontWeight: 600 }}>
                CONFIANCE
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>
                {confiance !== undefined ? `${confiance}%` : '—'}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--v2-ink-3)', fontWeight: 600 }}>
                AVIS
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2 }}>
                {noteMoyenne !== undefined ? `${noteMoyenne}/5` : '—'}
              </div>
              {nbAvis !== undefined && (
                <div style={{ fontSize: 11, color: 'var(--v2-ink-3)' }}>
                  {nbAvis} avis
                </div>
              )}
            </div>
          </div>

          {/* Info rachat */}
          {data && (data.rouge > 0 || data.noir > 0) && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.3)',
                fontSize: 12.5,
                color: 'var(--v2-ink-2)',
                lineHeight: 1.5,
              }}
            >
              <b>Rachat en cours :</b>{' '}
              {data.vert_depuis_rouge ?? 0}/10 Vert accumulés depuis le dernier Rouge.
              {' '}10 Vert = 1 Rouge effacé.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 14,
            borderTop: '1px solid var(--v2-line)',
            background: 'var(--v2-surface-2)',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 14,
              border: 0,
              background: 'var(--v2-accent)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}