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
import { Card, Chip, EmptyState, ErrorBlock, Hint, Segmented, Skeleton, Stat } from './Ui';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import { formatNumber } from '../lib/format';
import { getTradingPerformance } from '../lib/trading';
import { jourLabel, SERIES_PERIODS, tooltipStyle, useChartTokens, type SeriesPeriod } from '../lib/charts';

/**
 * Performance personnelle d'un compte : PnL réalisé par appariement FIFO des
 * exécutions, volume et nombre de trades jour par jour.
 *
 * Le backend libelle chaque paire dans sa devise `quote`, donc rien n'est summé
 * entre devises : l'utilisateur choisit la devise lue. Sans lot acheté, une vente
 * n'est pas considérée comme une position courte : elle est seulement comptée.
 */

const montant = (value: number | null | undefined, devise: string): string => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return `— ${devise}`;
  return `${n >= 0 ? '' : '−'}${formatNumber(Math.abs(n), Math.abs(n) >= 1000 ? 0 : 2)} ${devise}`;
};

export function TradingPerformance({ uq }: { uq: string }) {
  const { theme } = useSession();
  const tokens = useChartTokens(theme);
  const [periode, setPeriode] = useState<SeriesPeriod>('30j');
  const [devise, setDevise] = useState('');

  const perf = useAsync(() => getTradingPerformance(uq, periode), [uq, periode], {
    enabled: Boolean(uq),
  });

  const devises = perf.data?.devises ?? [];
  const deviseActive = useMemo(() => {
    if (devises.length === 0) return '';
    return devises.some((entry) => entry.devise === devise) ? devise : devises[0].devise;
  }, [devises, devise]);

  const points = useMemo(
    () =>
      (perf.data?.series?.[deviseActive] ?? []).map((point) => ({
        ...point,
        label: jourLabel(point.date),
      })),
    [perf.data, deviseActive],
  );

  const totaux = devises.find((entry) => entry.devise === deviseActive);
  const positions = (perf.data?.positions_ouvertes ?? []).filter(
    (position) => position.devise === deviseActive
  );
  const couleurCumul =
    points.length > 0 && points[points.length - 1].pnl_cumule >= 0
      ? tokens.positive
      : tokens.negative;

  const executions = perf.data?.executions_comptees ?? 0;
  const nonApparies = perf.data?.lots_non_apparies ?? 0;

  return (
    <Card>
      <div className="v2-row-between" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
        <div>
          <div className="v2-h3" style={{ fontSize: 14 }}>
            Ma performance
          </div>
          <div className="v2-muted" style={{ fontSize: 11.5 }}>
            {executions > 0
              ? `${executions} exécution(s) appariée(s) en FIFO · ${periode}`
              : 'Aucune exécution enregistrée sur ce compte'}
          </div>
        </div>
        {executions > 0 ? (
          <span
            className={`v2-badge ${
              (totaux?.pnl_realise ?? 0) >= 0 ? 'v2-badge--positive' : 'v2-badge--negative'
            }`}
          >
            {totaux ? `PnL ${montant(totaux.pnl_realise, totaux.devise)}` : '—'}
          </span>
        ) : null}
      </div>

      <Segmented value={periode} onChange={setPeriode} options={SERIES_PERIODS} />

      <div style={{ marginTop: 12 }}>
        {perf.loading && !perf.data ? (
          <Skeleton height={190} radius={14} />
        ) : perf.error ? (
          <ErrorBlock message={perf.error} onRetry={perf.reload} />
        ) : devises.length === 0 ? (
          <EmptyState
            icon="trendUp"
            title="Aucune exécution à mesurer"
            description="Le graphique se construit à partir des exécutions réellement enregistrées. Place un ordre qui est exécuté pour voir apparaître le volume, le nombre de trades et le PnL réalisé."
          />
        ) : (
          <>
            {devises.length > 1 ? (
              <div className="v2-scroll-x" style={{ marginBottom: 10 }}>
                {devises.map((entry) => (
                  <Chip
                    key={entry.devise}
                    active={entry.devise === deviseActive}
                    onClick={() => setDevise(entry.devise)}
                  >
                    {entry.devise}
                  </Chip>
                ))}
              </div>
            ) : null}

            {points.length === 0 ? (
              <div className="v2-muted" style={{ fontSize: 12.5, padding: '14px 0' }}>
                {`Aucune exécution en ${deviseActive} sur ${periode} : l'historique plus ancien existe mais tombe hors de la fenêtre choisie.`}
              </div>
            ) : (
              <>
                <div style={{ height: 196, marginLeft: -8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={points} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke={tokens.grid} strokeDasharray="3 5" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: tokens.tick, fontSize: 10 }}
                        interval="preserveStartEnd"
                        minTickGap={22}
                      />
                      <YAxis
                        yAxisId="volume"
                        axisLine={false}
                        tickLine={false}
                        width={54}
                        tick={{ fill: tokens.tick, fontSize: 10 }}
                        tickFormatter={(value: number) => formatNumber(value, 0)}
                      />
                      <YAxis
                        yAxisId="pnl"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        width={54}
                        domain={['auto', 'auto']}
                        tick={{ fill: tokens.tick, fontSize: 10 }}
                        tickFormatter={(value: number) => formatNumber(value, 0)}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle(tokens)}
                        labelStyle={{ color: tokens.tick, fontWeight: 650 }}
                        formatter={(value: number, name: string) => {
                          if (name === 'trades') return [String(value), 'Trades du jour'];
                          return [montant(Number(value), deviseActive), name === 'volume' ? 'Volume' : 'PnL cumulé'];
                        }}
                      />
                      <Bar
                        yAxisId="volume"
                        dataKey="volume"
                        fill={tokens.grid}
                        isAnimationActive={false}
                        radius={[3, 3, 0, 0]}
                      />
                      <Line
                        yAxisId="pnl"
                        type="monotone"
                        dataKey="pnl_cumule"
                        stroke={couleurCumul}
                        strokeWidth={2.4}
                        dot={points.length <= 2}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ height: 58, marginLeft: -8, marginTop: 4 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={points} margin={{ top: 2, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" hide />
                      <YAxis hide yAxisId="trades" />
                      <Tooltip
                        contentStyle={tooltipStyle(tokens)}
                        formatter={(value: number) => [String(value), 'Trades du jour']}
                      />
                      <Bar
                        yAxisId="trades"
                        dataKey="trades"
                        fill={tokens.line}
                        isAnimationActive={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 12,
                alignItems: 'flex-end',
              }}
            >
              <Stat
                label={`PnL réalisé · ${periode}`}
                value={montant(totaux?.pnl_realise ?? 0, deviseActive)}
                hint="Ventes appariées à des achats, hors frais"
              />
              <Stat
                label={`Volume · ${periode}`}
                value={montant(totaux?.volume ?? 0, deviseActive)}
                hint={`${totaux?.trades ?? 0} trade(s) sur ${points.length} jour(s)`}
              />
              <Stat
                label={`Positions ouvertes · ${deviseActive}`}
                value={String(positions.length)}
                hint={
                  positions.length > 0
                    ? positions
                        .slice(0, 2)
                        .map((p) => `${p.pair} ${formatNumber(p.quantite, 4)}`)
                        .join(' · ') + (positions.length > 2 ? ' …' : '')
                    : 'Aucun lot restant'
                }
              />
            </div>

            {nonApparies > 0 ? (
              <div style={{ marginTop: 12 }}>
                <Hint tone="warning">
                  {`${nonApparies} vente(s) n’ont trouvé aucun lot acheté à appairer. Elles sont comptées dans le volume et le nombre de trades, mais aucun PnL ne leur est attribué : une vente à découvert n’est pas inventée.`}
                </Hint>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}
