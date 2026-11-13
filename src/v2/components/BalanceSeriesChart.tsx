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
import { Card, EmptyState, ErrorBlock, Hint, Segmented, Skeleton, Stat } from './Ui';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import { formatInt } from '../lib/format';
import { getBalanceSeries } from '../lib/api';
import {
  jourLabel,
  SERIES_PERIODS,
  tooltipStyle,
  useChartTokens,
  type SeriesPeriod,
} from '../lib/charts';

/**
 * Courbe privée du coffre : agrégation de tout le grand livre du compte, jour par
 * jour, sur la fenêtre choisie.
 *
 * La valeur tracée dépend de ce que les données permettent de prétendre. Si le
 * grand livre explique le solde affiché (`reconcilie`), la courbe est le solde.
 * Sinon elle reste le cumul des flux enregistrés — un solde reconstruit de force
 * serait une valeur inventée — et l'écart est affiché tel quel.
 */
export function BalanceSeriesChart({ uq }: { uq: string }) {
  const { theme } = useSession();
  const tokens = useChartTokens(theme);
  const [periode, setPeriode] = useState<SeriesPeriod>('30j');
  const serie = useAsync(() => getBalanceSeries(uq, periode), [uq, periode], {
    enabled: Boolean(uq),
  });

  const reconcilie = serie.data?.reconcilie ?? false;
  const nomSerie = reconcilie ? 'Solde' : 'Cumul des flux';

  const points = useMemo(
    () =>
      (serie.data?.series ?? []).map((point) => ({
        ...point,
        label: jourLabel(point.date),
        valeur: reconcilie ? point.solde_points : point.cumul_flux,
      })),
    [serie.data, reconcilie],
  );

  const premier = points[0];
  const dernier = points[points.length - 1];
  const couleur =
    premier && dernier && Number(dernier.valeur) >= Number(premier.valeur)
      ? tokens.positive
      : tokens.negative;
  const variation =
    premier && dernier && Number(premier.valeur) !== 0
      ? ((Number(dernier.valeur) - Number(premier.valeur)) / Math.abs(Number(premier.valeur))) *
        100
      : null;

  const totaux = useMemo(() => {
    let entrees = 0;
    let sorties = 0;
    let transactions = 0;
    for (const point of points) {
      entrees += point.entrees;
      sorties += point.sorties;
      transactions += point.transactions;
    }
    return { entrees, sorties, transactions };
  }, [points]);

  const nonClasses = Object.entries(serie.data?.types_non_classes ?? {});
  const rejetees = serie.data?.lignes_rejetees ?? 0;

  return (
    <Card>
      <div className="v2-row-between" style={{ marginBottom: 8, alignItems: 'flex-start' }}>
        <div>
          <div className="v2-h3" style={{ fontSize: 14 }}>
            Évolution du coffre
          </div>
          <div className="v2-muted" style={{ fontSize: 11.5 }}>
            {points.length > 0
              ? `${points.length} jour(s) avec mouvement · ${periode}`
              : `Aucun mouvement sur ${periode}`}
            {variation !== null && (
              <span style={{ color: couleur }}>
                {' · '}
                {variation >= 0 ? '+' : ''}
                {variation.toFixed(2)} %
              </span>
            )}
          </div>
        </div>
        <span className={`v2-badge ${reconcilie ? 'v2-badge--positive' : 'v2-badge--warning'}`}>
          {reconcilie ? 'solde réconcilié' : 'cumul des flux'}
        </span>
      </div>

      <Segmented value={periode} onChange={setPeriode} options={SERIES_PERIODS} />

      <div style={{ marginTop: 12 }}>
        {serie.loading && !serie.data ? (
          <Skeleton height={190} radius={14} />
        ) : serie.error ? (
          <ErrorBlock message={serie.error} onRetry={serie.reload} />
        ) : points.length === 0 ? (
          <EmptyState
            icon="trendUp"
            title="Aucun mouvement"
            description={`Aucune opération enregistrée sur ${periode}. Les entrées et les sorties composent cette courbe dès le premier mouvement.`}
          />
        ) : (
          <>
            <div style={{ height: 182, marginLeft: -8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={points} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={tokens.grid} strokeDasharray="3 5" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tokens.tick, fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={56}
                    domain={['auto', 'auto']}
                    tick={{ fill: tokens.tick, fontSize: 10 }}
                    tickFormatter={(value: number) => `${formatInt(value)} pts`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle(tokens)}
                    labelStyle={{ color: tokens.tick, fontWeight: 650 }}
                    formatter={(value: number) => [`${formatInt(Number(value))} pts`, nomSerie]}
                  />
                  <Line
                    type="monotone"
                    dataKey="valeur"
                    stroke={couleur}
                    strokeWidth={2.4}
                    dot={points.length <= 2}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ height: 62, marginLeft: -8, marginTop: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={points} margin={{ top: 2, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={tooltipStyle(tokens)}
                    formatter={(value: number, name: string) => [
                      `${formatInt(Number(value))} pts`,
                      name === 'entrees' ? 'Reçu ce jour' : 'Envoyé ce jour',
                    ]}
                  />
                  <Bar dataKey="entrees" fill={tokens.positive} isAnimationActive={false} />
                  <Bar dataKey="sorties" fill={tokens.negative} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

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
                label="Solde actuel"
                value={`${formatInt(serie.data?.solde_actuel_points ?? 0)} pts`}
                hint={
                  reconcilie
                    ? 'Expliqué par le grand livre sur toute l’histoire du compte'
                    : `Écart grand livre / solde : ${formatInt(
                        serie.data?.ecart_reconciliation_points ?? 0,
                      )} pts`
                }
              />
              <Stat
                label={`Reçu · ${periode}`}
                value={`${formatInt(totaux.entrees)} pts`}
                hint={`${totaux.transactions} opération(s) sur ${points.length} jour(s)`}
              />
              <Stat
                label={`Envoyé · ${periode}`}
                value={`${formatInt(totaux.sorties)} pts`}
                hint="Montants débités, frais inclus"
              />
            </div>

            {!reconcilie || nonClasses.length > 0 || rejetees > 0 ? (
              <div style={{ marginTop: 12 }}>
                <Hint tone="warning">
                  {!reconcilie
                    ? 'La courbe affiche le cumul des flux du grand livre, pas un solde : les lignes enregistrées n’expliquent pas le solde affiché. Aucun point n’est inventé pour combler l’écart.'
                    : 'La courbe est le solde du compte, réconcilié avec le grand livre.'}
                  {nonClasses.length > 0
                    ? ` Types non classés : ${nonClasses
                        .map(([type, n]) => `${type} (${n})`)
                        .join(', ')}.`
                    : ''}
                  {rejetees > 0
                    ? ` ${rejetees} ligne(s) ignorée(s) : leur statut n’est pas « success ».`
                    : ''}
                </Hint>
              </div>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}
