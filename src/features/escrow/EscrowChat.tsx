import { useEffect, useRef, useState } from 'react';
import { escrow } from './api';

/** Canal de discussion escrow : chat + boutons Vendre/Suivre + code croise. */
export function EscrowChat({ orderId }: { orderId: number }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [order, setOrder] = useState<any>(null);
  const [text, setText] = useState('');
  const [code, setCode] = useState('');
  const [tempCode, setTempCode] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  const load = async () => {
    const [c, o] = await Promise.all([escrow.chatGet(orderId), escrow.myOrders()]);
    setMsgs(c.data?.messages || []);
    const mine = (o.data?.orders || []).find((x: any) => x.id === orderId);
    setOrder(mine);
  };
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [orderId]);
  useEffect(() => { bottom.current?.scrollIntoView(); }, [msgs]);

  const send = async () => { if (!text.trim()) return; await escrow.chatSend(orderId, text); setText(''); load(); };
  const sell = async () => { await escrow.sell(orderId).catch(() => alert('Action impossible')); load(); };
  const confirm = async () => {
    const r = await escrow.confirm(orderId, code).catch((e) => ({ data: e.response?.data }));
    if (r.data?.temp_code) setTempCode(r.data.temp_code);
    if (r.data?.sold) alert('VENTE CONFIRMEE — escrow libere !');
    load();
  };

  const isSeller = order && localStorage.getItem('uq_number') === order.seller;
  const isBuyer = order && localStorage.getItem('uq_number') === order.buyer;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${m.sender === localStorage.getItem('uq_number') ? 'ml-auto bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
            {m.msg}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <div className="p-3 border-t border-white/10 space-y-2">
        {order?.status === 'discussion' && isSeller && (
          <button onClick={sell} className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm">Vendre le produit</button>
        )}
        {order?.status === 'vente' && isBuyer && (
          <button onClick={() => { sessionStorage.setItem('escrow_order_id', String(orderId)); window.dispatchEvent(new CustomEvent('uq:navigate', { detail: 'escrow-follow' })); }} className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-bold text-sm">Suivre mon produit</button>
        )}
        {order?.status === 'paiement' && (
          <div className="flex gap-2">
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Code 4 chiffres" className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white text-sm" />
            <button onClick={confirm} className="px-4 rounded-xl bg-purple-500 text-white text-sm font-bold">Confirmer</button>
          </div>
        )}
        {tempCode && <p className="text-center text-yellow-400 text-xs">Code : <b>{tempCode}</b> — montre-le a l'autre partie</p>}
        <div className="flex gap-2">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Message…" className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white text-sm" />
          <button onClick={send} className="px-4 rounded-xl bg-blue-600 text-white text-sm font-bold">Envoyer</button>
        </div>
      </div>
    </div>
  );
}
