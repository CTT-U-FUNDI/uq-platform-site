import { Icon, type IconName } from './Icon';

/**
 * Rail d'etapes de l'assistant KYC : une pastille par ecran, la suite en
 * pointilles, et l'etape en cours libellee. Il reste lisible sur petit ecran
 * parce que seules l'etape active et ses voisines proches affichent leur titre.
 */

export interface Etape {
  cle: string;
  titre: string;
  icone: IconName;
}

interface Props {
  etapes: Etape[];
  index: number;
  onSelectif?: (index: number) => void;
}

export function KycStepper({ etapes, index, onSelectif }: Props) {
  const atteint = (cible: number) => {
    if (cible < index) return 'fait';
    if (cible === index) return 'courant';
    return 'attente';
  };

  return (
    <div className="kyc-stepper" role="progressbar" aria-valuemin={1} aria-valuemax={etapes.length} aria-valuenow={index + 1}>
      <div className="kyc-stepper-rail">
        {etapes.map((etape, position) => {
          const etat = atteint(position);
          const visible = Math.abs(position - index) <= 1 || position === 0 || position === etapes.length - 1;
          return (
            <button
              key={etape.cle}
              type="button"
              className={`kyc-pastille kyc-pastille-${etat}${visible ? '' : ' kyc-pastille-serree'}`}
              onClick={() => (etat === 'fait' ? onSelectif?.(position) : undefined)}
              disabled={etat !== 'fait' && etat !== 'courant'}
              aria-label={`Étape ${position + 1} · ${etape.titre}`}
              aria-current={etat === 'courant' ? 'step' : undefined}
            >
              <span className="kyc-pastille-bulle">
                {etat === 'fait' ? <Icon name="check" size={13} strokeWidth={2.6} /> : <Icon name={etape.icone} size={15} />}
              </span>
              {visible ? <span className="kyc-pastille-titre">{etape.titre}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="kyc-stepper-texte">
        <span>{`Étape ${index + 1} sur ${etapes.length}`}</span>
        <strong>{etapes[index]?.titre}</strong>
      </div>
    </div>
  );
}
