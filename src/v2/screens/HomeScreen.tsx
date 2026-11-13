import { useEffect } from 'react';
import { Icon } from '../components/Icon';
import { Button, Card, EmptyState, IconButton, Row, SectionTitle, Skeleton } from '../components/Ui';
import { useSession } from '../lib/session';
import { useAsync } from '../lib/hooks';
import { useWalletSnapshot } from '../lib/useWallet';
import { listZandoItems, type ZandoItem } from '../lib/api';
import { tauxProvenanceLabel, useConvertisseurDevise } from '../lib/currency';
import {
  formatCurrency,
  formatNumber,
  initials,
  isIncomingTx,
  parseMediaUrls,
  relativeDay,
  txLabel,
} from '../lib/format';

type WalletIntent = 'send' | 'receive' | 'convert' | 'ubi';

interface HomeScreenProps {
  onGoTab: (tab: 'wallet' | 'market' | 'profile' | 'chat' | 'trading') => void;
  onGoStudio: () => void;
  onOpenWalletIntent: (intent: WalletIntent) => void;
  onOpenItem: (item: ZandoItem) => void;
}

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Bonne nuit';
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

export function HomeScreen({
  onGoTab,
  onGoStudio,
  onOpenWalletIntent,
  onOpenItem,
}: HomeScreenProps) {
  const { uq, displayName, pseudo, toast } = useSession();
  const wallet = useWalletSnapshot(uq);
  const feed = useAsync(() => listZandoItems(), []);

  const items = (feed.data?.items || []).filter((item) => item.published !== false);
  const highlights = items.slice(0, 6);
  const recent = wallet.data.transactions.slice(0, 4);

  useEffect(() => {
    if (wallet.error) toast('Soldes indisponibles pour le moment.', 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet.error]);

  const btc = Number(wallet.data.prices.btc_usd || 0);
  const gold = Number(wallet.data.prices.gold_usd_per_ounce || 0);

  // Le BORB n'est jamais une monnaie a l'ecran : les montants sont rendus
  // dans la devise d'affichage, au taux de l'oracle. Sans taux observé, le
  // montant est « indisponible » — jamais converti au taux implicite 1 pour 1.
  // La conversion vient du composant partagé, pas d'une recopie de la formule.
  const convertisseur = useConvertisseurDevise({
    rates: wallet.data.rates,
    usdRate: wallet.data.usdRate,
    devise: wallet.data.displayCurrency,
  });
  const { sansTaux, versDevise: toView, versDevisePoints: toViewPoints } = convertisseur;

  return (
    <div style={{ paddingTop: 'calc(10px + env(safe-area-inset-top))' }}>
      <div className="v2-pad v2-row-between" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button onClick={() => onGoTab('profile')} aria-label="Mon profil">
            <span
              className="v2-avatar"
              style={{ width: 44, height: 44, background: 'var(--v2-accent)', color: '#fff' }}
            >
              {initials(displayName || pseudo || uq)}
            </span>
          </button>
          <div style={{ minWidth: 0 }}>
            <div className="v2-muted" style={{ fontSize: 12 }}>
              {greeting()}
            </div>
            <div
              className="v2-h3"
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {displayName || pseudo || uq}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <IconButton name="chat" label="Messages" onClick={() => onGoTab('chat')} />
          <IconButton name="wallet" label="Coffre" onClick={() => onGoTab('wallet')} />
        </div>
      </div>

      <div className="v2-pad">
        <div className="v2-hero v2-rise">
          <div className="v2-row-between" style={{ alignItems: 'flex-start' }}>
            <span className="v2-hero-label">Wallet virtuel</span>
            <button
              className="v2-hero-pill"
              onClick={() => onGoTab('wallet')}
              style={{ color: '#fff' }}
            >
              Coffre <Icon name="forward" size={13} />
            </button>
          </div>

          {wallet.loading ? (
            <div style={{ marginTop: 12 }}>
              <div
                className="v2-skeleton"
                style={{ height: 38, width: 190, background: 'rgba(255,255,255,0.28)' }}
              />
            </div>
          ) : wallet.data.currencies.length > 0 ? (
            /* Le solde affiche est la somme des devises reellement converties.
               Sans taux, un « 0,00 » mentrait sur tout le portefeuille. */
            <div className="v2-hero-amount">
              {sansTaux
                ? '— taux indisponible'
                : formatCurrency(wallet.data.currenciesValue, wallet.data.displayCurrency)}
            </div>
          ) : (
            <div
              className="v2-muted"
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 10 }}
            >
              Aucun solde converti
            </div>
          )}

          <div className="v2-hero-meta">
            <span className="v2-hero-pill">
              <Icon name={wallet.data.taux.horsLigne ? 'alert' : 'globe'} size={13} />
                {' '}
              {tauxProvenanceLabel(wallet.data.taux, wallet.data.displayCurrency) ||
                'Provenance des taux indisponible'}
            </span>
            {wallet.data.currencies.length > 0 ? (
              <span className="v2-hero-pill">
                <Icon name="coin" size={13} />
                {wallet.data.currencies.length === 1
                  ? wallet.data.currencies[0].code
                  : `${wallet.data.currencies.length} devises`}
              </span>
            ) : (
              <span style={{ opacity: 0.85 }}>Réserve de sécurité dans le coffre</span>
            )}
          </div>
        </div>

        <div className="v2-actions" style={{ marginTop: 8 }}>
          <button className="v2-action" onClick={() => onOpenWalletIntent('send')}>
            <span className="v2-action-icon">
              <Icon name="send" size={20} />
            </span>
            Envoyer
          </button>
          <button className="v2-action" onClick={() => onOpenWalletIntent('receive')}>
            <span className="v2-action-icon v2-action-icon--green">
              <Icon name="qr" size={20} />
            </span>
            Recevoir
          </button>
          <button className="v2-action" onClick={() => onOpenWalletIntent('convert')}>
            <span className="v2-action-icon v2-action-icon--amber">
              <Icon name="swap" size={20} />
            </span>
            Convertir
          </button>
          <button className="v2-action" onClick={onGoStudio}>
            <span className="v2-action-icon v2-action-icon--neutral">
              <Icon name="plus" size={20} />
            </span>
            Publier
          </button>
        </div>
      </div>

      <div className="v2-pad">
        <SectionTitle
          action={
            <button className="v2-btn v2-btn--ghost v2-btn--sm" onClick={() => onGoTab('market')}>
              Tout voir
            </button>
          }
        >
          Marché Zando
        </SectionTitle>

        {feed.loading ? (
          <div style={{ display: 'flex', gap: 10 }}>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} height={148} width={132} radius={16} />
            ))}
          </div>
        ) : highlights.length === 0 ? (
          <Card>
            <EmptyState
              icon="market"
              title="Aucune offre publiée"
              description="Publie pour apparaître ici."
              action={<Button size="sm" onClick={onGoStudio} icon="plus">Créer une offre</Button>}
            />
          </Card>
        ) : (
          <div className="v2-scroll-x">
            {highlights.map((item) => {
              const media = parseMediaUrls(item.media_urls);
              return (
                <button
                  key={item.id}
                  onClick={() => onOpenItem(item)}
                  style={{
                    flex: 'none',
                    width: 148,
                    textAlign: 'left',
                    background: 'var(--v2-surface)',
                    border: '1px solid var(--v2-line)',
                    borderRadius: 18,
                    overflow: 'hidden',
                  }}
                >
                  {media[0] ? (
                    <img
                      src={media[0]}
                      alt=""
                      style={{ width: '100%', height: 92, objectFit: 'cover', background: 'var(--v2-surface-2)' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 92,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'var(--v2-surface-2)',
                        color: 'var(--v2-ink-3)',
                      }}
                    >
                      <Icon name="image" size={24} />
                    </div>
                  )}
                  <div style={{ padding: '9px 11px 12px' }}>
                    <div className="v2-clamp-1" style={{ fontSize: 13.5, fontWeight: 650 }}>
                      {item.title}
                    </div>
                    <div
                      className="v2-amount"
                      style={{ marginTop: 4, fontSize: 13, fontWeight: 700, color: 'var(--v2-accent)' }}
                    >
                      {toView(item.price_borb)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <SectionTitle
          action={
            <button className="v2-btn v2-btn--ghost v2-btn--sm" onClick={() => onGoTab('wallet')}>
              Historique
            </button>
          }
        >
          Activité récente
        </SectionTitle>

        <Card padded={false} style={{ overflow: 'hidden' }}>
          {wallet.loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Skeleton height={18} width="60%" />
              <Skeleton height={18} width="45%" />
              <Skeleton height={18} width="52%" />
            </div>
          ) : recent.length === 0 ? (
            <div style={{ padding: '10px 0' }}>
              <EmptyState
                icon="receipt"
                title="Pas encore d’opération"
                description="Aucune opération."
              />
            </div>
          ) : (
            recent.map((tx) => {
              const incoming = isIncomingTx(tx.type);
              return (
                <Row
                  key={`${tx.id}-${tx.timestamp}`}
                  icon={incoming ? 'arrowDownLeft' : 'arrowUpRight'}
                  iconTone={incoming ? 'green' : 'neutral'}
                  title={txLabel(tx.type)}
                  subtitle={`${relativeDay(tx.timestamp)} · ${tx.counterparty || 'UQ'}`}
                  value={`${incoming ? '+' : '−'}${toViewPoints(Math.abs(tx.amount))}`}
                  valueTone={incoming ? 'positive' : 'default'}
                />
              );
            })
          )}
        </Card>

        <SectionTitle
          action={
            <button className="v2-btn v2-btn--ghost v2-btn--sm" onClick={() => onGoTab('trading')}>
              Marchés
            </button>
          }
        >
          Repères du jour
        </SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: 'var(--v2-warning-soft)',
                  color: 'var(--v2-warning)',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                ₿
              </span>
              <div>
                <div className="v2-muted" style={{ fontSize: 11.5 }}>
                  Bitcoin
                </div>
                <div className="v2-amount" style={{ fontSize: 15, fontWeight: 700 }}>
                  {btc ? `$${formatNumber(btc, 0)}` : '—'}
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: 'var(--v2-accent-soft)',
                  color: 'var(--v2-accent)',
                }}
              >
                <Icon name="coin" size={17} />
              </span>
              <div>
                <div className="v2-muted" style={{ fontSize: 11.5 }}>
                  Or / once
                </div>
                <div className="v2-amount" style={{ fontSize: 15, fontWeight: 700 }}>
                  {gold ? `$${formatNumber(gold, 0)}` : '—'}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="v2-card" style={{ marginTop: 14, display: 'flex', gap: 12 }}>
          <span style={{ color: 'var(--v2-accent)', flex: 'none' }}>
            <Icon name="shield" size={20} />
          </span>
          <div>
            <div className="v2-h3">Ton coffre est protégé</div>
            <div className="v2-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
              Confirme chaque opération avec ton code PIN. Vérifie l’intégrité de ton historique depuis le
              coffre.
            </div>
          </div>
        </div>

        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
