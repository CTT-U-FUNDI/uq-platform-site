import { useMemo, useState } from 'react';
import { Icon } from './Icon';
import { Avatar, Sheet } from './Ui';
import { useAsync, usePolling } from '../lib/hooks';
import { useSession } from '../lib/session';
import {
  likePublication,
  listPublications,
  recordPublicationView,
  unlikePublication,
  type Publication,
  type ZandoItem,
} from '../lib/api';
import { estVitrineBoutique, formatCount, formatNumber } from '../lib/format';
import { useDisplayAmount } from '../lib/currency';

/** Statuts ouverts pendant cette session : la bulle reste marquée « vue ». */
const lus = new Set<string>();

const secondesRestantes = (publication: Publication): number =>
  Math.floor(publication.expires_at) - Math.floor(Date.now() / 1000);

const restantLabel = (publication: Publication): string => {
  const secondes = secondesRestantes(publication);
  if (secondes <= 0) return 'Terminé';
  const heures = Math.floor(secondes / 3600);
  if (heures >= 1) return `Expire dans ${heures} h`;
  return `Expire dans ${Math.max(1, Math.floor(secondes / 60))} min`;
};

/** Un auteur peut avoir plusieurs statuts en ligne : on groupe par pseudo. */
interface Bulle {
  pseudo: string;
  avatar?: string;
  statuts: Publication[];
}

export function StatusRail({
  items,
  onOpenItem,
  onOpenProfile,
}: {
  /** Éléments Zando déjà chargés : sert à résoudre le lien du statut. */
  items: ZandoItem[];
  onOpenItem?: (item: ZandoItem) => void;
  /** Ouvre la fiche publique de l'auteur (pseudo uniquement). */
  onOpenProfile?: (pseudo: string) => void;
}) {
  const { toast } = useSession();
  /** Le prix d'une offre s'affiche en devise, jamais en BORB brut. */
  const money = useDisplayAmount();
  const feed = useAsync(() => listPublications(), []);
  usePolling(() => feed.reload(), 10000);

  const [ouverte, setOuverte] = useState<Bulle | null>(null);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Compteurs rendus par l'API, prioritaires sur ceux du flux. */
  const [comptes, setComptes] = useState<
    Record<string, { likes?: number; liked?: boolean; vues?: number }>
  >({});

  const bulles = useMemo<Bulle[]>(() => {
    const enLigne = (feed.data?.publications || []).filter(
      (entry) => entry.kind === 'status' && secondesRestantes(entry) > 0,
    );
    const parAuteur = new Map<string, Bulle>();
    for (const entry of enLigne) {
      const cle = String(entry.author_pseudo || '').toLowerCase();
      if (!cle) continue;
      const existante = parAuteur.get(cle);
      if (existante) {
        existante.statuts.push(entry);
      } else {
        // Le flux arrive du plus récent au plus ancien : le premier vu est le dernier publié.
        parAuteur.set(cle, { pseudo: entry.author_pseudo, avatar: entry.author_avatar, statuts: [entry] });
      }
    }
    return Array.from(parAuteur.values());
  }, [feed.data]);

  const selection = useMemo(() => {
    if (!ouverte) return null;
    return ouverte.statuts.find((entry) => entry.id === selectionId) || ouverte.statuts[0];
  }, [ouverte, selectionId]);

  const likesDe = (entry: Publication) => comptes[entry.id]?.likes ?? entry.likes;
  const aimeDe = (entry: Publication) => comptes[entry.id]?.liked ?? entry.liked;
  const vuesDe = (entry: Publication) => comptes[entry.id]?.vues ?? entry.vues;

  const ouvrirBulle = (bulle: Bulle) => {
    const cible = bulle.statuts[0];
    setOuverte(bulle);
    setSelectionId(cible.id);
    if (lus.has(cible.id)) return;
    lus.add(cible.id);
    recordPublicationView(cible.id)
      .then((resultat) =>
        setComptes((precedents) => ({
          ...precedents,
          [cible.id]: { ...precedents[cible.id], vues: resultat.vues },
        })),
      )
      .catch(() => {
        // La vue est secondaire : elle ne doit jamais bloquer l'ouverture.
        lus.delete(cible.id);
      });
  };

  const basculerLike = async (entry: Publication) => {
    if (busy) return;
    setBusy(true);
    const aime = aimeDe(entry);
    try {
      const resultat = aime
        ? await unlikePublication(entry.id)
        : await likePublication(entry.id);
      setComptes((precedents) => ({
        ...precedents,
        [entry.id]: { ...precedents[entry.id], likes: resultat.likes, liked: !aime },
      }));
    } catch (error) {
      toast(
        error instanceof Error && error.message ? error.message : 'Action impossible.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const fermer = () => {
    setOuverte(null);
    setSelectionId(null);
  };

  // Rien a montrer tant que le flux ne confirme aucun statut en ligne :
  // pas de bulles inventees pendant le chargement.
  if (bulles.length === 0) return null;

  const offreLiee = (() => {
    const identifiant = selection?.zando_item_id;
    if (!identifiant) return null;
    return items.find((entry) => String(entry.id) === String(identifiant)) || null;
  })();

  return (
    <>
      <section className="v2-status-rail" aria-label="Statuts">
        <div className="v2-status-rail-head">
          <span className="v2-status-rail-titre">
            <Icon name="clock" size={13} />
            Statuts · 24 h
          </span>
          <span className="v2-muted" style={{ fontSize: 11.5 }}>
            {bulles.length > 1 ? `${bulles.length} auteurs` : `${bulles.length} auteur`}
          </span>
        </div>

        <div className="v2-status-rail-defile">
          {bulles.map((bulle) => {
            const dejaVu = lus.has(bulle.statuts[0].id);
            return (
              <button
                key={bulle.pseudo.toLowerCase()}
                type="button"
                className="v2-status-bulle"
                data-lu={dejaVu}
                onClick={() => ouvrirBulle(bulle)}
                aria-label={`Statut de ${bulle.pseudo}`}
              >
                <span className="v2-status-bulle-anneau">
                  <Avatar
                    label={bulle.pseudo.slice(0, 2).toUpperCase()}
                    src={bulle.avatar}
                    size={52}
                  />
                </span>
                <span className="v2-status-bulle-nom">{bulle.pseudo}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Sheet
        open={Boolean(selection)}
        onClose={fermer}
        title={ouverte?.pseudo || 'Statut'}
        subtitle={selection ? restantLabel(selection) : undefined}
        full
        footer={
          ouverte && selection ? (
            <div className="v2-status-actions">
              <button
                type="button"
                className="v2-status-auteur"
                onClick={() => onOpenProfile?.(ouverte.pseudo)}
                disabled={!onOpenProfile}
              >
                <Icon name="user" size={14} />
                {ouverte.pseudo}
              </button>
              <span className="v2-status-compteur">
                <Icon name="eye" size={13} />
                {formatCount(vuesDe(selection))}
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                {offreLiee && onOpenItem ? (
                  <button
                    type="button"
                    className="v2-icon-btn v2-icon-btn--sm"
                    aria-label="Voir l’offre Zando"
                    onClick={() => onOpenItem(offreLiee)}
                  >
                    <Icon name="market" size={18} />
                  </button>
                ) : null}
                <button
                  type="button"
                  className="v2-icon-btn v2-icon-btn--sm"
                  data-alert={aimeDe(selection) ? 'true' : undefined}
                  aria-label={aimeDe(selection) ? 'Retirer mon like' : 'Like'}
                  disabled={busy}
                  onClick={() => void basculerLike(selection)}
                >
                  {busy ? (
                    <span className="v2-spinner" />
                  ) : (
                    <>
                      <Icon name="sparkles" size={18} />
                    </>
                  )}
                </button>
                <span className="v2-status-compteur">{formatCount(likesDe(selection))}</span>
              </div>
            </div>
          ) : undefined
        }
      >
        {ouverte && selection ? (
          <>
            {ouverte.statuts.length > 1 ? (
              <div className="v2-status-barres" role="tablist" aria-label="Statuts de l’auteur">
                {ouverte.statuts.map((entry, index) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={entry.id === selection.id}
                    className="v2-status-barre"
                    data-active={entry.id === selection.id}
                    aria-label={`Statut ${index + 1} sur ${ouverte.statuts.length} · ${restantLabel(entry)}`}
                    onClick={() => setSelectionId(entry.id)}
                  />
                ))}
              </div>
            ) : null}

            <div className="v2-status-canvas">
              {selection.media ? (
                <img className="v2-status-media" src={selection.media} alt={selection.title} />
              ) : (
                <div className="v2-status-texte">
                  <div>
                    <div style={{ fontWeight: 750, fontSize: 17 }}>{selection.title}</div>
                    {selection.body ? (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 14,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {selection.body}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {selection.media ? (
                <div style={{ width: '100%' }}>
                  <div style={{ fontWeight: 750, fontSize: 15 }}>{selection.title}</div>
                  {selection.body ? (
                    <div
                      className="v2-muted"
                      style={{ marginTop: 4, fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}
                    >
                      {selection.body}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {offreLiee ? (
                <span className="v2-status-compteur" style={{ alignSelf: 'flex-start' }}>
                  <Icon name={estVitrineBoutique(offreLiee) ? 'market' : 'coin'} size={13} />
                  {estVitrineBoutique(offreLiee) ? 'Boutique' : money.format(offreLiee.price_borb)}
                </span>
              ) : typeof selection.price === 'number' && selection.price > 0 ? (
                <span className="v2-status-compteur" style={{ alignSelf: 'flex-start' }}>
                  <Icon name="coin" size={13} />
                  {formatNumber(selection.price, 2)}
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </Sheet>
    </>
  );
}
