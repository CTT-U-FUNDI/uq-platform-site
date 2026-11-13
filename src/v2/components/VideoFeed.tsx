import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type UIEvent } from 'react';
import { Icon } from '../../components/ui/Icon';
import { Button, EmptyState, ErrorBlock, Loader, Sheet, Textarea } from './Ui';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import { useDisplayAmount } from '../lib/currency';
import { identityPseudo, useIdentities } from '../lib/identity';
import { addToCart, useCart } from '../lib/cart';
import { estVitrineBoutique, firstImageUrl, firstVideoUrl, formatCount, parseMediaUrls } from '../lib/format';
import {
  describeError,
  followUser,
  getProfileStats,
  interactZando,
  listZandoInteractions,
  listZandoItems,
  unfollowUser,
  zandoOwner,
  type ProfileStatsResponse,
  type ZandoInteraction,
  type ZandoItem,
} from '../lib/api';

/* ============================================================
   FLUX IMMERSIF ZANDO — une publication par écran
   ============================================================
   Toutes les données viennent des routes réelles :
   /api/zando/items, /api/zando/item/{id}/interactions,
   /api/account/{uq}/public, /api/profile/stats/{pseudo},
   /api/follow/{pseudo}. Aucune valeur n'est inventée.

   Média : le Studio écrit des visuels (data URI WebP) dans `media_urls` ;
   une carte n'affie une balise <video> que si l'adresse finit par une
   extension de vidéo. Sinon, le visuel occupe l'écran.
   ============================================================ */

const compact = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) return '0';
  if (value < 1000) return String(value);
  const thousands = value / 1000;
  return `${thousands.toFixed(thousands < 10 ? 1 : 0).replace('.', ',')} k`;
};

const initials = (label: string): string => label.trim().slice(0, 2).toUpperCase();

/** Tints d'arrière-plan pour les publications sans média. */
const BACKDROPS = [
  'radial-gradient(120% 80% at 22% 18%, #402c5e 0%, transparent 62%), linear-gradient(155deg, #16202e 0%, #05070a 72%)',
  'radial-gradient(120% 80% at 78% 12%, #1d4b46 0%, transparent 60%), linear-gradient(200deg, #101c24 0%, #05070a 74%)',
  'radial-gradient(120% 80% at 30% 82%, #5a3320 0%, transparent 60%), linear-gradient(170deg, #1a1a24 0%, #05070a 70%)',
  'radial-gradient(120% 80% at 70% 70%, #2a3f6b 0%, transparent 58%), linear-gradient(190deg, #131a26 0%, #05070a 72%)',
];

/** Compteurs réels d'une offre, lus sur la route des interactions. */
interface Tally {
  view: number;
  like: number;
  share: number;
  comment: number;
  likeByMe: boolean;
  /** La route remonte 500 lignes : au-delà, les compteurs sont bornés. */
  limited: boolean;
}

const EMPTY_TALLY: Tally = { view: 0, like: 0, share: 0, comment: 0, likeByMe: false, limited: false };

const tallyOf = (list: ZandoInteraction[], account: string): Tally => {
  const tally: Tally = { ...EMPTY_TALLY, limited: list.length >= 500 };
  const mine = account.toUpperCase();
  for (const entry of list) {
    if (entry.type === 'view' || entry.type === 'like' || entry.type === 'share' || entry.type === 'comment') {
      tally[entry.type] += 1;
    }
    if (entry.type === 'like' && String(entry.user_id || '').toUpperCase() === mine) tally.likeByMe = true;
  }
  return tally;
};

const commentText = (entry: ZandoInteraction): string => {
  try {
    const parsed = JSON.parse(entry.data || '{}') as { content?: unknown };
    return typeof parsed.content === 'string' ? parsed.content : '';
  } catch {
    return '';
  }
};

interface VideoFeedProps {
  /**
   * Espace réservé en bas de carte : la barre d'onglets UQ (`--v2-tabbar-h`)
   * reste visible et rien ne la recouvre. Passer `0px` si l'hôte réserve déjà
   * cet espace.
   */
  bottomInset?: string;
  /** Fiche détaillée de l'offre (fiche Zando existante). */
  onOpenItem?: (item: ZandoItem) => void;
  /** « Découvrir » : mini-site du vendeur, dans la même interface. */
  onOpenBoutique?: (seller: string) => void;
  onOpenCart?: () => void;
  /** Accès direct au Studio depuis un flux vide. */
  onGoStudio?: () => void;
}

export function VideoFeed({
  bottomInset = 'calc(var(--v2-tabbar-h, 64px) + env(safe-area-inset-bottom))',
  onOpenItem,
  onOpenBoutique,
  onOpenCart,
  onGoStudio,
}: VideoFeedProps) {
  const { uq, toast } = useSession();
  const money = useDisplayAmount();
  const cart = useCart(uq);
  const feed = useAsync(() => listZandoItems(), []);

  const items = useMemo(
    () => (feed.data?.items || []).filter((item) => item.published !== false),
    [feed.data],
  );
  const sellers = useIdentities(items.map((item) => zandoOwner(item)));

  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [follows, setFollows] = useState<Record<string, boolean>>({});
  const [tallies, setTallies] = useState<Record<string, Tally>>({});
  const [profils, setProfils] = useState<Record<string, ProfileStatsResponse>>({});
  const [commentsFor, setCommentsFor] = useState<ZandoItem | null>(null);
  const [comments, setComments] = useState<ZandoInteraction[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const commenters = useIdentities(comments.map((entry) => entry.user_id));

  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());
  const tallyBusyRef = useRef<Set<string>>(new Set());

  const loadTally = useCallback(
    async (itemId: string, force = false) => {
      if (tallyBusyRef.current.has(itemId)) return;
      tallyBusyRef.current.add(itemId);
      try {
        const list = await listZandoInteractions(itemId);
        setTallies((current) => ({ ...current, [itemId]: tallyOf(list, uq) }));
      } catch {
        // Le compteur garde le dernier relevé plutôt qu'un zéro inventé.
      } finally {
        tallyBusyRef.current.delete(itemId);
      }
    },
    [uq],
  );

  /**
   * Un seul lecteur actif : les autres sont mis en pause et remis à zéro.
   * « muted par défaut » se pilote sur la propriété, pas sur le volume.
   */
  useEffect(() => {
    items.forEach((item, index) => {
      const node = videoRefs.current.get(item.id);
      if (!node) return;
      if (index === active) {
        node.muted = muted;
        node.volume = 1;
        if (!paused) void node.play().catch(() => undefined);
        return;
      }
      node.pause();
      node.currentTime = 0;
    });
  }, [active, items, muted, paused]);

  /** Vue enregistrée une seule fois par offre, compteurs relus juste après. */
  useEffect(() => {
    const item = items[active];
    if (!item) return;
    if (seenRef.current.has(item.id)) {
      void loadTally(item.id);
      return;
    }
    seenRef.current.add(item.id);
    interactZando(item.id, 'view')
      .catch(() => undefined)
      .then(() => loadTally(item.id, true));
  }, [items, active, loadTally]);

  /** Identité publique du vendeur actif : abonnés, vérification, pseudo. */
  useEffect(() => {
    const item = items[active];
    if (!item) return;
    const pseudo = identityPseudo(zandoOwner(item), sellers[zandoOwner(item).toUpperCase()]);
    if (!pseudo || profils[pseudo]) return;
    let cancelled = false;
    getProfileStats(pseudo)
      .then((response) => {
        if (!cancelled && response) setProfils((current) => ({ ...current, [pseudo]: response }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [items, active, sellers, profils]);

  const onScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    const node = event.currentTarget;
    const next = Math.round(node.scrollTop / (node.clientHeight || 1));
    setActive((current) => (current === next ? current : next));
    setPaused(false);
  }, []);

  const togglePlayback = (item: ZandoItem) => {
    const node = videoRefs.current.get(item.id);
    if (!node) {
      onOpenItem?.(item);
      return;
    }
    if (node.paused) {
      void node.play().catch(() => undefined);
      setPaused(false);
    } else {
      node.pause();
      setPaused(true);
    }
  };

  const pseudoOf = (item: ZandoItem) => {
    const owner = zandoOwner(item);
    return item.seller_pseudo || identityPseudo(owner, sellers[owner.toUpperCase()]);
  };

  const profilOf = (pseudo: string) => profils[pseudo];

  const like = async (item: ZandoItem) => {
    if (likes[item.id] || tallies[item.id]?.likeByMe) {
      toast('Tu as déjà gardé cette offre.');
      return;
    }
    try {
      await interactZando(item.id, 'like');
      setLikes((current) => ({ ...current, [item.id]: true }));
      setTallies((current) => {
        const tally = current[item.id] || EMPTY_TALLY;
        return { ...current, [item.id]: { ...tally, like: tally.like + 1, likeByMe: true } };
      });
      toast('Offre gardée', 'success');
    } catch (error) {
      toast(describeError(error, 'Enregistrement impossible.'), 'error');
    }
  };

  const share = async (item: ZandoItem) => {
    const link = `${window.location.origin}${window.location.pathname}?item=${encodeURIComponent(item.id)}`;
    try {
      if (navigator.share) await navigator.share({ title: item.title, text: item.title, url: link });
      else {
        await navigator.clipboard.writeText(link);
        toast('Lien copié', 'success');
      }
      await interactZando(item.id, 'share').catch(() => undefined);
      setTallies((current) => {
        const tally = current[item.id] || EMPTY_TALLY;
        return { ...current, [item.id]: { ...tally, share: tally.share + 1 } };
      });
    } catch {
      // Partage interrompu par l'utilisateur : rien à signaler.
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
      setComments(list.filter((entry) => entry.type === 'comment' && commentText(entry)));
      setCommentDraft('');
      toast('Commentaire publié', 'success');
    } catch (error) {
      toast(describeError(error, 'Commentaire refusé.'), 'error');
    } finally {
      setCommentBusy(false);
    }
  };

  const follow = async (item: ZandoItem) => {
    const pseudo = pseudoOf(item);
    if (!pseudo) {
      toast('Identité du vendeur indisponible.', 'error');
      return;
    }
    const suitDeja = follows[pseudo] ?? Boolean(profilOf(pseudo)?.vous_suivez_deja);
    try {
      const suite = suitDeja ? await unfollowUser(pseudo) : await followUser(pseudo);
      setFollows((current) => ({ ...current, [pseudo]: !suitDeja }));
      setProfils((current) => {
        const profil = current[pseudo];
        return profil
          ? {
              ...current,
              [pseudo]: {
                ...profil,
                vous_suivez_deja: !suitDeja,
                stats: { ...profil.stats, total_abonnes: suite.total_abonnes },
              },
            }
          : current;
      });
      toast(suitDeja ? `Tu ne suis plus ${pseudo}` : `Tu suis ${pseudo}`, 'success');
    } catch (error) {
      toast(describeError(error, 'Action impossible.'), 'error');
    }
  };

  const pushToCart = (item: ZandoItem) => {
    const visuel = firstImageUrl(parseMediaUrls(item.media_urls));
    addToCart(uq, {
      itemId: item.id,
      title: item.title || 'Offre',
      seller: zandoOwner(item),
      priceUnits: Number(item.price_borb) || 0,
      ...(visuel ? { media: visuel } : {}),
    });
    toast(`${item.title || 'Offre'} ajouté au panier`, 'success');
  };

  if (feed.loading && items.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#05070a]">
        <Loader label="Chargement des créations…" />
      </div>
    );
  }

  if (feed.error && items.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#05070a] px-6">
        <ErrorBlock message={feed.error} onRetry={feed.reload} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-[#05070a] px-6 text-white">
        <EmptyState
          icon="market"
          title="Aucune publication en ligne"
          description="Le marché est vide pour le moment. Lance ton Studio pour créer la première carte de ce flux."
          action={
            onGoStudio ? (
              <Button size="sm" icon="plus" onClick={onGoStudio}>
                Ouvrir le Studio
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#05070a] text-white"
      style={{ '--vf-inset': bottomInset } as CSSProperties}
    >
      <div
        onScroll={onScroll}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => {
          const media = parseMediaUrls(item.media_urls);
          const videoUrl = firstVideoUrl(media);
          const visuel = firstImageUrl(media);
          const pseudo = pseudoOf(item);
          const profil = pseudo ? profilOf(pseudo) : undefined;
          const tally = tallies[item.id];
          const near = Math.abs(index - active) <= 1;
          const dejaAime = Boolean(likes[item.id] || tally?.likeByMe);
          const suitDeja = follows[pseudo] ?? Boolean(profil?.vous_suivez_deja);
          const dansLePanier = cart.lines.some((line) => line.itemId === item.id);
          const estVitrine = estVitrineBoutique(item);
          /** Vente/service solo : achat par transaction séquestre, pas par panier. */
          const typeSoloBrut = String(item.type || '').toLowerCase();
          const estSoloItem = typeSoloBrut === 'produit' || typeSoloBrut === 'service';
          const typeSoloLabel = estSoloItem
            ? typeSoloBrut === 'service'
              ? 'Service solo'
              : 'Vente solo'
            : null;
          const auteur = pseudo || 'Vendeur UQ';

          return (
            <article key={item.id} className="relative h-full w-full snap-start snap-always overflow-hidden">
              {/* --- Média : vidéo quand l'adresse en est une, sinon visuel --- */}
              <button
                type="button"
                onClick={() => togglePlayback(item)}
                aria-label={
                  videoUrl
                    ? index === active && !paused
                      ? 'Mettre en pause'
                      : 'Lire la vidéo'
                    : 'Ouvrir la fiche de cette offre'
                }
                className="absolute inset-0 h-full w-full cursor-default"
              >
                <span className="absolute inset-0" style={{ background: BACKDROPS[index % BACKDROPS.length] }} />
                <span className="absolute inset-x-0 top-[14%] px-6 text-center text-[34px] font-black leading-none tracking-tight text-white/8">
                  {auteur}
                </span>
                {videoUrl ? (
                  <video
                    ref={(node) => {
                      if (node) videoRefs.current.set(item.id, node);
                      else videoRefs.current.delete(item.id);
                    }}
                    src={videoUrl}
                    poster={visuel || undefined}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay={index === 0}
                    loop
                    muted
                    playsInline
                    preload={near ? 'auto' : 'none'}
                  />
                ) : visuel ? (
                  <img
                    src={visuel}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    loading={near ? 'eager' : 'lazy'}
                  />
                ) : null}
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(5,7,10,0.62) 0%, rgba(5,7,10,0.06) 32%, rgba(5,7,10,0.72) 70%, rgba(5,7,10,0.96) 100%)',
                  }}
                />
                {index === active && paused ? (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-16 w-16 place-items-center rounded-full bg-black/45 ring-1 ring-white/25 backdrop-blur-md">
                      <Icon name="play" size={26} />
                    </span>
                  </span>
                ) : null}
              </button>

              {/* --- Rail droit : like, commentaire, partage --- */}
              <div
                className="absolute right-3 z-10 flex flex-col items-center gap-4"
                style={{ bottom: 'calc(var(--vf-inset) + 196px)' }}
              >
                <RailButton
                  label={tally ? compact(tally.like) : ''}
                  onClick={() => void like(item)}
                  active={dejaAime}
                  ariaLabel={dejaAime ? 'Offre déjà gardée' : 'Garder cette offre'}
                >
                  <Icon name="heart" size={24} filled={dejaAime} />
                </RailButton>
                <RailButton
                  label={compact(tally?.comment ?? item.comment_count ?? 0)}
                  onClick={() => void openComments(item)}
                  ariaLabel="Commenter"
                >
                  <Icon name="message" size={24} />
                </RailButton>
                <RailButton
                  label={compact(tally?.share ?? item.share_count ?? 0)}
                  onClick={() => void share(item)}
                  ariaLabel="Partager"
                >
                  <Icon name="send" size={24} />
                </RailButton>
              </div>

              {/* --- Bloc bas : vendeur + Suivre, offre, actions --- */}
              <div
                className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 pl-4 pr-20"
                style={{ paddingBottom: 'calc(var(--vf-inset) + 16px)' }}
              >
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenBoutique?.(zandoOwner(item))}
                    className="flex min-w-0 items-center gap-2.5 text-left"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white/16 text-[12px] font-bold ring-1 ring-white/25">
                      {profil?.avatar_url ? (
                        <img src={profil.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(auteur)
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[14px] font-bold leading-tight">
                        <span className="truncate">{profil?.name || auteur}</span>
                        {profil?.stats.kyc_verifie ? <Icon name="check" size={13} /> : null}
                      </span>
                      <span className="block truncate text-[11.5px] text-white/65">
                        @{auteur} · {formatCount(profil?.stats.total_abonnes ?? 0)} abonnés
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void follow(item)}
                    aria-pressed={suitDeja}
                    className={`ml-auto shrink-0 rounded-pill px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                      suitDeja ? 'bg-white/12 text-white ring-1 ring-white/25' : 'text-white'
                    }`}
                    style={suitDeja ? undefined : { background: 'var(--v2-accent)', color: 'var(--v2-accent-ink)' }}
                  >
                    {suitDeja ? 'Abonné' : 'Suivre'}
                  </button>
                </div>

                <div>
                  {item.category ? (
                    <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/12 px-2.5 py-1 text-[11px] font-semibold text-white/85 ring-1 ring-white/15">
                      <Icon name="store" size={13} />
                      <span className="capitalize">{item.category}</span>
                    </span>
                  ) : null}
                  <h3 className="mt-2 text-[22px] font-bold leading-tight tracking-tight">
                    {item.title || 'Sans titre'}
                  </h3>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/80">{item.description}</p>
                  ) : null}
                  {estVitrine ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-white/80">
                      <Icon name="store" size={14} />
                      Boutique · galerie et annonces à explorer
                    </p>
                  ) : (
                    <p className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-[19px] font-bold tabular-nums text-[color:var(--v2-gold)]">
                        {money.format(item.price_borb)}
                      </span>
                      {typeSoloLabel ? (
                        <span className="rounded-pill bg-white/12 px-2 py-0.5 text-[11px] font-bold text-white/85 ring-1 ring-white/20">
                          {typeSoloLabel}
                        </span>
                      ) : item.type ? (
                        <span className="text-[11.5px] text-white/60">{item.type}</span>
                      ) : null}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {estVitrine ? (
                    <button
                      type="button"
                      onClick={() => onOpenBoutique?.(zandoOwner(item))}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] px-4 text-[14px] font-bold active:scale-[0.98]"
                      style={{ background: 'var(--v2-accent)', color: 'var(--v2-accent-ink)' }}
                    >
                      <Icon name="store" size={18} />
                      Explorer la boutique
                    </button>
                  ) : (
                    <>
                      {estSoloItem ? (
                        <button
                          type="button"
                          onClick={() => onOpenItem(item)}
                          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] px-4 text-[14px] font-bold active:scale-[0.98]"
                          style={{ background: 'var(--v2-accent)', color: 'var(--v2-accent-ink)' }}
                        >
                          <Icon name="shoppingCart" size={18} />
                          Acheter
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => pushToCart(item)}
                          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] px-4 text-[14px] font-bold active:scale-[0.98]"
                          style={{ background: 'var(--v2-accent)', color: 'var(--v2-accent-ink)' }}
                        >
                          <Icon name={dansLePanier ? 'check' : 'shoppingCart'} size={18} />
                          {dansLePanier ? 'Dans le panier' : 'Ajouter au panier'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenBoutique?.(zandoOwner(item))}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-white/8 px-4 text-[14px] font-bold text-white ring-1 ring-white/25 backdrop-blur-md active:scale-[0.98]"
                      >
                        <Icon name="sparkle" size={18} />
                        Découvrir
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* --- Chrome du flux (aucune navigation d'app ici) --- */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center px-4"
        style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
      >
        <span className="pointer-events-auto rounded-pill bg-black/35 px-3 py-1.5 text-[13px] font-bold tracking-[0.14em] ring-1 ring-white/15 backdrop-blur-md">
          ZANDO
        </span>
        <span className="flex-1" />
        {onOpenCart ? (
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Panier${cart.count ? ` · ${cart.count} article${cart.count > 1 ? 's' : ''}` : ''}`}
            className="pointer-events-auto relative mr-2 grid h-9 w-9 place-items-center rounded-pill bg-black/35 ring-1 ring-white/15 backdrop-blur-md"
          >
            <Icon name="shoppingCart" size={17} />
            {cart.count > 0 ? (
              <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-pill bg-[var(--v2-accent)] px-1 text-[10.5px] font-bold text-[var(--v2-accent-ink)]">
                {cart.count > 9 ? '9+' : cart.count}
              </span>
            ) : null}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setMuted((current) => !current)}
          aria-pressed={!muted}
          className="pointer-events-auto flex items-center gap-1.5 rounded-pill bg-black/35 px-3 py-1.5 text-[12px] font-semibold ring-1 ring-white/15 backdrop-blur-md"
        >
          <Icon name="music" size={15} />
          {muted ? 'Muet' : 'Son'}
        </button>
      </div>

      {/* --- Progression dans le flux --- */}
      <div className="absolute right-1.5 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-1" aria-hidden>
        {items.slice(0, 12).map((item, index) => (
          <span
            key={item.id}
            className={`w-[3px] rounded-pill transition-all ${
              index === active ? 'h-5 bg-white' : 'h-2 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* --- Commentaires : mêmes données que la fiche Zando --- */}
      <Sheet
        open={Boolean(commentsFor)}
        onClose={() => setCommentsFor(null)}
        title="Commentaires"
        subtitle={commentsFor ? commentsFor.title : undefined}
        footer={
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Textarea
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                placeholder="Ton commentaire…"
                rows={2}
              />
            </div>
            <Button icon="send" loading={commentBusy} onClick={() => void sendComment()}>
              Envoyer
            </Button>
          </div>
        }
      >
        {commentBusy && comments.length === 0 ? (
          <Loader label="Chargement des commentaires…" />
        ) : comments.length === 0 ? (
          <EmptyState icon="message" title="Aucun commentaire" description="Sois le premier à réagir." />
        ) : (
          <div className="v2-stack">
            {comments.map((entry, position) => (
              <div key={`${entry.user_id}-${entry.created_at || position}`} className="v2-row-between">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {identityPseudo(entry.user_id, commenters[String(entry.user_id || '').toUpperCase()]) || 'Membre UQ'}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.4 }}>{commentText(entry)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function RailButton({
  children,
  label,
  onClick,
  active,
  ariaLabel,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex w-14 flex-col items-center gap-1 text-[11px] font-bold text-white"
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-full ring-1 ring-white/15 backdrop-blur-md transition-colors ${
          active ? 'text-[color:var(--v2-accent)]' : 'bg-black/40 text-white'
        }`}
        style={
          active
            ? { background: 'color-mix(in srgb, var(--v2-accent) 22%, rgba(10,14,20,0.55))' }
            : undefined
        }
      >
        {children}
      </span>
      <span className="tabular-nums">{label}</span>
    </button>
  );
}

export default VideoFeed;
