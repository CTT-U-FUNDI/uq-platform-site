import { useState } from 'react';
import { Icon } from './Icon';
import { Avatar, Button, Card, EmptyState, ErrorBlock, Sheet, Skeleton, Stat } from './Ui';
import { PinSheet } from './PinSheet';
import { ExplorerElements, type ElementExplorer } from './ExplorerElements';
import { PublicProfileSheet } from './PublicProfileSheet';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import { identityPseudo, useIdentity } from '../lib/identity';
import { useDisplayAmount } from '../lib/currency';
import { addToCart, useCart } from '../lib/cart';
import {
  estVitrineBoutique,
  firstImageUrl,
  formatCount,
  formatDureeRestante,
  formatNumber,
  parseMediaUrls,
  relativeDay,
} from '../lib/format';
import {
  boutiqueEnLigne,
  describeError,
  followUser,
  getPinStatus,
  getProfileStats,
  getShop,
  latestShopOf,
  listShops,
  listShopItems,
  PIN_MAX_LENGTH,
  PIN_MIN_LENGTH,
  pinIsConfigured,
  renewShop,
  secondesRestantesBoutique,
  sqlStamp,
  unfollowUser,
  zandoOwner,
  zandoStamp,
  type ShopSection,
  type ZandoItem,
} from '../lib/api';
import { mediaFilter, mediaDuree, fmtDuree } from '../lib/minisite';
import type { SitePage } from '../lib/api';
import { normaliserVitrine } from '../lib/vitrine-pont';
import type { LienExterne, MiniSite as VitrineSite } from '../lib/site-model';

/** Libellés des tranches de contenu : une section reste libre, son type seulement sert à l'affichage. */
const TITRES_SECTION: Record<string, string> = {
  annonce: 'Annonce',
  panneau: 'Panneau',
  horaire: 'Horaires',
  contact: 'Contact',
  service: 'Service',
  produit: 'Produit',
  gallerie: 'Photo',
  video: 'Vidéo',
  texte: 'Texte',
};

const libelleSection = (section: ShopSection): string =>
  TITRES_SECTION[String(section.type || '').trim().toLowerCase()] || 'Information';

/**
 * Mini-site d'un vendeur du marché.
 *
 * Trois lectures publiques réelles le composent quand le Studio n'a rien
 * déclaré — l'identité du compte, ses statistiques agrégées et ses éléments
 * Zando (`/api/zando/items/{shop_id}`). Dès qu'une boutique existe
 * (`GET /api/shop/{id}`), sa galerie, ses sections et son compteur de présence
 * passent en premier.
 */
export function BoutiqueSite({
  seller,
  onClose,
  onContact,
  onOpenItem,
  onOpenCart,
}: {
  /** Propriétaire technique des offres (`shop_id` du backend), jamais affiché. */
  seller: string;
  onClose: () => void;
  onContact?: (seller: string) => void;
  onOpenItem?: (item: ZandoItem) => void;
  onOpenCart?: () => void;
}) {
  const { uq, toast } = useSession();
  const money = useDisplayAmount();
  const cart = useCart(uq);
  const identity = useIdentity(seller);
  const pseudo = identityPseudo(seller, identity);

  const profil = useAsync(() => getProfileStats(pseudo), [pseudo], { enabled: Boolean(pseudo) });
  const catalogue = useAsync(() => listShopItems(seller), [seller], { enabled: Boolean(seller) });
  const boutiques = useAsync(() => listShops(), []);

  const [suiviBusy, setSuiviBusy] = useState(false);
  const [suit, setSuit] = useState<boolean | null>(null);
  /** Photo de la galerie que le visiteur agrandit. */
  const [pleinePhoto, setPleinePhoto] = useState<string | null>(null);
  /** Fiche publique du vendeur, ouverte au clic sur son pseudo. */
  const [profilOuvert, setProfilOuvert] = useState(false);
  /** Feuille de renouvellement : la durée se choisit avant la saisie du PIN. */
  const [renouvelerOuvert, setRenouvelerOuvert] = useState(false);
  const [jours, setJours] = useState(1);

  const shop = latestShopOf(boutiques.data || [], seller);
  /** Le frais de présence et l'échéance exacte viennent de la route dédiée. */
  const etatBoutique = useAsync(
    () => (shop ? getShop(shop.id) : Promise.resolve(null)),
    [shop?.id],
    { enabled: Boolean(shop) },
  );
  const estProprietaire = seller.toUpperCase() === uq.toUpperCase();
  /** Longueur du PIN lu sur le compte du visiteur : le pavé n'est jamais deviné. */
  const pinStatus = useAsync(() => getPinStatus(uq), [uq], { enabled: estProprietaire });
  const pinLength = Math.min(
    Math.max(Number(pinStatus.data?.pin_length) || PIN_MIN_LENGTH, PIN_MIN_LENGTH),
    PIN_MAX_LENGTH,
  );
  const echeance = etatBoutique.data?.secondes_restantes ?? secondesRestantesBoutique(shop);
  const enLigne = etatBoutique.data ? etatBoutique.data.en_ligne : boutiqueEnLigne(shop);
  const frais = etatBoutique.data?.frais;
  const lignesIci = cart.lines.filter((line) => line.seller.toUpperCase() === seller.toUpperCase());

  /** La vitrine n'est pas un produit : elle ouvre ce mini-site, jamais le panier. */
  const offres = (catalogue.data?.items || []).filter((item) => {
    if (item.published === false) return false;
    if (item.sold) return false;
    const fin = sqlStamp(item.expires_at);
    if (fin && fin <= Date.now()) return false;
    return !estVitrineBoutique(item);
  });
  const galerie = (shop?.gallery || []).filter((url) => Boolean(url)).slice(0, 10);
  const sections = (shop?.sections || []).filter((section) => Boolean(section?.titre));
  /** Mini-site édité dans le Studio : ses pages passent devant quand il existe. */
  const sitePages = shop?.site?.pages || [];
  const video = shop?.presentation_video || '';
  const cover =
    firstImageUrl([shop?.presentation_photo || '']) ||
    firstImageUrl(galerie) ||
    firstImageUrl(parseMediaUrls(offres[0]?.media_urls));
  const nomBoutique = shop?.name || profil.data?.name || identity?.name || 'Boutique UQ';
  /** Le studio de vitrine fait foi quand il existe : c'est lui que le vendeur a réglé. */
  const vitrine = shop?.vitrine ? normaliserVitrine(shop.vitrine, nomBoutique) : null;
  const vitrineMedias = (vitrine?.medias || []).filter((media) => Boolean(media.url));
  const pseudoAffiche = profil.data?.pseudo || pseudo;
  const suitMaintenant = suit ?? Boolean(profil.data?.vous_suivez_deja);

  const basculerSuivi = async () => {
    if (suiviBusy) return;
    if (!pseudoAffiche) {
      toast('Identité du vendeur indisponible.', 'error');
      return;
    }
    setSuiviBusy(true);
    try {
      const suite = suitMaintenant ? await unfollowUser(pseudoAffiche) : await followUser(pseudoAffiche);
      setSuit(!suitMaintenant);
      profil.setData(
        profil.data
          ? {
              ...profil.data,
              vous_suivez_deja: !suitMaintenant,
              stats: { ...profil.data.stats, total_abonnes: suite.total_abonnes },
            }
          : profil.data,
      );
    } catch (error) {
      toast(describeError(error, 'Action impossible.'), 'error');
    } finally {
      setSuiviBusy(false);
    }
  };

  /** Prolonger la présence : le PIN autorise le robinet, il ne débite rien ici. */
  const prolongerLaPresence = async (code: string): Promise<string | void> => {
    if (!shop) return 'Boutique introuvable';
    try {
      const answer = await renewShop(shop.id, { pin: code, uq_number: uq, jours });
      if (answer?.status !== 'success') {
        return answer?.message || 'Prolongation refusée.';
      }
      setRenouvelerOuvert(false);
      toast(`Présence prolongée de ${jours} ${jours > 1 ? 'jours' : 'jour'} · robinet ouvert.`, 'success');
      await Promise.all([boutiques.reload(), etatBoutique.reload()]);
    } catch (error) {
      return describeError(error, 'Prolongation impossible.');
    }
  };

  const ajouter = (item: ZandoItem) => {
    const visuel = firstImageUrl(parseMediaUrls(item.media_urls));
    addToCart(uq, {
      itemId: item.id,
      title: item.title || 'Offre',
      seller: zandoOwner(item) || seller,
      priceUnits: Number(item.price_borb) || 0,
      ...(visuel ? { media: visuel } : {}),
    });
    toast(`${item.title || 'Offre'} ajouté au panier`, 'success');
  };

  const description = shop?.description || profil.data?.public_profile?.description || '';

  /**
   * Une seule file de lecture : la galerie, les annonces, le catalogue et la
   * fiche de la boutique deviennent des éléments pleine écran, qu'on glisse de
   * gauche à droite. Rien ne défile plus verticalement dans la feuille.
   */
  const elements: ElementExplorer[] = [
    ...(estProprietaire && shop
      ? [
          {
            id: 'presence',
            etiquette: 'Ton administration',
            titre: 'Présence de ta boutique',
            fond: cover,
            noeud: (
              <>
                <div className="v2-explorer-desc">
                  {enLigne
                    ? `Encore ${formatDureeRestante(echeance)} dans le flux Zando.`
                    : 'Ta boutique est enregistrée mais absente du flux : prolonge sa présence pour y revenir.'}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 13 }}>
                  <span className="v2-muted">Robinet</span>
                  <span style={{ fontWeight: 800, color: 'var(--v2-accent)' }}>
                    {frais ? `${money.formatPoints(frais.frais_24h_points)} / 24 h` : '—'}
                  </span>
                  {frais && frais.par_seconde_points > 0 ? (
                    <span className="v2-muted" style={{ marginLeft: 'auto', fontSize: 11.5 }}>
                      {money.formatPoints(frais.par_seconde_points * 3600)} / h
                    </span>
                  ) : null}
                </div>
                <div className="v2-muted" style={{ fontSize: 11.5 }}>
                  {frais
                    ? `${frais.pourcent} % de ${money.formatPoints(frais.catalogue_points)} de catalogue, prélevés en continu${
                        frais.robinet_ouvert ? '' : ' dès que tu ouvres le robinet'
                      }.`
                    : 'Frais de présence indisponibles pour le moment.'}
                </div>
                {shop.robinet && (shop.regle_points ?? 0) > 0 ? (
                  <div className="v2-muted" style={{ fontSize: 11.5 }}>
                    Déjà réglé : {money.formatPoints(shop.regle_points ?? 0)}
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {[1, 2, 3, 5, 7].map((bloc) => (
                    <button
                      key={bloc}
                      type="button"
                      className="v2-feed-pill"
                      data-active={jours === bloc}
                      onClick={() => setJours(bloc)}
                      style={
                        jours === bloc ? { background: 'var(--v2-accent)', borderColor: 'transparent' } : undefined
                      }
                    >
                      {bloc} {bloc > 1 ? 'j' : 'jour'}
                    </button>
                  ))}
                </div>
                <div className="v2-explorer-pied">
                  <Button
                    block
                    icon="wallet"
                    disabled={!pinIsConfigured(pinStatus.data)}
                    onClick={() => setRenouvelerOuvert(true)}
                    style={{ flex: 1 }}
                  >
                    Prolonger de {jours} {jours > 1 ? 'jours' : 'jour'}
                  </Button>
                </div>
                {!pinIsConfigured(pinStatus.data) ? (
                  <div className="v2-muted" style={{ fontSize: 11.5 }}>
                    Configure d’abord un code PIN dans Profil › Sécurité pour autoriser le robinet.
                  </div>
                ) : null}
              </>
            ),
          },
        ]
      : []),
    ...(vitrine
      ? [
          {
            id: 'vitrine-identite',
            etiquette: 'Mini-site',
            titre: vitrine.nom || nomBoutique,
            fond: cover || vitrineMedias[0]?.url,
            noeud: (
              <VitrineFiche
                site={vitrine}
                nom={nomBoutique}
                onContact={onContact ? () => onContact(seller) : undefined}
                onOpenCart={onOpenCart}
              />
            ),
          },
          ...vitrineMedias.map((media, index) => ({
            id: `vitrine-media-${index}`,
            etiquette: media.label || 'Mini-site',
            media: media.type === 'photo' ? media.url : '',
            onMedia:
              media.type === 'photo' && media.url ? () => setPleinePhoto(media.url as string) : undefined,
            titre: vitrine.nom || nomBoutique,
            desc: media.label || '',
            fond: cover,
            noeud:
              media.type === 'video' && media.url ? (
                <video
                  src={media.url}
                  controls
                  playsInline
                  style={{ display: 'block', width: '100%', maxHeight: 300, borderRadius: 12, background: '#05070c' }}
                />
              ) : undefined,
          })),
          ...vitrine.items.map((item, index) => ({
            id: `vitrine-item-${index}`,
            etiquette: 'Élément',
            titre: item.nom || 'Élément',
            desc: [item.pack, item.marque, item.modele, item.qualite, item.etat]
              .filter(Boolean)
              .join(' · '),
            fond: cover,
            pied: (
              <>
                {item.prix > 0 ? <span className="v2-explorer-prix">{money.format(item.prix)}</span> : null}
                {item.stock > 0 ? (
                  <span className="v2-muted" style={{ fontSize: 11.5 }}>
                    {item.stock} en stock
                  </span>
                ) : null}
                {onContact ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon="chat"
                    onClick={() => onContact(seller)}
                    style={{ marginLeft: 'auto' }}
                  >
                    Contacter
                  </Button>
                ) : null}
              </>
            ),
          })),
          ...vitrine.blocs.map((bloc, index) => ({
            id: `vitrine-bloc-${index}`,
            etiquette: 'Bloc',
            titre: bloc.titre,
            desc: bloc.description,
            fond: cover,
          })),
          ...(vitrine.liv.on
            ? [
                {
                  id: 'vitrine-livraison',
                  etiquette: 'Livraison',
                  titre: 'Livraison',
                  desc: [
                    vitrine.liv.zone,
                    vitrine.liv.delai,
                    vitrine.liv.tarif > 0 ? money.format(vitrine.liv.tarif) : '',
                  ]
                    .filter(Boolean)
                    .join(' · '),
                  fond: cover,
                },
              ]
            : []),
          ...(vitrine.liens.length
            ? [
                {
                  id: 'vitrine-liens',
                  etiquette: 'Liens',
                  titre: 'Liens et réseaux',
                  fond: cover,
                  noeud: (
                    <VitrineLiens
                      liens={vitrine.liens}
                      onContact={onContact ? () => onContact(seller) : undefined}
                      onOpenCart={onOpenCart}
                    />
                  ),
                },
              ]
            : []),
        ]
      : sitePages.map((page, pi) => ({
          id: `site-page-${pi}`,
          etiquette: sitePages.length > 1 ? `Page ${pi + 1}/${sitePages.length}` : 'Mini-site',
          titre: page.name || nomBoutique,
          fond: cover,
          noeud: (
            <SitePageView
              page={page}
              nom={nomBoutique}
              onContact={onContact ? () => onContact(seller) : undefined}
              onOpenCart={onOpenCart}
            />
          ),
        }))),
    ...(video
      ? [
          {
            id: 'presentation',
            etiquette: 'Présentation',
            titre: nomBoutique,
            fond: cover,
            noeud: (
              <>
                <video
                  src={video}
                  controls
                  playsInline
                  style={{
                    display: 'block',
                    width: '100%',
                    maxHeight: 260,
                    borderRadius: 12,
                    background: '#05070c',
                  }}
                />
                {description ? <div className="v2-explorer-desc">{description}</div> : null}
              </>
            ),
          },
        ]
      : []),
    ...(vitrine
      ? []
      : galerie.map((url, index) => ({
          id: `photo-${index}-${url}`,
          etiquette: galerie.length > 1 ? `Galerie ${index + 1}/${galerie.length}` : 'Galerie',
          media: url,
          onMedia: () => setPleinePhoto(url),
          titre: nomBoutique,
          desc: index === 0 ? description : '',
          pied: onOpenCart ? (
            <Button variant="secondary" icon="cart" size="sm" onClick={onOpenCart}>
              Panier
            </Button>
          ) : undefined,
        }))),
    ...(vitrine
      ? []
      : sections.map((section) => {
          const media = section.media || '';
          const estVideo = /\.(mp4|webm|mov)(\?|$)/i.test(media);
          return {
            id: `section-${section.id}`,
            etiquette: libelleSection(section),
            media: estVideo ? '' : media,
            onMedia: !estVideo && media ? () => setPleinePhoto(media) : undefined,
            titre: section.titre,
            desc: section.contenu || '',
            fond: cover,
            noeud: estVideo ? (
              <video
                src={media}
                controls
                playsInline
                style={{ display: 'block', width: '100%', maxHeight: 240, borderRadius: 12, background: '#05070c' }}
              />
            ) : undefined,
          };
        })),
    ...offres.map((item) => {
      const visuel = firstImageUrl(parseMediaUrls(item.media_urls));
      const date = zandoStamp(item);
      const dansLePanier = cart.lines.some((line) => line.itemId === item.id);
      return {
        id: `offre-${item.id}`,
        etiquette: 'Offre',
        media: visuel,
        onMedia: onOpenItem ? () => onOpenItem(item) : visuel ? () => setPleinePhoto(visuel) : undefined,
        titre: item.title || 'Sans titre',
        desc: item.description || '',
        fond: cover,
        pied: (
          <>
            <span className="v2-explorer-prix">{money.format(item.price_borb)}</span>
            {date ? <span className="v2-muted" style={{ fontSize: 11.5 }}>{relativeDay(date)}</span> : null}
            <Button
              variant={dansLePanier ? 'secondary' : 'primary'}
              size="sm"
              icon={dansLePanier ? 'check' : 'cart'}
              onClick={() => ajouter(item)}
              style={{ marginLeft: 'auto' }}
            >
              {dansLePanier ? 'Dans le panier' : 'Ajouter'}
            </Button>
          </>
        ),
      };
    }),
    ...(description && !video
      ? [{ id: 'boutique', etiquette: 'La boutique', titre: nomBoutique, desc: description, fond: cover }]
      : []),
  ];

  return (
    <>
      <Sheet
        open={Boolean(seller)}
        onClose={onClose}
        title={nomBoutique}
        className="v2-sheet--explorer"
        subtitle={
          pseudoAffiche
            ? `@${pseudoAffiche} · ${formatCount(profil.data?.stats.total_publications ?? offres.length)} publications`
            : 'Boutique du marché Zando'
        }
        footer={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button
              variant={suitMaintenant ? 'secondary' : 'primary'}
              icon={suitMaintenant ? 'check' : 'plus'}
              loading={suiviBusy}
              onClick={basculerSuivi}
              style={{ flex: 1 }}
            >
              {suitMaintenant ? 'Abonné' : 'Suivre'}
            </Button>
            {onContact ? (
              <Button variant="outline" icon="chat" onClick={() => onContact(seller)} style={{ flex: 1 }}>
                Contacter
              </Button>
            ) : null}
            {onOpenCart ? (
              <Button variant="secondary" icon="cart" onClick={onOpenCart}>
                Panier{lignesIci.length > 0 ? ` · ${cart.count}` : ''}
              </Button>
            ) : null}
          </div>
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            paddingTop: 4,
            flex: 1,
            minHeight: 0,
            // Feuille explorer : le body est en flex-column ; sans overflow
            // propre, ce panneau rognait le bas du mini-site sans scroll.
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          {profil.loading && !profil.data ? (
            <>
              <Skeleton height={150} radius={18} />
              <Skeleton height={86} radius={16} />
            </>
          ) : profil.error && !profil.data ? (
            <ErrorBlock message={profil.error} onRetry={profil.reload} />
          ) : (
            <>
              <div
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 'var(--v2-r-lg)',
                  border: '1px solid var(--v2-line)',
                  background: 'var(--v2-surface-2)',
                  flex: 'none',
                }}
              >
                {cover ? (
                  <>
                    <img
                      src={cover}
                      alt=""
                      style={{ display: 'block', width: '100%', height: 118, objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(6,10,16,0.05), rgba(6,10,16,0.72))',
                      }}
                    />
                  </>
                ) : (
                  <div style={{ height: 62 }} />
                )}
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 12,
                    padding: cover ? '0 14px 12px' : '12px 14px',
                    marginTop: cover ? -46 : 0,
                  }}
                >
                  <Avatar
                    label={pseudoAffiche || nomBoutique}
                    src={profil.data?.avatar_url || identity?.avatar_url}
                    size={66}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => setProfilOuvert(true)}
                      style={{ textAlign: 'left', padding: 0, border: 0, background: 'none' }}
                      aria-label={`Voir le profil de ${nomBoutique}`}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: 17.5,
                          lineHeight: 1.2,
                          color: cover ? '#fff' : 'var(--v2-ink)',
                        }}
                      >
                        {nomBoutique}
                      </div>
                      {pseudoAffiche ? (
                        <div
                          style={{
                            fontSize: 12.5,
                            color: cover ? 'rgba(255,255,255,0.85)' : 'var(--v2-ink-3)',
                          }}
                        >
                          @{pseudoAffiche}
                        </div>
                      ) : null}
                    </button>
                  </div>
                </div>
              </div>

              <Card style={{ flex: 'none' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Stat icon="users" label="Abonnés" value={formatCount(profil.data?.stats.total_abonnes ?? 0)} />
                  <Stat icon="eye" label="Vues" value={formatCount(profil.data?.stats.total_vues_recues ?? 0)} />
                  <Stat
                    icon="star"
                    label="Note"
                    value={
                      profil.data && profil.data.stats.nb_avis > 0
                        ? `${formatNumber(profil.data.stats.note_moyenne, 1)}/5`
                        : '—'
                    }
                    hint={profil.data ? `${formatCount(profil.data.stats.nb_avis)} avis` : undefined}
                  />
                  <Stat
                    icon="shield"
                    label="Confiance"
                    value={`${formatNumber(profil.data?.score_confiance.total ?? 0, 0)}/100`}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  {profil.data?.stats.kyc_verifie ? (
                    <span className="v2-badge v2-badge--positive">
                      <Icon name="shield" size={13} /> Identité vérifiée
                    </span>
                  ) : null}
                  <span className="v2-badge">
                    <Icon name="cart" size={13} /> {formatCount(profil.data?.stats.ventes ?? 0)} ventes
                  </span>
                  {shop ? (
                    <span className={`v2-badge ${enLigne ? 'v2-badge--positive' : 'v2-badge--warning'}`}>
                      <Icon name="clock" size={13} />
                      {enLigne
                        ? `En ligne · ${formatDureeRestante(echeance)}`
                        : `Hors ligne · ${formatDureeRestante(echeance)}`}
                    </span>
                  ) : null}
                  {shop?.category ? (
                    <span className="v2-badge">
                      <Icon name="market" size={13} /> {shop.category}
                    </span>
                  ) : null}
                </div>
              </Card>

              {elements.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="market"
                    title="Aucune offre en ligne"
                    description={
                      shop
                        ? 'Cette boutique explore son mini-site sans vendre d’élément pour l’instant.'
                        : "Ce vendeur n'a rien publié pour le moment."
                    }
                  />
                </Card>
              ) : (
                <ExplorerElements elements={elements} />
              )}
            </>
          )}
        </div>
      </Sheet>

      <Sheet
        open={Boolean(pleinePhoto)}
        onClose={() => setPleinePhoto(null)}
        title={nomBoutique}
        subtitle={galerie.length > 0 ? `Photo ${(galerie.indexOf(pleinePhoto ?? '') + 1) || 1}` : undefined}
      >
        {pleinePhoto ? (
          <img
            src={pleinePhoto}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              maxHeight: '62vh',
              objectFit: 'contain',
              borderRadius: 'var(--v2-r-lg)',
              background: 'var(--v2-surface-2)',
            }}
          />
        ) : null}
      </Sheet>

      <PinSheet
        open={renouvelerOuvert}
        onClose={() => setRenouvelerOuvert(false)}
        title="Prolonger la présence"
        subtitle={
          frais
            ? `${jours} ${jours > 1 ? 'jours' : 'jour'} de plus · le robinet prélève ${money.formatPoints(
                frais.par_seconde_points * 3600,
              )} par heure, rien n'est débité ici`
            : `Saisis ton PIN pour prolonger la présence de ${jours} ${jours > 1 ? 'jours' : 'jour'}`
        }
        length={pinLength}
        onSubmit={prolongerLaPresence}
      />

      {profilOuvert ? (
        <PublicProfileSheet pseudo={pseudoAffiche || pseudo} onClose={() => setProfilOuvert(false)} />
      ) : null}
    </>
  );
}

/** Réseaux sociaux : couleur et icône canoniques, le lien réel est porté par la fiche. */
const SOCIAL_STYLE: Record<string, { c: string; ic: 'phone' | 'camera' | 'music' | 'play' | 'globe' | 'share' }> = {
  WhatsApp: { c: '#25D366', ic: 'phone' },
  Instagram: { c: '#E1306C', ic: 'camera' },
  TikTok: { c: '#111', ic: 'music' },
  YouTube: { c: '#FF0000', ic: 'play' },
  Facebook: { c: '#1877F2', ic: 'share' },
  X: { c: '#111', ic: 'share' },
  Site: { c: '#2e86de', ic: 'globe' },
};

/**
 * Une page du mini-site édité, vue par le visiteur : médias calibrés, appels à
 * action réels (chat, panier, lien), vidéo externe et réseaux en bas de page.
 * Aucun contenu d'exemple : tout vient de la fiche publiée par le vendeur.
 */
function SitePageView({
  page,
  nom,
  onContact,
  onOpenCart,
}: {
  page: SitePage;
  nom: string;
  onContact?: () => void;
  onOpenCart?: () => void;
}) {
  const medias = (page.medias || []).filter((m) => Boolean(m.src));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {medias.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: medias.length > 1 ? '1fr 1fr' : '1fr', gap: 9 }}>
          {medias.map((m, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '4/5', borderRadius: 12, overflow: 'hidden', background: '#05070c', border: '1px solid var(--v2-line)' }}>
              {m.type === 'video' ? (
                <video src={m.src} controls playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: mediaFilter(m.adj) }} />
              ) : (
                <img src={m.src} alt={`${nom} ${i + 1}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: mediaFilter(m.adj) }} />
              )}
              {(m.overlays || []).map((o, oi) =>
                o.src ? (
                  <img
                    key={oi}
                    src={o.src}
                    alt=""
                    style={{ position: 'absolute', left: `${o.x}%`, top: `${o.y}%`, width: `${o.w}%`, height: `${o.h}%`, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,.4)' }}
                  />
                ) : null,
              )}
              {m.type === 'video' ? (
                <span className="v2-badge" style={{ position: 'absolute', left: 7, bottom: 7 }}>{fmtDuree(mediaDuree(m))}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {page.buttons?.length ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {page.buttons.map((b, i) =>
            b.kind === 'contact' && onContact ? (
              <Button key={i} size="sm" icon="chat" onClick={onContact}>{b.label || 'Nous écrire'}</Button>
            ) : b.kind === 'acheter' && onOpenCart ? (
              <Button key={i} size="sm" variant="secondary" icon="cart" onClick={onOpenCart}>{b.label || 'Acheter'}</Button>
            ) : (
              <Button
                key={i}
                size="sm"
                variant="outline"
                icon="external"
                disabled={!b.url}
                onClick={() => b.url && window.open(b.url, '_blank', 'noopener,noreferrer')}
              >
                {b.label || 'Voir le lien'}
              </Button>
            ),
          )}
        </div>
      ) : null}

      {page.video?.url ? (
        <button
          type="button"
          onClick={() => window.open(page.video!.url, '_blank', 'noopener,noreferrer')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', border: '1px solid var(--v2-line)', borderRadius: 12, padding: '10px 12px', background: 'var(--v2-card)', color: 'inherit', cursor: 'pointer' }}
        >
          <span style={{ width: 40, height: 40, flex: 'none', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(230,57,70,.9)', color: '#fff' }}>
            <Icon name="play" size={18} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.video.title || 'Vidéo'}</span>
            <span className="v2-muted" style={{ display: 'block', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.video.src} · {page.video.url}</span>
          </span>
          <Icon name="external" size={16} />
        </button>
      ) : null}

      {page.social?.length ? (
        <div style={{ marginTop: 2 }}>
          <div className="v2-muted" style={{ textAlign: 'center', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 750, marginBottom: 8 }}>Retrouve-nous</div>
          <div style={{ display: 'flex', gap: 9, justifyContent: 'center', flexWrap: 'wrap' }}>
            {page.social.map((s) => {
              const style = SOCIAL_STYLE[s.name] || { c: '#2e86de', ic: 'globe' as const };
              return (
                <a
                  key={s.name}
                  href={s.url || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={s.url || s.name}
                  style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', background: style.c, border: '1px solid rgba(255,255,255,.2)', opacity: s.url ? 1 : 0.45, pointerEvents: s.url ? 'auto' : 'none' }}
                >
                  <Icon name={style.ic} size={16} />
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * La fiche d'identité du studio de vitrine : ce que le vendeur a réglé dans
 * les panneaux Identité, Mini-site, Live et statistiques.
 */
function VitrineFiche({
  site,
  nom,
  onContact,
  onOpenCart,
}: {
  site: VitrineSite;
  nom: string;
  onContact?: () => void;
  onOpenCart?: () => void;
}) {
  const initiales = (site.nom || nom || '?').trim().slice(0, 2).toUpperCase();
  const score = site.stats.score && site.stats.score !== '—' ? site.stats.score : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 52,
            height: 52,
            flex: 'none',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
            background: site.couleur || 'var(--v2-accent)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 18,
            border: '1px solid rgba(255,255,255,.22)',
          }}
        >
          {site.logo ? (
            <img src={site.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initiales
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{site.nom || nom}</div>
          <div className="v2-muted" style={{ fontSize: 12 }}>
            {[site.cat, site.distance, score ? `★ ${score}` : ''].filter(Boolean).join(' · ')}
          </div>
        </div>
        {site.live ? (
          <span className="v2-badge v2-badge--accent">
            <Icon name="play" size={12} /> En direct
          </span>
        ) : null}
      </div>

      {site.accroche ? <div className="v2-explorer-desc">{site.accroche}</div> : null}

      {site.ms.showStats ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5 }}>
          <span>
            <b>{formatNumber(site.stats.vues)}</b> <span className="v2-muted">vues</span>
          </span>
          <span>
            <b>{formatNumber(site.stats.likes)}</b> <span className="v2-muted">j’aime</span>
          </span>
          <span>
            <b>{formatNumber(site.ms.abon)}</b> <span className="v2-muted">abonnés</span>
          </span>
        </div>
      ) : null}

      {site.adresse && site.ms.showAddr ? (
        <div className="v2-muted" style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="pin" size={14} /> {site.adresse}
        </div>
      ) : null}

      {site.ms.showAbout && (site.ms.about || site.ms.sujet) ? (
        <div className="v2-explorer-desc">{site.ms.about || site.ms.sujet}</div>
      ) : null}

      {site.live && site.liveTitre ? (
        <div className="v2-muted" style={{ fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="play" size={14} /> {site.liveTitre}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {onContact ? (
          <Button size="sm" icon="chat" onClick={onContact}>
            Contacter
          </Button>
        ) : null}
        {onOpenCart && site.ms.showCart ? (
          <Button size="sm" variant="secondary" icon="cart" onClick={onOpenCart}>
            Panier
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Les liens réels déclarés dans le panneau Liens, plus les appels à l'action. */
function VitrineLiens({
  liens,
  onContact,
  onOpenCart,
}: {
  liens: LienExterne[];
  onContact?: () => void;
  onOpenCart?: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {liens.map((lien, index) => (
        <a
          key={`${lien.url}-${index}`}
          href={lien.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--v2-line)',
            background: 'var(--v2-card)',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <Icon name="external" size={16} />
          <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lien.nom || 'Lien'}
          </span>
        </a>
      ))}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {onContact ? (
          <Button size="sm" icon="chat" onClick={onContact}>
            Contacter
          </Button>
        ) : null}
        {onOpenCart ? (
          <Button size="sm" variant="secondary" icon="cart" onClick={onOpenCart}>
            Panier
          </Button>
        ) : null}
      </div>
    </div>
  );
}
