import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Icon } from './Icon';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorBlock,
  Hint,
  KeyValue,
  Loader,
  Row,
  SectionTitle,
  Segmented,
  Skeleton,
  Stat,
} from './Ui';
import { useAsync } from '../lib/hooks';
import { useSession } from '../lib/session';
import { formatCurrency, formatInt, formatNumber } from '../lib/format';
import { getEarnContext, getEarnRewards, type EarnPeriod } from '../lib/trading';

/**
 * Gagnez V2 : courbe réelle des récompenses Earn (`earn_rewards` côté backend),
 * agrégée par jour et par devise. Période et devise sont choisies par
 * l'utilisateur ; rien n'est interpolé entre deux jours sans versement.
 */

const PERIODS: { value: EarnPeriod; label: string }[] = [
  { value: '7j', label: '7 j' },
  { value: '30j', label: '30 j' },
  { value: '1an', label: '1 an' },
];

/** « 2026-10-05 » → « 05/10 » (libellé court de l'axe horizontal). */
const jourLabel = (date: string): string => {
  const parts = date.split('-');
  if (parts.length < 3) return date;
  return `${parts[2]}/${parts[1]}`;
};

/**
 * Les couleurs du graphique suivent les tokens CSS de la racine v2 : elles sont
 * lues au moment du rendu pour rester correctes en thème clair comme en sombre.
 */
function useChartColors(theme: string) {
  return useMemo(() => {
    const host = document.querySelector('.v2-root') || document.documentElement;
    const token = (name: string) => getComputedStyle(host).getPropertyValue(name).trim();
    return {
      line: token('--v2-accent') || 'currentColor',
      grid: token('--v2-surface-3') || 'currentColor',
      tick: token('--v2-ink-3') || 'currentColor',
      ink: token('--v2-ink') || 'currentColor',
      surface: token('--v2-surface') || 'transparent',
      border: token('--v2-line') || token('--v2-surface-3'),
    };
  }, [theme]);
}

export function EarnPanel() {
  const { uq, theme } = useSession();
  const [periode, setPeriode] = useState<EarnPeriod>('30j');
  const [devise, setDevise] = useState('');

  const rewards = useAsync(() => getEarnRewards(uq, periode), [uq, periode]);
  const context = useAsync(() => getEarnContext(uq), [uq]);

  const devises = useMemo(
    () => (rewards.data?.totaux || []).map((entry) => entry.currency),
    [rewards.data],
  );

  useEffect(() => {
    if (devises.length === 0) return;
    if (!devises.includes(devise)) setDevise(devises[0]);
  }, [devises, devise]);

  const points = useMemo(
    () =>
      (rewards.data?.series || [])
        .filter((entry) => entry.currency === devise)
        .map((entry) => ({
          label: jourLabel(entry.date),
          date: entry.date,
          cumulative: entry.cumulative,
          amount: entry.amount,
          count: entry.reward_count,
        })),
    [rewards.data, devise],
  );

  const colors = useChartColors(theme);
  const total = rewards.data?.totaux.find((entry) => entry.currency === devise)?.total ?? 0;
  const produit = rewards.data?.produits.find((entry) => entry.currency === devise);

  const relance = () => {
    rewards.reload();
    context.reload();
  };

  return (
    <div className="v2-stack">
      <Card>
        <div className="v2-row-between" style={{ marginBottom: 10 }}>
          <div>
            <div className="v2-h3">Récompenses Earn</div>
            <div className="v2-muted" style={{ fontSize: 12 }}>
              Versements réels enregistrés sur {periode}
            </div>
          </div>
          <Button size="sm" variant="secondary" icon="refresh" onClick={relance}>
            Actualiser
          </Button>
        </div>

        <Segmented value={periode} onChange={setPeriode} options={PERIODS} />

        {rewards.loading && !rewards.data ? (
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <Skeleton height={168} radius={14} />
            <Skeleton height={14} width="45%" />
          </div>
        ) : rewards.error ? (
          <div style={{ marginTop: 8 }}>
            <ErrorBlock message={rewards.error} onRetry={rewards.reload} />
          </div>
        ) : devises.length > 1 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {devises.map((code) => (
              <Chip key={code} active={code === devise} onClick={() => setDevise(code)}>
                {code}
              </Chip>
            ))}
          </div>
        ) : null}
      </Card>

      {rewards.data && !rewards.error && (
        points.length === 0 ? (
          <Card>
            <EmptyState
              icon="trendUp"
              title="Aucune récompense versée"
              description={
                devises.length === 0
                  ? `Aucun versement reçu sur ${periode}. Place une position pour commencer à accumuler.`
                  : `Aucun versement en ${devise} sur ${periode}.`
              }
            />
          </Card>
        ) : (
          <Card>
            <div style={{ height: 188, marginLeft: -8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={colors.grid} strokeDasharray="3 5" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: colors.tick, fontSize: 10 }}
                    interval="preserveStartEnd"
                    minTickGap={18}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    domain={['auto', 'auto']}
                    tick={{ fill: colors.tick, fontSize: 10 }}
                    tickFormatter={(value: number) => formatNumber(value, value >= 1000 ? 0 : 2)}
                  />
                  <Tooltip
                    contentStyle={{
                      background: colors.surface,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 12,
                      color: colors.ink,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: colors.tick, fontWeight: 650 }}
                    formatter={(value: number, name: string) =>
                      name === 'cumulative'
                        ? [formatCurrency(value, devise), 'Cumul']
                        : [formatCurrency(value, devise), 'Versé ce jour']
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke={colors.line}
                    strokeWidth={2.5}
                    dot={points.length <= 2}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="v2-row-between" style={{ marginTop: 12, gap: 12 }}>
              <Stat
                label={`Peru en ${devise} · ${periode}`}
                value={formatCurrency(total, devise)}
                hint={`${rewards.data.recompenses_comptees} versement(s) tous produits confondus`}
              />
              <div style={{ textAlign: 'right' }}>
                <div className="v2-muted" style={{ fontSize: 12 }}>
                  Dernier jour
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {formatCurrency(points[points.length - 1].amount, devise)}
                </div>
                <div className="v2-muted" style={{ fontSize: 11.5 }}>
                  {points[points.length - 1].date}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <Hint icon="info">
                Courbe cumulative : chaque point vient d’un versement enregistré, les jours sans
                récompense n’apparaissent pas.
              </Hint>
            </div>
          </Card>
        )
      )}

      {rewards.data && rewards.data.produits.length > 0 && (
        <>
          <SectionTitle>Produits</SectionTitle>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {rewards.data.produits.map((entry) => (
              <Row
                key={entry.currency}
                icon="trendUp"
                iconTone={entry.apy_pct > 0 ? 'green' : 'neutral'}
                title={entry.currency}
                subtitle={`${formatCurrency(entry.staked, entry.currency)} verrouillés · ${formatCurrency(
                  entry.rewarded_24h,
                  entry.currency,
                )} versés sur 24 h`}
                value={`${formatNumber(entry.apy_pct, 2)} % APY`}
                valueTone={entry.apy_pct > 0 ? 'positive' : 'default'}
              />
            ))}
          </Card>
          {produit && (
            <Card>
              <KeyValue
                label={`Rendement quotidien ${devise}`}
                value={`${formatNumber(produit.daily_pct, 3)} %`}
              />
              <KeyValue
                label="Part des frais reversible"
                value={formatCurrency(produit.case2_available, devise)}
              />
            </Card>
          )}
        </>
      )}

      <SectionTitle>Mes positions</SectionTitle>
      {context.loading && !context.data ? (
        <Card>
          <Loader label="Chargement des positions…" />
        </Card>
      ) : context.error ? (
        <ErrorBlock message={context.error} onRetry={context.reload} />
      ) : context.data && context.data.positions.length > 0 ? (
        <>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            {context.data.positions.map((position) => (
              <Row
                key={position.id}
                icon="lock"
                title={formatCurrency(position.principal, position.currency)}
                subtitle={
                  position.can_withdraw
                    ? `Retrait disponible · ${formatCurrency(position.rewards, position.currency)} gagnés`
                    : `Déblocage dans ${formatInt(position.days_left)} j · ${formatCurrency(
                        position.rewards,
                        position.currency,
                      )} gagnés`
                }
                value={
                  position.can_withdraw ? (
                    <span className="v2-badge v2-badge--positive">
                      <Icon name="check" size={12} /> Disponible
                    </span>
                  ) : (
                    <span className="v2-badge v2-badge--warning">Verrouillé</span>
                  )
                }
              />
            ))}
          </Card>
          {context.data.policy && (
            <div>
              <Hint icon="info">
                Verrou {formatInt(context.data.policy.lock_days)} j · pénalité de retrait anticipé{' '}
                {formatNumber(context.data.policy.early_penalty_pct, 1)} % · redistribution toutes{' '}
                {formatNumber(context.data.policy.distribution_hours, 0)} h
              </Hint>
            </div>
          )}
        </>
      ) : (
        <Card>
          <EmptyState
            icon="lock"
            title="Aucune position active"
            description="Les montants bloqués et leurs dates de déblocage s’afficheront ici."
          />
        </Card>
      )}
    </div>
  );
}
