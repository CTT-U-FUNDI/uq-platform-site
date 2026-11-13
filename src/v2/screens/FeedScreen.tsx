import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Icon } from '../components/Icon';
import { PublicProfileSheet } from '../components/PublicProfileSheet';
import {
  Avatar,
  Button,
  EmptyState,
  ErrorBlock,
  Field,
  Loader,
  Sheet,
  Textarea,
} from '../components/Ui';
import { useAsync } from '../lib/hooks';
import {
  describeError,
  interactZando,
  listZandoInteractions,
  listZandoItems,
  sqlStamp,
  zandoOwner,
  type ZandoInteraction,
  type ZandoItem,
} from '../lib/api';
import {
  estVitrineBoutique,
  firstContentUrl,
  firstImageUrl,
  formatDureeRestante,
  formatInt,
  parseMediaUrls,
} from '../lib/format';
import { identityAvatar, identityLabel, identityPseudo, useIdentities } from '../lib/identity';
import { useSession } from '../lib/session';
import { useDisplayAmount } from '../lib/currency';

/** Texte d'un commentaire Zando : la charge libre porte `{ content }`. */
const commentText = (entry: ZandoInteraction): string => {
  try {
    const parsed = JSON.parse(entry.data || '{}') as { content?: unknown };
    return typeof parsed.content === 'string' ? parsed.content : '';
  } catch {
    return '';
  }
};

/** Tally des interactions reelses d'une offre, lu sur /api/zando/item/{id}/interactions. */
type InteractionKind = 'view' | 'like' | 'share' | 'comment';

interface InteractionTally extends Record<InteractionKind, number> {
  /** La route remonte les 500 dernieres lignes : au-dela, les compteurs sont bornes. */
  limited: boolean;
}

const tallyOf = (list: ZandoInteraction[]): InteractionTally => {
  const tally: InteractionTally = { view: 0, like: 0, share: 0, comment: 0, limited: false };
  for (const entry of list) {
    if (entry.type === 'view' || entry.type === 'like' || entry.type === 'share' || entry.type === 'comment') {
      tally[entry.type] += 1;
    }
  }
  tally.limited = list.length >= 500;
  return tally;
};

/** Mini barre du flux : trois compteurs issus des interactions enregistrees. */
function InteractionBars({ tally }: { tally: InteractionTally }) {
  const rows = [
    { label: 'Vues', value: tally.view },
    { label: 'Gardés', value: tally.like },
    { label: 'Commentaires', value: tally.comment },
  ];
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  if (total === 0) {
    return (
      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)' }}>
        Aucune interaction enregistree
      </div>
    );
  }

  return (
    <div>
      <div style={{ height: 78 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
            barCategoryGap={6}
          >
            <XAxis type="number" hide domain={[0, 'dataMax']} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={88}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.72)', fontSize: 11 }}
            />
            <Tooltip
              cursor={false}
              contentStyle={{
                background: 'rgba(12,18,28,0.92)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 10,
                fontSize: 11.5,
                color: '#fff',
              }}
              formatter={(value: number, name: string) => [formatInt(value), name]}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="rgba(255,255,255,0.82)" barSize={11} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {tally.limited && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
          Compteurs bases sur les 500 dernieres interactions
        </div>
      )}
    </div>
  );
}

/**
 * Accueil Zando : flux vertical plein ecran, une creation par ecran.
 * Toutes les donnees viennent de /api/zando/items ; les categories sont
 * deduites des offres publiees (le backend n'expose pas de route dediee).
 */
export function FeedScreen({
  onOpenItem,
  onMessage,
  onGoStudio,
  onGoMarket,
  onPlay,
  onOpenBoutiqueSysteme,
}: {
  onOpenItem: (item: ZandoItem) => void;
  onMessage: (peer: string, item?: ZandoItem) => void;
  onGoStudio: () => void;
  onGoMarket: () => void;
  /** Contenu lecteur : ouvre le lecteur payant a la seconde. */
  onPlay?: (item: ZandoItem) => void;
  /** Boutique systeme de revente de connexion. */
  onOpenBoutiqueSysteme?: () => void;
}) {
  const { toast } = useSession();
  const feed = useAsync(() => listZandoItems(), []);
  /** Prix affiches en devise : le BORB reste une garantie, pas une monnaie. */
  const money = useDisplayAmount();
  const [category, setCategory] = useState<string>('all');
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [kept, setKept] = useState<string[]>([]);
  const [commentsFor, setCommentsFor] = useState<ZandoItem | null>(null);
  /** Fiche publique du vendeur : ouverture au clic sur son pseudo ou sa photo. */
  const [profilVendeur, setProfilVendeur] = useState<string | null>(null);
  const [comments, setComments] = useState<ZandoInteraction[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  /** Compteur rafraichi apres un commentaire, en attendant le prochain flux. */
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const scrollerRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());

  /** Compteurs d'interactions de l'offre active (route publique /interactions). */
  const [tallies, setTallies] = useState<Record<string, InteractionTally>>({});
  const tallyLoadedRef = useRef<Set<string>>(new Set());
  const tallyBusyRef = useRef<Set<string>>(new Set());

  const applyTally = useCallback((itemId: string, list: ZandoInteraction[]) => {
    setTallies((current) => ({ ...current, [itemId]: tallyOf(list) }));
    tallyLoadedRef.current.add(itemId);
  }, []);

  const loadTally = useCallback(
    async (itemId: string, force = false) => {
      if (tallyBusyRef.current.has(itemId)) return;
      if (!force && tallyLoadedRef.current.has(itemId)) return;
      tallyBusyRef.current.add(itemId);
      try {
        applyTally(itemId, await listZandoInteractions(itemId));
      } catch {
        // Le compteur affiche le dernier releve plutot qu'un zero invente.
      } finally {
        tallyBusyRef.current.delete(itemId);
      }
    },
    [applyTally],
  );

  const items = useMemo(
    () =>
      (feed.data?.items || []).filter((item) => {
        if (item.published === false) return false;
        if (item.sold) return false;
        const fin = sqlStamp(item.expires_at);
        if (fin && fin <= Date.now()) return false;
        return true;
      }),
    [feed.data],
  );

  const categories = useMemo(() => {
    const found = new Set(items.map((item) => item.category).filter(Boolean));
    return ['all', ...Array.from(found)];
  }, [items]);

  const visible = useMemo(
    () => (category === 'all' ? items : items.filter((item) => item.category === category)),
    [items, category],
  );

  /**
   * Les offres portent le shop_id du vendeur ; le pseudo n'est pas toujours
   * renvoye. On resout les identites en une passe pour n'afficher que le
   * pseudo (`uq@destin`), jamais le numero UQ.
   */
  const sellers = useIdentities(visible.map((item) => zandoOwner(item)));
  const commenters = useIdentities(comments.map((entry) => entry.user_id));
  const sellerOf = (item: ZandoItem) => {
    const owner = zandoOwner(item);
    return item.seller_pseudo || identityLabel(owner, sellers[owner.toUpperCase()]) || 'Vendeur';
  };
  const commentAuthor = (userId: string) =>
    identityPseudo(userId, commenters[String(userId || '').toUpperCase()]) || 'Membre UQ';

  // Retour a la premiere creation quand le filtre change.
  useEffect(() => {
    setActive(0);
    scrollerRef.current?.scrollTo({ top: 0 });
  }, [category]);

  // Une vue est enregistree une seule fois par offre ; les compteurs sont relus apres.
  useEffect(() => {
    const item = visible[active];
    if (!item) return;
    if (seenRef.current.has(item.id)) {
      void loadTally(item.id);
      return;
    }
    seenRef.current.add(item.id);
    interactZando(item.id, 'view')
      .catch(() => undefined)
      .then(() => loadTally(item.id, true));
  }, [visible, active, loadTally]);

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    const height = node.clientHeight || 1;
    const next = Math.round(node.scrollTop / height);
    if (next !== active) {
      setActive(next);
      setExpanded(null);
    }
  };

  const keep = async (item: ZandoItem) => {
    try {
      await interactZando(item.id, 'like');
      setKept((current) => (current.includes(item.id) ? current : [...current, item.id]));
      toast('Offre enregistree', 'success');
    } catch (error) {
      toast(describeError(error, 'Enregistrement impossible.'), 'error');
    }
  };

  const share = async (item: ZandoItem) => {
    const link = `${window.location.origin}${window.location.pathname}?item=${encodeURIComponent(item.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text: item.title, url: link });
      } else {
        await navigator.clipboard.writeText(link);
        toast('Lien copie', 'success');
      }
      await interactZando(item.id, 'share').catch(() => undefined);
    } catch {
      // Partage annule par l'utilisateur : pas d'erreur a afficher.
    }
  };

  const openComments = async (item: ZandoItem) => {
    setCommentsFor(item);
    setComments([]);
    setCommentDraft('');
    setCommentBusy(true);
    try {
      const list = await listZandoInteractions(item.id);
      setComments(list.filter((entry) => entry.type === 'comment' && commentText(entry)));
    } catch (error) {
      toast(describeError(error, 'Commentaires indisponibles.'), 'error');
    } finally {
      setCommentBusy(false);
    }
  };

  const sendComment = async () => {
    if (!commentsFor) return;
    const text = commentDraft.trim();
    if (!text) return;
    setCommentBusy(true);
    try {
      await interactZando(commentsFor.id, 'comment', text);
      const list = await listZandoInteractions(commentsFor.id);
      const fresh = list.filter((entry) => entry.type === 'comment' && commentText(entry));
      setComments(fresh);
      setCommentCounts((current) => ({ ...current, [commentsFor.id]: fresh.length }));
      setCommentDraft('');
      toast('Commentaire publié', 'success');
    } catch (error) {
      toast(describeError(error, 'Commentaire refusé.'), 'error');
    } finally {
      setCommentBusy(false);
    }
  };

  if (feed.loading) {
    return (
      <div className="v2-body--flush" style={{ display: 'grid', placeItems: 'center' }}>
        <Loader label="Chargement des creations…" />
      </div>
    );
  }

  if (feed.error) {
    return (
      <div className="v2-body--flush" style={{ display: 'grid', placeItems: 'center' }}>
        <ErrorBlock message={feed.error} onRetry={feed.reload} />
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <>
        <div className="v2-feed-head" style={{ position: 'relative' }}>
          <span className="v2-feed-pill" style={{ fontWeight: 800, letterSpacing: '0.12em' }}>
            ZANDO
          </span>
          <div style={{ flex: 1 }} />
          {onOpenBoutiqueSysteme ? (
            <button
              className="v2-feed-rail-icon"
              aria-label="Boutique connexion du système"
              onClick={onOpenBoutiqueSysteme}
            >
              <Icon name="globe" size={20} />
            </button>
          ) : null}
        </div>
        <div style={{ padding: '40px 18px' }}>
          <EmptyState
            icon="market"
            title={items.length === 0 ? 'Aucune creation' : 'Rien dans cette categorie'}
            description={
              items.length === 0
                ? 'Publie la premiere offre : une photo, un titre, un prix.'
                : 'Choisis une autre categorie pour continuer.'
            }
            action={
              items.length === 0 ? (
                <Button size="sm" icon="plus" onClick={onGoStudio}>
                  Creer une offre
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setCategory('all')}>
                  Tout afficher
                </Button>
              )
            }
          />
        </div>
      </>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', background: '#05070a' }}>
      <div className="v2-feed" ref={scrollerRef} onScroll={onScroll}>
        {visible.map((item, index) => {
          const media = parseMediaUrls(item.media_urls);
          const cover = firstImageUrl(media) || media[0];
          const playable = Boolean(firstContentUrl(media));
          const open = expanded === item.id;
          const seller = sellerOf(item);
          const fin = sqlStamp(item.expires_at);
          const reste = fin ? Math.max(0, Math.round((fin - Date.now()) / 1000)) : 0;
          return (
            <article className="v2-feed-item" key={item.id} data-active={index === active}>
              {cover ? (
                <>
                  <img className="v2-feed-media v2-feed-media--blur" src={cover} alt="" aria-hidden />
                  <img
                    className="v2-feed-media"
                    src={cover}
                    alt={item.title}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    style={{ objectFit: 'contain', padding: '76px 0 210px' }}
                  />
                </>
              ) : (
                <div
                  className="v2-feed-media"
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    background: 'radial-gradient(circle at 50% 30%, #23303f, #05070a 70%)',
                    color: 'rgba(255,255,255,0.4)',
                  }}
                >
                  <Icon name="image" size={54} />
                </div>
              )}

              <div className="v2-feed-shade" />

              <div className="v2-feed-rail">
                <button className="v2-feed-rail-btn" onClick={() => keep(item)}>
                  <span
                    className="v2-feed-rail-icon"
                    style={kept.includes(item.id) ? { color: 'var(--v2-accent)' } : undefined}
                  >
                    <Icon name="sparkles" size={22} />
                  </span>
                  Garder
                </button>
                <button className="v2-feed-rail-btn" onClick={() => share(item)}>
                  <span className="v2-feed-rail-icon">
                    <Icon name="external" size={22} />
                  </span>
                  Partager
                </button>
                <button className="v2-feed-rail-btn" onClick={() => openComments(item)}>
                  <span className="v2-feed-rail-icon">
                    <Icon name="chat" size={22} />
                  </span>
                  Commenter
                  {(commentCounts[item.id] ?? item.comment_count ?? 0) > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 750, color: '#fff' }}>
                      {commentCounts[item.id] ?? item.comment_count}
                    </span>
                  )}
                </button>
                {playable && onPlay && (
                  <button className="v2-feed-rail-btn" onClick={() => onPlay(item)}>
                    <span className="v2-feed-rail-icon" style={{ color: 'var(--v2-gold)' }}>
                      <Icon name="play" size={22} />
                    </span>
                    Lire
                  </button>
                )}
                <button className="v2-feed-rail-btn" onClick={() => onMessage(zandoOwner(item), item)}>
                  <span className="v2-feed-rail-icon">
                    <Icon name="chat" size={22} />
                  </span>
                  Contacter
                </button>
                <button className="v2-feed-rail-btn" onClick={() => onOpenItem(item)} aria-label="Details de l’offre">
                  <span className="v2-feed-rail-icon">
                    <Icon name="more" size={22} />
                  </span>
                  Details
                </button>
              </div>

              <div className="v2-feed-bottom">
                <span className="v2-feed-pill">
                  <Icon name="market" size={13} />
                  <span style={{ textTransform: 'capitalize' }}>{item.category || 'Zando'}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setProfilVendeur(zandoOwner(item))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 0,
                    padding: 0,
                    color: 'inherit',
                    cursor: 'pointer',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: 'rgba(255,255,255,0.16)',
                      border: '1px solid rgba(255,255,255,0.24)',
                      fontSize: 11,
                      fontWeight: 750,
                      overflow: 'hidden',
                      flex: 'none',
                    }}
                  >
                    {identityAvatar(zandoOwner(item), sellers[zandoOwner(item).toUpperCase()]) ? (
                      <img
                        src={identityAvatar(zandoOwner(item), sellers[zandoOwner(item).toUpperCase()])}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      seller.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                      {seller}
                    </div>
                    {item.rating ? (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                        {formatInt(item.rating)} / 5 · {formatInt(item.review_count || 0)} avis
                      </div>
                    ) : null}
                  </div>
                </button>

                <div className="v2-feed-title">{item.title}</div>

                {item.subtitle && !estVitrineBoutique(item) ? (
                  <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12.5, lineHeight: 1.35 }}>
                    {item.subtitle}
                  </div>
                ) : null}

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  {estVitrineBoutique(item) ? (
                    <span className="v2-feed-pill" style={{ fontSize: 12.5, fontWeight: 750 }}>
                      <Icon name="market" size={13} /> Boutique a explorer
                    </span>
                  ) : (
                    <>
                      <span className="v2-feed-price">{money.format(item.price_borb)}</span>
                      {playable ? (
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
                          /s
                        </span>
                      ) : null}
                      {reste > 0 ? (
                        <span className="v2-feed-pill" style={{ fontSize: 11.5, fontWeight: 700 }}>
                          <Icon name="clock" size={12} /> {formatDureeRestante(reste)}
                        </span>
                      ) : null}
                    </>
                  )}
                </div>

                {item.description ? (
                  <button
                    onClick={() => setExpanded(open ? null : item.id)}
                    style={{ textAlign: 'left', color: 'rgba(255,255,255,0.86)', fontSize: 13, lineHeight: 1.45 }}
                  >
                    <span className={open ? undefined : 'v2-clamp-2'} style={{ display: 'block' }}>
                      {item.description}
                    </span>
                    <span style={{ color: 'var(--v2-gold)', fontWeight: 700, fontSize: 12 }}>
                      {open ? 'Reduire' : 'Lire la suite'}
                    </span>
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {/* Chrome du flux : marque, recherche, categories. */}
      <div className="v2-feed-head">
        <span className="v2-feed-pill" style={{ fontWeight: 800, letterSpacing: '0.12em' }}>
          ZANDO
        </span>
        <div style={{ flex: 1 }} />
        {onOpenBoutiqueSysteme ? (
          <button
            className="v2-feed-rail-icon"
            aria-label="Boutique connexion du système"
            onClick={onOpenBoutiqueSysteme}
          >
            <Icon name="globe" size={20} />
          </button>
        ) : null}
        <button className="v2-feed-rail-icon" aria-label="Rechercher" onClick={onGoMarket}>
          <Icon name="search" size={20} />
        </button>
        <button className="v2-feed-rail-icon" aria-label="Publier une offre" onClick={onGoStudio}>
          <Icon name="plus" size={20} />
        </button>
      </div>

      <div className="v2-feed-cats">
        {categories.map((entry) => (
          <button
            key={entry}
            className="v2-feed-pill"
            data-active={category === entry}
            onClick={() => setCategory(entry)}
            style={{
              textTransform: entry === 'all' ? undefined : 'capitalize',
              background: category === entry ? 'var(--v2-accent)' : undefined,
              borderColor: category === entry ? 'transparent' : undefined,
            }}
          >
            {entry === 'all' ? 'Pour toi' : entry}
          </button>
        ))}
      </div>

      {visible.length > 1 && (
        <div className="v2-feed-dots" aria-hidden>
          {visible.slice(0, 12).map((item, index) => (
            <span key={item.id} className="v2-feed-dot" data-active={index === active} />
          ))}
        </div>
      )}

      <Sheet
        open={Boolean(commentsFor)}
        onClose={() => setCommentsFor(null)}
        title="Commentaires"
        subtitle={commentsFor?.title}
        footer={
          <Button
            block
            icon="send"
            loading={commentBusy}
            disabled={!commentDraft.trim()}
            onClick={sendComment}
          >
            Envoyer
          </Button>
        }
      >
        <div className="v2-stack">
          {commentBusy && comments.length === 0 ? (
            <Loader label="Chargement des commentaires…" />
          ) : comments.length === 0 ? (
            <div className="v2-muted" style={{ fontSize: 13 }}>
              Aucun commentaire. Sois le premier.
            </div>
          ) : (
            comments.map((entry, index) => (
              <div key={`${entry.created_at}-${index}`} style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setProfilVendeur(entry.user_id)}
                  style={{
                    background: 'none',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    color: 'inherit',
                  }}
                >
                  <Avatar label={commentAuthor(entry.user_id)} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {commentAuthor(entry.user_id)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--v2-ink-3)' }}>Profil</div>
                  </div>
                </button>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>{commentText(entry)}</div>
                </div>
              </div>
            ))
          )}
          <Field label="Ton commentaire">
            <Textarea
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Écris un commentaire…"
              rows={3}
              maxLength={500}
            />
          </Field>
        </div>
      </Sheet>

      <PublicProfileSheet
        pseudo={profilVendeur || ''}
        onClose={() => setProfilVendeur(null)}
        onContact={
          profilVendeur
            ? () => {
                const peer = profilVendeur;
                setProfilVendeur(null);
                setCommentsFor(null);
                onMessage(peer);
              }
            : undefined
        }
      />
    </div>
  );
}
