import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Icon } from '../components/Icon';
import { Card, ErrorBlock, ScreenHeader, Skeleton, Stat } from '../components/Ui';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import {
  getProfileStats,
  getWalletAnalytics,
  getZandoAnalytics,
  listShopItems,
  sqlStamp,
} from '../lib/api';
import { estVitrineBoutique, formatCount, formatDate, formatNumber } from '../lib/format';
import { SERIES_PERIODS, jourLabel, tooltipStyle, useChartTokens, type SeriesPeriod } from '../lib/charts';
import { getTradingPerformance } from '../lib/trading';

export function ProfileAnalyticsScreen({ onBack }: { onBack: () => void }) {
  const { uq, pseudo, theme } = useSession();
  const [period, setPeriod] = useState<SeriesPeriod>('30j');
  const [currency, setCurrency] = useState('');
  const chartTokens = useChartTokens(theme);
  const wallet = useAsync(() => getWalletAnalytics(uq, period), [uq, period], { enabled: Boolean(uq) });
  const publicStats = useAsync(() => getProfileStats(uq), [uq], { enabled: Boolean(uq) });
  const zando = useAsync(() => getZandoAnalytics(uq), [uq], { enabled: Boolean(uq) });
  const trading = useAsync(() => getTradingPerformance(uq, period), [uq, period], { enabled: Boolean(uq) });
  const historique = useAsync(() => listShopItems(uq), [uq], { enabled: Boolean(uq) });

  const tradingCurrencies = trading.data?.devises || [];
  const activeCurrency =
    tradingCurrencies.find((entry) => entry.devise === currency)?.devise ||
    tradingCurrencies[0]?.devise ||
    '';
  const tradingSeries = activeCurrency ? trading.data?.series[activeCurrency] || [] : [];
  const tradingSummary = tradingSeries.reduce(
    (summary, point) => ({
      pnl: summary.pnl + point.pnl_realise,
      volume: summary.volume + point.volume,
      trades: summary.trades + point.trades,
    }),
    { pnl: 0, volume: 0, trades: 0 },
  );
  const zandoSummary = (zando.data?.daily || []).reduce(
    (summary, day) => ({
      views: summary.views + day.views,
      likes: summary.likes + day.likes,
    }),
    { views: 0, likes: 0 },
  );
  /** Objets passés : vendus ou sortis du flux après 48 h. Texte seul, jamais la photo. */
  const objetsPasses = (historique.data?.items || [])
    .filter((item) => !estVitrineBoutique(item))
    .filter((item) => {
      if (item.sold) return true;
      const fin = sqlStamp(item.expires_at);
      return item.published === false && Boolean(item.published_at) && fin > 0 && fin <= Date.now();
    })
    .sort(
      (a, b) =>
        sqlStamp(b.sold_at || b.expires_at) - sqlStamp(a.sold_at || a.expires_at),
    );
  const walletTotals = wallet.data?.totals;
  const nonClassifiedTypes = Object.keys(wallet.data?.types_non_classes || {});
  const leadingSource = [...(wallet.data?.sources || [])]
    .filter((source) => source.direction === 'entree')
    .sort((a, b) => b.amount - a.amount)[0];
  const globalPoints = new Map<
    string,
    { date: string; wallet: number | null; zando: number | null; trading: number | null }
  >();
  for (const point of wallet.data?.series || []) {
    globalPoints.set(point.date, { date: point.date, wallet: point.net, zando: null, trading: null });
  }
  for (const point of zando.data?.daily || []) {
    const entry = globalPoints.get(point.date) || {
      date: point.date,
      wallet: null,
      zando: null,
      trading: null,
    };
    entry.zando = point.views;
    globalPoints.set(point.date, entry);
  }
  for (const point of tradingSeries) {
    const entry = globalPoints.get(point.date) || {
      date: point.date,
      wallet: null,
      zando: null,
      trading: null,
    };
    entry.trading = point.pnl_realise;
    globalPoints.set(point.date, entry);
  }
  const globalRows = [...globalPoints.values()].sort((a, b) => a.date.localeCompare(b.date));
  const normalize = (values: (number | null)[]) => {
    const present = values.filter((value): value is number => value !== null);
    if (present.length === 0) return values.map(() => null);
    const minimum = Math.min(...present);
    const maximum = Math.max(...present);
    return values.map((value) =>
      value === null ? null : maximum === minimum ? 50 : ((value - minimum) / (maximum - minimum)) * 100,
    );
  };
  const walletIndex = normalize(globalRows.map((row) => row.wallet));
  const zandoIndex = normalize(globalRows.map((row) => row.zando));
  const tradingIndex = normalize(globalRows.map((row) => row.trading));
  const globalTrend = globalRows.map((row, index) => ({
    date: row.date,
    wallet: walletIndex[index],
    zando: zandoIndex[index],
    trading: tradingIndex[index],
  }));

  return (
    <>
      <ScreenHeader
        title="Tableau analytique"
        subtitle={pseudo ? `@${pseudo} · données privées` : 'Activité réelle de tes services UQ'}
        onBack={onBack}
      />
      <div className="v2-pad">
        <Card>
          <div className="v2-row-between" style={{ gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Période d’analyse</div>
              <div className="v2-muted" style={{ fontSize: 12 }}>
                Les sources fournissent des données quotidiennes, pas des mesures à la seconde ou à la minute.
              </div>
            </div>
            <select
              className="v2-input"
              aria-label="Période du tableau analytique"
              value={period}
              onChange={(event) => setPeriod(event.target.value as SeriesPeriod)}
              style={{ width: 'auto', minHeight: 36, padding: '4px 10px', fontSize: 12 }}
            >
              {SERIES_PERIODS.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          {wallet.loading && !wallet.data ? (
            <Skeleton height={86} radius={14} />
          ) : wallet.error ? (
            <ErrorBlock message={wallet.error} onRetry={wallet.reload} />
          ) : (
            <>
              <div className="v2-row-between" style={{ marginBottom: 10 }}>
                <span className="v2-muted" style={{ fontSize: 12 }}>Solde actuel du coffre</span>
                <span style={{ fontWeight: 800, fontSize: 15 }}>
                  {formatNumber(wallet.data?.solde_actuel_points ?? 0, 0)} pts
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Stat label="Entrées coffre" value={`${formatNumber(walletTotals?.entrees ?? 0, 0)} pts`} />
                <Stat label="Sorties coffre" value={`${formatNumber(walletTotals?.sorties ?? 0, 0)} pts`} />
                <Stat label="Flux net" value={`${formatNumber(walletTotals?.net ?? 0, 0)} pts`} />
              </div>
              <div className="v2-muted" style={{ fontSize: 11, marginTop: 8 }}>
                {wallet.data?.reconcilie
                  ? 'Le grand livre classifié correspond au solde du coffre.'
                  : `Écart de ${formatNumber(wallet.data?.ecart_reconciliation_points ?? 0, 0)} pts et ${formatCount(wallet.data?.lignes_non_classifiees_historique ?? 0)} écriture(s) non classifiée(s) dans l’historique complet.`}
              </div>
              <div
                className="v2-hint"
                data-tone={Number(walletTotals?.net || 0) >= 0 ? 'positive' : 'warning'}
                style={{ marginTop: 12 }}
              >
                <Icon name="trendUp" size={15} />
                <span className="v2-hint-text">
                  {leadingSource
                    ? `${leadingSource.label} est la principale source d’entrées du coffre sur cette période.`
                    : 'Aucune entrée classifiée dans le coffre sur cette période.'}
                </span>
              </div>
              <div className="v2-muted" style={{ fontSize: 11.5, marginTop: 8 }}>
                Les transferts et échanges P2P sont des mouvements de solde, pas des revenus commerciaux.
                Seules les récompenses UBI sont identifiées comme revenu généré.
              </div>
            </>
          )}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 750, fontSize: 14, marginBottom: 4 }}>Tendance globale des activités</div>
          <div className="v2-muted" style={{ fontSize: 11.5, marginBottom: 8 }}>
            Lignes normalisées séparément sur 0–100 : elles comparent les évolutions, pas les montants.
            {' '}Zando fournit {zando.data?.period_days ?? 30} jours d’historique.
          </div>
          {globalTrend.length ? (
            <div style={{ height: 230 }} aria-label="Comparaison des tendances du coffre, Zando et trading">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={globalTrend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke={chartTokens.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={jourLabel} tick={{ fill: chartTokens.tick, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis domain={[0, 100]} tick={{ fill: chartTokens.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
                  <Tooltip
                    contentStyle={tooltipStyle(chartTokens)}
                    labelFormatter={(label) => jourLabel(String(label))}
                    formatter={(value: number, name: string) => [
                      value === null ? '—' : `${formatNumber(value, 0)}/100`,
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="wallet" name="Coffre · flux net" stroke={chartTokens.line} strokeWidth={2} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="zando" name="Zando · vues" stroke={chartTokens.gold} strokeWidth={2} dot={false} connectNulls={false} />
                  <Line type="monotone" dataKey="trading" name="Trading · PnL réalisé" stroke={chartTokens.positive} strokeWidth={2} dot={false} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="v2-muted" style={{ padding: '20px 4px', textAlign: 'center', fontSize: 12.5 }}>
              Le graphique apparaîtra dès que les sources fourniront des activités enregistrées.
            </div>
          )}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 750, fontSize: 14, marginBottom: 8 }}>Mouvements du coffre</div>
          {wallet.loading && !wallet.data ? (
            <Skeleton height={200} radius={14} />
          ) : wallet.error ? (
            <ErrorBlock message={wallet.error} onRetry={wallet.reload} />
          ) : wallet.data?.series.length ? (
            <div style={{ height: 210 }} aria-label="Graphique des entrées et sorties du coffre">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wallet.data.series} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke={chartTokens.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={jourLabel}
                    tick={{ fill: chartTokens.tick, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: chartTokens.tick, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle(chartTokens)}
                    labelFormatter={(label) => jourLabel(String(label))}
                    formatter={(value: number, name: string) => [
                      `${formatNumber(value, 0)} pts`,
                      name === 'entrees' ? 'Entrées' : 'Sorties',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="entrees"
                    name="entrees"
                    stroke={chartTokens.line}
                    fill={chartTokens.line}
                    fillOpacity={0.14}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="sorties"
                    name="sorties"
                    stroke={chartTokens.gold}
                    fill={chartTokens.gold}
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="v2-muted" style={{ padding: '20px 4px', textAlign: 'center', fontSize: 12.5 }}>
              Aucun mouvement de coffre sur cette période.
            </div>
          )}
          {wallet.data?.sources.length ? (
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {wallet.data.sources.map((source) => (
                <div key={source.code} className="v2-row-between" style={{ borderTop: '1px solid var(--v2-line)', paddingTop: 8 }}>
                  <div>
                    <div style={{ fontWeight: 650, fontSize: 12.5 }}>{source.label}</div>
                    <div className="v2-muted" style={{ fontSize: 11 }}>
                      {source.direction === 'entree' ? 'Entrées' : 'Sorties'} · {formatCount(source.transactions)} opérations
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {formatNumber(source.amount, 0)} pts
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {nonClassifiedTypes.length > 0 ? (
            <div className="v2-muted" style={{ fontSize: 11, marginTop: 10 }}>
              {formatCount(nonClassifiedTypes.length)} type(s) de transaction restent non classifiés pour éviter une attribution erronée.
            </div>
          ) : null}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <div className="v2-row-between" style={{ marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 750, fontSize: 14 }}>Visibilité Zando</div>
              <div className="v2-muted" style={{ fontSize: 11.5 }}>30 derniers jours · activité, pas revenu</div>
            </div>
            <Icon name="market" size={19} style={{ color: 'var(--v2-accent)' }} />
          </div>
          {zando.loading && !zando.data ? (
            <Skeleton height={180} radius={14} />
          ) : zando.error ? (
            <ErrorBlock message={zando.error} onRetry={zando.reload} />
          ) : zando.data?.daily.length ? (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                <Stat label="Vues" value={formatCount(zandoSummary.views)} />
                <Stat label="Likes" value={formatCount(zandoSummary.likes)} />
                <Stat
                  label="Ventes"
                  value={publicStats.data ? formatCount(publicStats.data.stats.ventes) : '—'}
                />
              </div>
              <div style={{ height: 190 }} aria-label="Graphique des vues et likes Zando sur 30 jours">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={zando.data.daily} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={chartTokens.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={jourLabel} tick={{ fill: chartTokens.tick, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis allowDecimals={false} tick={{ fill: chartTokens.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip
                      contentStyle={tooltipStyle(chartTokens)}
                      labelFormatter={(label) => jourLabel(String(label))}
                      formatter={(value: number, name: string) => [formatCount(value), name === 'views' ? 'Vues' : 'Likes']}
                    />
                    <Area type="monotone" dataKey="views" name="views" stroke={chartTokens.line} fill={chartTokens.line} fillOpacity={0.14} strokeWidth={2} />
                    <Area type="monotone" dataKey="likes" name="likes" stroke={chartTokens.gold} fill={chartTokens.gold} fillOpacity={0.12} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="v2-muted" style={{ fontSize: 11, marginTop: 8 }}>
                Le montant des ventes Zando n’est pas fourni par cette source; il n’est donc pas additionné aux revenus du coffre.
              </div>
            </>
          ) : (
            <div className="v2-muted" style={{ padding: '20px 4px', textAlign: 'center', fontSize: 12.5 }}>
              Les vues et likes de tes publications apparaîtront ici.
            </div>
          )}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <div className="v2-row-between" style={{ marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 750, fontSize: 14 }}>Objets passés</div>
              <div className="v2-muted" style={{ fontSize: 11.5 }}>
                Vente solo · historique texte, sans photo
              </div>
            </div>
            <Icon name="receipt" size={19} style={{ color: 'var(--v2-accent)' }} />
          </div>
          {historique.loading && !historique.data ? (
            <Skeleton height={80} radius={14} />
          ) : historique.error ? (
            <ErrorBlock message={historique.error} onRetry={historique.reload} />
          ) : objetsPasses.length === 0 ? (
            <div className="v2-muted" style={{ padding: '16px 4px', textAlign: 'center', fontSize: 12.5 }}>
              Les objets vendus ou sortis après 48 h laisseront ici leur trace, sans photo.
            </div>
          ) : (
            <div className="v2-stack" style={{ gap: 8 }}>
              {objetsPasses.slice(0, 20).map((item) => {
                const date = sqlStamp(item.sold_at || item.expires_at);
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 14,
                      background: 'var(--v2-surface-2)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{item.title || 'Sans titre'}</div>
                      <div className="v2-muted" style={{ fontSize: 11.5 }}>
                        {[
                          item.subtitle || (item.description ? item.description.slice(0, 90) : null),
                          item.category || null,
                          date ? formatDate(date) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flex: 'none' }}>
                      <div style={{ fontWeight: 750, fontSize: 13 }}>
                        {formatCount(item.price_borb)} BORB
                      </div>
                      <span className={`v2-badge ${item.sold ? 'v2-badge--positive' : 'v2-badge--warning'}`}>
                        {item.sold ? 'vendu' : 'expiré'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <div className="v2-row-between" style={{ gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 750, fontSize: 14 }}>Résultat réalisé du trading</div>
              <div className="v2-muted" style={{ fontSize: 11.5 }}>Séparé des entrées du coffre</div>
            </div>
            {tradingCurrencies.length > 1 ? (
              <select
                className="v2-input"
                aria-label="Devise de la performance trading"
                value={activeCurrency}
                onChange={(event) => setCurrency(event.target.value)}
                style={{ width: 'auto', minHeight: 36, padding: '4px 10px', fontSize: 12 }}
              >
                {tradingCurrencies.map((entry) => (
                  <option key={entry.devise} value={entry.devise}>{entry.devise}</option>
                ))}
              </select>
            ) : null}
          </div>
          {trading.loading && !trading.data ? (
            <Skeleton height={190} radius={14} />
          ) : trading.error ? (
            <ErrorBlock message={trading.error} onRetry={trading.reload} />
          ) : !activeCurrency || !tradingSeries.length ? (
            <div className="v2-muted" style={{ padding: '20px 4px', textAlign: 'center', fontSize: 12.5 }}>
              Les résultats de trading apparaîtront ici après des transactions clôturées.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                <Stat label="PnL réalisé" value={`${formatNumber(tradingSummary.pnl, 2)} ${activeCurrency}`} />
                <Stat label="Volume" value={`${formatNumber(tradingSummary.volume, 2)} ${activeCurrency}`} />
                <Stat label="Transactions" value={formatCount(tradingSummary.trades)} />
              </div>
              <div style={{ height: 190 }} aria-label={`Graphique du résultat trading en ${activeCurrency}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tradingSeries} margin={{ top: 8, right: 6, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={chartTokens.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={jourLabel} tick={{ fill: chartTokens.tick, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fill: chartTokens.tick, fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip
                      contentStyle={tooltipStyle(chartTokens)}
                      labelFormatter={(label) => jourLabel(String(label))}
                      formatter={(value: number) => [`${formatNumber(value, 2)} ${activeCurrency}`, 'PnL réalisé']}
                    />
                    <Line type="monotone" dataKey="pnl_cumule" name="PnL réalisé" stroke={chartTokens.line} strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 750, fontSize: 14, marginBottom: 8 }}>Statistiques du profil</div>
          {publicStats.loading && !publicStats.data ? (
            <Skeleton height={54} radius={12} />
          ) : publicStats.error ? (
            <ErrorBlock message={publicStats.error} onRetry={publicStats.reload} />
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              <Stat label="Abonnés" value={formatCount(publicStats.data?.stats.total_abonnes ?? 0)} />
              <Stat label="Likes reçus" value={formatCount(publicStats.data?.stats.total_likes_recus ?? 0)} />
              <Stat label="Confiance" value={`${formatNumber(publicStats.data?.score_confiance.total ?? 0, 0)}/100`} />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
