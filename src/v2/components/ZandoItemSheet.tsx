import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { PublicProfileSheet } from './PublicProfileSheet';
import { TransactionSheet } from './TransactionSheet';
import { Button, Card, List, Row, Sheet } from './Ui';
import {
  createPublication,
  describeError,
  interactZando,
  marketplaceCreer,
  paritePointsParBorb,
  zandoOwner,
  zandoStamp,
  type ZandoItem,
} from '../lib/api';
import { estVitrineBoutique, firstContentUrl, parseMediaUrls, relativeDay } from '../lib/format';
import { identityAvatar, identityLabel, useIdentity } from '../lib/identity';
import { useSession } from '../lib/session';
import { useDisplayAmount } from '../lib/currency';

export function ZandoItemSheet({
  item,
  onClose,
  onMessage,
  onPlay,
  onOpenBoutique,
}: {
  item: ZandoItem | null;
  onClose: () => void;
  onMessage: (uq: string, item?: ZandoItem) => void;
  /** Ouvre le lecteur payant a la seconde sur le lien du contenu. */
  onPlay?: (item: ZandoItem) => void;
  /** « Explorer » : le mini-site du vendeur, pour une vitrine de boutique. */
  onOpenBoutique?: (seller: string) => void;
}) {
  const { toast, authenticated, uq: monUq } = useSession();
  /** Prix rendus en devise : le BORB n'est jamais une monnaie d'affichage. */
  const money = useDisplayAmount();
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState<string | null>(null);
  /** Fiche publique du vendeur, ouverte au clic sur sa ligne. */
  const [profilOuvert, setProfilOuvert] = useState(false);
  /** Statut publie depuis cette offre : l'element n'est qu'un lien. */
  const [statutBusy, setStatutBusy] = useState(false);
  const [statutPublie, setStatutPublie] = useState(false);
  /** Transaction marketplace ouverte depuis cette offre (vente/service solo). */
  const [txId, setTxId] = useState<number | null>(null);
  const [achatBusy, setAchatBusy] = useState(false);

  const media = item ? parseMediaUrls(item.media_urls) : [];
  /** Lien facturable : une photo d'offre n'est pas un contenu lisible. */
  const playUrl = item ? firstContentUrl(media) : '';
  const owner = zandoOwner(item);
  const sellerUq = /^UQ-\d+$/i.test(owner) ? owner : undefined;
  /** Le vendeur s'affiche par son pseudo ; l'identifiant UQ reste technique. */
  const sellerIdentity = useIdentity(sellerUq);
  const sellerLabel = item?.seller_pseudo || (sellerUq ? identityLabel(sellerUq, sellerIdentity) : owner);
  const stamp = zandoStamp(item);
  /** Une vitrine n'a pas de prix : elle se paie en présence, pas à l'achat. */
  const vitrine = estVitrineBoutique(item);
  /** Vente ou service solo : seuls ces types passent par le séquestre UQ. */
  const typeSolo = String(item?.type || '').toLowerCase();
  const estVenteSolo = typeSolo === 'produit';
  const estServiceSolo = typeSolo === 'service';
  const estSolo = estVenteSolo || estServiceSolo;
  /** Le vendeur ne peut pas s'acheter à lui-même (le backend le refuse aussi). */
  const estLeVendeur = Boolean(sellerUq && monUq && sellerUq.toUpperCase() === monUq.toUpperCase());
  const peutAcheter = estSolo && !vitrine && Boolean(sellerUq) && authenticated && !estLeVendeur && !item?.sold;
  const typeLabel = estServiceSolo ? 'Service solo' : estVenteSolo ? 'Vente solo' : null;
  const subtitle = item
    ? [
        stamp ? relativeDay(stamp) : null,
        typeLabel || (vitrine ? 'Boutique' : money.format(item.price_borb)),
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined;

  useEffect(() => {
    if (!item || !authenticated) return;
    if (registered === item.id) return;
    setRegistered(item.id);
    interactZando(item.id, 'view').catch(() => undefined);
  }, [item, authenticated, registered]);

  useEffect(() => {
    setLiked(false);
    setStatutPublie(false);
  }, [item?.id]);

  const like = async () => {
    if (!item || liked || busy) return;
    if (!authenticated) {
      toast('Connecte-toi pour enregistrer cette offre.', 'error');
      return;
    }
    setBusy(true);
    try {
      await interactZando(item.id, 'like');
      setLiked(true);
      toast('Offre enregistrée', 'success');
    } catch {
      toast('Enregistrement impossible.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!item) return;
    const url = new URL(window.location.href);
    url.searchParams.set('item', item.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url: url.toString() });
      } else {
        await navigator.clipboard.writeText(url.toString());
        toast('Lien copié', 'success');
      }
      if (authenticated) interactZando(item.id, 'share').catch(() => undefined);
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      toast('Partage impossible.', 'error');
    }
  };

  /**
   * Le statut ne duplique pas l'offre : il en porte l'image, le titre et le
   * lien. Le prix reste sur `shop_items`, seule source du produit.
   */
  /**
   * « Acheter » sur une vente/service solo : crée la réservation marketplace
   * (statut `reservation`) puis ouvre la fiche transaction. Le prix BORB de
   * l'annonce est converti en points via la parité publiée par l'oracle.
   */
  const acheter = async () => {
    if (!item || !sellerUq || achatBusy) return;
    const parite = paritePointsParBorb();
    if (!parite) {
      toast('Conversion prix → points indisponible (parité oracle non reçue).', 'error');
      return;
    }
    const pointsTotal = Math.round((Number(item.price_borb) || 0) * parite);
    if (pointsTotal <= 0) {
      toast('Prix invalide pour une transaction marketplace.', 'error');
      return;
    }
    setAchatBusy(true);
    try {
      const res = await marketplaceCreer({
        produit_id: item.id,
        type_produit: estServiceSolo ? 'service' : 'physique',
        vendeur: sellerUq,
        points_total: pointsTotal,
        devise: 'POINTS',
      });
      setTxId(res.id);
    } catch (error) {
      toast(describeError(error, 'Réservation impossible.'), 'error');
    } finally {
      setAchatBusy(false);
    }
  };

  const publierStatut = async () => {
    if (!item || statutPublie || statutBusy) return;
    if (!authenticated) {
      toast('Connecte-toi pour publier un statut.', 'error');
      return;
    }
    setStatutBusy(true);
    try {
      const creee = await createPublication({
        kind: 'status',
        title: item.title,
        body: item.description || undefined,
        ...(media[0] ? { media: media[0] } : {}),
        zando_item_id: item.id,
      });
      const expiration = creee?.publication?.expires_at;
      const heures = expiration
        ? Math.max(1, Math.floor((Number(expiration) * 1000 - Date.now()) / 3_600_000))
        : null;
      toast(heures ? `Statut en ligne · expire dans ${heures} h` : 'Statut en ligne', 'success');
      setStatutPublie(true);
    } catch (error) {
      toast(describeError(error, 'Publication impossible.'), 'error');
    } finally {
      setStatutBusy(false);
    }
  };

  return (
    <>
      <Sheet
        open={Boolean(item)}
        onClose={onClose}
        title={item?.title || 'Offre'}
        subtitle={subtitle}
        footer={
          item ? (
            <div className="v2-stack">
              {peutAcheter && (
                <>
                  <Button block icon="cart" loading={achatBusy} onClick={() => void acheter()}>
                    Acheter — paiement séquestre UQ
                  </Button>
                  <div className="v2-muted" style={{ fontSize: 12, textAlign: 'center' }}>
                    {estServiceSolo
                      ? 'Service : réservation avec créneau possible. Le paiement est séquestré jusqu’à la fin de la prestation.'
                      : 'Le montant est séquestré jusqu’à la remise. Code jetable à deux saisies pour libérer.'}
                  </div>
                </>
              )}
              {playUrl && onPlay && !vitrine && (
                <Button block icon="play" onClick={() => onPlay(item)}>
                  Lire ce contenu · {money.format(item.price_borb)}/s
                </Button>
              )}
              <Button
                block
                variant="ghost"
                icon="sparkles"
                loading={statutBusy}
                disabled={statutPublie}
                onClick={() => void publierStatut()}
              >
                {statutPublie ? 'Statut en ligne' : 'Publier en statut'}
              </Button>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  variant="secondary"
                  icon={liked ? 'check' : 'pin'}
                  onClick={like}
                  disabled={liked}
                  style={{ flex: 1 }}
                >
                  {liked ? 'Enregistrée' : 'Enregistrer'}
                </Button>
                <Button icon="send" onClick={() => sellerUq && onMessage(sellerUq, item || undefined)} disabled={!sellerUq} style={{ flex: 1 }}>
                  Message
                </Button>
              </div>
            </div>
          ) : null
        }
      >
      {item && (
        <div className="v2-stack">
          {media[0] ? (
            <img
              src={media[0]}
              alt={item.title}
              style={{
                width: '100%',
                maxHeight: 300,
                objectFit: 'cover',
                borderRadius: 20,
                background: 'var(--v2-surface-2)',
              }}
            />
          ) : (
            <div
              style={{
                height: 170,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 20,
                background: 'var(--v2-surface-2)',
                color: 'var(--v2-ink-3)',
              }}
            >
              <Icon name="image" size={34} />
            </div>
          )}

          <div className="v2-row-between">
            <div>
              <div className="v2-muted" style={{ fontSize: 12 }}>
                {vitrine ? 'Type' : 'Prix'}
              </div>
              <div className="v2-h2" style={{ color: vitrine ? 'var(--v2-ink)' : 'var(--v2-accent)' }}>
                {vitrine ? 'Boutique en ligne' : money.format(item.price_borb)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {typeLabel ? <span className="v2-badge v2-badge--accent">{typeLabel}</span> : null}
              {item.category && <span className="v2-badge">{item.category}</span>}
            </div>
          </div>

          {vitrine && sellerUq && onOpenBoutique ? (
            <Button block icon="market" onClick={() => onOpenBoutique(sellerUq)}>
              Explorer la boutique
            </Button>
          ) : null}

          <div>
            <div className="v2-h3" style={{ marginBottom: 4 }}>
              Description
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--v2-ink-2)' }}>
              {item.description || 'Aucune description fournie par le vendeur.'}
            </p>
          </div>

          <List>
            <Row
              avatar={{
                label: (sellerLabel || 'Vendeur').slice(0, 2).toUpperCase(),
                src: sellerUq ? identityAvatar(sellerUq, sellerIdentity) : undefined,
              }}
              title={sellerLabel || 'Vendeur'}
              subtitle={item.category || 'Offre publiée sur Zando'}
              right={<span className="v2-badge">Vendeur</span>}
              chevron={Boolean(sellerUq)}
              onClick={sellerUq ? () => setProfilOuvert(true) : undefined}
            />
          </List>

          <Card style={{ display: 'flex', gap: 10 }}>
            <span style={{ color: 'var(--v2-warning)', flex: 'none' }}>
              <Icon name="info" size={18} />
            </span>
            <div className="v2-muted" style={{ fontSize: 12.5 }}>
              {peutAcheter
                ? estServiceSolo
                  ? 'Règle : la réservation est gratuite, le paiement n’est séquestré qu’après ton PIN. Le vendeur dispose de 48 h pour accepter ; passé ce délai la transaction peut être annulée.'
                  : 'Règle : le paiement est séquestré par UQ jusqu’à la remise. Le vendeur doit accepter ; le code jetable à deux saisies libère les fonds. Litige possible pendant la remise.'
                : estSolo
                  ? 'Cette offre solo n’est pas achetable en l’état (vendue, expirée ou vendeur différent). Contacte le vendeur pour convenir de la remise.'
                  : 'Le paiement en ligne n’est pas encore actif sur cette offre. Contacte le vendeur pour convenir de la remise.'}
            </div>
          </Card>

          <Button variant="ghost" icon="external" onClick={share}>
            Partager l’offre
          </Button>
        </div>
      )}
      </Sheet>

      <TransactionSheet txId={txId} onClose={() => setTxId(null)} />

      <PublicProfileSheet
        pseudo={profilOuvert && sellerUq ? sellerUq : ''}
        onClose={() => setProfilOuvert(false)}
        onContact={
          sellerUq
            ? () => {
                setProfilOuvert(false);
                onMessage(sellerUq, item || undefined);
              }
            : undefined
        }
      />
    </>
  );
}
