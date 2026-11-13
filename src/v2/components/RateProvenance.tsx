import { Icon } from './Icon';
import { decrireAgeTaux, tauxProvenanceLabel, type ProvenanceTaux } from '../lib/currency';

interface Props {
  /** Provenance lue sur l'oracle (backend ou cache local), jamais recalculée ici. */
  taux: ProvenanceTaux;
  /** Devise concernée, pour que la pastille dise ce qu'elle qualifie. */
  devise?: string;
  className?: string;
}

/**
 * Pastille de provenance et de fraîcheur des taux.
 *
 * Composant partagé, volontairement : dire « Taux agrégé » sur un écran et se
 * taire sur les six autres laisserait le membre croire que tous ses montants
 * viennent du marché. Un seul endroit décide du libellé et du ton.
 */
export function RateProvenance({ taux, devise, className }: Props) {
  const perime = /périmé/.test(taux.badge);
  const vieillissant = taux.ageSecs >= 300;
  const label = tauxProvenanceLabel(taux, devise);

  if (!label) {
    return (
      <span
        className={`v2-badge v2-badge--warning ${className || ''}`}
        title="Aucune réponse de l'oracle : aucun taux ne sera affirmé."
      >
        <Icon name="alert" size={13} /> Taux indisponible
      </span>
    );
  }

  const details = [
    taux.horsLigne ? 'Réseau coupé : dernière réponse reçue resservie.' : '',
    taux.devisesRejouees > 0
      ? `${taux.devisesRejouees} devise(s) resservie(s) depuis leur dernière observation`
      : '',
    taux.nbSources > 0 ? `${taux.nbSources} source(s) ce cycle` : '',
    decrireAgeTaux(taux.ageSecs),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <span
      className={`v2-badge ${
        taux.horsLigne || perime ? 'v2-badge--warning' : vieillissant ? 'v2-badge--accent' : ''
      } ${className || ''}`}
      style={{ gap: 4 }}
      title={details}
    >
      <Icon name={taux.horsLigne ? 'alert' : 'clock'} size={13} /> {label}
    </span>
  );
}
