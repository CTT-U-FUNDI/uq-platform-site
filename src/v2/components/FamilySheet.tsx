// ============================================================================
// FamilySheet.tsx — La feuille d'une famille (liste des métiers)
// S'ouvre quand on clique sur une famille dans la mosaïque.
// Chaque métier a deux boutons : "gabarit" (pré-rempli) et "Personnaliser".
// ============================================================================

import { Icon, type IconName } from './Icon';
import {
  FAMILLE_COULEUR,
  metiersDe,
  type Famille,
  type Metier,
} from '../lib/studio-data';

interface FamilySheetProps {
  famille: Famille;
  onMetierClick: (metier: Metier, mode: 'gabarit' | 'perso') => void;
  onClose: () => void;
}

export function FamilySheet({ famille, onMetierClick, onClose }: FamilySheetProps) {
  const metiers = metiersDe(famille);
  const couleur = FAMILLE_COULEUR[famille];

  return (
    <div className="family-sheet" role="dialog" aria-label={`Métiers · ${famille}`}>
      <div className="family-sheet__backdrop" onClick={onClose} />
      <div className="family-sheet__panel">
        <div className="family-sheet__head">
          <div className="family-sheet__title">
            <h3>{famille}</h3>
            <span className="family-sheet__sub">
              {metiers.length} métier{metiers.length > 1 ? 's' : ''} · deux chemins
            </span>
          </div>
          <button
            type="button"
            className="family-sheet__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="family-sheet__list">
          {metiers.map((m) => (
            <div key={m.nom} className="family-sheet__row">
              <button
                type="button"
                className="family-sheet__main"
                onClick={() => onMetierClick(m, 'gabarit')}
              >
                <span
                  className="family-sheet__icon"
                  style={{ background: couleur }}
                >
                  <Icon name={m.icone as IconName} size={15} />
                </span>
                <span className="family-sheet__info">
                  <b>{m.nom}</b>
                  <span>{m.description}</span>
                </span>
                <span className="family-sheet__go">gabarit</span>
              </button>
              <button
                type="button"
                className="family-sheet__perso"
                onClick={() => onMetierClick(m, 'perso')}
              >
                <Icon name="spark" size={12} />
                Personnaliser
              </button>
            </div>
          ))}
          {metiers.length === 0 && (
            <div className="family-sheet__empty">
              Aucun métier dans cette famille.
            </div>
          )}
        </div>

        <div className="family-sheet__foot">
          Chaque boutique arrive pré-remplie : logo, photos, services, prix, horaires.
        </div>
      </div>
    </div>
  );
}