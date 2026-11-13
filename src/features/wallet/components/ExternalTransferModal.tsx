// ============================================================
// EXTERNAL TRANSFER MODAL - Depot / Retrait externe
// Methodes : Mobile Money, Banque, International, Crypto, P2P
// ============================================================

import { useState } from 'react';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { UQ_COLORS } from '../../../theme/colors';
import { IconClose } from '../../../components/ui/UQIcons';

type Mode = 'depot' | 'retrait';
type ActionType = 'bientot' | 'redirection' | 'p2p';

interface Methode {
  id: string;
  label: string;
  desc: string;
  icon: IconName;
  action: ActionType;
  url?: string;
}

interface Categorie {
  titre: string;
  couleur: string;
  methodes: Methode[];
}

interface Props {
  show: boolean;
  mode: Mode;
  onClose: () => void;
  onP2PClick?: () => void;
}

const CATEGORIES: Categorie[] = [
  {
    titre: 'Mobile Money',
    couleur: '#0ECB81',
    methodes: [
      { id: 'mpesa',   label: 'M-Pesa',       desc: 'Vodacom - RDC, Kenya, Tanzanie', icon: 'phone', action: 'p2p' },
      { id: 'airtel',  label: 'Airtel Money', desc: 'Airtel - Afrique', icon: 'phone', action: 'p2p' },
      { id: 'orange',  label: 'Orange Money', desc: 'Orange - Afrique', icon: 'phone', action: 'p2p' },
      { id: 'mtn',     label: 'MTN MoMo',     desc: 'MTN - Afrique', icon: 'phone', action: 'p2p' },
      { id: 'moov',    label: 'Moov Money',   desc: 'Moov - Afrique de l Ouest', icon: 'phone', action: 'p2p' },
      { id: 'wave',    label: 'Wave',         desc: 'Senegal, Cote d Ivoire', icon: 'waves', action: 'bientot' },
    ],
  },
  {
    titre: 'Banque',
    couleur: '#2E86DE',
    methodes: [
      { id: 'iban',    label: 'IBAN',         desc: 'Virement Europeen', icon: 'bank', action: 'bientot' },
      { id: 'swift',   label: 'SWIFT',        desc: 'Virement international', icon: 'bank', action: 'bientot' },
      { id: 'local',   label: 'Compte local', desc: 'Banque nationale', icon: 'bank', action: 'bientot' },
    ],
  },
  {
    titre: 'International',
    couleur: '#B5378C',
    methodes: [
      { id: 'paypal',  label: 'PayPal',         desc: 'Paiement international', icon: 'card', action: 'redirection', url: 'https://www.paypal.com' },
      { id: 'wise',    label: 'Wise',           desc: 'Transfert a bas cout', icon: 'banknote', action: 'redirection', url: 'https://wise.com' },
      { id: 'wu',      label: 'Western Union',  desc: 'Transfert d argent', icon: 'wallet', action: 'redirection', url: 'https://www.westernunion.com' },
      { id: 'carte',   label: 'Carte bancaire', desc: 'Visa, Mastercard', icon: 'card', action: 'bientot' },
    ],
  },
  {
    titre: 'Crypto',
    couleur: '#F7931A',
    methodes: [
      { id: 'btc',     label: 'Bitcoin',  desc: 'BTC', icon: 'coins', action: 'redirection', url: 'https://www.blockchain.com' },
      { id: 'eth',     label: 'Ethereum', desc: 'ETH', icon: 'coins', action: 'redirection', url: 'https://etherscan.io' },
      { id: 'usdt',    label: 'USDT',     desc: 'Tether', icon: 'coins', action: 'redirection', url: 'https://tether.to' },
    ],
  },
  {
    titre: 'P2P UQ',
    couleur: '#7B4DD9',
    methodes: [
      { id: 'p2p',     label: 'Carnet d ordres', desc: 'Echange P2P entre utilisateurs UQ', icon: 'refresh', action: 'p2p' },
    ],
  },
];

export function ExternalTransferModal({ show, mode, onClose, onP2PClick }: Props) {
  const [message, setMessage] = useState('');

  if (!show) return null;

  const handleClick = (m: Methode) => {
    if (m.action === 'bientot') {
      setMessage(`${m.label} : Bientot disponible`);
      setTimeout(() => setMessage(''), 2500);
    } else if (m.action === 'redirection' && m.url) {
      window.open(m.url, '_blank');
    } else if (m.action === 'p2p') {
      if (onP2PClick) onP2PClick();
      onClose();
    }
  };

  const titre = mode === 'depot' ? 'DEPOT EXTERNE' : 'RETRAIT EXTERNE';
  const sousTitre = mode === 'depot'
    ? 'Ajouter des fonds depuis l exterieur'
    : 'Retirer vers un compte externe';

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 uq-animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-3xl w-full max-w-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(26,10,21,0.98) 0%, rgba(10,21,48,0.98) 100%)',
          border: '1px solid rgba(230,57,70,0.4)',
          boxShadow: '0 0 60px rgba(47,107,255,0.24), 0 0 120px rgba(22,139,255,0.18)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E63946]/30">
          <div>
            <h3 className="text-lg font-black text-white">{titre}</h3>
            <p className="text-xs text-white/55 mt-1">{sousTitre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all active:scale-90"
          >
            <IconClose size={18} color="#FFF" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {CATEGORIES.map((cat) => (
            <div key={cat.titre} className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 rounded-full" style={{ background: cat.couleur, boxShadow: `0 0 8px ${cat.couleur}` }} />
                <p className="text-xs font-black tracking-wider uppercase text-white/85">{cat.titre}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {cat.methodes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleClick(m)}
                    className="rounded-2xl p-3 text-left transition-all active:scale-95 hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${cat.couleur}15, ${cat.couleur}05)`,
                      border: `1px solid ${cat.couleur}40`,
                      boxShadow: `0 0 15px ${cat.couleur}15`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon name={m.icon} size={18} />
                      <span className="text-xs font-black text-white">{m.label}</span>
                    </div>
                    <p className="text-[10px] text-white/55 leading-tight">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Message bas */}
        {message && (
          <div className="px-5 pb-4">
            <div className="p-3 rounded-xl text-xs bg-[#F6465D]/15 border border-[#F6465D]/30 text-[#F6465D] text-center">
              {message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}