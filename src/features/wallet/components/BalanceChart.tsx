import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import apiClient from '../../../api/client';

interface Transaction {
  type: string;
  amount: number;
  fee?: number;
  timestamp: number;
  status?: string;
}

interface DataPoint {
  label: string;
  balance: number;
}

interface Props {
  uqNumber: string;
  currentScorePoints: number;
}

const INCOMING_TYPES = new Set(['receive', 'ubi', 'recovered']);

export function BalanceChart({ uqNumber, currentScorePoints }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let active = true;

    if (!uqNumber) {
      setErreur('Historique indisponible sans compte connecté.');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    apiClient
      .get(`/api/borb/transactions/${uqNumber}`)
      .then((response) => {
        if (response.data.status === 'error') {
          throw new Error(response.data.message || 'Historique indisponible.');
        }
        if (!Array.isArray(response.data.transactions)) {
          throw new Error('Format de l’historique invalide.');
        }
        if (active) {
          setTransactions(response.data.transactions);
          setErreur('');
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setTransactions([]);
          setErreur(error instanceof Error ? error.message : 'Erreur réseau lors du chargement.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [uqNumber]);

  const data = useMemo(() => {
    if (
      !Number.isFinite(currentScorePoints)
      || currentScorePoints < 0
      || transactions.some((transaction) => !Number.isFinite(transaction.timestamp))
    ) {
      return { points: [] as DataPoint[], unsupported: true };
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const firstDay = new Date(today);
    firstDay.setDate(firstDay.getDate() - 6);
    const firstTimestamp = firstDay.getTime() / 1000;
    const nowTimestamp = now.getTime() / 1000;
    const recentTransactions = transactions.filter(
      (transaction) => transaction.timestamp >= firstTimestamp && transaction.timestamp <= nowTimestamp,
    );
    const changes = recentTransactions.map((transaction) => {
      const amount = Number(transaction.amount);
      const fee = Number(transaction.fee || 0);
      const status = transaction.status?.toLowerCase();
      if (
        !Number.isFinite(amount)
        || amount < 0
        || !Number.isFinite(fee)
        || fee < 0
        || (status && !['completed', 'confirmed', 'success', 'settled'].includes(status))
        || (!INCOMING_TYPES.has(transaction.type) && transaction.type !== 'send')
      ) {
        return null;
      }

      return {
        timestamp: transaction.timestamp,
        delta: INCOMING_TYPES.has(transaction.type)
          ? amount
          : -(amount + fee),
      };
    });

    if (changes.some((change) => change === null)) {
      return { points: [] as DataPoint[], unsupported: true };
    }

    const validChanges = changes.filter((change): change is NonNullable<typeof change> => change !== null);
    const points = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(firstDay);
      day.setDate(firstDay.getDate() + index);
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);
      const boundary = index === 6 ? nowTimestamp : endOfDay.getTime() / 1000;
      const changesAfterBoundary = validChanges
        .filter((change) => change.timestamp > boundary)
        .reduce((total, change) => total + change.delta, 0);

      return {
        label: day.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        balance: currentScorePoints - changesAfterBoundary,
      };
    });

    if (points.some((point) => !Number.isFinite(point.balance) || point.balance < 0)) {
      return { points: [] as DataPoint[], unsupported: true };
    }

    return { points, unsupported: false };
  }, [currentScorePoints, transactions]);

  const formatBalance = (value: number) =>
    value.toLocaleString('fr-FR', { maximumFractionDigits: 2 });

  return (
    <section
      aria-label="Historique du score de sécurité sur sept jours"
      className="relative overflow-hidden rounded-3xl border border-[var(--uq-border)] bg-[var(--uq-bg-secondary)] p-4 sm:p-5"
      style={{ boxShadow: '0 0 36px rgba(47,107,255,0.1)' }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--uq-text-primary)]">Score de sécurité</h2>
          <p className="mt-0.5 text-[10px] text-[var(--uq-text-secondary)]">
            Points internes BORB · sans valeur monétaire directe
          </p>
        </div>
        <span className="rounded-full border border-[var(--uq-blue)]/30 bg-[var(--uq-blue)]/10 px-2.5 py-1 text-[10px] font-bold text-[var(--uq-yellow)]">
          7D
        </span>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-[var(--uq-text-secondary)]">
          Chargement de l’historique…
        </div>
      ) : erreur ? (
        <div role="alert" className="flex h-40 items-center justify-center text-center text-sm text-[var(--uq-red)]">
          {erreur}
        </div>
      ) : data.unsupported ? (
        <div role="status" className="flex h-40 items-center justify-center text-center text-sm text-[var(--uq-text-secondary)]">
          L’historique ne peut pas être calculé à partir des mouvements disponibles.
        </div>
      ) : (
        <div className="h-40 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="borbBalanceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.34} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#1E3158" strokeDasharray="3 5" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8292B0', fontSize: 9 }}
                interval="preserveStartEnd"
                padding={{ left: 8, right: 8 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8292B0', fontSize: 9 }}
                tickFormatter={formatBalance}
                width={42}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{
                  background: '#0C1530',
                  border: '1px solid #2D4A80',
                  borderRadius: '12px',
                  color: '#F4F7FF',
                  fontSize: '11px',
                }}
                formatter={(value) => [`${formatBalance(Number(value))} points`, 'Score']}
              />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#38BDF8"
                strokeWidth={2.5}
                fill="url(#borbBalanceFill)"
                activeDot={{ r: 4, fill: '#7DD3FC', stroke: '#0C1530', strokeWidth: 2 }}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
