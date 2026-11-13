import React, { useState } from 'react';
import apiClient from '../../api/client';
import { Icon } from './Icon';

interface PasswordModalProps {
  uqNumber: string;
  action: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  uqNumber,
  action,
  onSuccess,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  const handleSubmit = async () => {
    if (!password) {
      setError('Entre ton mot de passe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const r = await apiClient.post('/api/account/pin/verify-password', {
        uq_number: uqNumber,
        password: password,
      });

      if (r.data.valid) {
        onSuccess();
      } else {
        setError(r.data.message || 'Mot de passe incorrect');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur de vérification');
    } finally {
      setLoading(false);
    }
  };

  const actionLabels: Record<string, string> = {
    send: 'Envoyer BORB',
    convert: 'Convertir BORB',
    withdraw: 'Retirer',
    publish: 'Publier dans Zando',
    delete_draft: 'Supprimer le brouillon',
    delete_item: 'Supprimer la publication',
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#14141A] border border-[#FCD535]/30 rounded-2xl p-6 uq-animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[#FCD535]/15 flex items-center justify-center">
            <span className="text-lg"><Icon name="key" size={18} tone="warning" /></span>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#EAECEF]">Mot de passe requis</h3>
            <p className="text-xs text-[#8E8E9A]">{actionLabels[action] || 'Confirmation'}</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-[#FCD535]/10 border border-[#FCD535]/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-[#FCD535]">
            ℹ️ Ton PIN est en attente (24h). Utilise ton mot de passe de compte.
          </p>
        </div>

        {/* Input */}
        <div className="relative mb-4">
          <input
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Mot de passe"
            className="w-full bg-[#1A1A24] border border-[#2A2A38] rounded-xl px-4 py-3 pr-12 text-[#EAECEF] focus:outline-none focus:border-[#FCD535]"
            autoFocus
          />
          <button
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E9A]"
          >
            {show ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-[#F6465D] text-center mb-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-full bg-[#1A1A24] border border-[#2A2A38] text-[#8E8E9A] font-semibold active:scale-95"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !password}
            className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#FCD535] to-[#F0CB2E] text-black font-bold active:scale-95 disabled:opacity-50"
          >
            {loading ? '⏳...' : 'Valider'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
