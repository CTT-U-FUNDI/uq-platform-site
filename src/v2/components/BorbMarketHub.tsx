import { useEffect, useMemo, useState } from 'react';
import { Icon } from './Icon';
import {
  Button,
  Card,
  EmptyState,
  ErrorBlock,
  IconButton,
  ScreenHeader,
  Segmented,
  Skeleton,
  Stat,
} from './Ui';
import {
  describeError,
  getBalance,
  getCryptoMarketKlines,
  getCryptoMarketQuote,
  getStockQuote,
  type CryptoKlinesResponse,
  type CryptoMarketQuoteResponse,
  type BorbBalance,
  type StockQuoteResponse,
} from '../lib/api';
import { useAsync, usePolling } from '../lib/hooks';
import { formatNumber } from '../lib/format';
import { loadRates } from '../../services/rates';

type MarketTab = 'crypto' | 'actions' | 'etf' | 'portfolio';
type MarketKind = Exclude<MarketTab, 'portfolio'>;
type CryptoInterval = '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';
type StockRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y';

interface MarketAsset {
  symbol: string;
  name: string;
  kind: MarketKind;
  mark: string;
  color: string;
}

interface QuoteRow {
  asset: MarketAsset;
  quote: CryptoMarketQuoteResponse | StockQuoteResponse | null;
  error: string | null;
}

interface ChartPoint {
  time: number;
  close: number;
  volume?: number | null;
}

const ASSETS: MarketAsset[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', kind: 'crypto', mark: '₿', color: '#f7931a' },
  { symbol: 'ETHUSDT', name: 'Ethereum', kind: 'crypto', mark: 'Ξ', color: '#627eea' },
  { symbol: 'BNBUSDT', name: 'BNB', kind: 'crypto', mark: 'B', color: '#f0b90b' },
  { symbol: 'SOLUSDT', name: 'Solana', kind: 'crypto', mark: 'S', color: '#8b5cf6' },
  { symbol: 'XRPUSDT', name: 'XRP', kind: 'crypto', mark: 'X', color: '#4169e1' },
  { symbol: 'ADAUSDT', name: 'Cardano', kind: 'crypto', mark: 'A', color: '#2a6df4' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', kind: 'crypto', mark: 'Ð', color: '#c2a633' },
  { symbol: 'TRXUSDT', name: 'TRON', kind: 'crypto', mark: 'T', color: '#e84142' },
  { symbol: 'TONUSDT', name: 'Toncoin', kind: 'crypto', mark: 'T', color: '#0098ea' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', kind: 'crypto', mark: 'A', color: '#e84142' },
  { symbol: 'DOTUSDT', name: 'Polkadot', kind: 'crypto', mark: 'P', color: '#e6007a' },
  { symbol: 'LINKUSDT', name: 'Chainlink', kind: 'crypto', mark: 'L', color: '#2a5ada' },
  { symbol: 'LTCUSDT', name: 'Litecoin', kind: 'crypto', mark: 'Ł', color: '#345d9d' },
  { symbol: 'BCHUSDT', name: 'Bitcoin Cash', kind: 'crypto', mark: 'B', color: '#8dc351' },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu', kind: 'crypto', mark: 'S', color: '#f00500' },
  { symbol: 'UNIUSDT', name: 'Uniswap', kind: 'crypto', mark: 'U', color: '#ff007a' },
  { symbol: 'ATOMUSDT', name: 'Cosmos', kind: 'crypto', mark: 'A', color: '#2e3148' },
  { symbol: 'NEARUSDT', name: 'NEAR Protocol', kind: 'crypto', mark: 'N', color: '#00c08b' },
  { symbol: 'AAPL', name: 'Apple', kind: 'actions', mark: 'A', color: '#75808d' },
  { symbol: 'TSLA', name: 'Tesla', kind: 'actions', mark: 'T', color: '#e82127' },
  { symbol: 'NVDA', name: 'NVIDIA', kind: 'actions', mark: 'N', color: '#76b900' },
  { symbol: 'MSFT', name: 'Microsoft', kind: 'actions', mark: 'M', color: '#00a4ef' },
  { symbol: 'AMZN', name: 'Amazon', kind: 'actions', mark: 'A', color: '#ff9900' },
  { symbol: 'GOOGL', name: 'Alphabet', kind: 'actions', mark: 'G', color: '#4285f4' },
  { symbol: 'META', name: 'Meta Platforms', kind: 'actions', mark: 'M', color: '#0866ff' },
  { symbol: 'JPM', name: 'JPMorgan Chase', kind: 'actions', mark: 'J', color: '#1769aa' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', kind: 'etf', mark: 'S', color: '#4b78c2' },
  { symbol: 'QQQ', name: 'Invesco QQQ ETF', kind: 'etf', mark: 'Q', color: '#5670a7' },
  { symbol: 'VTI', name: 'Vanguard Total Market ETF', kind: 'etf', mark: 'V', color: '#9b1c31' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', kind: 'etf', mark: 'V', color: '#c41230' },
  { symbol: 'GLD', name: 'SPDR Gold Shares', kind: 'etf', mark: 'G', color: '#c7a64b' },
];

const TABS: { value: MarketTab; label: string; icon: 'coin' | 'trendUp' | 'globe' | 'wallet' }[] = [
  { value: 'crypto', label: 'Crypto', icon: 'coin' },
  { value: 'actions', label: 'Actions', icon: 'trendUp' },
  { value: 'etf', label: 'ETF', icon: 'globe' },
  { value: 'portfolio', label: 'Mon coffre', icon: 'wallet' },
];

const CRYPTO_INTERVALS: { value: CryptoInterval; label: string }[] = [
  { value: '1s', label: '1 s' },
  { value: '1m', label: '1 min' },
  { value: '5m', label: '5 min' },
  { value: '15m', label: '15 min' },
  { value: '1h', label: '1 h' },
  { value: '4h', label: '4 h' },
  { value: '1d', label: '1 j' },
  { value: '1w', label: '1 sem.' },
  { value: '1M', label: '1 mois' },
];

const STOCK_RANGES: { value: StockRange; label: string }[] = [
  { value: '1d', label: '1 j' },
  { value: '5d', label: '1 sem.' },
  { value: '1mo', label: '1 mois' },
  { value: '3mo', label: '3 mois' },
  { value: '6mo', label: '6 mois' },
  { value: '1y', label: '1 an' },
  { value: '5y', label: '5 ans' },
];

const displaySymbol = (symbol: string) => symbol.replace(/USDT$/, '');

function AssetMark({ asset, size = 38 }: { asset: MarketAsset; size?: number }) {
  const gradientId = `asset-${asset.symbol.replace(/[^A-Z0-9]/gi, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label={`${asset.name} (${displaySymbol(asset.symbol)})`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={asset.color} />
          <stop offset="100%" stopColor="var(--v2-ink)" stopOpacity=".82" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="13" fill={`url(#${gradientId})`} />
      <text
        x="20"
        y="26"
        fill="white"
        textAnchor="middle"
        fontFamily="var(--v2-font)"
        fontSize={asset.mark.length > 1 ? 12 : 19}
        fontWeight="800"
      >
        {asset.mark}
      </text>
    </svg>
  );
}

function quoteData(quote: QuoteRow['quote']) {
  if (!quote?.data) return null;
  return quote.data;
}

function quotePrice(quote: QuoteRow['quote']) {
  const value = quoteData(quote)?.price;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function quoteChange(quote: QuoteRow['quote']) {
  const value = quoteData(quote)?.change_percent;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatChange(value: number | null) {
  if (value === null) return 'Variation indisponible';
  return `${value > 0 ? '▲ +' : value < 0 ? '▼ ' : '• '}${formatNumber(value, 2)} %`;
}

function changeColor(value: number | null) {
  if (value === null || value === 0) return 'var(--v2-ink-3)';
  return value > 0 ? 'var(--v2-positive)' : 'var(--v2-negative)';
}

function MarketChart({
  asset,
  points,
  intervalLabel,
  borbUsd,
  quoteToUsd,
}: {
  asset: MarketAsset;
  points: ChartPoint[];
  intervalLabel: string;
  borbUsd?: number | null;
  quoteToUsd: number | null;
}) {
  const values = points.map((point) => point.close).filter(Number.isFinite);
  const minimum = values.length ? Math.min(...values) : 0;
  const maximum = values.length ? Math.max(...values) : 0;
  const spread = maximum - minimum || 1;
  const coordinates = values.map((value, index) => ({
    x: values.length < 2 ? 160 : 10 + (index / (values.length - 1)) * 300,
    y: 112 - ((value - minimum) / spread) * 96,
  }));
  const line = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');
  const area = coordinates.length
    ? `${line} L${coordinates[coordinates.length - 1].x},118 L${coordinates[0].x},118 Z`
    : '';
  const rising =
    coordinates.length > 1 &&
    coordinates[coordinates.length - 1].y <= coordinates[0].y;
  const stroke = rising ? 'var(--v2-positive)' : 'var(--v2-negative)';
  const gradientId = `chart-${asset.symbol.replace(/[^A-Z0-9]/gi, '')}`;

  if (points.length < 2) {
    return (
      <div className="v2-market-chart-empty">
        L’historique de ce graphique n’est pas encore disponible.
      </div>
    );
  }

  const firstTime = new Date(points[0].time * 1000);
  const lastTime = new Date(points[points.length - 1].time * 1000);
  const formatTime = (date: Date) =>
    Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString('fr-FR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });

  return (
    <div className="v2-market-chart">
      <svg
        viewBox="0 0 320 130"
        role="img"
        aria-label={`Graphique de ${displaySymbol(asset.symbol)} : ${points.length} bougies de ${intervalLabel}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity=".22" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[20, 52, 84, 116].map((y) => (
          <line
            key={y}
            x1="8"
            x2="312"
            y1={y}
            y2={y}
            stroke="var(--v2-line-strong)"
            strokeDasharray="3 5"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={coordinates[coordinates.length - 1].x}
          cy={coordinates[coordinates.length - 1].y}
          r="4"
          fill={stroke}
        />
      </svg>
      <div className="v2-market-chart-axis">
        <span>{formatNumber(minimum, 4)}</span>
        <span>{formatTime(firstTime)} — {formatTime(lastTime)}</span>
        <span>{formatNumber(maximum, 4)}</span>
      </div>
      {asset.kind === 'crypto' &&
        quoteToUsd !== null &&
        Number.isFinite(quoteToUsd) &&
        quoteToUsd > 0 &&
        typeof borbUsd === 'number' &&
        Number.isFinite(borbUsd) &&
        borbUsd > 0 && (
          <div className="v2-market-chart-conversion">
            <span>Équivalent BORB · historique converti au taux actuel</span>
            <span>
              {formatNumber((minimum * quoteToUsd) / borbUsd, 4)} — {formatNumber((maximum * quoteToUsd) / borbUsd, 4)} BORB
            </span>
          </div>
        )}
    </div>
  );
}

function MiniMarketChart({
  asset,
  points,
  loading,
}: {
  asset: MarketAsset;
  points: ChartPoint[];
  loading: boolean;
}) {
  const values = points.map((point) => point.close).filter(Number.isFinite);
  if (values.length < 2) {
    return (
      <div className="v2-market-mini-chart-empty">
        {loading ? 'Chargement du graphique…' : 'Graphique indisponible'}
      </div>
    );
  }

  const minimum = Math.min(...values);
  const spread = Math.max(...values) - minimum || 1;
  const coordinates = values.map((value, index) => ({
    x: (index / (values.length - 1)) * 100,
    y: 29 - ((value - minimum) / spread) * 24,
  }));
  const line = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');
  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? 'var(--v2-positive)' : 'var(--v2-negative)';
  const gradientId = `mini-${asset.symbol.replace(/[^A-Z0-9]/gi, '')}`;

  return (
    <svg
      className="v2-market-mini-chart"
      viewBox="0 0 100 32"
      role="img"
      aria-label={`Tendance récente de ${displaySymbol(asset.symbol)} basée sur ${values.length} points réels`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity=".24" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L100,32 L0,32 Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function chartPoints(
  asset: MarketAsset,
  crypto: CryptoKlinesResponse | null,
  stock: StockQuoteResponse | null,
): ChartPoint[] {
  if (asset.kind === 'crypto') {
    return (crypto?.candles || []).map((candle) => ({
      time: candle.time,
      close: candle.close,
      volume: candle.volume,
    }));
  }
  return (stock?.data?.history || []).map((point) => ({
    time: point.time,
    close: point.close,
    volume: point.volume,
  }));
}

function quoteSource(quote: QuoteRow['quote']) {
  if (!quote) return '';
  return quote.source || 'source inconnue';
}

function quoteFreshness(quote: QuoteRow['quote']) {
  if (!quote) return '';
  const age = quote.capture?.age_sec;
  const ageLabel =
    typeof age !== 'number'
      ? quote.cached
        ? 'cache'
        : 'capture récente'
      : age < 5
        ? "capturé à l'instant"
        : age < 60
          ? `capturé il y a ${Math.floor(age)} s`
          : `capturé il y a ${Math.floor(age / 60)} min`;
  return quote.stale ? `hors ligne · ${ageLabel}` : ageLabel;
}

export function BorbMarketHub({
  uq,
  borbUsd,
  onFullViewChange,
}: {
  uq: string;
  borbUsd?: number | null;
  onFullViewChange?: (fullView: boolean) => void;
}) {
  const [tab, setTab] = useState<MarketTab>('crypto');
  const [focusedSymbol, setFocusedSymbol] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [cryptoInterval, setCryptoInterval] = useState<CryptoInterval>('1m');
  const [stockRange, setStockRange] = useState<StockRange>('1d');

  useEffect(() => {
    onFullViewChange?.(showAll || Boolean(focusedSymbol));
  }, [showAll, focusedSymbol, onFullViewChange]);
  useEffect(() => () => onFullViewChange?.(false), [onFullViewChange]);

  const visibleAssets = useMemo(
    () => ASSETS.filter((asset) => asset.kind === tab),
    [tab],
  );
  const listedAssets = showAll ? visibleAssets : visibleAssets.slice(0, 4);
  const symbolsKey = listedAssets.map((asset) => asset.symbol).join(',');
  const quotes = useAsync(
    async () => {
      const assets = symbolsKey
        ? symbolsKey
            .split(',')
            .map((symbol) => ASSETS.find((asset) => asset.symbol === symbol))
            .filter((asset): asset is MarketAsset => Boolean(asset))
        : [];
      return Promise.all(
        assets.map(async (asset): Promise<QuoteRow> => {
          try {
            const quote =
              asset.kind === 'crypto'
                ? await getCryptoMarketQuote(asset.symbol)
                : await getStockQuote(asset.symbol, stockRange);
            return { asset, quote, error: null };
          } catch (error) {
            return {
              asset,
              quote: null,
              error: describeError(error, 'Cours indisponible pour le moment.'),
            };
          }
        }),
      );
    },
    [symbolsKey, tab, stockRange],
  );
  usePolling(
    () => quotes.reload(),
    tab === 'crypto' ? 10_000 : 60_000,
    tab !== 'portfolio' && visibleAssets.length > 0 && !focusedSymbol,
  );
  const miniChartKey = listedAssets
    .filter((asset) => asset.kind === 'crypto')
    .map((asset) => asset.symbol)
    .join(',');
  const miniCharts = useAsync(
    async () => {
      const symbols = miniChartKey ? miniChartKey.split(',') : [];
      return Promise.all(
        symbols.map(async (symbol) => {
          try {
            const history = await getCryptoMarketKlines(symbol, '1m', 24);
            return { symbol, history, error: null };
          } catch (error) {
            return {
              symbol,
              history: null,
              error: describeError(error, 'Historique temporairement indisponible.'),
            };
          }
        }),
      );
    },
    [miniChartKey],
    { enabled: tab === 'crypto' && symbolsKey.length > 0 },
  );
  usePolling(
    () => miniCharts.reload(),
    60_000,
    tab === 'crypto' && symbolsKey.length > 0 && !focusedSymbol,
  );

  const focusedAsset = focusedSymbol
    ? ASSETS.find((asset) => asset.symbol === focusedSymbol) || null
    : null;
  const fiatRates = useAsync(
    () => loadRates(true),
    [],
    { enabled: tab === 'crypto' },
  );
  usePolling(() => fiatRates.reload(), 60_000, tab === 'crypto');
  const detailQuote = useAsync(
    async () => {
      if (!focusedAsset) return null;
      return focusedAsset.kind === 'crypto'
        ? getCryptoMarketQuote(focusedAsset.symbol)
        : getStockQuote(focusedAsset.symbol, stockRange);
    },
    [focusedSymbol, stockRange],
    { enabled: Boolean(focusedAsset) },
  );
  const detailHistory = useAsync(
    async () => {
      if (!focusedAsset) return null;
      return focusedAsset.kind === 'crypto'
        ? getCryptoMarketKlines(focusedAsset.symbol, cryptoInterval, 200)
        : getStockQuote(focusedAsset.symbol, stockRange);
    },
    [focusedSymbol, cryptoInterval, stockRange],
    { enabled: Boolean(focusedAsset) },
  );
  usePolling(() => detailQuote.reload(), 10_000, focusedAsset?.kind === 'crypto');
  usePolling(() => detailHistory.reload(), 15_000, focusedAsset?.kind === 'crypto');

  const balance = useAsync(
    () => getBalance(uq),
    [uq],
    { enabled: tab === 'portfolio' },
  );
  const loadedQuotes = quotes.data || [];
  const quoteOf = (symbol: string) => loadedQuotes.find((entry) => entry.asset.symbol === symbol);
  const currentQuote = detailQuote.data;
  const cryptoHistory =
    focusedAsset?.kind === 'crypto' && detailHistory.data
      ? (detailHistory.data as CryptoKlinesResponse)
      : null;
  const stockHistory =
    focusedAsset && focusedAsset.kind !== 'crypto' && detailHistory.data
      ? (detailHistory.data as StockQuoteResponse)
      : null;
  const points = focusedAsset
    ? chartPoints(focusedAsset, cryptoHistory, stockHistory)
    : [];
  const detailData = currentQuote?.data;
  const detailFreshness = quoteFreshness(currentQuote || null);
  const detailCurrency = (detailData?.currency || 'USD').toUpperCase();
  const detailQuoteToUsd =
    detailCurrency === 'USD'
      ? 1
      : Number(fiatRates.data?.[detailCurrency]) > 0
        ? 1 / Number(fiatRates.data?.[detailCurrency])
        : null;
  const detailChange =
    typeof detailData?.change_percent === 'number' &&
    Number.isFinite(detailData.change_percent)
      ? detailData.change_percent
      : null;
  const currentSource = currentQuote?.source || '';
  const intervalLabel =
    focusedAsset?.kind === 'crypto'
      ? CRYPTO_INTERVALS.find((item) => item.value === cryptoInterval)?.label || cryptoInterval
      : STOCK_RANGES.find((item) => item.value === stockRange)?.label || stockRange;

  return (
    <section className="v2-borb-market" aria-label="Marchés financiers">
      {focusedAsset ? (
        <>
          <ScreenHeader
            title={`${focusedAsset.name} (${displaySymbol(focusedAsset.symbol)})`}
            subtitle={`Cours indicatif · ${currentSource || (focusedAsset.kind === 'crypto' ? 'Binance / CoinGecko / Coinbase' : 'Yahoo Finance')}${detailFreshness ? ` · ${detailFreshness}` : ''}`}
            onBack={() => setFocusedSymbol(null)}
          />
          <div className="v2-pad v2-stack">
            <Card className="v2-market-detail-hero">
              <div className="v2-market-detail-heading">
                <AssetMark asset={focusedAsset} size={48} />
                <div>
                  <div className="v2-market-detail-price">
                    {typeof detailData?.price === 'number'
                      ? `${formatNumber(detailData.price, detailData.price < 1 ? 6 : 2)} ${detailData.currency || 'USD'}`
                      : '—'}
                  </div>
                  <div
                    className="v2-market-change"
                    style={{ color: changeColor(detailChange) }}
                  >
                    {formatChange(detailChange)}
                    {focusedAsset.kind === 'crypto' ? ' · 24 h' : ''}
                  </div>
                </div>
              </div>
              {typeof detailData?.price === 'number' &&
                detailQuoteToUsd !== null &&
                typeof borbUsd === 'number' &&
                Number.isFinite(borbUsd) &&
                borbUsd > 0 && (
                  <div className="v2-market-borb-equivalent">
                    ≈ {formatNumber((detailData.price * detailQuoteToUsd) / borbUsd, 4)} BORB
                    <span>Conversion indicative au taux fiat et régulateur BORB/USD</span>
                  </div>
                )}
              <div className="v2-market-disclaimer">
                Prix indicatifs fournis par des sources de marché. L’application n’est
                reliée à aucun courtier crypto ou boursier : aucun achat réel de ces
                actifs n’est proposé ici.
              </div>
              {currentQuote?.capture?.persisted === false && (
                <div className="v2-market-disclaimer">
                  La dernière capture n’a pas pu être sauvegardée sur le serveur.
                </div>
              )}
            </Card>

            <Card>
              <div className="v2-row-between" style={{ marginBottom: 10 }}>
                <h2 className="v2-h3" style={{ margin: 0 }}>Graphique analytique</h2>
                <span className="v2-market-source-badge">
                  {focusedAsset.kind === 'crypto' ? 'Binance · bougies' : 'Yahoo Finance'}
                </span>
              </div>
              <Segmented
                size="sm"
                value={focusedAsset.kind === 'crypto' ? cryptoInterval : stockRange}
                onChange={(value) => {
                  if (focusedAsset.kind === 'crypto') {
                    setCryptoInterval(value as CryptoInterval);
                  } else {
                    setStockRange(value as StockRange);
                  }
                }}
                options={
                  focusedAsset.kind === 'crypto'
                    ? CRYPTO_INTERVALS
                    : STOCK_RANGES
                }
              />
              <div className="v2-market-chart-caption">
                {focusedAsset.kind === 'crypto'
                  ? `Dernières 200 bougies · une bougie toutes les ${intervalLabel} · actualisation périodique`
                  : `Historique ${intervalLabel} fourni par Yahoo Finance`}
              </div>
              {detailHistory.loading && !detailHistory.data ? (
                <Skeleton height={150} radius={14} />
              ) : detailHistory.error ? (
                <ErrorBlock message={detailHistory.error} onRetry={detailHistory.reload} />
              ) : (
                <MarketChart
                  asset={focusedAsset}
                  points={points}
                  intervalLabel={intervalLabel}
                  borbUsd={borbUsd}
                  quoteToUsd={detailQuoteToUsd}
                />
              )}
            </Card>

            <Card>
              <h2 className="v2-h3" style={{ marginTop: 0 }}>Données de marché</h2>
              <div className="v2-market-info-grid">
                <Stat
                  label="Ouverture"
                  value={detailData?.open ? formatNumber(detailData.open, 4) : '—'}
                  hint={focusedAsset.kind === 'crypto' ? '24 h' : detailData?.currency || 'Séance'}
                />
                <Stat
                  label="Plus haut"
                  value={detailData?.day_high ? formatNumber(detailData.day_high, 4) : '—'}
                  hint={focusedAsset.kind === 'crypto' ? '24 h' : 'Séance'}
                />
                <Stat
                  label="Plus bas"
                  value={detailData?.day_low ? formatNumber(detailData.day_low, 4) : '—'}
                  hint={focusedAsset.kind === 'crypto' ? '24 h' : 'Séance'}
                />
                <Stat
                  label="Volume"
                  value={detailData?.volume ? formatNumber(detailData.volume, 0) : '—'}
                  hint={focusedAsset.kind === 'crypto' ? '24 h' : 'Séance'}
                />
              </div>
              {detailQuote.error && (
                <ErrorBlock message={detailQuote.error} onRetry={detailQuote.reload} />
              )}
              {detailHistory.data && 'stale' in detailHistory.data && detailHistory.data.stale && (
                <p className="v2-market-disclaimer">
                  Source hors ligne : les dernières données mises en cache sont affichées.
                </p>
              )}
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="v2-pad v2-borb-market-head">
            <div className="v2-row-between" style={{ alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div className="v2-borb-market-title">
                  <span className="v2-borb-brand-mark" aria-hidden="true">B</span>
                  {showAll ? 'Marchés · vue complète' : 'BORB Trading'}
                </div>
                <div className="v2-muted" style={{ fontSize: 12 }}>
                  {showAll
                    ? `${visibleAssets.length} actifs · cours externes indicatifs`
                    : 'Cours réels · aperçu compact'}
                </div>
              </div>
              {showAll ? (
                <IconButton name="back" label="Retour aux marchés" onClick={() => setShowAll(false)} />
              ) : (
                <span className="v2-market-source-badge">
                  <Icon name="globe" size={13} /> Sources gratuites
                </span>
              )}
            </div>
            <Segmented
              value={tab}
              onChange={(value) => {
                setTab(value);
                setShowAll(false);
              }}
              options={TABS}
              size="sm"
            />
          </div>

          <div className="v2-pad v2-stack">
            {tab === 'portfolio' ? (
              <>
                <Card>
                  <div className="v2-row-between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <h2 className="v2-market-section-title" style={{ marginTop: 0 }}>
                        <Icon name="wallet" size={17} /> Solde réel du coffre
                      </h2>
                      <div className="v2-market-disclaimer">
                        Données chargées depuis le compte connecté, pas depuis un stockage local.
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={balance.reload}>
                      Actualiser
                    </Button>
                  </div>
                  {balance.loading && !balance.data ? (
                    <div className="v2-market-quote-skeleton">
                      <Skeleton height={42} />
                      <Skeleton height={42} />
                    </div>
                  ) : balance.error ? (
                    <ErrorBlock message={balance.error} onRetry={balance.reload} />
                  ) : balance.data ? (
                    <div className="v2-market-info-grid" style={{ marginTop: 12 }}>
                      <Stat
                        label="Solde BORB"
                        value={`${formatNumber(balance.data.balance.borb_total, 2)} BORB`}
                        hint="Valeur renvoyée par le coffre"
                      />
                      <Stat
                        label="Points"
                        value={formatNumber(balance.data.balance.points, 0)}
                        hint="Unités du compte"
                      />
                      <Stat
                        label="Points gelés"
                        value={formatNumber(balance.data.balance.frozen_points, 0)}
                        hint="Indiqués par le coffre"
                      />
                    </div>
                  ) : (
                    <EmptyState
                      icon="wallet"
                      title="Solde indisponible"
                      description="Le backend n’a pas renvoyé le solde de ce compte."
                    />
                  )}
                  <p className="v2-market-disclaimer">
                    Ce solde BORB/points n’est pas présenté comme un solde BORB investissable.
                    Aucun endpoint de courtage ou de règlement d’actifs externes n’est
                    actuellement connecté à ce marché.
                  </p>
                </Card>
                <Card>
                  <EmptyState
                    icon="trendUp"
                    title="Aucun portefeuille crypto ou boursier connecté"
                    description="Les cours sont consultables, mais aucun actif externe ne peut être déclaré détenu sans une intégration réelle de courtier ou de conservation."
                  />
                </Card>
              </>
            ) : (
              <>
                <div className="v2-row-between">
                  <h2 className="v2-market-section-title" style={{ margin: 0 }}>
                    <Icon
                      name={tab === 'crypto' ? 'coin' : tab === 'etf' ? 'globe' : 'trendUp'}
                      size={17}
                    />
                    {tab === 'crypto' ? 'Marché crypto' : tab === 'etf' ? 'ETF' : 'Actions'}
                  </h2>
                  <span className="v2-market-muted-label">
                    {showAll ? visibleAssets.length : Math.min(4, visibleAssets.length)} / {visibleAssets.length}
                    {' '}actifs · actualisation {tab === 'crypto' ? '10 s' : '60 s'}
                  </span>
                </div>
                <div className="v2-market-disclaimer">
                  {tab === 'crypto'
                    ? 'Binance en priorité, puis CoinGecko et Coinbase selon disponibilité. Les variations et volumes sont fournis par la source lorsqu’elle les expose.'
                    : 'Cours Yahoo Finance indicatifs et susceptibles d’être différés. Les marchés boursiers peuvent être fermés.'}
                </div>
                {quotes.loading && !quotes.data ? (
                  <div className="v2-market-asset-grid">
                    {[0, 1, 2, 3].map((index) => (
                      <Card key={index} className="v2-market-asset-card">
                        <Skeleton height={24} />
                        <Skeleton height={30} />
                        <Skeleton height={36} />
                      </Card>
                    ))}
                  </div>
                ) : quotes.error ? (
                  <ErrorBlock message={quotes.error} onRetry={quotes.reload} />
                ) : (
                  <div className="v2-market-asset-grid">
                    {listedAssets.map((asset) => {
                      const loaded = quoteOf(asset.symbol);
                      const price = quotePrice(loaded?.quote || null);
                      const change = quoteChange(loaded?.quote || null);
                      const currency =
                        asset.kind === 'crypto'
                          ? (quoteData(loaded?.quote || null) as CryptoMarketQuoteResponse['data'] | undefined)?.currency || 'USD'
                          : (quoteData(loaded?.quote || null) as StockQuoteResponse['data'] | undefined)?.currency || 'USD';
                      const history = miniCharts.data?.find((entry) => entry.symbol === asset.symbol);
                      const assetBorbUsd =
                        typeof borbUsd === 'number' && Number.isFinite(borbUsd) && borbUsd > 0
                          ? borbUsd
                          : null;
                      const assetQuoteToUsd =
                        currency.toUpperCase() === 'USD'
                          ? 1
                          : Number(fiatRates.data?.[currency.toUpperCase()]) > 0
                            ? 1 / Number(fiatRates.data?.[currency.toUpperCase()])
                            : null;
                      const priceUsd =
                        price !== null && assetQuoteToUsd !== null
                          ? price * assetQuoteToUsd
                          : null;
                      return (
                        <article className="v2-market-asset-card" key={asset.symbol}>
                          <button
                            type="button"
                            className="v2-market-asset-main"
                            onClick={() => setFocusedSymbol(asset.symbol)}
                          >
                            <AssetMark asset={asset} size={29} />
                            <span className="v2-market-asset-labels">
                              <span className="v2-market-asset-symbol">
                                {displaySymbol(asset.symbol)}
                              </span>
                              <span className="v2-market-asset-name">{asset.name}</span>
                            </span>
                          </button>
                          <div className="v2-market-asset-prices">
                            <span className="v2-market-asset-price">
                              {priceUsd !== null
                                ? `${formatNumber(priceUsd, priceUsd < 1 ? 6 : 2)} USD`
                                : price === null
                                ? loaded?.error
                                  ? 'Indisponible'
                                  : '—'
                                : `${formatNumber(price, price < 1 ? 6 : 2)} ${currency}`}
                            </span>
                            <span className="v2-market-asset-change" style={{ color: changeColor(change) }}>
                              {formatChange(change)}
                            </span>
                          </div>
                          {asset.kind === 'crypto' && (
                            <>
                              <MiniMarketChart
                                asset={asset}
                                points={chartPoints(asset, history?.history || null, null)}
                                loading={miniCharts.loading && !history}
                              />
                              <div className="v2-market-asset-borb">
                                {priceUsd !== null && assetBorbUsd
                                  ? `≈ ${formatNumber(priceUsd / assetBorbUsd, 4)} BORB`
                                  : 'BORB indisponible'}
                                <span>
                                  {assetQuoteToUsd === null
                                    ? `Taux ${currency} → USD indisponible`
                                    : 'Au taux régulateur'}
                                </span>
                              </div>
                              {history?.error && (
                                <span className="v2-market-quote-error">{history.error}</span>
                              )}
                            </>
                          )}
                          {loaded?.quote && (
                            <div
                              className={`v2-market-asset-change${loaded.quote.stale ? ' v2-market-asset-change--stale' : ''}`}
                            >
                              {quoteSource(loaded.quote)} · {quoteFreshness(loaded.quote)}
                            </div>
                          )}
                          <Button
                            block
                            size="sm"
                            variant="ghost"
                            onClick={() => setFocusedSymbol(asset.symbol)}
                          >
                            Voir l’analyse
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                )}
                {!showAll && visibleAssets.length > 4 && (
                  <Button
                    block
                    size="sm"
                    variant="secondary"
                    icon="forward"
                    onClick={() => setShowAll(true)}
                  >
                    Voir les {visibleAssets.length} {tab === 'crypto' ? 'cryptos' : tab === 'etf' ? 'ETF' : 'actions'}
                  </Button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
