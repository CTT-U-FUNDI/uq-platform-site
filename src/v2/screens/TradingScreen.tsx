import { useEffect, useMemo, useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBlock,
  Field,
  Hint,
  IconButton,
  Input,
  KeyValue,
  Row,
  ScreenHeader,
  SearchInput,
  Segmented,
  Sheet,
  Skeleton,
  Stat,
} from '../components/Ui';
import { PinSheet } from '../components/PinSheet';
import { PublicProfileSheet } from '../components/PublicProfileSheet';
import { PublicationsPanel } from '../components/PublicationsPanel';
import { BorbMarketHub } from '../components/BorbMarketHub';
import { EarnPanel } from '../components/EarnPanel';
import { PairCandles } from '../components/PairCandles';
import { TradingPerformance } from '../components/TradingPerformance';
import { FactureAcheteur, FactureVendeur, PucePreuveCommande } from '../components/P2PFacture';
import { useAsync, usePolling } from '../lib/hooks';
import { useSession } from '../lib/session';
import { useNotifications } from '../lib/notifications';
import { useHelp } from '../lib/help';
import { decrireAgeTaux } from '../lib/currency';
import { describeError, lookupPublicPseudo, type PublicPseudoResponse } from '../lib/api';
import { identityPseudo, useIdentities } from '../lib/identity';
import { formatDateTime, formatNumber, formatTime, relativeDay } from '../lib/format';
import { ingestOffers, suggestRate, useLearningRevision } from '../lib/learning';
import {
  cancelOrder,
  cancelP2POrder,
  createP2POffer,
  getOrderbook,
  getPairTrades,
  getP2POffers,
  getP2POrders,
  getTradingContext,
  getTradingMarkets,
  getTradingOrders,
  numeroDePreuve,
  placeOrder,
  takeP2POffer,
  type OrderSide,
  type OrderType,
  type OrderbookLevel,
  type P2POffer,
  type P2POrder,
  type ScreenNotification,
  type TradeRow,
  type TradingBalance,
  type TradingMarket,
  type TradingOrder,
} from '../lib/trading';

type TradingTab = 'marche' | 'ordres' | 'p2p' | 'earn' | 'publications';
type P2PView = 'offres' | 'commandes';
type MarketSort = 'volume' | 'trades' | 'az';
type OrderFilter = 'all' | 'open' | 'filled' | 'cancelled';
type P2POrderFilter = 'all' | 'active' | 'done';
type P2PSort = 'recent' | 'rate-asc' | 'rate-desc';

const SCOPES: Record<string, { label: string; icon: IconName }> = {
  kyc: { label: 'Vérification', icon: 'shield' },
  coffre: { label: 'Coffre', icon: 'wallet' },
  zando: { label: 'Zando', icon: 'market' },
  trading: { label: 'Trading', icon: 'trendUp' },
  chat: { label: 'Chat', icon: 'chat' },
};

const num = (value: string): number => {
  const cleaned = value.replace(/\s/g, '').replace(',', '.');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const priceLabel = (value: number): string =>
  value ? formatNumber(value, value < 1 ? 6 : 2) : '—';

const pctLabel = (value: number): string =>
  `${value > 0 ? '+' : ''}${formatNumber(value, 2)} %`;

const timeLabel = (timestamp: number): string => {
  if (!timestamp) return '—';
  const date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const inputNumber = (value: number, digits = 6): string =>
  Number.isFinite(value) && value > 0 ? String(Number(value.toFixed(digits))) : '';

const favoritesKey = (uq: string) => `uq.trading.favorites:${uq}`;

const readFavorites = (uq: string): string[] => {
  try {
    const raw = window.localStorage.getItem(favoritesKey(uq));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is string => typeof entry === 'string')
      : [];
  } catch {
    return [];
  }
};

const STATUS_LABELS: Record<string, { label: string; tone: string; icon: IconName }> = {
  open: { label: 'Ouvert', tone: 'v2-badge--warning', icon: 'clock' },
  filled: { label: 'Exécuté', tone: 'v2-badge--positive', icon: 'check' },
  cancelled: { label: 'Annulé', tone: '', icon: 'close' },
  pending_payment: { label: 'À payer', tone: 'v2-badge--warning', icon: 'wallet' },
  paid: { label: 'Paiement annoncé', tone: 'v2-badge--accent', icon: 'phone' },
  completed: { label: 'Terminée', tone: 'v2-badge--positive', icon: 'star' },
};

function StatusChip({ status }: { status: string }) {
  const entry = STATUS_LABELS[status] || { label: status, tone: '', icon: 'info' as IconName };
  return (
    <span className={`v2-badge ${entry.tone}`}>
      <Icon name={entry.icon} size={12} /> {entry.label}
    </span>
  );
}

/* ============================ Ligne du carnet ============================ */

type BookRowLevel = OrderbookLevel & { total: number };

function BookRow({
  level,
  side,
  max,
}: {
  level: BookRowLevel;
  side: 'bid' | 'ask';
  max: number;
}) {
  const width = max > 0 ? Math.min(100, (level.total / max) * 100) : 0;
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 8,
        padding: '4px 10px',
        fontSize: 12.5,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: `${width}%`,
          background:
            side === 'bid' ? 'var(--v2-positive-soft)' : 'var(--v2-negative-soft)',
          opacity: 0.7,
        }}
      />
      <span
        style={{
          position: 'relative',
          fontWeight: 600,
          color: side === 'bid' ? 'var(--v2-positive)' : 'var(--v2-negative)',
        }}
      >
        {priceLabel(level.price)}
      </span>
      <span style={{ position: 'relative', textAlign: 'right' }}>
        {formatNumber(level.amount, 4)}
      </span>
      <span className="v2-muted" style={{ position: 'relative', textAlign: 'right' }}>
        {formatNumber(level.total, 4)}
      </span>
    </div>
  );
}

/* ============================ Ligne de marché ============================ */

function MarketListRow({
  market,
  favorite,
  balance,
  trades,
  tradeError,
  tradeLoading,
  onToggleFavorite,
  onOpen,
}: {
  market: TradingMarket;
  favorite: boolean;
  balance: number;
  trades: TradeRow[];
  tradeError: string | null;
  tradeLoading: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
}) {
  const points = trades
    .slice(0, 18)
    .reverse()
    .filter((trade) => Number.isFinite(trade.price) && trade.price > 0);
  const prices = points.map((trade) => trade.price);
  const minimum = prices.length ? Math.min(...prices) : 0;
  const spread = prices.length ? Math.max(...prices) - minimum || 1 : 1;
  const path = prices
    .map((price, index) => {
      const x = prices.length < 2 ? 50 : (index / (prices.length - 1)) * 100;
      const y = 28 - ((price - minimum) / spread) * 23;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
  const rising = prices.length > 1 && prices[prices.length - 1] >= prices[0];
  const lineColor = rising ? 'var(--v2-positive)' : 'var(--v2-negative)';

  return (
    <article className="v2-trading-market-tile">
      <div className="v2-trading-market-tile-head">
        <button
          type="button"
          className="v2-trading-market-favorite"
          onClick={onToggleFavorite}
          aria-label={
            favorite
              ? `Retirer ${market.pair} des favoris`
              : `Ajouter ${market.pair} aux favoris`
          }
        >
          <Icon name="star" size={14} filled={favorite} />
        </button>
        <button type="button" className="v2-trading-market-open" onClick={onOpen}>
          <span className="v2-trading-market-currency">{market.quote.slice(0, 3)}</span>
          <span className="v2-trading-market-name">
            <strong>{market.base} / {market.quote}</strong>
            <small>
              {balance > 0
                ? `Solde ${formatNumber(balance, 2)} ${market.quote}`
                : market.trades_24h > 0
                  ? `Dernier ${priceLabel(market.last)}`
                  : 'Oracle uniquement'}
            </small>
          </span>
        </button>
      </div>
      <div className="v2-trading-market-tile-price">{priceLabel(market.price)}</div>
      <div className="v2-trading-market-chart">
        {points.length >= 2 ? (
          <svg
            viewBox="0 0 100 32"
            role="img"
            aria-label={`Historique des ${points.length} dernières transactions ${market.pair}`}
            preserveAspectRatio="none"
          >
            <path d={path} fill="none" stroke={lineColor} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
          </svg>
        ) : (
          <span>
            {tradeLoading
              ? 'Chargement des transactions…'
              : tradeError
                ? 'Historique indisponible'
                : 'Pas assez de transactions pour tracer une tendance'}
          </span>
        )}
      </div>
      <div className="v2-trading-market-tile-foot">
        <span>{formatNumber(market.volume_24h, 2)} {market.quote} · {market.trades_24h} trades / 24 h</span>
        <button type="button" onClick={onOpen}>Analyser <Icon name="forward" size={12} /></button>
      </div>
    </article>
  );
}

/* ============================ Feuille : détail d'une paire ============================ */

function PairSheet({
  base,
  quote,
  market,
  onClose,
  onTrade,
}: {
  base: string;
  quote: string;
  market?: TradingMarket;
  onClose: () => void;
  onTrade: (side: OrderSide) => void;
}) {
  const pairId = `${base}-${quote}`;
  const book = useAsync(() => getOrderbook(pairId), [pairId]);
  const tape = useAsync(() => getPairTrades(pairId), [pairId]);
  const [view, setView] = useState<'carnet' | 'trades'>('carnet');

  usePolling(() => {
    book.reload();
    tape.reload();
  }, 15000);

  const bids = book.data?.bids || [];
  const asks = book.data?.asks || [];
  const trades = tape.data?.trades || [];
  const oracle = book.data?.oracle_price ?? (market ? market.price : 0);
  const last = book.data?.last_price ?? null;
  const delta = last !== null && oracle > 0 ? ((last - oracle) / oracle) * 100 : null;

  const cumulate = (levels: OrderbookLevel[]): BookRowLevel[] => {
    let running = 0;
    return levels.map((level) => {
      running += level.amount;
      return { ...level, total: running };
    });
  };
  const bidRows = cumulate(bids);
  const askRows = cumulate(asks);
  const maxTotal = Math.max(
    0,
    ...bidRows.map((row) => row.total),
    ...askRows.map((row) => row.total),
  );
  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const spread = bestBid > 0 && bestAsk > 0 ? bestAsk - bestBid : 0;
  const mid = bestBid > 0 && bestAsk > 0 ? (bestAsk + bestBid) / 2 : 0;
  const pending = (!book.data && book.loading) || (!tape.data && tape.loading);

  const refresh = () => {
    book.reload();
    tape.reload();
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${base} / ${quote}`}
      subtitle="Carnet · transactions · oracle"
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button block variant="secondary" icon="arrowDownLeft" onClick={() => onTrade('sell')}>
            Vendre
          </Button>
          <Button block icon="arrowUpRight" onClick={() => onTrade('buy')}>
            Acheter
          </Button>
        </div>
      }
    >
      {pending ? (
        <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
          <Skeleton height={28} width="55%" />
          <Skeleton height={18} width="40%" />
          <Skeleton height={64} />
          <Skeleton height={120} />
        </Card>
      ) : book.error ? (
        <ErrorBlock message={book.error} onRetry={refresh} />
      ) : (
        <div className="v2-stack">
          <Card>
            <div className="v2-row-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div className="v2-muted" style={{ fontSize: 12 }}>
                  Prix oracle
                </div>
                <div
                  style={{
                    fontSize: 27,
                    fontWeight: 750,
                    letterSpacing: '-0.02em',
                    marginTop: 2,
                  }}
                >
                  {priceLabel(oracle)}{' '}
                  <span className="v2-muted" style={{ fontSize: 13, fontWeight: 600 }}>
                    {quote}
                  </span>
                </div>
                <div className="v2-muted" style={{ fontSize: 12 }}>
                  1 {base} en {quote}
                </div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <div className="v2-muted" style={{ fontSize: 12 }}>
                  Dernier
                </div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>
                  {last !== null ? priceLabel(last) : '—'}
                </div>
                {delta !== null && (
                  <span className="v2-badge" style={{ marginTop: 6 }}>
                    {pctLabel(delta)} vs oracle
                  </span>
                )}
              </div>
            </div>

            <div style={{ height: 10 }} />
            <div style={{ display: 'flex', gap: 16 }}>
              <Stat
                label="Volume 24 h"
                value={
                  market && market.trades_24h > 0
                    ? `${formatNumber(market.volume_24h, 2)}`
                    : '—'
                }
                hint={market && market.trades_24h > 0 ? quote : 'aucun échange'}
              />
              <Stat
                label="Trades 24 h"
                value={market ? market.trades_24h : '—'}
                hint="exécutions"
              />
              <Stat
                label="Dernier"
                value={last !== null ? priceLabel(last) : '—'}
                hint={`${quote} / ${base}`}
              />
            </div>
          </Card>

          <PairCandles base={base} quote={quote} trades={trades} />

          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'carnet', label: 'Carnet', icon: 'file' },
              { value: 'trades', label: 'Transactions', icon: 'receipt' },
            ]}
          />

          <div className="v2-row-between">
            <span className="v2-muted" style={{ fontSize: 11.5 }}>
              {view === 'carnet'
                ? `${bids.length + asks.length} niveau(x) ouvert(s)`
                : `${trades.length} transaction(s) — 50 max`}
            </span>
            <Button size="sm" variant="ghost" icon="refresh" onClick={refresh}>
              Actualiser
            </Button>
          </div>

          {view === 'carnet' ? (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              {bids.length === 0 && asks.length === 0 ? (
                <EmptyState
                  icon="receipt"
                  title="Carnet vide"
                  description="Aucun ordre limite ouvert sur cette paire."
                />
              ) : (
                <div style={{ padding: '10px 0' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 8,
                      padding: '0 10px 6px',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: 'var(--v2-ink-3)',
                    }}
                  >
                    <span>Prix ({quote})</span>
                    <span style={{ textAlign: 'right' }}>Taille ({base})</span>
                    <span style={{ textAlign: 'right' }}>Cumul</span>
                  </div>

                  {askRows.length === 0 && (
                    <div className="v2-muted" style={{ padding: '2px 10px', fontSize: 12 }}>
                      Aucun ordre limite vendeur.
                    </div>
                  )}
                  {[...askRows].reverse().map((level) => (
                    <BookRow
                      key={`ask-${level.price}`}
                      level={level}
                      side="ask"
                      max={maxTotal}
                    />
                  ))}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      padding: '7px 10px',
                      margin: '4px 8px',
                      borderRadius: 8,
                      background: 'var(--v2-surface-2)',
                      fontSize: 12.5,
                    }}
                  >
                    <span className="v2-muted">Spread</span>
                    <span style={{ fontWeight: 650 }}>
                      {spread > 0
                        ? `${priceLabel(spread)} ${quote} · ${formatNumber(
                            mid > 0 ? (spread / mid) * 100 : 0,
                            2,
                          )} %`
                        : 'Carnet incomplet'}
                    </span>
                  </div>

                  {bidRows.length === 0 && (
                    <div className="v2-muted" style={{ padding: '2px 10px', fontSize: 12 }}>
                      Aucun ordre limite acheteur.
                    </div>
                  )}
                  {bidRows.map((level) => (
                    <BookRow
                      key={`bid-${level.price}`}
                      level={level}
                      side="bid"
                      max={maxTotal}
                    />
                  ))}
                </div>
              )}
            </Card>
          ) : tape.error ? (
            <ErrorBlock message={tape.error} onRetry={tape.reload} />
          ) : trades.length === 0 ? (
            <Card>
              <EmptyState
                icon="receipt"
                title="Aucune transaction"
                description="Les exécutions apparaîtront ici."
              />
            </Card>
          ) : (
            <Card padded={false} style={{ overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr .8fr',
                  gap: 8,
                  padding: '9px 12px',
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: 'var(--v2-ink-3)',
                }}
              >
                <span>Prix ({quote})</span>
                <span style={{ textAlign: 'right' }}>Montant</span>
                <span style={{ textAlign: 'right' }}>Total</span>
                <span style={{ textAlign: 'right' }}>Heure</span>
              </div>
              {trades.map((trade: TradeRow, index) => (
                <div
                  key={`${trade.created_at}-${trade.price}-${index}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1fr 1fr .8fr',
                    gap: 8,
                    padding: '6px 12px',
                    fontSize: 12.5,
                    fontVariantNumeric: 'tabular-nums',
                    borderTop: '1px solid var(--v2-line)',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        trade.side === 'buy'
                          ? 'var(--v2-positive)'
                          : 'var(--v2-negative)',
                    }}
                  >
                    {priceLabel(trade.price)}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    {formatNumber(trade.amount, 4)}
                  </span>
                  <span style={{ textAlign: 'right' }}>
                    {formatNumber(trade.total, 2)}
                  </span>
                  <span className="v2-muted" style={{ textAlign: 'right' }}>
                    {timeLabel(trade.created_at)}
                  </span>
                </div>
              ))}
            </Card>
          )}

          <div className="v2-stack">
            <Hint icon="globe">Ordre marché : prix oracle</Hint>
            <Hint icon="clock">
              Ordre limite : fonds réservés, ouvert jusqu'à annulation
            </Hint>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ============================ Feuille : ordre ============================ */

function TradeSheet({
  open,
  onClose,
  base,
  quote,
  price,
  initialSide = 'buy',
  balances,
  onSwap,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  base: string;
  quote: string;
  price: number;
  initialSide?: OrderSide;
  balances: TradingBalance[];
  onSwap: () => void;
  onDone: () => void;
}) {
  const { uq, toast } = useSession();
  const [side, setSide] = useState<OrderSide>(initialSide);
  const [type, setType] = useState<OrderType>('market');
  const [amount, setAmount] = useState('');
  const [limit, setLimit] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const quantity = num(amount);
  const limitValue = num(limit);
  const unitPrice = type === 'limit' ? limitValue : price;
  const total = quantity * unitPrice;
  const held = (code: string) =>
    balances.find((entry) => entry.code.toUpperCase() === code.toUpperCase())?.balance || 0;
  const available = side === 'buy' ? held(quote) : held(base);
  const missingLimit = type === 'limit' && limitValue <= 0;
  const insufficient =
    quantity > 0 && (side === 'buy' ? total > available + 1e-9 : quantity > available + 1e-9);

  const applyPercent = (percent: number) => {
    const budget = (available * percent) / 100;
    const qty = side === 'buy' ? (unitPrice > 0 ? budget / unitPrice : 0) : budget;
    if (!Number.isFinite(qty) || qty <= 0) {
      setAmount('');
      return;
    }
    setAmount(inputNumber(qty, 6));
  };

  const submit = async (pin: string): Promise<string | void> => {
    if (quantity <= 0) return 'Saisis une quantité.';
    if (type === 'limit' && unitPrice <= 0) return 'Saisis un prix limite.';
    if (insufficient) {
      return `Solde ${side === 'buy' ? quote : base} insuffisant.`;
    }
    setBusy(true);
    try {
      await placeOrder({
        uq,
        pair: `${base}-${quote}`,
        side,
        type,
        amount: quantity,
        price: type === 'limit' ? unitPrice : undefined,
        pin,
      });
      setPinOpen(false);
      toast(
        type === 'market'
          ? `${side === 'buy' ? 'Achat' : 'Vente'} exécuté : ${formatNumber(quantity, 6)} ${base}`
          : 'Ordre limite placé, fonds immobilisés',
        'success',
      );
      setAmount('');
      setLimit('');
      onDone();
      onClose();
    } catch (error) {
      return describeError(error, 'Ordre refusé');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={`${base} / ${quote}`}
        subtitle={`1 ${base} = ${priceLabel(unitPrice || price)} ${quote}`}
        footer={
          <Button
            block
            icon="lock"
            disabled={quantity <= 0 || missingLimit || insufficient || busy}
            onClick={() => setPinOpen(true)}
          >
            Continuer avec le PIN
          </Button>
        }
      >
        <Segmented
          value={side}
          onChange={setSide}
          options={[
            { value: 'buy', label: `Acheter ${base}`, icon: 'arrowUpRight' },
            { value: 'sell', label: `Vendre ${base}`, icon: 'arrowDownLeft' },
          ]}
        />

        <div className="v2-row-between" style={{ marginTop: 10 }}>
          <span className="v2-muted" style={{ fontSize: 12.5 }}>
            {side === 'buy' ? `Tu paies en ${quote}` : `Tu reçois en ${quote}`}
          </span>
          <button
            className="v2-badge v2-badge--accent"
            style={{ cursor: 'pointer' }}
            onClick={onSwap}
          >
            <Icon name="swap" size={13} /> Inverser
          </button>
        </div>

        <div style={{ height: 10 }} />
        <Segmented
          value={type}
          onChange={(value) => {
            setType(value);
            if (value === 'limit' && !num(limit) && price > 0) {
              setLimit(inputNumber(price));
            }
          }}
          options={[
            { value: 'market', label: 'Au marché', icon: 'sparkles' },
            { value: 'limit', label: 'Limite', icon: 'edit' },
          ]}
        />

        <div style={{ height: 12 }} />
        <Field
          label={`Quantité (${base})`}
          hint={`Disponible : ${formatNumber(available, 6)} ${
            side === 'buy' ? quote : base
          }`}
          error={
            insufficient
              ? `Solde ${side === 'buy' ? quote : base} insuffisant`
              : undefined
          }
        >
          <Input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="0"
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, marginTop: -4, marginBottom: 10 }}>
          {[25, 50, 75, 100].map((percent) => (
            <Chip key={percent} onClick={() => applyPercent(percent)}>
              {percent} %
            </Chip>
          ))}
        </div>

        {type === 'limit' && (
          <Field
            label={`Prix limite (${quote} par ${base})`}
            hint={`Prix du marché : ${priceLabel(price)}${
              limitValue > 0 && price > 0
                ? ` · écart ${pctLabel(((limitValue - price) / price) * 100)}`
                : ''
            }`}
            error={missingLimit && quantity > 0 ? 'Saisis un prix limite.' : undefined}
          >
            <Input
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              inputMode="decimal"
              placeholder={priceLabel(price)}
            />
          </Field>
        )}

        <Card style={{ marginTop: 8 }}>
          <KeyValue label="Prix retenu" value={`${priceLabel(unitPrice)} ${quote}`} />
          <KeyValue
            label="Total"
            value={unitPrice > 0 ? `${formatNumber(total, 2)} ${quote}` : '—'}
          />
          {quantity > 0 && unitPrice > 0 && (
            <>
              <KeyValue
                label={`${quote} ${type === 'limit' ? 'après réservation' : 'après l’ordre'}`}
                value={formatNumber(
                  held(quote) + (side === 'buy' ? -total : total),
                  2,
                )}
              />
              <KeyValue
                label={`${base} ${type === 'limit' ? 'après réservation' : 'après l’ordre'}`}
                value={formatNumber(
                  held(base) + (side === 'buy' ? quantity : -quantity),
                  4,
                )}
              />
            </>
          )}
          <KeyValue
            label="Exécution"
            value={
              type === 'market'
                ? 'Immédiate (oracle)'
                : 'Ouvert — fonds réservés'
            }
          />
        </Card>
        <div className="v2-stack" style={{ marginTop: 8 }}>
          <Hint icon="globe">Marché : exécution immédiate au prix oracle</Hint>
          <Hint icon="clock">
            Limite : fonds réservés, l’ordre reste ouvert jusqu’à annulation
          </Hint>
        </div>
      </Sheet>

      <PinSheet
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        title="Confirmer l'ordre"
        subtitle={`${side === 'buy' ? 'Achat' : 'Vente'} de ${formatNumber(quantity, 6)} ${base}`}
        onSubmit={submit}
      />
    </>
  );
}

/* ============================ Feuille : annulation d'ordre ============================ */

function CancelOrderSheet({
  order,
  busy,
  onClose,
  onConfirm,
}: {
  order: TradingOrder | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const refund = order
    ? order.side === 'buy'
      ? order.amount * order.price
      : order.amount
    : 0;
  const refundCode = order ? (order.side === 'buy' ? order.quote : order.base) : '';

  return (
    <Sheet
      open={Boolean(order)}
      onClose={onClose}
      title="Annuler l'ordre"
      subtitle={
        order
          ? `${order.pair} · ${order.type === 'limit' ? 'Limite' : 'Marché'}`
          : undefined
      }
    >
      {order && (
        <div className="v2-stack">
          <Card>
            <KeyValue
              label="Sens"
              value={order.side === 'buy' ? 'Achat' : 'Vente'}
            />
            <KeyValue
              label="Quantité"
              value={`${formatNumber(order.amount, 4)} ${order.base}`}
            />
            <KeyValue label="Prix" value={`${priceLabel(order.price)} ${order.quote}`} />
            <KeyValue
              label="Fonds restitués"
              value={`${formatNumber(refund, 2)} ${refundCode}`}
            />
          </Card>
          <Hint icon="info">
            L’ordre sera fermé ; le montant réservé revient sur ton solde tradable.
          </Hint>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button block variant="ghost" icon="check" onClick={onClose} disabled={busy}>
              Garder
            </Button>
            <Button block variant="danger" icon="close" loading={busy} onClick={onConfirm}>
              Annuler l'ordre
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ============================ Feuille : prise P2P ============================ */

function TakeSheet({
  offer,
  currencies,
  rates,
  onClose,
  onDone,
  onProfile,
}: {
  offer: P2POffer | null;
  currencies: string[];
  rates: Record<string, number>;
  onClose: () => void;
  onDone: () => void;
  /** Ouvre la fiche publique du vendeur. */
  onProfile: (uq: string) => void;
}) {
  const { uq, toast } = useSession();
  const [amount, setAmount] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  /** Devise dans laquelle l'acheteur raisonne : BORB par défaut, ou la sienne. */
  const [payCurrency, setPayCurrency] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  /** Profil confirme du vendeur : on n'accepte pas une offre anonyme. */
  const [seller, setSeller] = useState<PublicPseudoResponse | null>(null);

  useEffect(() => {
    setSeller(null);
    setPayOpen(false);
    setPayCurrency('');
    const pseudo = String(offer?.pseudo || '').trim().replace(/^@/, '');
    if (!pseudo) return;
    let cancelled = false;
    lookupPublicPseudo(pseudo)
      .then((found) => {
        if (!cancelled && found?.existe) setSeller(found);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [offer?.id, offer?.pseudo]);

  const quantity = num(amount);
  /**
   * Offres récentes : la saisie est une quantité de BORB, ou un montant dans
   * la devise que choisit l'acheteur — le backend convertit via l'USD et le
   * taux de l'offre. Offres héritées (unité devise) : l'ancienne saisie en
   * devise du vendeur reste servie.
   */
  const borbMode = offer?.amount_unit === 'BORB';
  const enMaDevise = borbMode && payOpen;
  /** Unités de devise par USD, comme les lit le backend ; USD = base 1. */
  const parUsd = (code: string) =>
    code.toUpperCase() === 'USD' ? 1 : Number(rates[code]) || 0;
  const parSaisie = enMaDevise ? parUsd(payCurrency) : 0;
  const parOffre = offer ? parUsd(offer.currency) : 0;
  const borbDevises =
    enMaDevise && parSaisie > 0 && parOffre > 0 && (offer?.rate ?? 0) > 0
      ? (quantity / parSaisie) * parOffre
      : 0;
  const borb = borbMode
    ? enMaDevise
      ? borbDevises / (offer?.rate ?? 1)
      : quantity
    : offer && offer.rate > 0
      ? quantity / offer.rate
      : 0;
  const aPayer = borb * (offer?.rate ?? 0);
  /** Unités de la devise de l'acheteur pour 1 BORB : taux de l'offre ponté par l'USD. */
  const parBorb =
    enMaDevise && parOffre > 0 ? (offer?.rate ?? 0) * (parSaisie / parOffre) : 0;
  const restant = borbMode
    ? offer
      ? (offer.remaining_borb ?? offer.max_borb ?? offer.max_amount / (offer.rate || 1))
      : 0
    : offer
      ? (offer.remaining ?? offer.max_amount)
      : 0;
  const borneMini = borbMode ? (offer?.min_borb ?? 0) : (offer?.min_amount ?? 0);
  const borneMaxi = borbMode
    ? Math.min(offer?.max_borb ?? 0, restant)
    : Math.min(offer?.max_amount ?? 0, restant);
  /** Le pseudo saisi doit avoir ete confirme par son profil public. */
  const sellerReady = !String(offer?.pseudo || '').trim() || Boolean(seller?.existe);
  const saisieValide =
    quantity > 0 &&
    borb > 0 &&
    borb >= borneMini - 1e-9 &&
    borb <= borneMaxi + 1e-9 &&
    borb <= restant + 1e-9 &&
    (!enMaDevise || payCurrency.trim() !== '');

  const submit = async (pin: string): Promise<string | void> => {
    if (!offer) return 'Offre indisponible.';
    if (quantity <= 0) {
      return borbMode ? 'Saisis une quantité de BORB.' : 'Saisis un montant.';
    }
    try {
      const response = await takeP2POffer(
        offer.id,
        borbMode
          ? enMaDevise
            ? { uq, amount: quantity, pay_currency: payCurrency.trim().toUpperCase(), pin }
            : { uq, borb_amount: quantity, pin }
          : { uq, amount: quantity, pin },
      );
      setPinOpen(false);
      const livre = formatNumber(response.order.borb_amount ?? borb, 2);
      const paye = formatNumber(response.order.amount ?? aPayer, 2);
      const nom = response.order.seller_display || String(offer.pseudo || 'le vendeur');
      toast(
        `Commande ouverte. Paie ${paye} ${offer.currency} à ${nom} au ${response.seller_phone} : ${livre} BORB sont réservés.`,
        'success',
      );
      setAmount('');
      setPayOpen(false);
      setPayCurrency('');
      onDone();
      onClose();
    } catch (error) {
      return describeError(error, 'Commande refusée');
    }
  };

  return (
    <>
      <Sheet
        open={Boolean(offer)}
        onClose={onClose}
        title={offer ? `${offer.side === 'sell' ? 'Offre de vente' : 'Offre d’achat'} · ${offer.currency}` : 'Offre'}
        subtitle={
          offer
            ? offer.rate_base
              ? `1 ${offer.rate_base} = ${priceLabel(offer.rate)} ${offer.currency}`
              : `${priceLabel(offer.rate)} ${offer.currency} par unité · taux hérité, offre à recréer en BORB`
            : undefined
        }
        footer={
          offer ? (
            <Button
              block
              icon="lock"
              disabled={!saisieValide || !sellerReady}
              onClick={() => setPinOpen(true)}
            >
              Prendre et ouvrir le canal
            </Button>
          ) : undefined
        }
      >
        {offer && (
          <>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => onProfile(offer.uq || String(offer.pseudo || ''))}
                  disabled={!offer.uq}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                    background: 'none',
                    border: 0,
                    padding: 0,
                    color: 'inherit',
                    cursor: offer.uq ? 'pointer' : 'default',
                  }}
                >
                  <Avatar
                    label={String(seller?.pseudo || offer.pseudo || 'Vendeur')}
                    src={seller?.avatar_url}
                    size={44}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 750, fontSize: 14 }}>
                      {String(seller?.pseudo || offer.pseudo || 'Vendeur')}
                    </div>
                    <div className="v2-muted" style={{ fontSize: 12 }}>
                      {String(seller?.name || 'Vendeur P2P')}
                    </div>
                  </div>
                </button>
                {seller?.existe && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--v2-positive)',
                      fontSize: 11.5,
                      fontWeight: 700,
                    }}
                  >
                    <Icon name="check" size={13} />
                    Profil confirmé
                  </span>
                )}
              </div>
              <div style={{ height: 8 }} />
              <KeyValue label="Opérateur" value={offer.operator || '—'} />
              <KeyValue label="Ville" value={offer.city || '—'} />
              <KeyValue label="Numéro (masqué)" value={offer.phone} />
              <KeyValue
                label="Bornes"
                value={`${formatNumber(borneMini, 2)} – ${formatNumber(borneMaxi, 2)} ${borbMode ? 'BORB' : offer.currency}`}
              />
              <KeyValue
                label="Encore disponible"
                value={
                  borbMode
                    ? `${formatNumber(restant, 2)} BORB`
                    : `${formatNumber(restant, 2)} ${offer.currency}`
                }
              />
            </Card>

            <div style={{ height: 10 }} />

            {borbMode && (
              <Segmented
                value={enMaDevise ? 'devise' : 'borb'}
                onChange={(value) => setPayOpen(value === 'devise')}
                options={[
                  { value: 'borb', label: 'En BORB' },
                  { value: 'devise', label: 'Dans ma devise' },
                ]}
              />
            )}

            {enMaDevise && (
              <Field
                label="Devise de calcul"
                hint={
                  parBorb > 0
                    ? `1 BORB ≈ ${priceLabel(parBorb)} ${payCurrency} au taux du jour et de l'offre`
                    : `Choisis une devise connue de l'oracle (USD, EUR, CDF…).`
                }
              >
                <Input
                  list="uq-p2p-pay-currencies"
                  value={payCurrency}
                  onChange={(event) => setPayCurrency(event.target.value.toUpperCase())}
                  placeholder={offer.currency}
                />
                <datalist id="uq-p2p-pay-currencies">
                  {currencies.map((code) => (
                    <option key={code} value={code} />
                  ))}
                </datalist>
              </Field>
            )}

            <Field
              label={
                borbMode
                  ? enMaDevise
                    ? `Montant que tu paies (${payCurrency || 'devise'})`
                    : 'Quantité de BORB à recevoir'
                  : `Montant à payer (${offer.currency})`
              }
              hint={
                borbMode && enMaDevise
                  ? parBorb > 0
                    ? `entre ${formatNumber(borneMini * parBorb, 2)} et ${formatNumber(borneMaxi * parBorb, 2)} ${payCurrency}`
                    : `entre ${formatNumber(borneMini, 2)} et ${formatNumber(borneMaxi, 2)} BORB — choisis une devise cotée`
                  : `entre ${formatNumber(borneMini, 2)} et ${formatNumber(borneMaxi, 2)} ${borbMode ? 'BORB' : offer.currency}`
              }
            >
              <Input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                placeholder={
                  borbMode && enMaDevise && parBorb > 0
                    ? formatNumber(borneMini * parBorb, 0)
                    : formatNumber(borneMini, 0)
                }
              />
            </Field>

            {borbMode && borb > 0 && (
              <Card>
                <KeyValue
                  label={enMaDevise ? 'Tu recevras' : 'Tu paieras'}
                  value={
                    enMaDevise
                      ? `≈ ${formatNumber(borb, 2)} BORB`
                      : `${formatNumber(aPayer, 2)} ${offer.currency}`
                  }
                />
                {enMaDevise && (
                  <>
                    <div style={{ height: 6 }} />
                    <KeyValue
                      label="Tu paieras"
                      value={`${formatNumber(aPayer, 2)} ${offer.currency}`}
                    />
                  </>
                )}
                <div className="v2-muted" style={{ fontSize: 12, marginTop: 6 }}>
                  Au taux du vendeur : {priceLabel(offer.rate)} {offer.currency} pour 1 BORB
                  (base 1 BORB = 1 USD). Le paiement se fait hors plateforme, sur son numéro
                  mobile money.
                </div>
              </Card>
            )}

            <div className="v2-muted" style={{ fontSize: 12 }}>
              {formatNumber(borb, 2)} BORB au vendeur sont immobilisés dès que tu acceptes, et
              entrent dans ton coffre quand il confirme ta réception. Ces BORB sont vendables en
              Trading et convertibles en devise virtuelle pour être transférés — ils ne partent
              pas directement vers un autre compte. Un canal privé s'ouvre dans le chat UQ.
            </div>
          </>
        )}
      </Sheet>

      <PinSheet
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        title="Confirmer la commande P2P"
        subtitle={
          offer
            ? borbMode
              ? enMaDevise
                ? `${formatNumber(quantity, 2)} ${payCurrency} · tu recevras ≈ ${formatNumber(borb, 2)} BORB et paieras ${formatNumber(aPayer, 2)} ${offer.currency}`
                : `${formatNumber(quantity, 2)} BORB · tu paieras ${formatNumber(aPayer, 2)} ${offer.currency}`
              : `${formatNumber(quantity, 2)} ${offer.currency}`
            : undefined
        }
        onSubmit={submit}
      />
    </>
  );
}

/* ============================ Feuille : publier une offre ============================ */

function PublishSheet({
  open,
  onClose,
  currencies,
  rates,
  borbUsd,
  phone,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  currencies: string[];
  rates: Record<string, number>;
  /** Prix interne d'1 BORB en USD, publié par l'oracle : sert de référence au taux. */
  borbUsd: number;
  phone: string;
  onDone: () => void;
}) {
  const { uq, toast } = useSession();
  const [side, setSide] = useState<OrderSide>('sell');
  // Le vendeur encaisse par défaut en USD ; il peut choisir sa devise locale.
  const [currency, setCurrency] = useState('USD');
  const [rate, setRate] = useState('');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [operator, setOperator] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);

  const isUsd = currency.toUpperCase() === 'USD';
  /**
   * Base du marché P2P : 1 BORB = 1 USD. Le vendeur ajuste seulement son taux
   * local « 1 USD = X devise », qui devient mécaniquement le X devise pour 1
   * BORB affiché à l'acheteur.
   */
  const tauxRetenu = isUsd ? 1 : num(rate);

  /** Référence du jour « 1 BORB = X devise » : prix du BORB en USD × unités de devise par USD. */
  const parUsd = Number(rates[currency]) || 0;
  const reference = borbUsd > 0 && parUsd > 0 ? borbUsd * parUsd : 0;
  const suggestion = isUsd ? '1' : parUsd > 0 ? priceLabel(parUsd) : '';
  const learningRevision = useLearningRevision();
  const observedRate = useMemo(
    () => suggestRate(currency),
    // `learningRevision` relit le modele apres un apprentissage.
    [currency, learningRevision],
  );
  const showObserved =
    !isUsd &&
    observedRate !== null &&
    (reference <= 0 || Math.abs(observedRate - reference) / reference > 0.005);

  const tauxPreview = tauxRetenu > 0 ? tauxRetenu : reference;
  const ecartPct =
    reference > 0 && tauxRetenu > 0 ? ((tauxRetenu - reference) / reference) * 100 : null;

  const submit = async () => {
    const rateValue = tauxRetenu || reference || 0;
    const minValue = num(minimum);
    const maxValue = num(maximum);
    if (!rateValue) {
      toast(`Renseigne ton taux local : combien de ${currency} pour 1 USD ?`, 'error');
      return;
    }
    if (!minValue || maxValue < minValue) {
      toast('Bornes invalides : saisis les quantités de BORB en vente', 'error');
      return;
    }
    setBusy(true);
    try {
      const created = await createP2POffer({
        uq,
        side,
        currency: currency.trim() || 'USD',
        rate: rateValue,
        min_borb: minValue,
        max_borb: maxValue,
        operator: operator.trim() || undefined,
        city: city.trim() || undefined,
      });
      if (created?.offer) ingestOffers([created.offer]);
      toast('Offre publiée', 'success');
      // Signal sur le taux : informatif, l'offre reste en vente quoi qu'il en soit.
      if (created?.offer?.rate_signal?.niveau === 'attention') {
        toast(created.offer.rate_signal.message, 'default');
      }
      setRate('');
      setMinimum('');
      setMaximum('');
      onDone();
      onClose();
    } catch (error) {
      toast(describeError(error, 'Publication impossible'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Publier une offre P2P"
      subtitle={`Mobile money · ${phone}`}
      footer={
        <Button block icon="send" loading={busy} onClick={submit}>
          Publier l'offre
        </Button>
      }
    >
      <Segmented
        value={side}
        onChange={setSide}
        options={[
          { value: 'sell', label: 'Je vends', icon: 'arrowDownLeft' },
          { value: 'buy', label: 'J’achète', icon: 'arrowUpRight' },
        ]}
      />

      <div style={{ height: 12 }} />
      <div className="v2-muted" style={{ fontSize: 12.5, marginBottom: 4 }}>
        Base du marché : <b>1 BORB = 1 USD</b>. Tu encaisses en USD par défaut, ou dans la
        devise de ton choix en fixant ton taux local.
      </div>
      <Field label="Devise d'encaissement" hint="Par défaut USD ; choisis ta devise locale pour encaisser en monnaie mobile money.">
        <Input
          list="uq-p2p-currencies"
          value={currency}
          onChange={(event) => setCurrency(event.target.value.toUpperCase())}
          placeholder="USD"
        />
        <datalist id="uq-p2p-currencies">
          {currencies.map((code) => (
            <option key={code} value={code} />
          ))}
        </datalist>
      </Field>

      {isUsd ? (
        <KeyValue label="Taux" value="1 BORB = 1 USD (base du marché)" />
      ) : (
        <Field
          label={`Taux local (1 USD = ? ${currency})`}
          hint={
            parUsd > 0
              ? `Oracle du jour : 1 USD ≈ ${priceLabel(parUsd)} ${currency} · donc 1 BORB = ${priceLabel(tauxRetenu || parUsd)} ${currency}`
              : `Référence indisponible pour ${currency} : c'est toi qui fixes ton taux local.`
          }
        >
          <Input
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            inputMode="decimal"
            placeholder={suggestion}
          />
        </Field>
      )}
      {ecartPct !== null && (
        <div className="v2-muted" style={{ fontSize: 12.5, marginTop: -4 }}>
          {ecartPct > 0 ? '+' : '−'}
          {formatNumber(Math.abs(ecartPct), 1)} % par rapport à la référence —
          {Math.abs(ecartPct) <= 0.5
            ? ' ton taux suit le marché.'
            : ecartPct > 0
              ? ' les acheteurs verront une offre chère, tu restes libre de la publier.'
              : ' tu vends moins cher que le marché, tu restes libre de le faire.'}
        </div>
      )}
      {showObserved && observedRate !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: -4 }}>
          <div className="v2-muted" style={{ fontSize: 12.5, flex: 1 }}>
            <span style={{ fontWeight: 650 }}>Taux observé : </span>
            {priceLabel(observedRate)} {currency}
          </div>
          <Button size="sm" variant="secondary" icon="edit" onClick={() => setRate(inputNumber(observedRate, 2))}>
            Utiliser
          </Button>
        </div>
      )}

      <Field
        label="Quantité minimum (BORB)"
        hint={
          tauxPreview > 0 && num(minimum) > 0
            ? `Le plus petit achat accepté : ≈ ${formatNumber(num(minimum) * tauxPreview, 2)} ${currency} payés`
            : undefined
        }
      >
        <Input value={minimum} onChange={(event) => setMinimum(event.target.value)} inputMode="decimal" placeholder="0" />
      </Field>
      <Field
        label="Quantité maximum (BORB)"
        hint={
          tauxPreview > 0 && num(maximum) > 0
            ? `Total en vente sur l'offre : ≈ ${formatNumber(num(maximum) * tauxPreview, 2)} ${currency} encaissés`
            : undefined
        }
      >
        <Input value={maximum} onChange={(event) => setMaximum(event.target.value)} inputMode="decimal" placeholder="0" />
      </Field>
      <Field label="Opérateur mobile money" hint="Laisse vide pour reprendre celui du profil.">
        <Input value={operator} onChange={(event) => setOperator(event.target.value)} placeholder="M-Pesa, Orange Money…" />
      </Field>
      <Field label="Ville">
        <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Kinshasa" />
      </Field>
    </Sheet>
  );
}

/* ============================ Feuille : notifications ============================ */

function NotificationsSheet({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (scope: string) => void;
}) {
  const notifications = useNotifications();
  const [filtre, setFiltre] = useState<string>('tout');

  // Une catégorie n'est proposée que si le flux en contient vraiment :
  // aucun onglet mort, aucune étiquette inventée.
  const categories = useMemo(() => {
    const vues: string[] = [];
    for (const entry of notifications.items) {
      if (!vues.includes(entry.scope)) vues.push(entry.scope);
    }
    return vues;
  }, [notifications.items]);

  // Une catégorie filtrée peut disparaître entre deux relevés : le filtre
  // retombe sur « Tout » au lieu de laisser une liste vide à l'écran.
  const actif = filtre !== 'tout' && categories.includes(filtre) ? filtre : 'tout';

  const visibles = useMemo(
    () =>
      actif === 'tout'
        ? notifications.items
        : notifications.items.filter((entry) => entry.scope === actif),
    [notifications.items, actif],
  );

  const libelle = (scope: string) => SCOPES[scope]?.label || scope;
  const nonLues = visibles.reduce((total, entry) => (entry.read ? total : total + 1), 0);
  // Les signaux d'état s'acquittent par référence, les événements par identifiant.
  const references = visibles
    .filter((entry) => entry.reference)
    .map((entry) => entry.reference);

  // Le flux arrive déjà ordonné par le backend : tête épinglée, puis un bloc
  // par catégorie. Le rendu suit cet ordre, il n'en réinvente aucun.
  const tete = visibles.filter((entry) => entry.en_cours);
  const groupes = useMemo(() => {
    const blocs: { scope: string; entries: ScreenNotification[] }[] = [];
    for (const entry of visibles) {
      if (entry.en_cours) continue;
      const courant = blocs[blocs.length - 1];
      if (courant && courant.scope === entry.scope) courant.entries.push(entry);
      else blocs.push({ scope: entry.scope, entries: [entry] });
    }
    return blocs;
  }, [visibles]);

  const ligne = (entry: ScreenNotification) => {
    const scope = SCOPES[entry.scope] || { label: entry.scope, icon: 'info' as IconName };
    // Les événements stockés portent leur heure ; les signaux d'état
    // n'ont pas d'instant, ils décrivent la situation actuelle.
    const horodatage =
      entry.id > 0
        ? `${relativeDay(entry.created_at)} · ${formatTime(entry.created_at)}`
        : 'Signal actuel';
    return (
      <button
        key={`${entry.scope}-${entry.id}-${entry.reference}`}
        className="v2-row"
        onClick={() => {
          notifications.markRead(
            entry.id > 0 ? { ids: [entry.id] } : { references: [entry.reference] },
          );
          onNavigate(entry.scope);
        }}
        style={{ opacity: entry.read ? 0.6 : 1 }}
      >
        <span className="v2-badge" style={{ gap: 4 }}>
          <Icon name={scope.icon} size={14} /> {scope.label}
        </span>
        <div className="v2-row-main">
          <div className="v2-row-title">{entry.title}</div>
          <div className="v2-row-sub">{entry.body}</div>
        </div>
        <span className="v2-row-stamp">{horodatage}</span>
        {!entry.read && <span className="v2-dot" />}
      </button>
    );
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Notifications"
      subtitle={
        actif === 'tout'
          ? `${notifications.total} non lue(s)${
              notifications.totalEnCours ? ` · ${notifications.totalEnCours} en cours` : ''
            }`
          : `${libelle(actif)} · ${nonLues} non lue(s)`
      }
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            variant="secondary"
            block
            icon="bell"
            onClick={notifications.toggleSound}
          >
            {notifications.soundEnabled ? 'Son activé' : 'Son coupé'}
          </Button>
          <Button
            block
            icon="check"
            onClick={() =>
              notifications.markRead(
                actif === 'tout'
                  ? { all: true, references }
                  : { scope: actif, references },
              )
            }
          >
            {actif === 'tout' ? 'Tout lire' : `Tout lire · ${libelle(actif)}`}
          </Button>
        </div>
      }
    >
      {categories.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Chip active={actif === 'tout'} onClick={() => setFiltre('tout')}>
            Tout
            {notifications.total > 0 && (
              <span className="v2-chip-count">
                {notifications.total > 9 ? '9+' : notifications.total}
              </span>
            )}
          </Chip>
          {categories.map((scope) => {
            const reste = notifications.counts[scope] || 0;
            return (
              <Chip key={scope} active={actif === scope} onClick={() => setFiltre(scope)}>
                <Icon name={SCOPES[scope]?.icon || ('info' as IconName)} size={14} />
                {libelle(scope)}
                {reste > 0 && (
                  <span className="v2-chip-count">{reste > 9 ? '9+' : reste}</span>
                )}
              </Chip>
            );
          })}
        </div>
      )}

      {notifications.items.length === 0 ? (
        <EmptyState
          icon="bell"
          title="Aucune notification"
          description="Aucune alerte active."
        />
      ) : (
        <>
          {tete.length > 0 && (
            <div className="v2-notif-pinned">
              <div className="v2-notif-group">
                <Icon name="clock" size={13} /> En cours
                <span className="v2-notif-count">{tete.length}</span>
              </div>
              <div className="v2-list">{tete.map(ligne)}</div>
            </div>
          )}
          {groupes.map((groupe) => {
            const reste = groupe.entries.reduce(
              (total, entry) => (entry.read ? total : total + 1),
              0,
            );
            return (
              <div key={groupe.scope}>
                {actif === 'tout' && (
                  <div className="v2-notif-group">
                    <Icon
                      name={SCOPES[groupe.scope]?.icon || ('info' as IconName)}
                      size={13}
                    />
                    {libelle(groupe.scope)}
                    {reste > 0 && <span className="v2-notif-count">{reste}</span>}
                  </div>
                )}
                <div className="v2-list">{groupe.entries.map(ligne)}</div>
              </div>
            );
          })}
        </>
      )}
    </Sheet>
  );
}

/* ============================ Ecran ============================ */

export function TradingScreen({
  onOpenWallet,
  onOpenProfile,
  onOpenChat,
  onOpenFeed,
  onMessage,
  onBack,
}: {
  onOpenItem?: unknown;
  onOpenWallet?: () => void;
  onOpenProfile?: () => void;
  onOpenChat?: () => void;
  onOpenFeed?: () => void;
  /** Ouvrir la discussion avec un pseudo (profil public d'un membre publié). */
  onMessage?: (pseudo: string) => void;
  onBack?: () => void;
}) {
  const { uq, toast } = useSession();
  const notifications = useNotifications();

  const [tab, setTab] = useState<TradingTab>('marche');
  const [uqMarketExpanded, setUqMarketExpanded] = useState(false);
  const [uqMarketsFullPage, setUqMarketsFullPage] = useState(false);
  const [marketsFullPage, setMarketsFullPage] = useState(false);
  const [p2pView, setP2pView] = useState<P2PView>('offres');
  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [pairSheet, setPairSheet] = useState<{ base: string; quote: string } | null>(null);
  const [tradePair, setTradePair] = useState<{
    base: string;
    quote: string;
    side?: OrderSide;
  } | null>(null);
  const [takeTarget, setTakeTarget] = useState<P2POffer | null>(null);
  /** Fiche publique d'un membre : offre P2P ou commande en cours. */
  const [profilMembre, setProfilMembre] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites(uq));
  const [marketSort, setMarketSort] = useState<MarketSort>('volume');
  const [favOnly, setFavOnly] = useState(false);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [cancelTarget, setCancelTarget] = useState<TradingOrder | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [p2pSide, setP2pSide] = useState<'all' | OrderSide>('all');
  const [p2pCurrency, setP2pCurrency] = useState('');
  const [p2pSort, setP2pSort] = useState<P2PSort>('recent');
  const [p2pOrderFilter, setP2pOrderFilter] = useState<P2POrderFilter>('all');
  const help = useHelp();

  useEffect(() => {
    setFavorites(readFavorites(uq));
  }, [uq]);

  const context = useAsync(() => getTradingContext(uq), [uq]);
  usePolling(() => context.reload(), 15_000, tab === 'marche');
  const markets = useAsync(() => getTradingMarkets(), []);
  const orders = useAsync(() => getTradingOrders(uq), [uq]);
  const offers = useAsync(() => getP2POffers(uq), [uq]);
  const p2pOrders = useAsync(() => getP2POrders(uq), [uq]);

  const reloadAll = () => {
    context.reload();
    markets.reload();
    orders.reload();
    offers.reload();
    p2pOrders.reload();
    notifications.refresh();
  };

  const balances = context.data?.balances || [];
  const displayCurrency = (context.data?.profile.display_currency || 'USD').toUpperCase();
  const phone = context.data?.profile.phone || '';
  const phoneReady = Boolean(context.data?.phone_ready);

  const balanceOf = (code: string) =>
    balances.find((entry) => entry.code.toUpperCase() === code.toUpperCase())?.balance || 0;

  /** Unites de devise pour 1 USD, lues sur les paires USD-XXX de l'oracle. */
  const rates = useMemo(() => {
    const map: Record<string, number> = { USD: 1 };
    (markets.data?.markets || []).forEach((market) => {
      map[market.quote.toUpperCase()] = market.price;
    });
    return map;
  }, [markets.data]);

  const pairPrice = (base: string, quote: string): number => {
    const baseRate = rates[base.toUpperCase()] || 0;
    const quoteRate = rates[quote.toUpperCase()] || 0;
    if (!baseRate || !quoteRate) return 0;
    return quoteRate / baseRate;
  };

  const toggleFavorite = (pair: string) => {
    setFavorites((current) => {
      const next = current.includes(pair)
        ? current.filter((entry) => entry !== pair)
        : [...current, pair];
      try {
        window.localStorage.setItem(favoritesKey(uq), JSON.stringify(next));
      } catch {
        // Stockage local indisponible : les favoris restent valables pour la session.
      }
      return next;
    });
  };

  const marketList = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const list = (markets.data?.markets || [])
      .filter(
        (market) =>
          !lowered ||
          market.pair.toLowerCase().includes(lowered) ||
          market.quote.toLowerCase().includes(lowered),
      )
      .filter((market) => !favOnly || favorites.includes(market.pair));
    return list.sort((a, b) => {
      const aFavorite = favorites.includes(a.pair) ? 1 : 0;
      const bFavorite = favorites.includes(b.pair) ? 1 : 0;
      if (aFavorite !== bFavorite) return bFavorite - aFavorite;
      if (marketSort === 'volume') return b.volume_24h - a.volume_24h;
      if (marketSort === 'trades') return b.trades_24h - a.trades_24h;
      return a.pair.localeCompare(b.pair);
    });
  }, [markets.data, query, favorites, favOnly, marketSort]);

  const uqChartMarkets = useMemo(
    () =>
      uqMarketExpanded || uqMarketsFullPage
        ? marketList.slice(0, uqMarketsFullPage ? marketList.length : 4)
        : [],
    [marketList, uqMarketExpanded, uqMarketsFullPage],
  );
  const uqChartMarketKey = uqChartMarkets.map((market) => market.pair).join(',');
  const uqTradeCharts = useAsync(
    async () =>
      Promise.all(
        uqChartMarkets.map(async (market) => {
          try {
            const result = await getPairTrades(market.pair);
            return { pair: market.pair, trades: result.trades || [], error: null };
          } catch (error) {
            return {
              pair: market.pair,
              trades: [] as TradeRow[],
              error: describeError(error, 'Historique des transactions indisponible.'),
            };
          }
        }),
      ),
    [uqChartMarketKey],
    {
      enabled:
        tab === 'marche' &&
        !marketsFullPage &&
        uqMarketExpanded &&
        uqChartMarkets.length > 0,
    },
  );
  usePolling(
    () => uqTradeCharts.reload(),
    20_000,
    tab === 'marche' &&
      !marketsFullPage &&
      uqMarketExpanded &&
      uqChartMarkets.length > 0,
  );

  /** Paire proposée par les raccourcis : devise d'affichage si elle est cotée. */
  const defaultPair = useMemo(() => {
    const list = markets.data?.markets || [];
    if (list.length === 0) return null;
    const preferred = list.find((market) => market.quote === displayCurrency);
    const market = preferred || list[0];
    return { base: market.base, quote: market.quote };
  }, [markets.data, displayCurrency]);

  const portfolioUsd = balances.reduce((sum, entry) => sum + (Number(entry.usd_value) || 0), 0);
  const portfolioDisplay = portfolioUsd * (rates[displayCurrency] || 0);

  const currencyOptions = useMemo(() => {
    const codes = new Set<string>();
    Object.keys(rates).forEach((code) => {
      if (code !== 'USD' && code !== 'BORB' && code !== 'BORB') codes.add(code);
    });
    balances.forEach((entry) => codes.add(entry.code.toUpperCase()));
    if (displayCurrency) codes.add(displayCurrency);
    return Array.from(codes).sort();
  }, [rates, balances, displayCurrency]);

  const openCount = orders.data?.open_count || 0;
  const allP2POrders = p2pOrders.data?.orders || [];
  const activeP2P = allP2POrders.filter(
    (order) => order.status === 'pending_payment' || order.status === 'paid',
  ).length;
  const doneP2P = allP2POrders.length - activeP2P;

  const orderCounts = useMemo(() => {
    const list = orders.data?.orders || [];
    return {
      all: list.length,
      open: list.filter((order) => order.status === 'open').length,
      filled: list.filter((order) => order.status === 'filled').length,
      cancelled: list.filter((order) => order.status === 'cancelled').length,
    };
  }, [orders.data]);

  const orderList = useMemo(() => {
    const list = orders.data?.orders || [];
    if (orderFilter === 'all') return list;
    return list.filter((order) => order.status === orderFilter);
  }, [orders.data, orderFilter]);

  const allOffers = offers.data?.offers || [];
  const offerCurrencies = useMemo(() => {
    const codes = new Set<string>();
    allOffers.forEach((offer) => codes.add(offer.currency.toUpperCase()));
    return Array.from(codes).sort();
  }, [offers.data]);

  const offerList = useMemo(() => {
    const list = allOffers.filter(
      (offer) =>
        (p2pSide === 'all' || offer.side === p2pSide) &&
        (!p2pCurrency || offer.currency.toUpperCase() === p2pCurrency),
    );
    if (p2pSort === 'recent') return list.sort((a, b) => b.created_at - a.created_at);
    if (p2pSort === 'rate-asc') return list.sort((a, b) => a.rate - b.rate);
    return list.sort((a, b) => b.rate - a.rate);
  }, [offers.data, p2pSide, p2pCurrency, p2pSort]);

  const p2pOrderList = useMemo(() => {
    if (p2pOrderFilter === 'all') return allP2POrders;
    const active = p2pOrderFilter === 'active';
    return allP2POrders.filter((order) =>
      active
        ? order.status === 'pending_payment' || order.status === 'paid'
        : order.status === 'completed' || order.status === 'cancelled',
    );
  }, [p2pOrders.data, p2pOrderFilter]);

  // Les commandes P2P ne portent que l'UQ du vis-a-vis : on affiche son pseudo.
  const peerIdentities = useIdentities(p2pOrderList.map((order) => order.peer || ''));
  const peerLabel = (peer?: string) => {
    const key = String(peer || '').toUpperCase();
    return identityPseudo(String(peer || ''), peerIdentities[key]) || 'Membre UQ';
  };

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast('Numéro copié', 'success');
    } catch {
      toast('Copie impossible sur cet appareil', 'error');
    }
  };

  const handleP2PAction = async (order: P2POrder, action: 'cancel') => {
    try {
      // Une annulation apres le paiement annonce est un litige : le moteur
      // apprend que les preuves jointes n'ont pas convaincu.
      await cancelP2POrder(order.id, uq, order.status === 'paid');
      toast(
        `${formatNumber(order.borb_amount ?? 0, 2)} BORB débloqués, commande annulée`,
        'success',
      );
      reloadAll();
    } catch (error) {
      toast(describeError(error, 'Action impossible'), 'error');
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancelTarget) return;
    setCancelBusy(true);
    try {
      await cancelOrder(cancelTarget.id, uq);
      toast('Ordre annulé, fonds restitués', 'success');
      setCancelTarget(null);
      reloadAll();
    } catch (error) {
      toast(describeError(error, 'Annulation impossible'), 'error');
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <>
      {!marketsFullPage && !uqMarketsFullPage && (
        <ScreenHeader
          title="Trading"
          subtitle="Devises · Ordres · P2P mobile"
          onBack={onBack}
          right={
            <>
              <IconButton name="info" label="Guide du trading" onClick={() => help.openHelp('trading')} />
              <IconButton
                name="bell"
                label="Notifications"
                badge={notifications.total > 0}
                onClick={() => setNotifOpen(true)}
              />
              {onOpenWallet && (
                <IconButton name="wallet" label="Ouvrir le coffre" onClick={onOpenWallet} />
              )}
              <IconButton name="refresh" label="Actualiser" onClick={reloadAll} />
            </>
          }
        />
      )}

      <div
        className="v2-pad"
        style={{ display: marketsFullPage || uqMarketsFullPage ? 'none' : undefined }}
      >
        <div className="v2-hero v2-trading-hero">
          <div className="v2-row-between" style={{ alignItems: 'flex-start' }}>
            <span className="v2-hero-label">Portefeuille tradable</span>
            <span className="v2-hero-pill" style={{ color: '#fff' }}>
              <Icon name={markets.data?.hors_ligne ? 'alert' : 'trendUp'} size={13} />{' '}
              {markets.data?.badge || markets.data?.source || 'Source des taux non publiee'}
            </span>
          </div>
          <div className="v2-hero-amount">
            {context.loading ? (
              '—'
            ) : balances.length === 0 ? (
              <span className="v2-hero-empty">Aucun solde converti</span>
            ) : (
              <>
                <span className="v2-hero-number">{formatNumber(portfolioDisplay, 2)}</span>
                <span className="v2-hero-unit">{displayCurrency}</span>
              </>
            )}
          </div>
          {/* Grand symbole en filigrane : repère visuel de l'écran. */}
          <span className="v2-hero-glyph" aria-hidden="true">
            <Icon name="trendUp" size={96} />
          </span>
          <div className="v2-hero-meta">
            <span className="v2-hero-pill">
              <Icon name="phone" size={13} /> {phoneReady ? phone : 'Numéro mobile manquant'}
            </span>
            <span className="v2-hero-pill">
              <Icon name="shield" size={13} />
              {context.data?.profile.kyc_verified ? ' KYC validé' : ' KYC à faire'}
            </span>
          </div>
        </div>

        {!context.loading && !phoneReady && (
          <div style={{ marginTop: 8 }}>
            <Hint icon="phone" tone="warning" onClick={onOpenProfile}>
              Numéro mobile requis pour le P2P
            </Hint>
          </div>
        )}

        <div className="v2-actions v2-trading-actions" style={{ marginTop: 8 }}>
          <button
            className="v2-action"
            disabled={!defaultPair}
            onClick={() => defaultPair && setTradePair({ ...defaultPair, side: 'buy' })}
          >
            <span className="v2-action-icon v2-action-icon--green">
              <Icon name="arrowUpRight" size={20} />
            </span>
            Acheter
          </button>
          <button
            className="v2-action"
            disabled={!defaultPair}
            onClick={() => defaultPair && setTradePair({ ...defaultPair, side: 'sell' })}
          >
            <span className="v2-action-icon">
              <Icon name="arrowDownLeft" size={20} />
            </span>
            Vendre
          </button>
          <button className="v2-action" onClick={() => setTab('ordres')}>
            <span className="v2-action-icon v2-action-icon--amber">
              <Icon name="receipt" size={20} />
            </span>
            {openCount} ordre(s)
          </button>
          <button className="v2-action" onClick={() => { setTab('p2p'); setP2pView('commandes'); }}>
            <span className="v2-action-icon v2-action-icon--neutral">
              <Icon name="users" size={20} />
            </span>
            {activeP2P} P2P
          </button>
        </div>
      </div>

      <div
        className="v2-pad"
        style={{ display: marketsFullPage || uqMarketsFullPage ? 'none' : undefined }}
      >
        <Segmented
          size="sm"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'marche', label: 'Marché', icon: 'market' },
            { value: 'ordres', label: 'Ordres', icon: 'receipt' },
            { value: 'p2p', label: 'P2P mobile', icon: 'phone' },
            { value: 'earn', label: 'Earn', icon: 'gift' },
            { value: 'publications', label: 'Publications', icon: 'bell' },
          ]}
        />
      </div>

      {tab === 'marche' && (
        <>
        <BorbMarketHub
          uq={uq}
          borbUsd={context.data?.oracle?.borb_usd ?? null}
          onFullViewChange={setMarketsFullPage}
        />
        <div
          className="v2-pad v2-trading-market-home"
          style={{ display: marketsFullPage ? 'none' : undefined }}
        >
          <section
            className={uqMarketsFullPage ? undefined : 'v2-trading-market-section'}
            aria-label="Marché UQ"
          >
            {uqMarketsFullPage ? (
              <ScreenHeader
                title="Marchés UQ"
                subtitle="Cours et transactions observés · carnet réel"
                onBack={() => {
                  setUqMarketsFullPage(false);
                  setQuery('');
                  setFavOnly(false);
                }}
              />
            ) : (
              <button
                type="button"
                className="v2-trading-disclosure-toggle"
                aria-expanded={uqMarketExpanded}
                onClick={() => setUqMarketExpanded((value) => !value)}
              >
                <span className="v2-trading-disclosure-icon">
                  <Icon name="globe" size={16} />
                </span>
                <span className="v2-trading-disclosure-copy">
                  <span className="v2-trading-disclosure-title">Marché UQ</span>
                  <span className="v2-trading-disclosure-subtitle">
                    Paires de devises · ordres internes réels
                  </span>
                </span>
                <span className="v2-trading-disclosure-meta">
                  {markets.error
                    ? 'Indisponible'
                    : markets.loading && !markets.data
                      ? 'Chargement'
                      : `${markets.data?.markets.length || 0} paires`}
                </span>
                <Icon name={uqMarketExpanded ? 'chevronUp' : 'chevronDown'} size={16} />
              </button>
            )}
            {uqMarketExpanded && (
              <div
                className={
                  uqMarketsFullPage ? undefined : 'v2-trading-market-section-content'
                }
              >
                {markets.loading && !markets.data ? (
                  <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
                    <Skeleton height={20} width="50%" />
                    <Skeleton height={20} width="42%" />
                    <Skeleton height={20} width="58%" />
                  </Card>
                ) : markets.error ? (
                  <ErrorBlock message={markets.error} onRetry={markets.reload} />
                ) : (
                  <>
                    {uqMarketsFullPage && (
                      <div className="v2-trading-disclosure">
                        <div className="v2-trading-market-updated">
                          {markets.data?.badge
                            ? `Taux · ${markets.data.badge}`
                            : markets.data?.source
                              ? `Taux · ${markets.data.source}`
                              : 'Source des taux non publiee'}
                          {markets.data?.age_secs != null
                            ? ` · ${decrireAgeTaux(markets.data.age_secs)}`
                            : markets.data
                              ? ` · ${formatTime(markets.data.updated_at)}`
                              : ''}
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <SearchInput
                            value={query}
                            onChange={setQuery}
                            placeholder="Rechercher une devise…"
                          />
                        </div>
                        <Segmented
                          value={marketSort}
                          onChange={setMarketSort}
                          options={[
                            { value: 'volume', label: 'Volume', icon: 'coin' },
                            { value: 'trades', label: 'Trades', icon: 'receipt' },
                            { value: 'az', label: 'A-Z', icon: 'filter' },
                          ]}
                        />

                        <div className="v2-trading-market-filters">
                          <Chip active={!favOnly} onClick={() => setFavOnly(false)}>
                            <Icon name="globe" size={13} /> Toutes
                          </Chip>
                          <Chip active={favOnly} onClick={() => setFavOnly(true)}>
                            <Icon name="star" size={13} /> Favoris · {favorites.length}
                          </Chip>
                        </div>
                      </div>
                    )}

                    {marketList.length === 0 ? (
                      <Card>
                        <EmptyState
                          icon={favOnly ? 'star' : 'globe'}
                          title={favOnly ? 'Aucun favori' : 'Aucune paire'}
                          description={
                            favOnly
                              ? "Touche l'étoile d'une paire pour la suivre."
                              : query
                                ? 'Aucune devise ne correspond à ta recherche.'
                                : 'Aucune devise publiée par l’oracle.'
                          }
                          action={
                            favOnly ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon="globe"
                                onClick={() => setFavOnly(false)}
                              >
                                Voir toutes
                              </Button>
                            ) : undefined
                          }
                        />
                      </Card>
                    ) : (
                      <Card
                        padded={false}
                        style={{ overflow: 'hidden' }}
                        className="v2-trading-market-list"
                      >
                        {(uqMarketsFullPage
                          ? marketList
                          : marketList.slice(0, 4)
                        ).map((market) => {
                          const chart = uqTradeCharts.data?.find(
                            (entry) => entry.pair === market.pair,
                          );
                          return (
                            <MarketListRow
                              key={market.pair}
                              market={market}
                              favorite={favorites.includes(market.pair)}
                              balance={balanceOf(market.quote)}
                              trades={chart?.trades || []}
                              tradeError={chart?.error || null}
                              tradeLoading={uqTradeCharts.loading && !chart}
                              onToggleFavorite={() => toggleFavorite(market.pair)}
                              onOpen={() =>
                                setPairSheet({ base: market.base, quote: market.quote })
                              }
                            />
                          );
                        })}
                      </Card>
                    )}
                    {!uqMarketsFullPage && marketList.length > 4 && (
                      <Button
                        block
                        size="sm"
                        variant="secondary"
                        icon="forward"
                        onClick={() => {
                          setUqMarketExpanded(true);
                          setUqMarketsFullPage(true);
                        }}
                      >
                        Voir les {marketList.length} marchés UQ
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        <div
          className="v2-pad"
          style={{ display: marketsFullPage || uqMarketsFullPage ? 'none' : undefined }}
        >
          <div className="v2-stack" style={{ marginTop: 14 }}>
            <section aria-labelledby="trading-publications-heading">
              <div className="v2-row-between" style={{ marginBottom: 8 }}>
                <div>
                  <h2 id="trading-publications-heading" className="v2-h3">
                    Publications récentes
                  </h2>
                  <div className="v2-muted" style={{ fontSize: 12 }}>
                    Annonces et actualités des membres
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  icon="forward"
                  onClick={() => setTab('publications')}
                >
                  Tout voir
                </Button>
              </div>
              <PublicationsPanel
                compact
                compose
                emptyHint="Les annonces et publications récentes apparaîtront ici."
                onContact={onMessage}
              />
            </section>
          </div>
          <div style={{ height: 8 }} />
        </div>
        </>
      )}

      {tab === 'ordres' && (
        <div className="v2-pad">
          <div className="v2-stack">
            <TradingPerformance uq={uq} />

            <Card>
              <div className="v2-row-between">
                <div>
                  <div className="v2-h3">Mes ordres</div>
                  <div className="v2-muted" style={{ fontSize: 12.5 }}>
                    {openCount} ouvert(s) · {orders.data?.orders.length || 0} au total
                  </div>
                </div>
                <Button size="sm" variant="secondary" icon="refresh" onClick={orders.reload}>
                  Recharger
                </Button>
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Chip active={orderFilter === 'all'} onClick={() => setOrderFilter('all')}>
                <Icon name="more" size={13} /> Tous · {orderCounts.all}
              </Chip>
              <Chip active={orderFilter === 'open'} onClick={() => setOrderFilter('open')}>
                <Icon name="clock" size={13} /> Ouverts · {orderCounts.open}
              </Chip>
              <Chip active={orderFilter === 'filled'} onClick={() => setOrderFilter('filled')}>
                <Icon name="check" size={13} /> Exécutés · {orderCounts.filled}
              </Chip>
              <Chip
                active={orderFilter === 'cancelled'}
                onClick={() => setOrderFilter('cancelled')}
              >
                <Icon name="close" size={13} /> Annulés · {orderCounts.cancelled}
              </Chip>
            </div>

            {orders.loading && !orders.data ? (
              <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
                <Skeleton height={20} width="60%" />
                <Skeleton height={20} width="45%" />
              </Card>
            ) : orders.error ? (
              <ErrorBlock message={orders.error} onRetry={orders.reload} />
            ) : orderList.length === 0 ? (
              <Card>
                <EmptyState
                  icon="receipt"
                  title={orderFilter === 'all' ? 'Aucun ordre' : 'Aucun ordre ici'}
                  description={
                    orderFilter === 'all'
                      ? 'Aucun échange pour l’instant.'
                      : 'Aucun ordre ne correspond à ce filtre.'
                  }
                  action={
                    orderFilter === 'all' ? (
                      <Button size="sm" icon="trendUp" onClick={() => setTab('marche')}>
                        Voir le marché
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" icon="more" onClick={() => setOrderFilter('all')}>
                        Tout afficher
                      </Button>
                    )
                  }
                />
              </Card>
            ) : (
              <Card padded={false} style={{ overflow: 'hidden' }}>
                {orderList.map((order) => (
                  <Row
                    key={order.id}
                    title={`${order.side === 'buy' ? 'Achat' : 'Vente'} ${formatNumber(order.amount, 4)} ${order.base}`}
                    subtitle={`${order.pair} · ${order.type === 'limit' ? 'Limite' : 'Marché'} · ${formatDateTime(order.created_at)}`}
                    value={
                      <div style={{ textAlign: 'right' }}>
                        <div>
                          {formatNumber(order.total, 2)} {order.quote}
                        </div>
                        <div className="v2-muted" style={{ fontSize: 11 }}>
                          {priceLabel(order.price)} {order.quote}
                        </div>
                      </div>
                    }
                    right={
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <StatusChip status={order.status} />
                        {order.status === 'open' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            icon="close"
                            onClick={() => setCancelTarget(order)}
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    }
                  />
                ))}
              </Card>
            )}
          </div>
          <div style={{ height: 8 }} />
        </div>
      )}

      {tab === 'p2p' && (
        <div className="v2-pad">
          <div className="v2-stack">
            <Card>
              <div className="v2-row-between">
                <div style={{ minWidth: 0 }}>
                  <div className="v2-h3">Mobile money</div>
                  <div className="v2-muted" style={{ fontSize: 12.5 }}>
                    {phoneReady ? `${phone} · ${context.data?.profile.operator || 'opérateur non défini'}` : 'Numéro absent du profil'}
                  </div>
                </div>
                {!phoneReady && onOpenProfile && (
                  <Button size="sm" variant="secondary" icon="user" onClick={onOpenProfile}>
                    Ajouter
                  </Button>
                )}
              </div>
            </Card>

            <Segmented
              value={p2pView}
              onChange={setP2pView}
              options={[
                { value: 'offres', label: 'Offres', icon: 'market' },
                { value: 'commandes', label: 'Commandes', icon: 'receipt' },
              ]}
            />

            {p2pView === 'offres' && (
              <>
                <Button
                  block
                  icon="plus"
                  disabled={!phoneReady}
                  onClick={() => setPublishOpen(true)}
                >
                  Publier une offre
                </Button>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Chip active={p2pSide === 'all'} onClick={() => setP2pSide('all')}>
                    <Icon name="more" size={13} /> Toutes
                  </Chip>
                  <Chip active={p2pSide === 'sell'} onClick={() => setP2pSide('sell')}>
                    <Icon name="arrowDownLeft" size={13} /> Vend
                  </Chip>
                  <Chip active={p2pSide === 'buy'} onClick={() => setP2pSide('buy')}>
                    <Icon name="arrowUpRight" size={13} /> Achète
                  </Chip>
                </div>

                {offerCurrencies.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                    <Chip active={!p2pCurrency} onClick={() => setP2pCurrency('')}>
                      <Icon name="globe" size={13} /> Toutes devises
                    </Chip>
                    {offerCurrencies.map((code) => (
                      <Chip
                        key={code}
                        active={p2pCurrency === code}
                        onClick={() => setP2pCurrency(code)}
                      >
                        {code}
                      </Chip>
                    ))}
                  </div>
                )}

                <Segmented
                  value={p2pSort}
                  onChange={setP2pSort}
                  options={[
                    { value: 'recent', label: 'Récents', icon: 'clock' },
                    { value: 'rate-asc', label: 'Taux ↑', icon: 'trendUp' },
                    { value: 'rate-desc', label: 'Taux ↓', icon: 'trendDown' },
                  ]}
                />

                {offers.loading && !offers.data ? (
                  <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
                    <Skeleton height={20} width="55%" />
                    <Skeleton height={20} width="40%" />
                  </Card>
                ) : offers.error ? (
                  <ErrorBlock message={offers.error} onRetry={offers.reload} />
                ) : offerList.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon="users"
                      title="Aucune offre"
                      description={
                        p2pSide !== 'all' || p2pCurrency
                          ? 'Aucune offre ne correspond aux filtres.'
                          : 'Sois le premier à publier.'
                      }
                      action={
                        p2pSide !== 'all' || p2pCurrency ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon="refresh"
                            onClick={() => {
                              setP2pSide('all');
                              setP2pCurrency('');
                            }}
                          >
                            Réinitialiser
                          </Button>
                        ) : undefined
                      }
                    />
                  </Card>
                ) : (
                  <Card padded={false} style={{ overflow: 'hidden' }}>
                    {offerList.map((offer) => {
                      const deviation =
                        offer.rate_deviation_pct != null && Number.isFinite(offer.rate_deviation_pct)
                          ? offer.rate_deviation_pct
                          : null;
                      const enBorb = offer.amount_unit === 'BORB';
                      const resteDevise = offer.remaining ?? offer.max_amount;
                      const resteBorb =
                        offer.remaining_borb ??
                        (offer.rate > 0 ? resteDevise / offer.rate : resteDevise);
                      return (
                        <Row
                          key={offer.id}
                          title={
                            offer.rate_base
                              ? offer.side === 'sell'
                                ? 'Vend du BORB'
                                : 'Achète du BORB'
                              : 'Offre héritée · à recréer en BORB'
                          }
                          subtitle={
                            enBorb
                              ? `${offer.pseudo || 'Utilisateur UQ'} · ${formatNumber(offer.min_borb ?? 0, 2)}–${formatNumber(resteBorb, 2)} BORB restants`
                              : `${offer.pseudo || 'Utilisateur UQ'} · ${formatNumber(offer.min_amount, 0)}–${formatNumber(resteDevise, 0)} ${offer.currency} restants`
                          }
                          value={
                            <div style={{ textAlign: 'right' }}>
                              <div>
                                {priceLabel(offer.rate)} {offer.currency}
                              </div>
                              <div className="v2-muted" style={{ fontSize: 11 }}>
                                {deviation !== null
                                  ? `${pctLabel(deviation)} vs référence`
                                  : offer.operator || 'mobile money'}
                              </div>
                            </div>
                          }
                          right={
                            offer.mine ? (
                              <span className="v2-badge">Ton offre</span>
                            ) : offer.rate_signal?.niveau === 'attention' ? (
                              <span className="v2-badge" title={offer.rate_signal.message}>
                                {offer.rate_signal.sens === 'eleve' ? 'Taux cher' : 'Taux bas'}
                              </span>
                            ) : undefined
                          }
                          chevron={!offer.mine}
                          onClick={() => {
                            if (offer.mine) {
                              toast('C’est ton offre.');
                              return;
                            }
                            setTakeTarget(offer);
                          }}
                        />
                      );
                    })}
                  </Card>
                )}
              </>
            )}

            {p2pView === 'commandes' && (
              <>
                <div className="v2-row-between">
                  <div className="v2-section-title" style={{ margin: 0 }}>
                    Mes commandes P2P
                  </div>
                  <Button size="sm" variant="ghost" icon="refresh" onClick={p2pOrders.reload}>
                    Recharger
                  </Button>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Chip
                    active={p2pOrderFilter === 'all'}
                    onClick={() => setP2pOrderFilter('all')}
                  >
                    <Icon name="more" size={13} /> Toutes · {allP2POrders.length}
                  </Chip>
                  <Chip
                    active={p2pOrderFilter === 'active'}
                    onClick={() => setP2pOrderFilter('active')}
                  >
                    <Icon name="clock" size={13} /> Actives · {activeP2P}
                  </Chip>
                  <Chip
                    active={p2pOrderFilter === 'done'}
                    onClick={() => setP2pOrderFilter('done')}
                  >
                    <Icon name="check" size={13} /> Terminées · {doneP2P}
                  </Chip>
                </div>

                {p2pOrders.loading && !p2pOrders.data ? (
                  <Card padded={false} style={{ padding: 16, display: 'grid', gap: 12 }}>
                    <Skeleton height={20} width="58%" />
                    <Skeleton height={20} width="44%" />
                  </Card>
                ) : p2pOrders.error ? (
                  <ErrorBlock message={p2pOrders.error} onRetry={p2pOrders.reload} />
                ) : p2pOrderList.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon="swap"
                      title="Aucune commande"
                      description={
                        p2pOrderFilter === 'all'
                          ? 'Prends une offre pour ouvrir le canal.'
                          : 'Aucune commande dans ce filtre.'
                      }
                      action={
                        p2pOrderFilter !== 'all' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon="more"
                            onClick={() => setP2pOrderFilter('all')}
                          >
                            Tout afficher
                          </Button>
                        ) : undefined
                      }
                    />
                  </Card>
                ) : (
                  <div className="v2-stack">
                    {p2pOrderList.map((order) => {
                      const roleLabel = order.role === 'buyer' ? 'Acheteur' : 'Vendeur';
                      const gele = (order.escrow_points ?? 0) > 0;
                      const nomVendeur =
                        order.role === 'seller'
                          ? peerLabel(order.peer)
                          : order.seller_display || peerLabel(order.seller);
                      return (
                      <Card key={order.id}>
                        <div className="v2-row-between">
                          <div style={{ minWidth: 0 }}>
                            <div className="v2-h3">
                              {gele
                                ? `${formatNumber(order.borb_amount ?? 0, 2)} BORB`
                                : `${formatNumber(order.amount, 2)} ${order.currency}`}
                            </div>
                            <div className="v2-muted" style={{ fontSize: 12.5 }}>
                              {roleLabel} ·{' '}
                              <button
                                type="button"
                                onClick={() => order.peer && setProfilMembre(order.peer)}
                                disabled={!order.peer}
                                style={{
                                  background: 'none',
                                  border: 0,
                                  padding: 0,
                                  font: 'inherit',
                                  color: order.peer ? 'var(--v2-accent)' : 'inherit',
                                  cursor: order.peer ? 'pointer' : 'default',
                                }}
                              >
                                {peerLabel(order.peer)}
                              </button>{' '}
                              · {formatDateTime(order.created_at)}
                            </div>
                          </div>
                          <StatusChip status={order.status} />
                        </div>

                        <KeyValue
                          label={
                            order.rate_base
                              ? `Taux (1 ${order.rate_base} =)`
                              : 'Taux (base de l’offre inconnue)'
                          }
                          value={`${priceLabel(order.rate)} ${order.currency}`}
                        />
                        <KeyValue
                          label="À payer"
                          value={`${formatNumber(order.amount, 2)} ${order.currency}`}
                        />
                        <KeyValue
                          label={
                            order.role === 'buyer'
                              ? 'Numéro à payer'
                              : 'Ton numéro de réception'
                          }
                          value={
                            (order.role === 'buyer'
                              ? numeroDePreuve(order)
                              : order.seller_phone || '') || '—'
                          }
                        />

                        {order.role === 'buyer' && order.status === 'pending_payment' && gele && (
                          <div className="v2-muted" style={{ fontSize: 12, marginTop: 6 }}>
                            Paie {formatNumber(order.amount, 2)} {order.currency} à {nomVendeur} :{' '}
                            {formatNumber(order.borb_amount ?? 0, 2)} BORB sont immobilisés chez lui
                            jusqu'à sa confirmation.
                          </div>
                        )}
                        {order.role === 'buyer' && order.status === 'paid' && (
                          <div className="v2-muted" style={{ fontSize: 12, marginTop: 6 }}>
                            Paiement annoncé — {nomVendeur} vérifie la réception puis libère les BORB.
                          </div>
                        )}
                        {order.role === 'buyer' && order.status === 'completed' && (
                          <div className="v2-muted" style={{ fontSize: 12, marginTop: 6 }}>
                            Tu as reçu {formatNumber(order.borb_amount ?? 0, 2)} BORB dans ton
                            coffre. Vendables en Trading, convertibles en devise virtuelle pour
                            transférer — pas de transfert direct de BORB dans l'app.
                          </div>
                        )}
                        {order.role === 'seller' && order.status === 'pending_payment' && gele && (
                          <div className="v2-muted" style={{ fontSize: 12, marginTop: 6 }}>
                            {formatNumber(order.borb_amount ?? 0, 2)} BORB sont immobilisés chez toi
                            pour {peerLabel(order.peer)}, en attente de son paiement mobile money.
                          </div>
                        )}
                        {order.role === 'seller' && order.status === 'paid' && (
                          <div className="v2-muted" style={{ fontSize: 12, marginTop: 6 }}>
                            {peerLabel(order.peer)} annonce le paiement : vérifie ton mobile money
                            avant de libérer les BORB.
                          </div>
                        )}
                        {!gele && (order.status === 'pending_payment' || order.status === 'paid') && (
                          <div className="v2-muted" style={{ fontSize: 12, marginTop: 6 }}>
                            Commande ouverte avant le gel BORB : rien n'est immobilisé, donc elle ne
                            peut plus être terminée. Annule-la et reprends la transaction dans le
                            carnet.
                          </div>
                        )}

                          <PucePreuveCommande order={order} face={peerLabel(order.peer)} />
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                          {order.role === 'buyer' && order.status === 'pending_payment' && (
                            <FactureAcheteur order={order} face={peerLabel(order.peer)} onRefresh={reloadAll} />
                          )}
                          {order.role === 'seller' && order.status === 'paid' && (
                            <FactureVendeur order={order} face={peerLabel(order.peer)} onRefresh={reloadAll} />
                          )}
                          {order.role === 'buyer' && numeroDePreuve(order) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon="copy"
                              onClick={() => copyValue(numeroDePreuve(order))}
                            >
                              Numéro
                            </Button>
                          )}
                          {(order.status === 'pending_payment' || order.status === 'paid') && (
                            <Button size="sm" variant="ghost" icon="close" onClick={() => handleP2PAction(order, 'cancel')}>
                              Annuler
                            </Button>
                          )}
                          {order.chat_group_id && onOpenChat && (
                            <Button size="sm" variant="ghost" icon="chat" onClick={onOpenChat}>
                              Chat
                            </Button>
                          )}
                        </div>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            <Hint icon="lock" onClick={() => help.openHelp('p2p')}>
              Séquestre · canal privé · numéro du profil
            </Hint>
          </div>
          <div style={{ height: 8 }} />
        </div>
      )}

      {tab === 'earn' && (
        <div className="v2-pad">
          <EarnPanel />
          <div style={{ height: 8 }} />
        </div>
      )}

      {tab === 'publications' && (
        <div className="v2-pad">
          <div className="v2-row-between" style={{ marginBottom: 8 }}>
            <div>
              <div className="v2-h3">Publications</div>
              <div className="v2-muted" style={{ fontSize: 12 }}>
                Annonces et conférences des membres · disparition après 7 jours
              </div>
            </div>
            <span className="v2-badge">
              <Icon name="clock" size={12} /> 7 j
            </span>
          </div>
          <PublicationsPanel compose onContact={onMessage} />
          <div style={{ height: 8 }} />
        </div>
      )}

      {pairSheet && (
        <PairSheet
          base={pairSheet.base}
          quote={pairSheet.quote}
          market={markets.data?.markets.find(
            (entry) => entry.pair === `${pairSheet.base}-${pairSheet.quote}`,
          )}
          onClose={() => setPairSheet(null)}
          onTrade={(side) => {
            setTradePair({ ...pairSheet, side });
            setPairSheet(null);
          }}
        />
      )}

      {tradePair && (
        <TradeSheet
          open={Boolean(tradePair)}
          onClose={() => setTradePair(null)}
          base={tradePair.base}
          quote={tradePair.quote}
          price={pairPrice(tradePair.base, tradePair.quote)}
          initialSide={tradePair.side || 'buy'}
          balances={balances}
          onSwap={() =>
            setTradePair({ ...tradePair, base: tradePair.quote, quote: tradePair.base })
          }
          onDone={reloadAll}
        />
      )}

      <CancelOrderSheet
        order={cancelTarget}
        busy={cancelBusy}
        onClose={() => setCancelTarget(null)}
        onConfirm={confirmCancelOrder}
      />

      <TakeSheet
        offer={takeTarget}
        currencies={currencyOptions}
        rates={rates}
        onClose={() => setTakeTarget(null)}
        onDone={reloadAll}
        onProfile={(peer) => setProfilMembre(peer)}
      />

      <PublicProfileSheet
        pseudo={profilMembre || ''}
        onClose={() => setProfilMembre(null)}
        onContact={
          onMessage
            ? (pseudo) => {
                setProfilMembre(null);
                onMessage(pseudo);
              }
            : undefined
        }
      />

      <PublishSheet
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        currencies={currencyOptions}
        rates={rates}
        borbUsd={Number(context.data?.oracle?.borb_usd) || 0}
        phone={phone}
        onDone={reloadAll}
      />

      <NotificationsSheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigate={(scope) => {
          setNotifOpen(false);
          if (scope === 'trading') {
            // Une alerte d'ordre ou de commande P2P se traite dans l'onglet P2P.
            setTab('p2p');
            setP2pView('commandes');
          } else if (scope === 'coffre') {
            onOpenWallet?.();
          } else if (scope === 'kyc') {
            onOpenProfile?.();
          } else if (scope === 'chat') {
            onOpenChat?.();
          } else if (scope === 'zando') {
            onOpenFeed?.();
          }
        }}
      />
    </>
  );
}
