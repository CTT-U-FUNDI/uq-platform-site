import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, Chip, ErrorBlock, Segmented, Skeleton } from './Ui';
import { Icon } from './Icon';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import { horodatageLabel, tooltipStyle, useChartTokens } from '../lib/charts';
import {
  getMarketOhlc,
  type MarketOhlcBar,
  type MarketOhlcResponse,
} from '../lib/api';
import {
  bougiesDepuisExecutions,
  macd as calculMacd,
  moyenneMobile,
  PERIODE_SECONDES,
  regrouperCandles,
  rsi as calculRsi,
  trierCandles,
  candleDepuisBarre,
  type Candle,
  type CandlePeriod,
} from '../lib/indicators';

/**
 * Graphique de paire visible par tous : bougies réelle (source externe OHLC
 * biquote) avec repli sur les exécutions internes de la paire quand la source
 * n'a pas de données. MA / RSI / MACD sont calculés sur les clôtures affichées.
 */

const PERIODS: { value: CandlePeriod; label: string }[] = [
  { value: '1h', label: '1 h' },
  { value: '4h', label: '4 h' },
  { value: '1j', label: '1 j' },
  { value: '1sem', label: '1 sem' },
  { value: '1mois', label: '1 mois' },
];

/** Intervalle demandé à la source externe pour chaque période affichée. */
const INTERVALLE_SOURCE: Record<CandlePeriod, string> = {
  '1h': '1h',
  '4h': '4h',
  '1j': '1d',
  '1sem': '1d',
  '1mois': '1d',
};

const LIMIT_SOURCE: Record<CandlePeriod, number> = {
  '1h': 120,
  '4h': 120,
  '1j': 180,
  '1sem': 365,
  '1mois': 365,
};

type VueIndicateur = 'aucun' | 'ma' | 'rsi' | 'macd';

function FormeChandelle(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: Candle & { range: [number, number] };
  haussiere?: string;
  baissiere?: string;
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload, haussiere, baissiere } = props;
  if (!payload) return null;
  const { open, high, low, close } = payload;
  const amplitude = high - low;
  const couleur = close >= open ? haussiere : baissiere;

  // Une barre « range » occupe [y, y+height] pour les valeurs [low, high] :
  // on en déduit la position en pixels du corps (open/close).
  const pixelsParUnite = amplitude > 0 ? height / amplitude : 0;
  const hautCorps = y + (high - Math.max(open, close)) * pixelsParUnite;
  const hauteurCorps = Math.max(Math.abs(close - open) * pixelsParUnite, 1.2);
  const centre = x + width / 2;

  return (
    <g>
      <line x1={centre} y1={y} x2={centre} y2={y + height} stroke={couleur} strokeWidth={1} />
      <rect
        x={x}
        y={hautCorps}
        width={Math.max(width, 1)}
        height={hauteurCorps}
        fill={couleur}
        opacity={0.9}
      />
    </g>
  );
}

export function PairCandles({
  base,
  quote,
  trades,
}: {
  base: string;
  quote: string;
  trades: { price: number; amount: number; created_at: number }[];
}) {
  const { theme } = useSession();
  const tokens = useChartTokens(theme);
  const [periode, setPeriode] = useState<CandlePeriod>('1h');
  const [indicateur, setIndicateur] = useState<VueIndicateur>('ma');

  const symbole = `${base}${quote}`;
  const externe = useAsync(
    () => getMarketOhlc(symbole, INTERVALLE_SOURCE[periode], LIMIT_SOURCE[periode]),
    [symbole, periode],
  );

  const { bougies, origine, source, perime } = useMemo<{
    bougies: Candle[];
    origine: 'externe' | 'interne' | 'aucune';
    source: string;
    perime: boolean;
  }>(() => {
    const reponse: MarketOhlcResponse | null = externe.data;
    const barres: MarketOhlcBar[] = reponse?.candles || [];
    const converties = barres
      .map((barre) => candleDepuisBarre(barre))
      .filter((entry): entry is Candle => entry !== null);

    if (reponse?.status === 'success' && converties.length > 0) {
      const triees = trierCandles(converties);
      const series =
        periode === '1sem' || periode === '1mois' ? regrouperCandles(triees, periode) : triees;
      return {
        bougies: series,
        origine: 'externe',
        source: reponse.source || 'biquote',
        perime: Boolean(reponse.stale),
      };
    }

    const internes = bougiesDepuisExecutions(trades, periode);
    return {
      bougies: internes,
      origine: internes.length > 0 ? 'interne' : 'aucune',
      source: internes.length > 0 ? 'executions internes' : reponse?.source || '',
      perime: false,
    };
  }, [externe.data, periode, trades]);

  const serie = useMemo(() => {
    const clotures = bougies.map((entry) => entry.close);
    const ma7 = moyenneMobile(clotures, 7);
    const ma25 = moyenneMobile(clotures, 25);
    const rsiValues = indicateur === 'rsi' ? calculRsi(clotures) : [];
    const macdValues =
      indicateur === 'macd' ? calculMacd(clotures) : { ligne: [], signal: [], histogramme: [] };
    return bougies.map((entry, index) => ({
      ...entry,
      range: [entry.low, entry.high] as [number, number],
      label: horodatageLabel(entry.time),
      ma7: ma7[index],
      ma25: ma25[index],
      rsi: rsiValues[index] ?? null,
      macdLigne: macdValues.ligne[index] ?? null,
      macdSignal: macdValues.signal[index] ?? null,
      macdHistogramme: macdValues.histogramme[index] ?? null,
      haussiere: entry.close >= entry.open,
    }));
  }, [bougies, indicateur]);

  const dernier = serie[serie.length - 1];
  const premier = serie[0];
  const variation =
    dernier && premier && premier.close > 0
      ? ((dernier.close - premier.close) / premier.close) * 100
      : null;
  /** Étendue réellement couverte par les bougies chargées. */
  const couvertureSecondes =
    dernier && premier
      ? Math.max(PERIODE_SECONDES[periode], dernier.time + PERIODE_SECONDES[periode] - premier.time)
      : 0;
  const couvertureLabel =
    couvertureSecondes >= 2 * 86400
      ? `${Math.round(couvertureSecondes / 86400)} jours`
      : `${Math.max(1, Math.round(couvertureSecondes / 3600))} heures`;

  const renduChandelle = (props: Parameters<typeof FormeChandelle>[0]) => (
    <FormeChandelle {...props} haussiere={tokens.positive} baissiere={tokens.negative} />
  );

  const badge =
    origine === 'externe'
      ? perime
        ? `${source} · cache`
        : `${source} · temps réel`
      : origine === 'interne'
        ? 'repli : exécutions internes'
        : null;

  return (
    <Card>
      <div className="v2-row-between" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
        <div>
          <div className="v2-h3" style={{ fontSize: 14 }}>
            {base} / {quote}
          </div>
          <div className="v2-muted" style={{ fontSize: 11.5 }}>
            {variation !== null && (
              <span style={{ color: variation >= 0 ? tokens.positive : tokens.negative }}>
                {variation >= 0 ? '+' : ''}
                {variation.toFixed(2)} %
              </span>
            )}
            {variation !== null ? ' · ' : ''}
            {serie.length > 0 ? `${serie.length} bougie(s) · ${couvertureLabel}` : 'aucune bougie'}
          </div>
        </div>
        {badge ? <span className="v2-badge">{badge}</span> : null}
      </div>

      <Segmented value={periode} onChange={setPeriode} options={PERIODS} />

      <div style={{ marginTop: 10 }}>
        {externe.loading && !externe.data ? (
          <Skeleton height={200} radius={14} />
        ) : externe.error ? (
          <ErrorBlock message={externe.error} onRetry={externe.reload} />
        ) : serie.length === 0 ? (
          <div className="v2-muted" style={{ fontSize: 12.5, padding: '18px 0' }}>
            {`Aucune bougie disponible pour ${base}${quote} : la source externe n'a pas d'historique sur cette paire et aucune exécution interne n'est enregistrée.`}
          </div>
        ) : (
          <>
            <div style={{ height: 200, marginLeft: -8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serie} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={tokens.grid} strokeDasharray="3 5" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tokens.tick, fontSize: 9.5 }}
                    interval="preserveStartEnd"
                    minTickGap={26}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    domain={['auto', 'auto']}
                    tick={{ fill: tokens.tick, fontSize: 9.5 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle(tokens)}
                    labelStyle={{ color: tokens.tick, fontWeight: 650 }}
                    formatter={(value: number | string, name: string) => {
                      if (name === 'range') return ['—', 'amplitude'];
                      return [typeof value === 'number' ? value.toFixed(4) : String(value), name];
                    }}
                  />
                  <Bar dataKey="range" shape={renduChandelle} isAnimationActive={false} />
                  {indicateur === 'ma' ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="ma7"
                        stroke={tokens.gold}
                        strokeWidth={1.4}
                        dot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="ma25"
                        stroke={tokens.line}
                        strokeWidth={1.4}
                        dot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    </>
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ height: 54, marginLeft: -8, marginTop: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serie} margin={{ top: 2, right: 6, left: 0, bottom: 0 }}>
                  <XAxis hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={tooltipStyle(tokens)}
                    formatter={(value: number) => [value.toFixed(2), 'volume']}
                  />
                  <Bar dataKey="volume" isAnimationActive={false} fill={tokens.grid} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 10,
                alignItems: 'center',
              }}
            >
              <Chip active={indicateur === 'aucun'} onClick={() => setIndicateur('aucun')}>
                <Icon name="market" size={13} /> Bougies seules
              </Chip>
              <Chip active={indicateur === 'ma'} onClick={() => setIndicateur('ma')}>
                <Icon name="trendUp" size={13} /> MA 7 / 25
              </Chip>
              <Chip active={indicateur === 'rsi'} onClick={() => setIndicateur('rsi')}>
                <Icon name="filter" size={13} /> RSI 14
              </Chip>
              <Chip active={indicateur === 'macd'} onClick={() => setIndicateur('macd')}>
                <Icon name="trendDown" size={13} /> MACD 12/26/9
              </Chip>
            </div>

            {indicateur === 'rsi' || indicateur === 'macd' ? (
              <div style={{ height: 110, marginLeft: -8, marginTop: 10 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={serie} margin={{ top: 4, right: 6, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={tokens.grid} strokeDasharray="3 5" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: tokens.tick, fontSize: 9 }}
                      interval="preserveStartEnd"
                      minTickGap={30}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={52}
                      domain={indicateur === 'rsi' ? [0, 100] : ['auto', 'auto']}
                      tick={{ fill: tokens.tick, fontSize: 9 }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle(tokens)}
                      labelStyle={{ color: tokens.tick, fontWeight: 650 }}
                      formatter={(value: number, name: string) => [
                        typeof value === 'number' ? value.toFixed(indicateur === 'rsi' ? 1 : 5) : String(value),
                        name,
                      ]}
                    />
                    {indicateur === 'rsi' ? (
                      <Line
                        dataKey="rsi"
                        stroke={tokens.gold}
                        strokeWidth={1.8}
                        dot={false}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    ) : (
                      <>
                        <Bar
                          dataKey="macdHistogramme"
                          isAnimationActive={false}
                          fill={tokens.grid}
                        />
                        <Line
                          dataKey="macdLigne"
                          stroke={tokens.gold}
                          strokeWidth={1.6}
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          dataKey="macdSignal"
                          stroke={tokens.line}
                          strokeWidth={1.4}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : null}

            <div className="v2-muted" style={{ fontSize: 11, marginTop: 8 }}>
              {origine === 'externe'
                ? `Bougies ${source} · ${serie.length} période(s) de ${periode}`
                : `Bougies reconstruites à partir de ${trades.length} exécution(s) interne(s) — la source externe n'a pas d'historique sur ${base}${quote}.`}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
