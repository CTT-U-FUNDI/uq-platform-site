import { Icon } from './Icon';
﻿import React from 'react';

interface SuccessDetail {
  label: string;
  value: string;
  highlight?: boolean;
}

interface SuccessModalProps {
  title: string;
  icon?: string;
  details: SuccessDetail[];
  txId?: string;
  onShare?: () => void;
  onHistory?: () => void;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  title,
  icon = '✅',
  details,
  txId,
  onShare,
  onHistory,
  onClose,
}) => {
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Partage par defaut
      const text = `${title}\n\n${details.map(d => `${d.label}: ${d.value}`).join('\n')}${txId ? `\n\nID: ${txId}` : ''}\n\nVia UQ Platform 🟣`;
      if (navigator.share) {
        navigator.share({ title, text });
      } else {
        navigator.clipboard.writeText(text);
        alert('Reçu copié dans le presse-papier !');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#14141A] border border-[#0ECB81]/30 rounded-2xl p-6 uq-animate-pop-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{icon}</div>
          <h3 className="text-xl font-bold text-[#0ECB81] mb-1">{title}</h3>
          {txId && (
            <p className="text-[10px] text-[#5A5A6A] font-mono">ID: {txId}</p>
          )}
        </div>

        {/* Détails */}
        <div className="space-y-2 mb-6">
          {details.map((d, i) => (
            <div
              key={i}
              className={`flex justify-between items-center text-sm p-3 rounded-xl ${
                d.highlight
                  ? 'bg-[#0ECB81]/10 border border-[#0ECB81]/30'
                  : 'bg-[#1A1A24]'
              }`}
            >
              <span className="text-[#8E8E9A]">{d.label}</span>
              <span
                className={`font-bold ${
                  d.highlight ? 'text-[#0ECB81]' : 'text-[#EAECEF]'
                }`}
              >
                {d.value}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-full bg-[#1A1A24] border border-[#2A2A38] text-[#EAECEF] font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Icon name="upload" size={20} tone="info" /> Partager
            </button>
            {onHistory && (
              <button
                onClick={onHistory}
                className="flex-1 py-3 rounded-full bg-[#1A1A24] border border-[#2A2A38] text-[#EAECEF] font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Icon name="receipt" size={20} tone="muted" /> Historique
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#E63946] via-[#B5378C] to-[#2E86DE] text-white font-bold active:scale-95 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
