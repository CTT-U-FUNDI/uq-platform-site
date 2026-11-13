// ============================================================================
// ReputationLegend.tsx — Feuille explicative des 5 couleurs
// ============================================================================

import { Sheet } from './Ui';
import { Icon } from './Icon';

interface ReputationLegendProps {
  open: boolean;
  onClose: () => void;
}

const COULEURS = [
  {
    icone: '●',
    couleur: '#22c55e',
    nom: 'VERT',
    sousTitre: "Tes bonnes actions d'aujourd'hui",
    description:
      'Chaque vente réussie, chaque bonne action = +1 Vert. Si tu fais une mauvaise action, ton Vert diminue.',
  },
  {
    icone: '●',
    couleur: '#e5e7eb',
    nom: 'BLANC',
    sousTitre: 'Ta mémoire',
    description:
      "Même si ton Vert diminue, ton Blanc garde la trace de tout le bien que tu as déjà fait. Ton passé ne s'efface pas.",
  },
  {
    icone: '●',
    couleur: '#f97316',
    nom: 'ORANGE',
    sousTitre: 'En cours de vérification',
    description:
      "On t'a signalé ? On ne te condamne pas. Tu passes en Orange, le temps qu'on vérifie. Si c'est faux, l'Orange disparaît. Si c'est vrai, l'Orange devient Rouge.",
  },
  {
    icone: '●',
    couleur: '#ef4444',
    nom: 'ROUGE',
    sousTitre: 'Problème confirmé',
    description:
      "C'est prouvé, ce n'est pas une rumeur. Mais tu peux te racheter : 10 achats réussis = 1 rouge effacé. Et tu peux à nouveau vendre.",
  },
  {
    icone: '●',
    couleur: '#111827',
    nom: 'NOIR',
    sousTitre: "L'histoire qu'on n'oublie pas",
    description:
      "Même si tu effaces ton Rouge, le Noir reste pour toujours. Il rappelle que tu as déjà eu un Rouge un jour. Tu peux changer, mais on n'oublie pas.",
  },
];

export function ReputationLegend({ open, onClose }: ReputationLegendProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Le système de réputation UQ"
      subtitle="Personne n'est condamné pour toujours, mais personne ne peut effacer son passé."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {COULEURS.map((c) => (
          <div
            key={c.nom}
            style={{
              display: 'flex',
              gap: 14,
              padding: 14,
              borderRadius: 14,
              background: 'var(--v2-surface-2)',
              border: '1px solid var(--v2-line)',
            }}
          >
            <div
              style={{
                flex: 'none',
                width: 44,
                height: 44,
                borderRadius: 22,
                background: c.couleur,
                display: 'grid',
                placeItems: 'center',
                fontSize: 22,
                color: c.nom === 'BLANC' ? '#111827' : '#fff',
                border: c.nom === 'BLANC' ? '2px solid #d1d5db' : 'none',
              }}
            >
              {c.nom === 'NOIR' ? '⬛' : c.icone}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 750,
                  letterSpacing: '-0.01em',
                  marginBottom: 2,
                }}
              >
                {c.nom}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--v2-ink-3)',
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                {c.sousTitre}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--v2-ink-2)',
                  lineHeight: 1.45,
                }}
              >
                {c.description}
              </div>
            </div>
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: 14,
            borderRadius: 14,
            background: 'var(--v2-accent-soft)',
            border: '1px solid var(--v2-accent)',
            marginTop: 8,
          }}
        >
          <Icon name="shield" size={20} />
          <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--v2-ink)' }}>
            <b>Le procès public dure 3 jours.</b> Les autres membres votent et
            commentent. À la fin, l'algorithme vérifie l'historique des
            commentateurs : si les commentateurs sont positifs, les sanctions
            sont rejetées. Si les commentateurs ont des litiges, les sanctions
            sont appliquées.
          </div>
        </div>
      </div>
    </Sheet>
  );
}