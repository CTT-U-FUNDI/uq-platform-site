import { useEffect, useState } from 'react';
import api from '../../../api/client';

export function CryptoMarketView() {
  const [btc, setBtc] = useState<number | null>(null);
  const [gold, setGold] = useState<number | null>(null);
  const [borb, setBorb] = useState<number | null>(null);
  const [btcHist, setBtcHist] = useState<number[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [all, hist] = await Promise.all([
          api.get('/api/price/all'),
          api.get('/api/price/history/btc'),
        ]);
        setBtc(all.data.prices?.btc_usd ?? null);
        setGold(all.data.prices?.gold_usd_per_ounce ?? null);
        setBorb(all.data.prices?.borb_usd ?? null);
        setBtcHist(hist.data?.points?.map((p: { price: number }) => p.price) ?? hist.data?.history ?? []);
      } catch {}
    };
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const min = btcHist.length ? Math.min(...btcHist) : 0;
  const max = btcHist.length ? Math.max(...btcHist) : 1;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'BORB / USD', val: borb, fmt: (v: number) => `$${v.toFixed(4)}` },
          { label: 'BTC / USD', val: btc, fmt: (v: number) => `$${v.toLocaleString()}` },
          { label: 'Or / oz', val: gold, fmt: (v: number) => `$${v.toLocaleString()}` },
        ].map((c) => (
          <div key={c.label} className="uq-card text-center">
            <p className="text-[10px] uppercase text-[var(--uq-text-secondary)]">{c.label}</p>
            <p className="text-lg font-black mt-1 tabular-nums">
              {c.val != null ? c.fmt(c.val) : '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="uq-card">
        <p className="text-xs font-bold text-[var(--uq-text-secondary)] mb-3">BTC — 24h (oracle UQ)</p>
        {btcHist.length > 1 ? (
          <div className="flex items-end gap-0.5 h-32">
            {btcHist.slice(-48).map((p, i) => (
              <div
                key={i}
                className="flex-1 bg-[var(--uq-yellow)]/80 rounded-t-sm min-w-[2px]"
                style={{ height: `${((p - min) / (max - min || 1)) * 100}%` }}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--uq-text-muted)]">Historique indisponible</p>
        )}
      </div>
    </div>
  );
}
