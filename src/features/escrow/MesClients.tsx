import { useEffect, useState } from 'react';
import { escrow } from './api';

interface Client { order_id: number; product_id: number; buyer: string; status: string; price_borb: number }

/** Ecran vendeur : produits + acheteurs interesses (etape 3-4 du flux escrow). */
export function MesClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const ordre: Record<string, number> = { interest: 0, discussion: 1, vente: 2, confirme: 3, annule: 4 };
  const load = () => escrow.clients().then(r => setClients((r.data?.clients || []).sort((a: Client, b: Client) => (ordre[a.status] ?? 9) - (ordre[b.status] ?? 9)))).catch(() => setErr('Erreur chargement')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const choisir = async (c: Client) => {
    await escrow.select(c.order_id, c.buyer).catch(() => setErr('Selection impossible'));
    sessionStorage.setItem('escrow_order_id', String(c.order_id)); (window as any).dispatchEvent(new CustomEvent('uq:navigate', { detail: 'escrow-chat' }));
  };

  if (loading) return <div className="p-6 text-gray-400 text-sm">Chargement…</div>;
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">Mes clients</h2>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      {clients.length === 0 && <p className="text-gray-500 text-sm">Aucun acheteur interesse pour le moment.</p>}
      {clients.map(c => (
        <div key={c.order_id} className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-semibold">Produit #{c.product_id}</p>
            <p className="text-gray-400 text-xs">{c.buyer} — {c.price_borb} BORB — <span className="text-yellow-400">{c.status}</span></p>
          </div>
          {c.status === 'interest' && (
            <button onClick={() => choisir(c)} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold">Choisir</button>
          )}
          {c.status === 'discussion' && <span className="text-xs text-blue-400">En discussion</span>}
          {c.status === 'vente' && <span className="text-xs text-purple-400">Vente en cours</span>}
          {c.status === 'confirme' && <span className="text-xs text-emerald-400">✓ Client — achat confirmé</span>}
        </div>
      ))}
    </div>
  );
}
