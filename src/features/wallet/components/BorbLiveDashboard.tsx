// ============================================================
// BORB LIVE DASHBOARD - Graphique 6 cases temps reel
// ============================================================

import { useEffect, useState } from 'react';
import apiClient from '../../../api/client';
import { Icon } from '../../../components/ui/Icon';

interface CaseData {
  id: string;
  label: string;
  icon: string;
  balance: number;
  entrees: number;
  sorties: number;
  net: number;
  sources: string[];
  dests: string[];
}

interface TotalData {
  borb_sortis: number;
  borb_restants: number;
  borb_dans_cases: number;
  borb_dans_comptes: number;
  borb_total: number;
  comptes_count: number;
  invariant_valid: boolean;
}

interface Prices {
  gold_usd_per_ounce: number;
  btc_usd: number;
  borb_usd: number;
}

interface Props {
  uqNumber: string;
}

export function BorbLiveDashboard({ uqNumber }: Props) {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [total, setTotal] = useState<TotalData | null>(null);
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(true);
  const [casesError, setCasesError] = useState('');
  const [pricesError, setPricesError] = useState('');

  // Charger les cases live
  const chargerCases = async () => {
    try {
      const r = await apiClient.get('/api/cases/live-stats');
      if (r.data?.status !== 'success' || !Array.isArray(r.data.cases)) {
        throw new Error(r.data?.message || 'Réponse des statistiques de réserve invalide.');
      }
      setCases(r.data.cases);
      setTotal(r.data.total || null);
      setCasesError('');
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      setCasesError(error.response?.data?.message || error.message || 'Statistiques indisponibles.');
    }
  };

  // Charger les prix
  const chargerPrices = async () => {
    try {
      const r = await apiClient.get('/api/price/all');
      if (r.data?.status !== 'success' || !r.data?.prices) {
        throw new Error(r.data?.message || 'Réponse des prix invalide.');
      }
      setPrices(r.data.prices);
      setPricesError('');
    } catch (e) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      setPricesError(error.response?.data?.message || error.message || 'Prix indisponibles.');
    }
  };

  useEffect(() => {
    const charger = async () => {
      setLoading(true);
      await Promise.all([chargerCases(), chargerPrices()]);
      setLoading(false);
    };
    charger();

    // Polling 5s pour les cases
    const intervalCases = setInterval(chargerCases, 5000);
    // Polling 60s pour les prix
    const intervalPrices = setInterval(chargerPrices, 60000);

    return () => {
      clearInterval(intervalCases);
      clearInterval(intervalPrices);
    };
  }, [uqNumber]);

  const fmt = (n: number, decimals = 0) => {
    if (n === 0) return '0';
    if (Math.abs(n) < 1) return n.toFixed(2);
    return n.toLocaleString('fr-FR', { maximumFractionDigits: decimals });
  };

  const fmtUsd = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toFixed(0);
  };

  if (loading && cases.length === 0) {
    return (
      <div className="rounded-2xl p-5 bg-[var(--uq-bg-secondary)] border border-[var(--uq-border)]">
        <p className="text-center text-white/60 text-sm">Chargement du dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header : Prix OR + BTC + USD */}
      <div className="rounded-2xl p-3"
           style={{
             background: 'linear-gradient(135deg, rgba(246,200,95,0.08) 0%, rgba(7,11,31,0.96) 100%)',
             border: '1px solid rgba(255,215,0,0.25)',
           }}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Prix OR */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#FFD700]/15 border border-[#FFD700]/40">
            <span><Icon name="medal" size={20} tone="warning" /></span>
            <span className="text-[10px] font-bold text-[#FFD700]">OR</span>
            <span className="text-[10px] font-mono font-bold text-white">
              {prices ? `$${fmtUsd(prices.gold_usd_per_ounce)}` : 'Indisponible'}
            </span>
          </div>

          {/* Prix BTC */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#F7931A]/15 border border-[#F7931A]/40">
            <span>₿</span>
            <span className="text-[10px] font-bold text-[#F7931A]">BTC</span>
            <span className="text-[10px] font-mono font-bold text-white">
              {prices ? `$${fmtUsd(prices.btc_usd)}` : 'Indisponible'}
            </span>
          </div>

          {/* Prix USD */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/40">
            <span><Icon name="banknote" size={20} tone="success" /></span>
            <span className="text-[10px] font-bold text-[#0ECB81]">USD</span>
            <span className="text-[10px] font-mono font-bold text-white">
              {prices ? `$${prices.borb_usd.toFixed(2)}` : 'Indisponible'}
            </span>
          </div>

          {/* Invariant */}
          {total?.invariant_valid && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0ECB81]/15 border border-[#0ECB81]/40">
              <span className="text-[10px]"><Icon name="checkCircle" size={12} tone="success" /></span>
              <span className="text-[10px] font-bold text-[#0ECB81]">INVARIANT</span>
            </div>
          )}
        </div>
      </div>
      {pricesError && (
        <p className="text-[10px] text-[#F6465D]">{pricesError}</p>
      )}

      <p className="text-[10px] text-white/45">Flux affichés sur les dernières 24 heures</p>

      {/* 6 Rectangles fins (1 par case) */}
      <div className="space-y-2">
        {casesError && cases.length > 0 && (
          <p className="text-[10px] text-[#F6465D]">{casesError}</p>
        )}
        {casesError && cases.length === 0 ? (
          <p className="rounded-xl border border-[#F6465D]/30 bg-[#F6465D]/10 p-3 text-xs text-[#F6465D]">
            {casesError}
          </p>
        ) : cases.map((c) => {
          const net = c.net;
          const netColor = net > 0 ? '#0ECB81' : net < 0 ? '#F6465D' : '#FFD700';

          return (
            <div
              key={c.id}
              className="rounded-xl p-3 transition-all hover:scale-[1.005]"
              style={{
                background: 'linear-gradient(135deg, rgba(17,30,61,0.82) 0%, rgba(7,11,31,0.98) 100%)',
                border: '1px solid var(--uq-border)',
                boxShadow: '0 0 15px rgba(230,57,70,0.05)',
              }}
            >
              {/* Titre + NET */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '14px' }}>{c.icon}</span>
                  <p className="text-[11px] font-bold text-white">{c.label}</p>
                  <p className="text-[9px] text-white/40 font-mono">
                    {fmt(c.balance)} score
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] text-white/50">◆</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: netColor }}>
                    {net >= 0 ? '+' : ''}{fmt(net, 2)}
                  </span>
                </div>
              </div>

              {/* Barre entrées (ligne NOIRE) */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-bold text-white/70 w-3"><Icon name="arrowUp" size={11} tone="success" /></span>
                <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/5">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.abs(c.entrees) / 100)}%`,
                      background: 'linear-gradient(90deg, #000000, #333333)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/80 w-16 text-right">
                  +{fmt(c.entrees, 2)}
                </span>
              </div>

              {/* Barre sorties (ligne BLANCHE) */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[9px] font-bold text-white/40 w-3"><Icon name="arrowDown" size={11} tone="brand" /></span>
                <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/5">
                  <div
                    className="h-full rounded-full bg-white/80"
                    style={{ width: `${Math.min(100, Math.abs(c.sorties) / 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/60 w-16 text-right">
                  -{fmt(c.sorties, 2)}
                </span>
              </div>

              {/* Qui l'alimente / Qui elle alimente */}
              <div className="flex items-center gap-2 text-[9px] text-white/45">
                <span className="font-mono"><Icon name="house" size={20} /></span>
                <span className="truncate flex-1">
                  {c.sources.join(' · ')}
                </span>
                <span className="font-mono">▶</span>
                <span className="truncate flex-1">
                  {c.dests.join(' · ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compteurs bas : Sortis / Restants / Total */}
      {total && (
        <div className="grid grid-cols-3 gap-2">
          {/* Sortis */}
          <div className="rounded-xl p-3"
               style={{
                 background: 'linear-gradient(135deg, rgba(230,57,70,0.15), rgba(7,11,31,0.96))',
                 border: '1px solid rgba(230,57,70,0.35)',
               }}>
            <p className="text-[9px] uppercase tracking-wider font-bold text-white/60 mb-1">
              <Icon name="upload" size={11} tone="info" /> Sortis
            </p>
            <p className="text-sm font-black text-white">
              {fmtUsd(total.borb_sortis)}
            </p>
            <p className="text-[9px] text-white/40">score</p>
          </div>

          {/* Restants */}
          <div className="rounded-xl p-3"
               style={{
                 background: 'linear-gradient(135deg, rgba(246,200,95,0.15), rgba(7,11,31,0.96))',
                 border: '1px solid rgba(255,215,0,0.35)',
               }}>
            <p className="text-[9px] uppercase tracking-wider font-bold text-white/60 mb-1">
              <Icon name="bank" size={11} tone="info" /> Restants
            </p>
            <p className="text-sm font-black text-[#FFD700]">
              {fmtUsd(total.borb_restants)}
            </p>
            <p className="text-[9px] text-white/40">score</p>
          </div>

          {/* Total */}
          <div className="rounded-xl p-3"
               style={{
                 background: 'linear-gradient(135deg, rgba(47,107,255,0.15), rgba(7,11,31,0.96))',
                 border: '1px solid rgba(47,107,255,0.35)',
               }}>
            <p className="text-[9px] uppercase tracking-wider font-bold text-white/60 mb-1">
              <Icon name="trendingUp" size={11} tone="success" /> Total
            </p>
            <p className="text-sm font-black text-[#2E86DE]">
              {fmtUsd(total.borb_total)}
            </p>
            <p className="text-[9px] text-white/40">score</p>
          </div>
        </div>
      )}

    </div>
  );
}