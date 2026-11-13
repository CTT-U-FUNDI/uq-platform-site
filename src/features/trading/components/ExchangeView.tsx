import { useEffect, useState } from 'react';
import api from '../../../api/client';
import { TrendingDown, TrendingUp } from 'lucide-react';

export function ExchangeView() {
  const [prices, setPrices] = useState<{
    borb_usd: number | null;
    btc_usd: number | null;
    gold_usd_per_ounce: number | null;
  } | null>(null);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [priceError, setPriceError] = useState('');

  useEffect(() => {
    api.get('/api/price/all')
      .then((r) => {
        const data = r.data?.prices;
        const rate = Number(data?.borb_usd);
        const btc = Number(data?.btc_usd);
        const gold = Number(data?.gold_usd_per_ounce);
        setPrices({
          borb_usd: Number.isFinite(rate) && rate > 0 ? rate : null,
          btc_usd: Number.isFinite(btc) && btc > 0 ? btc : null,
          gold_usd_per_ounce: Number.isFinite(gold) && gold > 0 ? gold : null,
        });
        setPriceError(Number.isFinite(rate) && rate > 0 ? '' : 'Taux BORB/USD indisponible.');
      })
      .catch(() => {
        setPrices(null);
        setPriceError('Impossible de charger les taux du marché.');
      });
  }, []);

  const borb = prices?.borb_usd ?? null;

  return (
    <div className="space-y-4">
      <div className="uq-card">
        <p className="text-xs text-[var(--uq-text-secondary)] uppercase tracking-wider mb-2">Spot BORB</p>
        <p className="text-3xl font-black tabular-nums">
          {borb == null ? '—' : `$${borb.toFixed(4)}`}{' '}
          <span className="text-sm font-normal text-[var(--uq-text-secondary)]">USD</span>
        </p>
        {priceError && <p role="status" className="mt-2 text-xs text-amber-200">{priceError}</p>}
        <div className="flex gap-4 mt-3 text-xs text-[var(--uq-text-secondary)]">
          <span>BTC {prices?.btc_usd == null ? '—' : `$${prices.btc_usd.toLocaleString()}`}</span>
          <span>Or {prices?.gold_usd_per_ounce == null ? '—' : `$${prices.gold_usd_per_ounce.toLocaleString()}`}/oz</span>
        </div>
      </div>

      <p role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
        Carnet en lecture seule : la création d’ordres et leur règlement sécurisé ne sont pas encore disponibles.
      </p>

      <div className="grid grid-cols-2 gap-2 p-1 uq-card !p-1">
        <button
          type="button"
          onClick={() => setSide('buy')}
          className={`py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${
            side === 'buy' ? 'uq-btn-success !rounded-lg' : 'uq-btn-ghost'
          }`}
        >
          <TrendingUp size={16} /> Acheter
        </button>
        <button
          type="button"
          onClick={() => setSide('sell')}
          className={`py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 ${
            side === 'sell' ? 'uq-btn-danger !rounded-lg' : 'uq-btn-ghost'
          }`}
        >
          <TrendingDown size={16} /> Vendre
        </button>
      </div>

      <div className="uq-card space-y-3">
        <label className="text-xs text-[var(--uq-text-secondary)]">Montant BORB</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="uq-input w-full text-xl font-bold tabular-nums"
        />
        <p className="text-xs text-[var(--uq-text-secondary)]">
          {borb == null
            ? 'Conversion indisponible sans taux valide.'
            : Number(amount) > 0
              ? `≈ $${(Number(amount) * borb).toFixed(2)} USD`
              : 'Saisissez un montant pour voir son équivalent.'}
        </p>
        <button
          type="button"
          disabled
          className={`uq-btn w-full py-3 ${side === 'buy' ? 'uq-btn-success' : 'uq-btn-danger'}`}
        >
          Carnet indisponible
        </button>
      </div>
    </div>
  );
}
