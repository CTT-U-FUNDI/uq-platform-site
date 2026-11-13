// ============================================================================
// MosaicFamily.tsx — La mosaïque des 16 familles
// ============================================================================

import { Icon, type IconName } from './Icon';
import {
  FAMILLES,
  FAMILLE_COULEUR,
  FAMILLE_ICONE,
  compterMetiers,
  type Famille,
} from '../lib/studio-data';

interface MosaicFamilyProps {
  onFamilyClick: (famille: Famille) => void;
  onFreeClick: () => void;
}

export function MosaicFamily({ onFamilyClick, onFreeClick }: MosaicFamilyProps) {
  return (
    <div className="mosaic-fam">
      <div className="mosaic-fam__head">
        <h2>Crée ton business <span>Zando</span></h2>
        <p>Vends ce que tu as, ou ouvre une boutique déjà remplie.</p>
      </div>

      <div className="mosaic-fam__grid">
        {FAMILLES.map((famille) => {
          const couleur = FAMILLE_COULEUR[famille];
          const icone = FAMILLE_ICONE[famille] as IconName;
          const nb = compterMetiers(famille);
          return (
            <button
              key={famille}
              type="button"
              className="mosaic-fam__tile"
              onClick={() => onFamilyClick(famille)}
              aria-label={`${famille} · ${nb} métiers`}
            >
              <span className="mosaic-fam__band" style={{ background: couleur }} />
              <span className="mosaic-fam__icon" style={{ background: couleur }}>
                <Icon name={icone} size={18} />
              </span>
              <span className="mosaic-fam__name">{famille}</span>
              <span className="mosaic-fam__count">{nb}</span>
            </button>
          );
        })}

        <button
          type="button"
          className="mosaic-fam__tile mosaic-fam__tile--free"
          onClick={onFreeClick}
          aria-label="Créer moi-même"
        >
          <span className="mosaic-fam__icon" style={{ background: '#0b1220' }}>
            <Icon name="plus" size={18} />
          </span>
          <span className="mosaic-fam__name">Créer moi-même</span>
        </button>
      </div>
    </div>
  );
}