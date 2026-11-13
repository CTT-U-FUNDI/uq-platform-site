// P2P VIEW — read-only until real order and escrow settlement are available

import { useState, useEffect, useCallback } from 'react';
import { Info, RefreshCw } from 'lucide-react';
import api from '../../../api/client';
import { BorbCoinIcon3D } from '../../../components/ui/Icons3D';
import { PublicUserIdentity } from '../../../components/ui/PublicUserIdentity';

export function P2PView() {
  const uq = localStorage.getItem('uq_number') || '';
  const [balance, setBalance] = useState<number | null>(null);
  const [walletAssets, setWalletAssets] = useState<{ code: string; balance: number }[]>([]);
  const [walletError, setWalletError] = useState('');
  const [borbUsdRate, setBorbUsdRate] = useState<number | null>(null);
  const [rateError, setRateError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMarket = useCallback(async () => {
    setLoading(true);
    setBorbUsdRate(null);
    setBalance(null);
    setWalletAssets([]);
    setRateError('');
    setWalletError('');
    try {
      const [priceR, balanceR, walletsR] = await Promise.all([
        api.get('/api/price/all'),
        uq ? api.get(`/api/borb/balance/${uq}`) : Promise.resolve(null),
        uq
          ? api.get(`/api/account/wallets/${uq}`).catch((error: any) => {
              setWalletError(error.response?.data?.message || 'Impossible de charger les portefeuilles.');
              return null;
            })
          : Promise.resolve(null),
      ]);
      const rate = Number(priceR.data?.prices?.borb_usd);
      setBorbUsdRate(Number.isFinite(rate) && rate > 0 ? rate : null);
      setRateError(Number.isFinite(rate) && rate > 0 ? '' : 'Taux BORB/USD indisponible.');
      if (balanceR?.data) {
        const rawTotal = balanceR.data?.balance?.borb_total;
        const rawPoints = balanceR.data?.balance?.points;
        const total = rawTotal == null ? Number.NaN : Number(rawTotal);
        const points = rawPoints == null ? Number.NaN : Number(rawPoints);
        const actualBalance = Number.isFinite(total) ? total : Number.isFinite(points) ? points / 100 : null;
        setBalance(actualBalance !== null && actualBalance >= 0 ? actualBalance : null);
      }
      setWalletAssets(
        (walletsR?.data?.wallets || [])
          .filter((wallet: { code: string; balance: number }) =>
            !['BORB', 'BORB'].includes(wallet.code.toUpperCase()) && wallet.balance > 0)
          .map((wallet: { code: string; balance: number }) => ({
            code: wallet.code,
            balance: wallet.balance,
          })),
      );
    } catch (error: any) {
      setBorbUsdRate(null);
      setBalance(null);
      setWalletAssets([]);
      setRateError(error.response?.data?.message || 'Impossible de charger les données du marché.');
    } finally {
      setLoading(false);
    }
  }, [uq]);

  useEffect(() => {
    loadMarket();
  }, [loadMarket]);

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 rounded-full opacity-20 blur-3xl"
           style={{ background: 'radial-gradient(circle, rgba(47,107,255,.5) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute top-1/2 -right-10 w-56 h-56 rounded-full opacity-20 blur-3xl"
           style={{ background: 'radial-gradient(circle, rgba(56,189,248,.34) 0%, transparent 70%)' }} />

      <div className="relative space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BorbCoinIcon3D size={42} />
            <div>
              <h1 className="font-extrabold text-base tracking-tight">
                UQ <span className="text-[var(--uq-yellow)] font-semibold text-xs">P2P Lite</span>
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-200 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                <Info size={10} /> Paiement non activé
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {uq && (
              <PublicUserIdentity
                userId={uq}
                size="sm"
                compact
                className="hidden rounded-xl border border-white/[0.08] bg-[#0D121B] px-2 py-1.5 sm:flex"
              />
            )}
            <button
              type="button"
              onClick={() => loadMarket()}
              className="uq-btn uq-btn-secondary w-9 h-9 p-0 rounded-xl"
              aria-label="Actualiser"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => uq && loadMarket()}
              className="uq-card !p-2 flex flex-col items-end hover:border-[var(--uq-yellow)]/40 transition"
            >
              <span className="text-[10px] text-[var(--uq-text-secondary)]">Réserve BORB</span>
              <span className="text-xs font-black tabular-nums text-[var(--uq-text-primary)]">
                {balance == null ? '—' : `${balance.toLocaleString('fr-FR')} BORB`}
              </span>
            </button>
          </div>
        </div>

        <div role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          Le carnet et l’escrow ne règlent pas encore les fonds. Aucun paiement ne sera traité depuis cet écran.
        </div>

        <section className="uq-card space-y-2" aria-label="Devises converties">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--uq-text-secondary)]">
              Devises converties
            </h2>
            <span className="text-[10px] text-[var(--uq-text-muted)]">
              Seuls ces soldes sont transférables
            </span>
          </div>
          {walletAssets.length ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {walletAssets.map((wallet) => (
                <li key={wallet.code} className="flex justify-between gap-2 rounded-lg bg-[var(--uq-bg-secondary)] px-3 py-2 text-xs">
                  <span className="font-bold">{wallet.code}</span>
                  <span className="font-mono tabular-nums">
                    {wallet.balance.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[var(--uq-text-muted)]">
              {walletError || (loading ? 'Chargement des soldes convertis…' : 'Aucun solde converti disponible pour le transfert.')}
            </p>
          )}
        </section>

        <section className="uq-card space-y-3" aria-label="Taux BORB">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--uq-text-secondary)]">
              Taux indicatif
            </h2>
            <span className="text-xs font-bold tabular-nums text-[var(--uq-yellow)]">
              {borbUsdRate == null ? '—' : `1 BORB ≈ $${borbUsdRate.toFixed(4)} USD`}
            </span>
          </div>
          {rateError && <p role="status" className="text-xs text-amber-200">{rateError}</p>}
        </section>

        <section className="uq-card space-y-3" aria-label="Marché P2P">
          <h2 className="text-sm font-extrabold">Marché P2P et escrow</h2>
          <p role="status" className="text-sm text-[var(--uq-text-secondary)]">
            Le carnet d’ordres et le règlement sécurisé ne sont pas encore disponibles.
            Aucun vendeur, ordre ou escrow ne peut être confirmé depuis cet écran.
          </p>
          <button
            type="button"
            disabled
            className="uq-btn uq-btn-primary w-full py-3 opacity-50"
          >
            Trading indisponible
          </button>
        </section>
      </div>
    </div>
  );
}
