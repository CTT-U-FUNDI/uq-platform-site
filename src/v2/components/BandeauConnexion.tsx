import { Icon } from './Icon';
import { useAsync } from '../lib/hooks';
import { BOUTIQUE_SYSTEME_ID, getShop } from '../lib/api';

/**
 * Entrée de la boutique système, posée sur les surfaces vivantes du marché.
 *
 * Le titre, l'accroche et le visuel viennent de la fiche serveur : si la route
 * ne répond pas ou ne connaît pas encore la boutique, le bandeau ne s'affiche
 * pas plutôt que d'inventer un contenu.
 */
export function BandeauConnexion({ onOpen }: { onOpen: () => void }) {
  const boutique = useAsync(() => getShop(BOUTIQUE_SYSTEME_ID), []);
  const fiche = boutique.data?.shop;

  if (!fiche) return null;

  return (
    <button
      type="button"
      className="v2-card"
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        textAlign: 'left',
        padding: 10,
      }}
      aria-label={`Ouvrir la boutique ${fiche.name}`}
    >
      {fiche.presentation_photo ? (
        <img
          src={fiche.presentation_photo}
          alt=""
          loading="lazy"
          style={{
            flex: 'none',
            width: 78,
            height: 62,
            borderRadius: 12,
            objectFit: 'cover',
          }}
        />
      ) : (
        <span
          style={{
            flex: 'none',
            display: 'grid',
            placeItems: 'center',
            width: 78,
            height: 62,
            borderRadius: 12,
            background: 'var(--v2-surface-3)',
            color: 'var(--v2-ink-3)',
          }}
        >
          <Icon name="globe" size={24} />
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14.5, fontWeight: 750, lineHeight: 1.25 }}>{fiche.name}</span>
          {fiche.confiance_systeme ? (
            <span className="v2-badge v2-badge--accent" style={{ fontSize: 10.5, fontWeight: 720 }}>
              <Icon name="shield" size={11} /> {fiche.confiance}
            </span>
          ) : null}
        </span>
        <span
          className="v2-muted v2-clamp-2"
          style={{ display: 'block', fontSize: 12, marginTop: 4, lineHeight: 1.3 }}
        >
          {fiche.description}
        </span>
      </span>
      <span style={{ flex: 'none', color: 'var(--v2-ink-3)' }}>
        <Icon name="forward" size={18} />
      </span>
    </button>
  );
}
