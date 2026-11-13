// ---
// TRANSACTION DETAIL MODAL — Détails + QR + Export PNG
// ---

import { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { UQ_COLORS } from '../../../theme/colors';
import { IconClose, IconCopy, IconReceive, IconCheck } from '../../../components/ui/UQIcons';
import { Icon } from '../../../components/ui/Icon';

interface Transaction {
  id: number | string;
  type: string;
  amount: number;
  fee: number;
  counterparty: string;
  timestamp: number;
  hash?: string;
  memo?: string;
  status?: string;
  // 📜 Chaînage de l'historique local (nouveaux champs de l'API)
  borb_id?: string;
  prev_hash?: string;
  block_number?: number;
  currency?: string;
  amount_currency?: number;
  fee_currency?: number;
  transfer_id?: string;
}

interface Props {
  transaction: Transaction;
  uqNumber: string;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, uqNumber, onClose }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ⚠️ Le vrai identifiant est `borb_id` (hash de la transaction).
  //    Avant : le modal fabriquait un faux hash « UQ-{id}-{timestamp} »,
  //    ce qui rendait la traçabilité inutilisable.
  const txHash = transaction.transfer_id || transaction.borb_id || transaction.hash || `UQ-${transaction.id}-${transaction.timestamp}`;

  // ⚠️ Le backend renvoie un montant TOUJOURS positif : c'est `type` qui
// donne le sens de l'op ration (envoy / re u / ubi / r cup r ).
  const entrant = transaction.type === 'receive'
    || transaction.type === 'ubi'
    || transaction.type === 'recovered';
  const libelle = transaction.type === 'send' ? 'Envoyé'
    : transaction.type === 'ubi' ? 'UBI'
    : transaction.type === 'recovered' ? 'Récupéré (voisins)'
    : 'Reçu';
  const date = new Date(transaction.timestamp * 1000);
  const dateStr = date.toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  // Générer le QR code avec le hash de transaction
  useEffect(() => {
    const qrContent = JSON.stringify({
      uq: uqNumber,
      tx: txHash,
      amount: transaction.amount_currency ?? transaction.amount,
      currency: transaction.currency || 'BORB',
      type: transaction.type,
      ts: transaction.timestamp
    });
    QRCode.toDataURL(qrContent, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    }).then(setQrDataUrl).catch(() => {});
  }, [transaction, uqNumber, txHash]);

  const copyHash = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportPNG = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#0B0E11',
        scale: 2,
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = `UQ-Transaction-${transaction.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Erreur export PNG:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 uq-animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={exportRef}
        className="bg-gradient-to-br from-[#111E3D] to-[#070B1F] border border-[#E63946]/30 rounded-3xl p-5 w-full max-w-sm uq-animate-scale-in max-h-[85vh] overflow-y-auto shadow-[0_0_60px_rgba(47,107,255,0.2)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${entrant ? 'bg-[#0ECB81]' : 'bg-[#F6465D]'}`} />
            <h3 className="text-lg font-bold">
              {entrant ? '📥 Reçu' : '📤 Envoyé'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[var(--uq-text-secondary)] hover:text-[var(--uq-text)]">
            <IconClose size={18} />
          </button>
        </div>

        {/* Montant principal */}
        <div className="text-center py-4 mb-4 rounded-xl" style={{
          background: 'linear-gradient(135deg, rgba(230,57,70,0.1), rgba(181,55,140,0.1))',
          border: `1px solid ${UQ_COLORS.magenta}30`
        }}>
          <p className="text-xs text-[var(--uq-text-secondary)] mb-1">Montant</p>
          <p className="text-2xl font-black" style={{ color: UQ_COLORS.gold }}>
            {entrant ? '+' : '-'}{transaction.currency
              ? (transaction.amount_currency || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
              : transaction.amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {transaction.currency || 'points de score'}
          </p>
        </div>

        {/* Détails */}
        <div className="space-y-3 mb-4">
          <Row label="Contrepartie" value={transaction.counterparty || '—'} />
          <Row label="Type" value={libelle} />
          <Row label="Date" value={dateStr} />
          <Row label="Frais" value={transaction.currency
            ? `${(transaction.fee_currency || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${transaction.currency}`
            : `${transaction.fee.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} points de score`} />
          {transaction.memo && <Row label="Note" value={transaction.memo} />}
          <Row label="Statut" value={transaction.status || 'Confirmé'} color={UQ_COLORS.green} />
        </div>

        {/* 📜 Chaînage de l'historique local (borb_id / prev_hash / bloc) */}
        {!transaction.currency && (
          <div className="mb-4 rounded-xl border border-[var(--uq-border)] overflow-hidden">
            <div className="px-3 py-2 bg-[var(--uq-bg)]">
              <p className="text-[10px] font-black text-[var(--uq-text-secondary)]"><Icon name="receipt" size={12} tone="muted" /> CHAÎNAGE LOCAL</p>
            </div>
            <div className="divide-y divide-[var(--uq-border)]">
              <Row label="Bloc" value={transaction.block_number !== undefined ? `#${transaction.block_number}` : '—'} />
              <Row
                label="prev_hash"
                value={transaction.prev_hash ? `${transaction.prev_hash.slice(0, 20)}…` : '(genèse)'}
                mono
              />
            </div>
          </div>
        )}

        {/* Hash */}
        <div className="mb-4">
          <p className="text-xs text-[var(--uq-text-secondary)] mb-2">Hash de transaction</p>
          <div className="p-3 bg-[var(--uq-bg)] border border-[var(--uq-border)] rounded-lg">
            <p className="font-mono text-[10px] text-[var(--uq-text)] break-all">{txHash}</p>
          </div>
          <button
            onClick={copyHash}
            className="w-full mt-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: copied ? `${UQ_COLORS.green}20` : 'var(--uq-card-light)',
              color: copied ? UQ_COLORS.green : 'var(--uq-text)',
              border: `1px solid ${copied ? UQ_COLORS.green : 'var(--uq-border)'}`
            }}
          >
            {copied ? <><IconCheck size={14} /> Copié</> : <><IconCopy size={14} /> Copier le hash</>}
          </button>
        </div>

        {/* QR Code */}
        {qrDataUrl && (
          <div className="mb-4 text-center">
            <p className="text-xs text-[var(--uq-text-secondary)] mb-2">QR Code de vérification</p>
            <div className="inline-block p-3 bg-white rounded-xl">
              <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
            </div>
          </div>
        )}

        {/* Export PNG */}
        <button
          onClick={exportPNG}
          disabled={exporting}
          className="w-full py-3 rounded-lg font-bold text-white uq-animate-gradient disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(90deg, #E63946 0%, #B5378C 35%, #7B5EA7 65%, #2E86DE 100%)', backgroundSize: '200% 200%' }}
        >
          <IconReceive size={16} />
          {exporting ? 'Génération...' : 'Enregistrer en PNG'}
        </button>

        <p className="text-[10px] text-[var(--uq-text-muted)] text-center mt-3">
          BORB · UQ Platform · Document officiel
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 px-2 py-1.5 border-b border-[var(--uq-border)]/30 last:border-b-0">
      <span className="text-xs text-[var(--uq-text-secondary)] shrink-0">{label}</span>
      <span
        className={`text-xs font-semibold text-right break-all ${mono ? 'font-mono text-[10px]' : ''}`}
        style={{ color: color || 'var(--uq-text)' }}
      >
        {value}
      </span>
    </div>
  );
}
