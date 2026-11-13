import { useEffect, useState } from 'react';
import api from '../../../api/client';

interface Unit {
  unit: string;
  value: number;
}

interface Wallet {
  code: string;
  balance: number;
}

export function AssetsView() {
  const uq = localStorage.getItem('uq_number') || '';
  const [balance, setBalance] = useState(0);
  const [units, setUnits] = useState<Unit[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uq) return;
    const load = async () => {
      try {
        const [balanceResponse, walletsResponse] = await Promise.all([
          api.get(`/api/borb/balance/${uq}`),
          api.get(`/api/account/wallets/${uq}`),
        ]);
        const points = Number(balanceResponse.data?.balance?.points) || 0;
        setBalance(Number(balanceResponse.data?.balance?.borb_total) || points / 100);
        setUnits(balanceResponse.data?.units || []);
        setWallets(
          (walletsResponse.data?.wallets || []).filter((wallet: Wallet) =>
            !['BORB', 'BORB'].includes(wallet.code.toUpperCase())),
        );
        setError('');
      } catch (e: any) {
        setError(e.response?.data?.message || e.message || 'Impossible de charger les soldes');
      }
    };
    load();
  }, [uq]);

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="uq-card text-sm text-[var(--uq-red)]">{error}</p>
      )}
      <section className="uq-card" aria-label="Réserve BORB">
        <p className="text-xs text-[var(--uq-text-secondary)]">Réserve de sécurité BORB</p>
        <p className="text-3xl font-black tabular-nums mt-1">
          {balance.toLocaleString('fr-FR')} BORB
        </p>
        <p className="text-sm text-[var(--uq-text-secondary)] mt-1">
          Utilisée comme garantie, non transférable directement.
        </p>
      </section>

      <section className="uq-card">
        <h2 className="text-xs font-bold mb-3 uppercase text-[var(--uq-text-secondary)]">
          Sous-unités BORB
        </h2>
        <div className="space-y-2">
          {units.map((unit) => (
            <div key={unit.unit} className="flex justify-between text-sm py-2 border-b border-[var(--uq-border)] last:border-0">
              <span className="font-mono">{unit.unit}</span>
              <span className="font-bold tabular-nums">
                {unit.value.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}
              </span>
            </div>
          ))}
          {units.length === 0 && (
            <p className="text-sm text-[var(--uq-text-muted)]">Aucune sous-unité disponible</p>
          )}
        </div>
      </section>

      <section className="uq-card">
        <h2 className="text-xs font-bold mb-3 uppercase text-[var(--uq-text-secondary)]">
          Soldes convertis transférables
        </h2>
        {wallets.length ? (
          <div className="space-y-2">
            {wallets.map((wallet) => (
              <div key={wallet.code} className="flex justify-between text-sm py-2 border-b border-[var(--uq-border)] last:border-0">
                <span className="font-mono">{wallet.code}</span>
                <span className="font-bold tabular-nums">
                  {wallet.balance.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--uq-text-muted)]">Aucun solde converti disponible</p>
        )}
      </section>
    </div>
  );
}
