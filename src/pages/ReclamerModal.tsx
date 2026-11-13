// ============================================================
// RECLAMER MODAL - Simple : juste le PIN 3543
// ============================================================

import { useState } from 'react';
import { apiFetch } from '../api/client';
import { Icon } from '../components/ui/Icon';

interface Props {
  onClose: () => void;
  uqProfil2?: string;
}

export function ReclamerModal({ onClose, uqProfil2 = 'UQ-230354360' }: Props) {
  const [codePin, setCodePin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultat, setResultat] = useState<any>(null);

  const handleSubmit = async () => {
    if (codePin.length < 4) {
      setError('Code PIN a 4 chiffres');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await apiFetch('/api/distribution/claim-with-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_pin: codePin,
          uq_profil2: uqProfil2,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.message || 'Code PIN incorrect');
        setLoading(false);
        return;
      }
      setResultat(data);
      setLoading(false);
    } catch (e: any) {
      setError(e.message || 'Erreur reseau');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#FCD535]/30 bg-[#181A20] p-6 shadow-2xl">

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#FCD535]">Reclamer 30%</h3>
          <button onClick={onClose} disabled={loading} className="text-[#8E8E9A] hover:text-white text-xl">×</button>
        </div>

        {!resultat && (
          <>
            <p className="text-xs text-[#8E8E9A] mb-4 leading-tight">
              Entrez le code de connexion owner pour valider la reclamation de <span className="text-[#FCD535] font-bold">300 000 BORB</span>.
            </p>

            <label className="block text-[10px] uppercase tracking-wider text-[#8E8E9A] mb-2">
              Code PIN Owner
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={codePin}
              onChange={(e) => setCodePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter' && codePin.length >= 4 && !loading) handleSubmit(); }}
              placeholder="----"
              autoFocus
              className="w-full p-4 rounded-xl bg-[#0F0F15] border border-[#2A2A38] text-white text-center text-2xl tracking-widest focus:outline-none focus:border-[#FCD535]"
            />

            {error && (
              <div className="mt-3 p-3 rounded-lg bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] text-xs text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || codePin.length < 4}
              className="w-full mt-4 py-3 rounded-xl bg-[#FCD535] text-black font-bold active:scale-95 transition disabled:opacity-50 hover:bg-[#FCD535]/90"
            >
              {loading ? 'Verification...' : 'Reclamer'}
            </button>
          </>
        )}

        {resultat && (
          <div className="text-center">
            <div className="text-5xl mb-4"><Icon name="check" size={20} tone="success" /></div>
            <p className="text-lg font-bold text-[#0ECB81] mb-4">Reclamation reussie</p>
            <div className="p-4 rounded-xl bg-[#0ECB81]/10 border border-[#0ECB81]/30 text-white text-sm mb-4">
              <p className="mb-1">Montant : <span className="font-bold text-[#0ECB81]">{resultat.montant_reclame} BORB</span></p>
              <p className="text-xs text-[#8E8E9A]">Avant : {resultat.solde_avant} BORB</p>
              <p className="text-xs text-[#8E8E9A]">Apres : {resultat.solde_apres} BORB</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-[#FCD535] text-black font-bold active:scale-95 transition hover:bg-[#FCD535]/90"
            >
              Fermer
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
