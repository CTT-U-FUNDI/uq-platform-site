import { useEffect, useRef, useState } from 'react';
import apiClient from '../../api/client';
import { escrowGet } from './api_get';
import { escrow } from './api';

const R = 6371e3;
function dist(a: [number,number], b: [number,number]) {
  const dLa = (b[0]-a[0])*Math.PI/180, dLo = (b[1]-a[1])*Math.PI/180;
  const h = Math.sin(dLa/2)**2 + Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLo/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}

/** Suivi GPS live : position soi + autre partie, distance, detection 3m -> paiement. */
export function EscrowFollow({ orderId }: { orderId: number }) {
  const [order, setOrder] = useState<any>(null);
  const [me, setMe] = useState<[number,number]|null>(null);
  const [err, setErr] = useState('');
  const watch = useRef<number|undefined>(undefined);

  useEffect(() => {
    escrowGet(orderId).then(r => setOrder(r.data?.order)).catch(() => setErr('Commande introuvable'));
    navigator.geolocation?.watchPosition(
      (p) => {
        const pos: [number,number] = [p.coords.latitude, p.coords.longitude];
        setMe(pos);
        escrow.position(orderId, pos[0], pos[1]).catch(() => {});
      },
      () => setErr('GPS indisponible — autorise la position'),
      { enableHighAccuracy: true }
    );
    const t = setInterval(() => escrowGet(orderId).then(r => setOrder(r.data?.order)).catch(() => {}), 5000);
    return () => { clearInterval(t); if (watch.current) navigator.geolocation.clearWatch(watch.current); };
  }, [orderId]);

  const uq = localStorage.getItem('uq_number');
  const isBuyer = order && uq === order.buyer;
  const other = order ? (isBuyer ? order.seller_pos : order.buyer_pos) : null;
  const otherHasPos = other && other[0] != null && other[1] != null;
  const distance = me && otherHasPos ? dist(me, other as [number,number]) : null;
  const proche = distance != null && distance <= 3;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">Suivi de la rencontre</h2>
      {err && <p className="text-red-400 text-xs">{err}</p>}

      {/* Distance card */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-center">
        {distance == null ? (
          <p className="text-gray-400 text-sm">En attente de la position {isBuyer ? 'du vendeur' : 'de l\'acheteur'}…</p>
        ) : (
          <>
            <p className="text-4xl font-bold text-white">{distance < 1000 ? `${distance.toFixed(0)} m` : `${(distance/1000).toFixed(2)} km`}</p>
            <p className="text-gray-400 text-xs mt-1">{isBuyer ? 'distance avec le vendeur' : 'distance avec l\'acheteur'}</p>
            {proche && <p className="mt-3 text-emerald-400 font-bold text-sm animate-pulse">✓ Vous etes a moins de 3m — paiement disponible</p>}
          </>
        )}
      </div>

      {/* Statuts */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-gray-300 space-y-1">
        <p>Commande #{orderId} — {order?.price_borb} BORB</p>
        <p>Statut : <span className="text-yellow-400">{order?.status}</span></p>
        {order?.temp_code && <p>Code : <b className="text-white">{order.temp_code}</b></p>}
      </div>

      {/* Paiement quand proche */}
      {proche && order?.status === 'vente' && (
        <button
          onClick={async () => {
            const r = await apiClient.post(`/api/escrow/${orderId}/confirm`, {}).catch((e) => ({ data: e.response?.data }));
            if (r.data?.temp_code) alert(`Code paiement : ${r.data.temp_code} — partage-le`);
          }}
          className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-bold"
        >Payer avec UQ PAY</button>
      )}

      <p className="text-[10px] text-gray-500 text-center">GPS physique uniquement — position temps reel des deux parties</p>
    </div>
  );
}
